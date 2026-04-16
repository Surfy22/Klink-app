#!/usr/bin/env node
/**
 * test-load.js — Script de test de charge KLINK
 *
 * Simule 20 tables simultanées avec des interactions réalistes
 * pour détecter les bugs de concurrence, de visibilité et de scoring.
 *
 * Usage : node backend/test-load.js
 * Options env :
 *   SERVER_URL=http://localhost:3001   (défaut)
 *   VERBOSE=1                          (logs détaillés)
 */

'use strict';

// ─── Dépendances ──────────────────────────────────────────────────────────────
let ioClient;
try {
  ioClient = require('socket.io-client').io;
} catch (_) {
  console.error('\n[ERREUR] socket.io-client manquant.');
  console.error('Installez-le avec : npm install --save-dev socket.io-client\n');
  process.exit(1);
}
const crypto = require('crypto');

// ─── Configuration ────────────────────────────────────────────────────────────
const SERVER_URL  = process.env.SERVER_URL || 'http://localhost:3001';
const BAR_ID      = 'test-bar';
const NUM_TABLES  = 20;
const NUM_PAIRS   = 10;   // 10 paires = 20 tables couvertes
const NUM_DISCO   = 5;    // Tables à déconnecter pendant les tests
const VERBOSE     = process.env.VERBOSE === '1';
const GRACE_MS    = 8_000; // Délai de grâce serveur en ms
const BET_TIMEOUT = 12_000; // Timeout max pour résoudre un pari

// ─── Rapport global ───────────────────────────────────────────────────────────
const report = {
  invitesSent:        0,
  invitesReceived:    0,
  betsAttempted:      0,
  betsResolved:       0,
  pointsHourly:       0,
  pointsEvening:      0,
  pointsMonthly:      0,
  visibilityErrors:   [],  // [{ tableId, missing: [tableId] }]
  disconnectErrors:   [],  // [tableId] — tables pas disparues après grace
  reconnectErrors:    [],  // [tableId] — tables avec problème de reconnexion
  bugs:               [],  // [string] — description textuelle
  responseTimes:      [],  // [ms] — latence mesurée sur les events
};

// ─── Utilitaires ──────────────────────────────────────────────────────────────
const sleep  = ms => new Promise(r => setTimeout(r, ms));
const now    = ()  => Date.now();
const avg    = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
const log    = (...a) => console.log(...a);
const vlog   = (...a) => VERBOSE && console.log('  [DBG]', ...a);
const errlog = (...a) => console.error('  [ERR]', ...a);

function logBug(msg) {
  errlog(msg);
  report.bugs.push(msg);
}

// ─── Génération de pseudos uniques ────────────────────────────────────────────
const ADJECTIVES = [
  'Rapide', 'Brutal', 'Calme', 'Sage', 'Fou',
  'Grand',  'Petit',  'Vieux', 'Jeune', 'Fort',
  'Noir',   'Rouge',  'Bleu',  'Vif',   'Lent',
  'Douce',  'Fière',  'Brave', 'Noble', 'Libre',
];
const NOUNS = [
  'Loup',   'Aigle',   'Tigre', 'Cobra', 'Requin',
  'Renard', 'Panda',   'Gorille', 'Vipère', 'Hibou',
  'Lynx',   'Faucon',  'Jaguar', 'Bison',  'Coyote',
  'Puma',   'Condor',  'Mamba',  'Kraken', 'Raton',
];

const usedPseudos = new Set();
function randomPseudo() {
  let p;
  let tries = 0;
  do {
    const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num  = Math.floor(Math.random() * 99) + 1;
    p = `${adj}${noun}${num}`;
  } while (usedPseudos.has(p) && ++tries < 200);
  usedPseudos.add(p);
  return p;
}

function generateUUID() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ─── Connexion d'une table ────────────────────────────────────────────────────
/**
 * Connecte une table et attend le premier `leaderboard:updated`
 * pour confirmer que le join est bien traité côté serveur.
 *
 * @returns {Promise<TableState>}
 */
function connectTable(tableNum, overrideUUID = null, overridePseudo = null) {
  return new Promise((resolve, reject) => {
    const tableId = `table-${tableNum}`;
    const pseudo  = overridePseudo || randomPseudo();
    const uuid    = overrideUUID   || generateUUID();

    const socket = ioClient(SERVER_URL, {
      transports:   ['websocket', 'polling'],
      reconnection: false,
      timeout:      10_000,
    });

    /** @type {TableState} */
    const state = {
      tableNum,
      tableId,
      pseudo,
      uuid,
      socket,
      latestTables:      {},
      latestScores:      {},
      latestLeaderboard: null,
      invitesReceived:   0,
      activeBets:        {},  // betId → { partner, winnerTableId }
      connected:         false,
      ready:             false,
    };

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error(`Timeout connexion ${tableId}`));
    }, 10_000);

    socket.on('connect', () => {
      const t0 = now();
      socket.emit('join', {
        barId:     BAR_ID,
        tableId,
        pseudo,
        photo:     null,
        tableUUID: uuid,
      });
      report.responseTimes.push(now() - t0);
    });

    socket.on('tables:updated', (tables) => {
      // Le serveur envoie un tableau [{tableId, pseudo, ...}]
      // On le normalise en map { tableId → entry } pour les lookups
      const arr = Array.isArray(tables) ? tables : Object.values(tables ?? {});
      const map = {};
      for (const t of arr) { if (t?.tableId) map[t.tableId] = t; }
      state.latestTables = map;
    });

    socket.on('scores:updated', (scores) => {
      state.latestScores = scores ?? {};
    });

    socket.on('leaderboard:updated', (lb) => {
      state.latestLeaderboard = lb;
      if (!state.ready) {
        state.ready     = true;
        state.connected = true;
        clearTimeout(timeout);
        resolve(state);
      }
    });

    socket.on('join:error', (err) => {
      clearTimeout(timeout);
      logBug(`join:error — ${tableId}: ${JSON.stringify(err)}`);
      reject(new Error(`join:error ${tableId}`));
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`connect_error ${tableId}: ${err.message}`));
    });
  });
}

// ─── Programme principal ──────────────────────────────────────────────────────
async function main() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('  KLINK — Test de charge : 20 tables simultanées');
  log(`  Serveur : ${SERVER_URL}   Bar : ${BAR_ID}`);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ══════════════════════════════════════════════════════════════════
  //  PHASE 1 — CONNEXION
  // ══════════════════════════════════════════════════════════════════
  log('▶  PHASE 1 — Connexion de 20 tables...\n');

  const tables = [];
  const connectionStart = now();

  for (let i = 1; i <= NUM_TABLES; i++) {
    try {
      const state = await connectTable(i);
      tables.push(state);
      log(`   ✓  ${state.tableId.padEnd(10)}  pseudo: ${state.pseudo}`);
    } catch (err) {
      logBug(`Connexion échouée — table-${i}: ${err.message}`);
    }
    // 120ms entre chaque join → évite le rate limit (5 par 10s)
    await sleep(120);
  }

  const connectionMs = now() - connectionStart;
  log(`\n   ${tables.length}/${NUM_TABLES} tables connectées en ${connectionMs} ms`);

  if (tables.length === 0) {
    logBug('Aucune table connectée — le serveur est-il démarré ?');
    printReport();
    process.exit(1);
  }

  // Attendre que le heartbeat (10s) ait propagé la liste complète
  log('   Attente du heartbeat (12 s)...\n');
  await sleep(12_000);

  // ══════════════════════════════════════════════════════════════════
  //  PHASE 2 — VISIBILITÉ
  // ══════════════════════════════════════════════════════════════════
  log('▶  PHASE 2 — Vérification de la visibilité...\n');

  let visibilityOK = 0;

  for (const t of tables) {
    const visibleIds = Object.keys(t.latestTables); // map normalisée → tableIds
    const expected   = tables.map(x => x.tableId);
    const missing    = expected.filter(id => !visibleIds.includes(id));

    if (missing.length > 0) {
      logBug(`${t.tableId} voit ${visibleIds.length}/${tables.length} tables — manquantes: ${missing.join(', ')}`);
      report.visibilityErrors.push({ tableId: t.tableId, missing });
    } else {
      visibilityOK++;
      vlog(`${t.tableId} voit correctement ${visibleIds.length} tables`);
    }
  }

  const visResult = visibilityOK === tables.length ? '✓' : '✗';
  log(`   ${visResult}  ${visibilityOK}/${tables.length} tables ont une visibilité complète\n`);

  // ══════════════════════════════════════════════════════════════════
  //  PHASE 3 — INVITATIONS SIMULTANÉES
  //  PHASE 4 — PARIS + ATTRIBUTION DES POINTS
  // ══════════════════════════════════════════════════════════════════
  log('▶  PHASE 3 — Invitations simultanées (10 paires)\n');
  log('▶  PHASE 4 — Paris et attribution des points\n');

  // Paires : (table-1 → table-2), (table-3 → table-4), ..., (table-19 → table-20)
  const pairs = [];
  for (let i = 0; i < NUM_PAIRS; i++) {
    const sender   = tables[i * 2];
    const receiver = tables[i * 2 + 1];
    if (sender && receiver) pairs.push({ sender, receiver });
  }

  /**
   * Orchestre une invite + pari pour une paire et retourne un résultat.
   */
  function runPairBet({ sender, receiver }) {
    return new Promise((resolve) => {
      const MSG       = 'Je parie qui finit sa bière en premier ?';
      const winnerRef = sender;  // Le sender gagne dans ce scénario de test

      let betId           = null;
      let senderGotAccept = false;
      let rcvrGotAccept   = false;
      let scoresChecked   = false;
      let resolved        = false;

      const baselineWins = sender.latestScores[sender.uuid]?.wins ?? 0;
      report.betsAttempted++;

      const finish = (outcome) => {
        if (resolved) return;
        resolved = true;
        // Nettoyage des listeners
        receiver.socket.off('invite:receive',  onInvite);
        sender.socket.off('invite:accepted',   onSenderAccepted);
        receiver.socket.off('invite:accepted', onRcvrAccepted);
        sender.socket.off('leaderboard:updated', onLeaderboard);
        receiver.socket.off('leaderboard:updated', onLeaderboard);
        resolve(outcome);
      };

      const timeout = setTimeout(() => {
        if (!senderGotAccept || !rcvrGotAccept) {
          if (report.invitesReceived < report.invitesSent) {
            logBug(`Invitation perdue ou non acceptée: ${sender.tableId} → ${receiver.tableId}`);
          }
        }
        if (!scoresChecked) {
          logBug(`Pari non résolu (timeout): ${sender.tableId} ↔ ${receiver.tableId} — betId=${betId}`);
        }
        finish({ ok: false });
      }, BET_TIMEOUT);

      // Le receiver écoute l'invitation
      const onInvite = (invite) => {
        const t0 = now();
        receiver.invitesReceived++;
        report.invitesReceived++;
        vlog(`invite:receive — ${receiver.tableId} reçoit de ${invite.fromTableId}`);

        // Répondre en acceptant
        receiver.socket.emit('invite:respond', {
          barId:       BAR_ID,
          toTableId:   receiver.tableId,
          fromTableId: invite.fromTableId,
          accepted:    true,
          message:     invite.message,
          fromPseudo:  invite.fromPseudo ?? '',
          fromPhoto:   invite.fromPhoto  ?? null,
        });
        report.responseTimes.push(now() - t0);
      };

      // Quand le pari est accepté, les deux tables soumettent leurs votes
      const trySubmitBets = () => {
        if (!senderGotAccept || !rcvrGotAccept || !betId) return;

        const betPayload = {
          barId:         BAR_ID,
          betId,
          winnerTableId: winnerRef.tableId,
          winnerPseudo:  winnerRef.pseudo,
          winnerPhoto:   null,
        };

        const t0 = now();
        // Les deux votes doivent venir de sockets différents (anti-double-vote)
        sender.socket.emit('bet:result', betPayload);
        receiver.socket.emit('bet:result', betPayload);
        report.responseTimes.push(now() - t0);
        vlog(`bet:result envoyés — sender=${sender.tableId} receiver=${receiver.tableId} winner=${winnerRef.tableId}`);
      };

      const onSenderAccepted = (cel) => {
        betId = betId || cel.betId;
        senderGotAccept = true;
        vlog(`invite:accepted — sender ${sender.tableId} betId=${betId}`);
        trySubmitBets();
      };

      const onRcvrAccepted = (cel) => {
        betId = betId || cel.betId;
        rcvrGotAccept = true;
        vlog(`invite:accepted — receiver ${receiver.tableId} betId=${betId}`);
        trySubmitBets();
      };

      // Vérifier l'attribution dans les 3 classements via leaderboard:updated
      const onLeaderboard = (lb) => {
        if (scoresChecked) return;
        const uuid = winnerRef.uuid;

        const hourlyWins  = lb?.hourly?.[uuid]?.wins  ?? 0;
        const eveningWins = lb?.evening?.[uuid]?.wins ?? 0;
        const monthlyWins = lb?.monthly?.[uuid]?.wins ?? 0;
        const currentEve  = eveningWins;

        if (currentEve > baselineWins) {
          scoresChecked = true;
          report.betsResolved++;

          if (hourlyWins > 0) {
            report.pointsHourly++;
            vlog(`Point hourly attribué à ${winnerRef.pseudo}`);
          } else {
            logBug(`Point hourly manquant pour ${winnerRef.pseudo} (uuid=${uuid})`);
          }
          if (eveningWins > 0) {
            report.pointsEvening++;
            vlog(`Point evening attribué à ${winnerRef.pseudo}`);
          }
          if (monthlyWins > 0) {
            report.pointsMonthly++;
            vlog(`Point monthly attribué à ${winnerRef.pseudo}`);
          } else {
            logBug(`Point monthly manquant pour ${winnerRef.pseudo} (uuid=${uuid}) — lb.monthly=${JSON.stringify(lb?.monthly?.[uuid])}`);
          }

          log(`   ✓  Pari résolu: ${sender.tableId} ↔ ${receiver.tableId} — vainqueur: ${winnerRef.pseudo} (eve:${eveningWins} hr:${hourlyWins} mo:${monthlyWins})`);
          clearTimeout(timeout);
          finish({ ok: true, winner: winnerRef.pseudo });
        }
      };

      // Enregistrer les listeners avant d'envoyer l'invitation
      receiver.socket.once('invite:receive', onInvite);
      sender.socket.once('invite:accepted',  onSenderAccepted);
      receiver.socket.once('invite:accepted', onRcvrAccepted);
      sender.socket.on('leaderboard:updated',   onLeaderboard);
      receiver.socket.on('leaderboard:updated', onLeaderboard);

      // Envoyer l'invitation
      const t0 = now();
      sender.socket.emit('invite:send', {
        barId:       BAR_ID,
        fromTableId: sender.tableId,
        fromPseudo:  sender.pseudo,
        fromPhoto:   null,
        toTableId:   receiver.tableId,
        message:     MSG,
      });
      report.invitesSent++;
      report.responseTimes.push(now() - t0);

      log(`   →  Invitation: ${sender.tableId} (${sender.pseudo}) → ${receiver.tableId} (${receiver.pseudo})`);
    });
  }

  // Lancer les 10 paires en parallèle (simultanément comme en prod)
  const betResults = await Promise.all(pairs.map(runPairBet));
  const betsOK = betResults.filter(r => r.ok).length;
  log(`\n   Paris résolus: ${betsOK}/${pairs.length}\n`);

  // ══════════════════════════════════════════════════════════════════
  //  PHASE 5 — DÉCONNEXIONS
  // ══════════════════════════════════════════════════════════════════
  log('▶  PHASE 5 — Déconnexion de 5 tables aléatoires...\n');

  // Choisir 5 tables au hasard parmi toutes les connectées
  const shuffled     = [...tables].sort(() => Math.random() - 0.5);
  const toDisconnect = shuffled.slice(0, NUM_DISCO);
  const remaining    = tables.filter(t => !toDisconnect.includes(t));

  for (const t of toDisconnect) {
    t.socket.disconnect();
    t.connected = false;
    log(`   ✗  ${t.tableId} (${t.pseudo}) déconnecté`);
  }

  log(`\n   Attente de l'expiration du délai de grâce (${GRACE_MS / 1000 + 1} s)...\n`);
  await sleep(GRACE_MS + 1_000);

  // Vérifier que les tables déconnectées ont disparu
  const anchor = remaining.find(t => t.connected);
  if (!anchor) {
    logBug('Aucune table restante pour vérifier la visibilité post-déconnexion');
  } else {
    const afterIds = Object.keys(anchor.latestTables); // map normalisée → tableIds
    let disappearedOK = 0;

    for (const disc of toDisconnect) {
      if (afterIds.includes(disc.tableId)) {
        logBug(`${disc.tableId} encore visible ${GRACE_MS / 1000 + 1}s après déconnexion`);
        report.disconnectErrors.push(disc.tableId);
      } else {
        disappearedOK++;
        log(`   ✓  ${disc.tableId} a bien disparu de la liste`);
      }
    }

    if (disappearedOK < toDisconnect.length) {
      logBug(`${toDisconnect.length - disappearedOK} table(s) persistent après déconnexion`);
    }
  }
  log('');

  // ══════════════════════════════════════════════════════════════════
  //  PHASE 6 — RECONNEXIONS
  // ══════════════════════════════════════════════════════════════════
  log('▶  PHASE 6 — Reconnexion avec le même UUID...\n');

  for (const old of toDisconnect) {
    try {
      // Créer un nouveau socket avec le MÊME uuid (simule localStorage)
      const newSocket = ioClient(SERVER_URL, {
        transports:   ['websocket', 'polling'],
        reconnection: false,
        timeout:      10_000,
      });

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          newSocket.disconnect();
          reject(new Error(`Timeout reconnexion ${old.tableId}`));
        }, 10_000);

        newSocket.on('connect', () => {
          newSocket.emit('join', {
            barId:     BAR_ID,
            tableId:   old.tableId,
            pseudo:    old.pseudo,
            photo:     null,
            tableUUID: old.uuid,  // Même UUID = même identité persistante
          });
        });

        // Attendre leaderboard:updated pour confirmer le join
        newSocket.once('leaderboard:updated', (lb) => {
          old.socket    = newSocket;
          old.connected = true;

          // Vérifier les scores dans le leaderboard reçu
          const eveWins = lb?.evening?.[old.uuid]?.wins  ?? 0;
          const hrWins  = lb?.hourly?.[old.uuid]?.wins   ?? 0;
          const moWins  = lb?.monthly?.[old.uuid]?.wins  ?? 0;

          log(`   ✓  ${old.tableId} reconnecté — scores eve:${eveWins} hr:${hrWins} mo:${moWins}`);

          // Si la table avait des points avant, vérifier qu'ils sont préservés
          const hadPoints = Object.values(old.latestScores ?? {}).some(
            s => s.tableId === old.tableId && s.wins > 0
          );
          if (hadPoints && eveWins === 0) {
            logBug(`${old.tableId} a perdu ses points après reconnexion (uuid=${old.uuid})`);
            report.reconnectErrors.push(old.tableId);
          }

          // Vérifier connected:true dans scores:updated
          newSocket.once('scores:updated', (scores) => {
            const entry = scores[old.uuid];
            if (entry && entry.connected === false) {
              logBug(`${old.tableId} reconnecté mais marqué connected:false dans scores`);
              report.reconnectErrors.push(old.tableId);
            }
          });

          clearTimeout(timeout);
          resolve();
        });

        newSocket.on('join:error', (err) => {
          clearTimeout(timeout);
          logBug(`join:error lors de la reconnexion de ${old.tableId}: ${JSON.stringify(err)}`);
          reject(new Error(`join:error ${old.tableId}`));
        });

        newSocket.on('connect_error', (err) => {
          clearTimeout(timeout);
          reject(new Error(`connect_error reconnexion ${old.tableId}: ${err.message}`));
        });
      });
    } catch (err) {
      logBug(`Reconnexion échouée — ${old.tableId}: ${err.message}`);
      report.reconnectErrors.push(old.tableId);
    }

    await sleep(150); // Évite rate limit join (5/10s)
  }

  await sleep(1_500); // Heartbeat + propagation
  log('');

  // ══════════════════════════════════════════════════════════════════
  //  PHASE 7 — RAPPORT FINAL
  // ══════════════════════════════════════════════════════════════════
  printReport();

  // Fermer toutes les connexions proprement
  for (const t of tables) {
    try { t.socket.disconnect(); } catch { /* ignore */ }
  }
  for (const t of toDisconnect) {
    try { t.socket.disconnect(); } catch { /* ignore */ }
  }

  process.exit(report.bugs.length > 0 ? 1 : 0);
}

// ─── Affichage du rapport ─────────────────────────────────────────────────────
function printReport() {
  const bugs   = report.bugs.length;
  const status = bugs === 0 ? '✓ TOUS LES TESTS PASSENT' : `✗ ${bugs} BUG(S) DÉTECTÉ(S)`;

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('  RAPPORT FINAL');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  log('  INVITATIONS');
  log(`    Envoyées             : ${report.invitesSent}`);
  log(`    Reçues               : ${report.invitesReceived}`);
  const lostInvites = report.invitesSent - report.invitesReceived;
  if (lostInvites > 0) {
    log(`    Perdues              : ${lostInvites}  <-- ANOMALIE`);
  }

  log('\n  PARIS');
  log(`    Tentés               : ${report.betsAttempted}`);
  log(`    Résolus              : ${report.betsResolved}`);
  log(`    Points horaire (hr)  : ${report.pointsHourly}`);
  log(`    Points soirée  (eve) : ${report.pointsEvening}`);
  log(`    Points mensuel (mo)  : ${report.pointsMonthly}`);

  log('\n  PERFORMANCES');
  log(`    Temps réponse moyen  : ${avg(report.responseTimes)} ms`);
  log(`    Nb mesures           : ${report.responseTimes.length}`);

  log('\n  VISIBILITÉ');
  log(`    Tables avec erreur   : ${report.visibilityErrors.length}`);
  if (report.visibilityErrors.length > 0) {
    for (const e of report.visibilityErrors) {
      log(`      • ${e.tableId} — manquantes: ${e.missing.join(', ')}`);
    }
  }

  log('\n  DÉCONNEXIONS');
  log(`    Tables pas disparues : ${report.disconnectErrors.length}`);
  if (report.disconnectErrors.length > 0) {
    for (const id of report.disconnectErrors) log(`      • ${id}`);
  }

  log('\n  RECONNEXIONS');
  log(`    Erreurs              : ${report.reconnectErrors.length}`);
  if (report.reconnectErrors.length > 0) {
    for (const id of report.reconnectErrors) log(`      • ${id}`);
  }

  log(`\n  BUGS DÉTECTÉS : ${bugs}`);
  if (bugs > 0) {
    for (const b of report.bugs) log(`    [BUG] ${b}`);
  } else {
    log('    Aucun bug détecté !');
  }

  log(`\n  ${status}`);
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ─── Lancement ────────────────────────────────────────────────────────────────
main().catch(err => {
  errlog('Erreur fatale:', err.message);
  if (VERBOSE) console.error(err.stack);
  printReport();
  process.exit(1);
});
