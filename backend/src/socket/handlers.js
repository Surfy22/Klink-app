/**
 * Structure en mémoire :
 * bars[barId] = {
 *   tables:            { [tableId]: { socketId, pseudo, photo, tableId, status, joinedAt } }
 *   stats:             { invitesSent, betsInProgress }
 *   scores:            { [uuid]: { wins, pseudo, photo, tableId, connected } }  — classement soirée (RAM)
 *   hourlyScores:      { [uuid]: { wins, pseudo, photo, tableId } }             — classement round courant (RAM)
 *   resolvedBets:      Map<betId, timestamp>   (horodatés pour purge)
 *   reservedNames:     { [pseudoNormalisé]: tableId }  (noms réservés jusqu'au reset)
 *   adminSockets:      Set<socketId>
 *   leaderboardMessage: string
 *   adminPassword:     string  (6 car. alphanum. majuscules, généré à la création)
 *   adminEmail:        string|null
 * }
 * monthlyScores[barId] = { [uuid]: { wins, pseudo, photo, tableId } } — classement mensuel (JSON persistant)
 * history[barId] = [{ date, stats, scores }, ...] — 30 derniers jours max
 */

const nodemailer = require('nodemailer');
const fs         = require('fs');
const path       = require('path');

const DATA_DIR = path.join(__dirname, '../../../data');
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}

const bars          = {};
const history       = {};
const monthlyScores = {}; // barId → { [uuid]: { wins, pseudo, photo, tableId } }

/* ── Persistance mensuelle ───────────────────────────────────────────────── */

function monthlyFilePath(barId) {
  return path.join(DATA_DIR, `monthly_scores_${barId}.json`);
}

function loadMonthlyScores(barId) {
  if (monthlyScores[barId]) return monthlyScores[barId];
  try {
    const raw = fs.readFileSync(monthlyFilePath(barId), 'utf8');
    monthlyScores[barId] = JSON.parse(raw);
  } catch (_) {
    monthlyScores[barId] = {};
  }
  return monthlyScores[barId];
}

function saveMonthlyScores(barId) {
  try {
    fs.writeFileSync(monthlyFilePath(barId), JSON.stringify(monthlyScores[barId] ?? {}), 'utf8');
  } catch (err) {
    console.error(`[${barId}] Erreur sauvegarde scores mensuels :`, err.message);
  }
}

/** Retourne les 3 classements sous forme d'objet { hourly, evening, monthly } */
function getAllLeaderboards(barId) {
  const bar = bars[barId];
  return {
    hourly:  bar ? { ...bar.hourlyScores } : {},
    evening: bar ? { ...bar.scores }       : {},
    monthly: { ...(loadMonthlyScores(barId)) },
  };
}

/* ── Mot de passe admin unique par bar ───────────────────────────────────── */

/** Génère un code alphanumérique majuscule de 6 caractères */
function generateBarPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * 36)]).join('');
}

/* ── Email hebdomadaire ──────────────────────────────────────────────────── */

const mailer = process.env.GMAIL_USER ? nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
}) : null;

/* ── Validation légère ───────────────────────────────────────────────────── */

/** Vérifie qu'une valeur est une string non vide dans la limite de longueur */
function isStr(v, max = 200) {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= max;
}

/** Vérifie une taille de photo base64 raisonnable (≤ 300 KB décodé ≈ 400 KB base64) */
function isValidPhoto(v) {
  if (v == null) return true;                    // photo optionnelle
  if (typeof v !== 'string') return false;
  if (v.length > 400_000) return false;          // rejet si > ~300 KB
  return v.startsWith('data:image/');
}

/* ── Rate limiting par socket ────────────────────────────────────────────── */

/** Map : `${socketId}:${event}` → { count, resetAt } */
const _rates = new Map();

/**
 * Retourne true si la socket dépasse la limite.
 * @param {string} sid    Socket ID
 * @param {string} event  Nom de l'événement
 * @param {number} limit  Nombre max d'appels dans la fenêtre
 * @param {number} windowMs Fenêtre en ms
 */
function isRateLimited(sid, event, limit, windowMs) {
  const key = `${sid}:${event}`;
  const now = Date.now();
  let e = _rates.get(key);
  if (!e || now > e.resetAt) {
    e = { count: 0, resetAt: now + windowMs };
  }
  e.count++;
  _rates.set(key, e);
  return e.count > limit;
}

/** Purge les entrées rate-limit liées à une socket à sa déconnexion */
function purgeRateLimits(sid) {
  const prefix = `${sid}:`;
  for (const key of _rates.keys()) {
    if (key.startsWith(prefix)) _rates.delete(key);
  }
}

/* ── Logo KLINK (SVG inline, attaché en CID dans les emails) ────────────── */

const LOGO_SVG_BUFFER = Buffer.from(
  '<svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<defs><linearGradient id="kg" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">' +
  '<stop stop-color="#00FF87"/><stop offset="1" stop-color="#0099FF"/></linearGradient></defs>' +
  '<rect width="32" height="32" rx="8" fill="url(#kg)"/>' +
  '<path d="M20 5L10 17L16 17L12 27L22 15L16 15Z" fill="white"/>' +
  '</svg>'
);

/* ── Données hebdomadaires ───────────────────────────────────────────────── */

const ACTIVITY_EMOJIS = {
  'Fléchettes': '🎯', 'Billard': '🎱', 'Paris': '🎲',
  'Ping-pong': '🏓', 'Verre': '🍺', 'Discussion': '💬', 'Autre': '✨',
};

function detectActivityType(message) {
  const m = (message || '').toLowerCase();
  if (/fl[ée]ch/.test(m))                    return 'Fléchettes';
  if (/billard/.test(m))                     return 'Billard';
  if (/pari|je parie/.test(m))               return 'Paris';
  if (/ping.?pong/.test(m))                  return 'Ping-pong';
  if (/bi[eè]res?|verres?/.test(m))          return 'Verre';
  if (/discuss|discuter|parler/.test(m))     return 'Discussion';
  return 'Autre';
}

function initWeeklyData() {
  return {
    invitesSent:      0,
    invitesAccepted:  0,
    hourlyActivity:   {},   // { "Ven-22": 15, "Sam-23": 8 }
    activityTypes:    {},   // { "Fléchettes": 5, "Paris": 10 }
    activeDates:      new Set(), // { "2026-03-28", ... }
  };
}

function recordInviteSent(barId, message) {
  const bar = bars[barId];
  if (!bar) return;
  const now  = new Date();
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const key  = `${days[now.getDay()]}-${now.getHours()}`;
  const date = now.toISOString().split('T')[0];
  const wd   = bar.weeklyData;
  wd.invitesSent++;
  wd.hourlyActivity[key] = (wd.hourlyActivity[key] || 0) + 1;
  wd.activeDates.add(date);
  const type = detectActivityType(message);
  wd.activityTypes[type] = (wd.activityTypes[type] || 0) + 1;
}

/* ── Gestion des bars ────────────────────────────────────────────────────── */

function getBar(barId) {
  if (!bars[barId]) {
    const envKey      = `ADMIN_PASSWORD_${barId}`;
    const adminPassword = process.env[envKey] || generateBarPassword();
    const source      = process.env[envKey] ? 'fixe (.env)' : 'généré aléatoirement';
    console.log(`[KLINK] 🔑 Bar "${barId}" — mot de passe admin : ${adminPassword} (${source})`);
    bars[barId] = {
      tables:             {},
      stats:              { invitesSent: 0, betsInProgress: 0 },
      scores:             {},
      hourlyScores:       {},
      resolvedBets:       new Map(),
      pendingVotes:       {},         // { [betId]: { voterTableId, winnerTableId, winnerPseudo, winnerPhoto } }
      inviteQueues:       {},         // { [toTableId]: [{ fromTableId, fromPseudo, fromPhoto, message }, ...] }
      reservedNames:      {},         // { [pseudoNormalisé]: tableId } — réservés jusqu'au reset
      adminSockets:       new Set(),
      leaderboardMessage: '',
      adminPassword,
      adminEmail:         null,
      weeklyData:         initWeeklyData(),
    };
  }
  return bars[barId];
}

function getActiveTables(barId) {
  return Object.values(bars[barId]?.tables || {});
}

function getDashboard(barId) {
  const bar = bars[barId];
  return {
    tables: getActiveTables(barId),
    stats: {
      activeTables:   bar ? Object.keys(bar.tables).length : 0,
      invitesSent:    bar?.stats.invitesSent    ?? 0,
      betsInProgress: bar?.stats.betsInProgress ?? 0,
    },
    scores:             bar?.scores             ?? {},
    leaderboardMessage: bar?.leaderboardMessage ?? '',
    adminEmail:         bar?.adminEmail         ?? null,
  };
}

function notifyAdmins(io, barId) {
  const bar = bars[barId];
  if (!bar || bar.adminSockets.size === 0) return;
  io.to(`admin:${barId}`).emit('admin:dashboard', getDashboard(barId));
}

/**
 * Purge les paris résolus vieux de plus de 24 h pour éviter une fuite mémoire.
 * Appelé lors de chaque reset quotidien et lors de la déconnexion.
 */
function pruneResolvedBets(bar) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [betId, ts] of bar.resolvedBets) {
    if (ts < cutoff) bar.resolvedBets.delete(betId);
  }
}

/**
 * Supprime un bar s'il est complètement vide (aucune table, aucun admin).
 * Évite l'accumulation de bars fantômes en mémoire.
 */
function maybeCleanBar(barId) {
  const bar = bars[barId];
  if (!bar) return;
  if (Object.keys(bar.tables).length === 0 && bar.adminSockets.size === 0) {
    delete bars[barId];
    console.log(`[${barId}] Bar vide supprimé de la mémoire`);
  }
}

/* ── Reset quotidien à minuit ────────────────────────────────────────────── */

let _io;

function resetBar(barId) {
  const bar = bars[barId];
  if (!bar) return;

  const today = new Date().toISOString().split('T')[0];

  if (!history[barId]) history[barId] = [];
  history[barId].push({
    date:   today,
    stats:  { ...bar.stats, activeTables: Object.keys(bar.tables).length },
    scores: JSON.parse(JSON.stringify(bar.scores)),
  });
  if (history[barId].length > 30) history[barId].shift();

  bar.stats          = { invitesSent: 0, betsInProgress: 0 };
  bar.scores         = {};
  bar.hourlyScores   = {};
  bar.resolvedBets   = new Map();
  bar.pendingVotes   = {};
  bar.inviteQueues   = {};
  bar.reservedNames  = {};

  if (_io) {
    _io.to(barId).emit('scores:updated', {});
    _io.to(barId).emit('leaderboard:updated', getAllLeaderboards(barId));
    notifyAdmins(_io, barId);
  }

  console.log(`[${barId}] Reset quotidien — snapshot ${today}`);
}

function scheduleMidnightReset() {
  // Calcul robuste : prochain minuit UTC+local
  const now      = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  const delay = midnight - now;

  setTimeout(() => {
    Object.keys(bars).forEach(resetBar);
    scheduleMidnightReset();
  }, delay);

  console.log(`Reset quotidien planifié dans ${Math.round(delay / 60000)} min`);
}

scheduleMidnightReset();

/* ── Reset horaire (classement round) ───────────────────────────────────── */

function resetHourlyScores() {
  for (const barId of Object.keys(bars)) {
    bars[barId].hourlyScores = {};
    if (_io) {
      _io.to(barId).emit('leaderboard:round-reset', {});
      _io.to(barId).emit('leaderboard:updated', getAllLeaderboards(barId));
    }
    console.log(`[${barId}] Reset horaire du classement round`);
  }
}

function scheduleHourlyReset() {
  const now         = new Date();
  const nextHour    = new Date(now);
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  const delay       = nextHour - now;
  setTimeout(() => {
    resetHourlyScores();
    scheduleHourlyReset();
  }, delay);
  console.log(`Reset horaire planifié dans ${Math.round(delay / 60000)} min`);
}

scheduleHourlyReset();

/* ── Reset mensuel (1er du mois) ─────────────────────────────────────────── */

async function resetMonthlyScores() {
  for (const barId of Object.keys(bars)) {
    const monthly = loadMonthlyScores(barId);
    const bar     = bars[barId];

    // Email au gérant avec les stats du mois avant reset
    if (bar?.adminEmail && mailer) {
      try {
        await sendMonthlyReport(barId, monthly, bar);
      } catch (err) {
        console.error(`[${barId}] Erreur email mensuel :`, err.message);
      }
    }

    monthlyScores[barId] = {};
    saveMonthlyScores(barId);

    if (_io) {
      _io.to(barId).emit('leaderboard:updated', getAllLeaderboards(barId));
    }
    console.log(`[${barId}] Reset mensuel classement`);
  }
}

function scheduleMonthlyReset() {
  const now      = new Date();
  const next1st  = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  const delay    = next1st - now;
  setTimeout(() => {
    resetMonthlyScores();
    scheduleMonthlyReset();
  }, delay);
  console.log(`Reset mensuel planifié dans ${Math.round(delay / 3600000)} h`);
}

scheduleMonthlyReset();

/* ── Gestionnaires Socket.io ─────────────────────────────────────────────── */

module.exports = (io) => {
  _io = io;

  // Heartbeat toutes les 10 s — force une sync complète de toutes les tables et scores
  setInterval(() => {
    for (const [barId, bar] of Object.entries(bars)) {
      if (Object.keys(bar.tables).length > 0) {
        io.to(barId).emit('tables:updated', getActiveTables(barId));
        io.to(barId).emit('scores:updated', bar.scores);
        io.to(barId).emit('leaderboard:updated', getAllLeaderboards(barId));
      }
    }
  }, 10000);

  io.on('connection', (socket) => {
    console.log(`[KLINK] ✅ Connexion : ${socket.id} depuis ${socket.handshake.address}`);
    let currentBarId   = null;
    let currentTableId = null;
    let isAdmin        = false;

    // ── TABLE CLIENT ──────────────────────────────────────────────────────────

    socket.on('join', (payload) => {
      try {
        const { barId, tableId, pseudo, photo, tableUUID } = payload ?? {};

        // Validation
        if (!isStr(barId, 50))    return;
        if (!isStr(tableId, 50))  return;
        if (!isStr(pseudo, 30))   return;
        if (!isValidPhoto(photo)) return;

        // UUID unique par table (persisté côté client dans localStorage)
        const validUUID = isStr(tableUUID, 36) ? tableUUID.trim() : tableId;

        // Rate limit : 5 joins par 10 s (reconnexions légitimes comprises)
        if (isRateLimited(socket.id, 'join', 5, 10_000)) return;

        currentBarId   = barId;
        currentTableId = tableId;
        socket.join(barId);

        const bar = getBar(barId);

        // Vérifie l'unicité du nom jusqu'au reset de minuit
        const normalizedPseudo = pseudo.trim().toLowerCase();
        const reservedBy = bar.reservedNames[normalizedPseudo];
        if (reservedBy && reservedBy !== tableId) {
          socket.emit('join:error', { message: '⚡ Ce nom est déjà pris ce soir ! Choisis un autre nom.' });
          return;
        }
        bar.reservedNames[normalizedPseudo] = tableId;

        // Reconnexion : annule le délai de grâce et conserve le statut
        const prevEntry = bar.tables[tableId];
        if (prevEntry) {
          if (prevEntry.disconnectTimer) {
            clearTimeout(prevEntry.disconnectTimer);
            console.log(`[KLINK] 🔄 Reconnexion dans le délai de grâce — table "${tableId}" socket=${socket.id}`);
          } else if (prevEntry.socketId !== socket.id) {
            console.log(`[KLINK] 🔄 Reconnexion — table "${tableId}" ancien socket=${prevEntry.socketId} nouveau socket=${socket.id}`);
          }
        }

        bar.tables[tableId] = {
          socketId:  socket.id,
          pseudo:    pseudo.trim(),
          photo:     photo || null,
          tableId,
          tableUUID: validUUID,
          status:    prevEntry?.status ?? null,   // conserve le statut après reconnexion
          joinedAt:  new Date().toISOString(),
        };

        // Reconnexion : restaure le score (marque connected:true, met à jour pseudo/photo)
        if (bar.scores[validUUID]) {
          bar.scores[validUUID].connected = true;
          bar.scores[validUUID].pseudo    = pseudo.trim();
          if (photo) bar.scores[validUUID].photo = photo;
        }

        console.log(`[KLINK] 📋 join — bar="${barId}" table="${tableId}" uuid="${validUUID}" pseudo="${pseudo.trim()}" socket=${socket.id}`);
        console.log(`[KLINK] 🏠 room "${barId}" contient maintenant ${Object.keys(bar.tables).length} table(s) : ${Object.keys(bar.tables).join(', ')}`);

        // Diffuse la liste complète à TOUTES les tables (remplace complètement côté client)
        io.to(barId).emit('tables:updated', getActiveTables(barId));
        // Scores mis à jour pour tout le monde (connected:true restauré)
        io.to(barId).emit('scores:updated', bar.scores);

        // Si une invitation était en attente lors de la déconnexion, la re-livrer
        const reconnectQueue = bar.inviteQueues[tableId];
        if (reconnectQueue && reconnectQueue.length > 0) {
          socket.emit('invite:receive', reconnectQueue[0]);
        }

        if (bar.leaderboardMessage) {
          socket.emit('bar:leaderboard-message', { message: bar.leaderboardMessage });
        }

        // Envoie les 3 classements à la table qui rejoint
        socket.emit('leaderboard:updated', getAllLeaderboards(barId));

        notifyAdmins(io, barId);
        console.log(`[${barId}] Table ${tableId} rejoint : "${pseudo}"`);
      } catch (err) {
        console.error('[join] erreur :', err.message);
      }
    });

    socket.on('table:status', (payload) => {
      try {
        const { barId, tableId, status } = payload ?? {};
        if (tableId !== currentTableId || barId !== currentBarId) return;
        if (status !== null && !isStr(status, 50)) return;

        const bar = bars[barId];
        if (!bar?.tables[tableId]) return;

        bar.tables[tableId].status = status ?? null;
        io.to(barId).emit('tables:updated', getActiveTables(barId));
        notifyAdmins(io, barId);
      } catch (err) {
        console.error('[table:status] erreur :', err.message);
      }
    });

    socket.on('invite:send', (payload) => {
      try {
        const { barId, fromTableId, fromPseudo, fromPhoto, toTableId, message } = payload ?? {};

        // Vérifications d'appartenance : seule la table actuelle peut envoyer
        if (barId !== currentBarId)         return;
        if (fromTableId !== currentTableId) return;
        if (!isStr(toTableId, 50))          return;
        if (!isStr(message, 300))           return;
        if (fromTableId === toTableId)      return; // pas d'auto-invitation

        // Rate limit : 10 invitations par 30 s
        if (isRateLimited(socket.id, 'invite:send', 10, 30_000)) {
          console.warn(`[${barId}] Rate limit invite:send — socket ${socket.id}`);
          return;
        }

        const bar    = getBar(barId);
        const target = bar.tables[toTableId];
        if (!target) return;

        const inviteData = {
          fromTableId,
          fromPseudo: isStr(fromPseudo, 30) ? fromPseudo.trim() : '?',
          fromPhoto:  isValidPhoto(fromPhoto) ? fromPhoto : null,
          message:    message.trim(),
        };

        bar.stats.invitesSent++;
        recordInviteSent(barId, message);

        if (!bar.inviteQueues[toTableId] || bar.inviteQueues[toTableId].length === 0) {
          // Aucune invitation en cours → livraison immédiate
          bar.inviteQueues[toTableId] = [inviteData];
          io.to(target.socketId).emit('invite:receive', inviteData);
          console.log(`[${barId}] invite:send — livraison immédiate à table "${toTableId}"`);
        } else {
          // Invitation déjà en cours → mise en file d'attente
          bar.inviteQueues[toTableId].push(inviteData);
          const pos    = bar.inviteQueues[toTableId].length;
          const sender = bar.tables[fromTableId];
          if (sender) {
            io.to(sender.socketId).emit('invite:queued', { targetPseudo: target.pseudo, position: pos });
          }
          console.log(`[${barId}] invite:send — file d'attente position ${pos} pour table "${toTableId}"`);
        }
        notifyAdmins(io, barId);
      } catch (err) {
        console.error('[invite:send] erreur :', err.message);
      }
    });

    socket.on('invite:respond', (payload) => {
      try {
        const { barId, toTableId, fromTableId, accepted, message,
                fromPseudo, fromPhoto } = payload ?? {};

        // Seule la table destinataire peut répondre
        if (barId !== currentBarId)        { console.warn(`[invite:respond] barId mismatch: got="${barId}" expected="${currentBarId}"`); return; }
        if (toTableId !== currentTableId)  { console.warn(`[invite:respond] toTableId mismatch: got="${toTableId}" expected="${currentTableId}"`); return; }
        if (!isStr(fromTableId, 50))       { console.warn(`[invite:respond] fromTableId invalide`); return; }
        if (typeof accepted !== 'boolean') { console.warn(`[invite:respond] accepted non-boolean`); return; }
        if (!isStr(message, 300))          { console.warn(`[invite:respond] message invalide: "${message}"`); return; }

        // Rate limit : 20 réponses par 30 s
        if (isRateLimited(socket.id, 'invite:respond', 20, 30_000)) return;

        const bar       = bars[barId];
        if (!bar) { console.warn(`[invite:respond] bar introuvable: "${barId}"`); return; }

        const sender    = bar.tables[fromTableId];
        const responder = bar.tables[toTableId];
        // sender peut être null si la table expéditrice a reconnecté — on utilise
        // les données envoyées par le client (fromPseudo/fromPhoto) comme fallback.

        console.log(`[${barId}] invite:respond — from="${fromTableId}" to="${toTableId}" accepted=${accepted} senderInRoom=${!!sender}`);

        if (accepted) {
          const bar2 = bars[barId];
          if (bar2?.weeklyData) bar2.weeklyData.invitesAccepted++;
          const isBet = message.includes('Je parie');
          const betId = `${barId}-${fromTableId}-${toTableId}-${Date.now()}`;
          if (isBet) bar.stats.betsInProgress++;

          const celebration = {
            betId,
            isBet,
            barId,
            table1: {
              tableId: fromTableId,
              pseudo:  sender?.pseudo ?? (isStr(fromPseudo, 30) ? fromPseudo.trim() : fromTableId),
              photo:   sender?.photo  ?? (isValidPhoto(fromPhoto) ? fromPhoto : null),
            },
            table2: {
              tableId: toTableId,
              pseudo:  responder?.pseudo ?? toTableId,
              photo:   responder?.photo  ?? null,
            },
            message: message.trim(),
          };

          if (sender)    io.to(sender.socketId).emit('invite:accepted', celebration);
          if (responder) io.to(responder.socketId).emit('invite:accepted', celebration);

          // Annuler les invitations en file d'attente pour les autres expéditeurs
          const queueOnAccept = bar.inviteQueues[toTableId];
          if (queueOnAccept) {
            for (const inv of queueOnAccept.slice(1)) {
              const waitingSender = bar.tables[inv.fromTableId];
              if (waitingSender) {
                io.to(waitingSender.socketId).emit('invite:busy', { targetPseudo: responder?.pseudo ?? toTableId });
              }
            }
            delete bar.inviteQueues[toTableId];
          }

          // Marquer les deux tables comme "En jeu"
          if (bar.tables[fromTableId]) bar.tables[fromTableId].status = 'En jeu';
          if (bar.tables[toTableId])   bar.tables[toTableId].status   = 'En jeu';
          io.to(barId).emit('tables:updated', getActiveTables(barId));
          notifyAdmins(io, barId);
          console.log(`[${barId}] Invitation acceptée — ${fromTableId}↔${toTableId} — isBet:${isBet}`);
        } else {
          if (sender) {
            io.to(sender.socketId).emit('invite:response', {
              responderId:     toTableId,
              responderPseudo: responder?.pseudo ?? toTableId,
              accepted:        false,
            });
          }

          // Passer à l'invitation suivante dans la file
          const queueOnDecline = bar.inviteQueues[toTableId];
          if (queueOnDecline) {
            queueOnDecline.shift();
            if (queueOnDecline.length > 0) {
              const next        = queueOnDecline[0];
              const targetTable = bar.tables[toTableId];
              if (targetTable) {
                io.to(targetTable.socketId).emit('invite:receive', next);
                console.log(`[${barId}] File d'attente — livraison de la prochaine invitation à "${toTableId}"`);
              }
            } else {
              delete bar.inviteQueues[toTableId];
            }
          }
        }
      } catch (err) {
        console.error('[invite:respond] erreur :', err.message);
      }
    });

    socket.on('bet:result', (payload) => {
      try {
        const { barId, betId, winnerPseudo, winnerTableId, winnerPhoto } = payload ?? {};

        if (barId !== currentBarId) return;
        if (!isStr(betId, 150))        return;
        if (!isStr(winnerPseudo, 30))  return;
        if (!isStr(winnerTableId, 50)) return;

        // Rate limit : 5 résultats par 10 s
        if (isRateLimited(socket.id, 'bet:result', 5, 10_000)) return;

        const bar = bars[barId];
        if (!bar || bar.resolvedBets.has(betId)) return; // déduplication

        const firstVote = bar.pendingVotes[betId];

        if (!firstVote) {
          // Premier vote — on attend le deuxième
          bar.pendingVotes[betId] = { voterTableId: currentTableId, winnerTableId, winnerPseudo, winnerPhoto };
          console.log(`[${barId}] Pari ${betId} — premier vote de table "${currentTableId}" pour "${winnerPseudo}"`);
          // Timeout 5 min : supprime un vote orphelin si le 2e vote n'arrive jamais
          setTimeout(() => {
            if (bars[barId]?.pendingVotes?.[betId]) {
              console.log(`[${barId}] Pari ${betId} — vote orphelin supprimé après timeout`);
              delete bars[barId].pendingVotes[betId];
            }
          }, 5 * 60 * 1000);
          return;
        }

        // Deuxième vote — même table ne peut pas voter deux fois
        if (firstVote.voterTableId === currentTableId) {
          console.warn(`[${barId}] bet:result — double vote ignoré de table "${currentTableId}"`);
          return;
        }

        // Nettoyage
        delete bar.pendingVotes[betId];
        bar.resolvedBets.set(betId, Date.now());
        if (bar.stats.betsInProgress > 0) bar.stats.betsInProgress--;
        if (bar.resolvedBets.size > 500) pruneResolvedBets(bar);

        if (firstVote.winnerTableId === winnerTableId) {
          // ── Accord — résolution normale ──────────────────────────────────────
          const winnerTable = bar.tables[winnerTableId];
          const uuid = winnerTable?.tableUUID || winnerTableId;

          if (!bar.scores[uuid]) {
            bar.scores[uuid] = { wins: 0, pseudo: winnerPseudo, tableId: winnerTableId, photo: null, connected: true };
          }
          bar.scores[uuid].wins++;
          bar.scores[uuid].pseudo    = winnerPseudo;
          bar.scores[uuid].tableId   = winnerTableId;
          bar.scores[uuid].connected = true;

          // Priorité : photo stockée côté serveur au moment du join (plus fiable).
          const storedPhoto  = winnerTable?.photo ?? null;
          const photoToStore = storedPhoto !== null ? storedPhoto
            : (isValidPhoto(winnerPhoto) && winnerPhoto != null ? winnerPhoto : null);
          bar.scores[uuid].photo = photoToStore;
          console.log(`[${barId}] Photo classement "${winnerPseudo}" (uuid=${uuid}) : ${photoToStore ? 'présente' : 'absente'} (source=${storedPhoto !== null ? 'serveur' : 'client'})`);

          // ── Classement horaire (round) ──────────────────────────────────────
          if (!bar.hourlyScores[uuid]) {
            bar.hourlyScores[uuid] = { wins: 0, pseudo: winnerPseudo, tableId: winnerTableId, photo: photoToStore };
          }
          bar.hourlyScores[uuid].wins++;
          bar.hourlyScores[uuid].pseudo = winnerPseudo;
          bar.hourlyScores[uuid].photo  = photoToStore;

          // ── Classement mensuel (JSON persistant) ────────────────────────────
          const monthly = loadMonthlyScores(barId);
          if (!monthly[uuid]) {
            monthly[uuid] = { wins: 0, pseudo: winnerPseudo, tableId: winnerTableId, photo: photoToStore };
          }
          monthly[uuid].wins++;
          monthly[uuid].pseudo = winnerPseudo;
          monthly[uuid].photo  = photoToStore;
          saveMonthlyScores(barId);

          // Libérer le statut "En jeu" des deux tables
          const t1accord = firstVote.voterTableId;
          const t2accord = currentTableId;
          if (bar.tables[t1accord]?.status === 'En jeu') bar.tables[t1accord].status = null;
          if (bar.tables[t2accord]?.status === 'En jeu') bar.tables[t2accord].status = null;

          io.to(barId).emit('scores:updated', bar.scores);
          io.to(barId).emit('leaderboard:updated', getAllLeaderboards(barId));
          io.to(barId).emit('tables:updated', getActiveTables(barId));
          notifyAdmins(io, barId);
          console.log(`[${barId}] Pari résolu — vainqueur : ${winnerPseudo}`);

        } else {
          // ── Désaccord — égalité ──────────────────────────────────────────────
          const voter1 = bar.tables[firstVote.voterTableId];
          const voter2 = bar.tables[currentTableId];

          // Libérer le statut "En jeu" (désaccord = retour à l'état normal)
          if (voter1?.status === 'En jeu') voter1.status = null;
          if (voter2?.status === 'En jeu') voter2.status = null;

          const tieEvent = {
            betId,
            table1: {
              tableId: firstVote.voterTableId,
              pseudo:  voter1?.pseudo ?? firstVote.voterTableId,
              photo:   voter1?.photo  ?? null,
            },
            table2: {
              tableId: currentTableId,
              pseudo:  voter2?.pseudo ?? currentTableId,
              photo:   voter2?.photo  ?? null,
            },
          };

          if (voter1) io.to(voter1.socketId).emit('bet:tie', tieEvent);
          if (voter2) io.to(voter2.socketId).emit('bet:tie', tieEvent);
          io.to(barId).emit('tables:updated', getActiveTables(barId));
          notifyAdmins(io, barId);
          console.log(`[${barId}] Égalité pari ${betId} — table "${firstVote.voterTableId}" vs "${currentTableId}" ne s'accordent pas`);
        }
      } catch (err) {
        console.error('[bet:result] erreur :', err.message);
      }
    });

    // ── ADMIN ─────────────────────────────────────────────────────────────────

    socket.on('admin:join', (payload) => {
      try {
        const { barId, password } = payload ?? {};

        if (!isStr(barId, 50)) return;

        // Rate limit sur les tentatives de connexion admin : 5 essais / 60 s
        if (isRateLimited(socket.id, 'admin:join', 5, 60_000)) {
          socket.emit('admin:error', { message: 'Trop de tentatives. Réessayez dans une minute.' });
          return;
        }

        const bar = getBar(barId); // crée le bar si nécessaire (génère le mdp)
        if (password !== bar.adminPassword) {
          socket.emit('admin:error', { message: 'Mot de passe incorrect' });
          return;
        }

        isAdmin      = true;
        currentBarId = barId;
        socket.join(`admin:${barId}`);
        bar.adminSockets.add(socket.id);
        socket.emit('admin:dashboard', getDashboard(barId));
        socket.emit('admin:history', history[barId] || []);
        console.log(`[${barId}] Admin connecté`);
      } catch (err) {
        console.error('[admin:join] erreur :', err.message);
      }
    });

    socket.on('admin:announce', (payload) => {
      try {
        if (!isAdmin) return;
        const { barId, message } = payload ?? {};
        if (barId !== currentBarId) return;
        if (!isStr(message, 200))   return;

        // Rate limit : 1 annonce par 5 s
        if (isRateLimited(socket.id, 'admin:announce', 1, 5_000)) return;

        io.to(barId).emit('bar:announcement', { message: message.trim() });
        console.log(`[${barId}] Annonce : "${message}"`);
      } catch (err) {
        console.error('[admin:announce] erreur :', err.message);
      }
    });

    socket.on('admin:setLeaderboardMessage', (payload) => {
      try {
        if (!isAdmin) return;
        const { barId, message } = payload ?? {};
        if (barId !== currentBarId) return;
        // Message vide autorisé pour effacer
        if (message !== '' && !isStr(message, 80)) return;

        const bar = getBar(barId);
        bar.leaderboardMessage = typeof message === 'string' ? message.trim() : '';
        io.to(barId).emit('bar:leaderboard-message', { message: bar.leaderboardMessage });
        console.log(`[${barId}] Message classement : "${bar.leaderboardMessage}"`);
      } catch (err) {
        console.error('[admin:setLeaderboardMessage] erreur :', err.message);
      }
    });

    socket.on('admin:getHistory', (payload) => {
      try {
        if (!isAdmin) return;
        const { barId } = payload ?? {};
        if (barId !== currentBarId) return;
        socket.emit('admin:history', history[barId] || []);
      } catch (err) {
        console.error('[admin:getHistory] erreur :', err.message);
      }
    });

    // ── EMAIL GÉRANT ──────────────────────────────────────────────────────────

    socket.on('admin:setEmail', (payload) => {
      try {
        if (!isAdmin) return;
        const { barId, email } = payload ?? {};
        if (barId !== currentBarId) return;
        const bar = bars[barId];
        if (!bar) return;
        // Accepte une adresse valide ou vide (pour supprimer)
        const trimmed = typeof email === 'string' ? email.trim() : '';
        bar.adminEmail = trimmed.includes('@') ? trimmed : null;
        socket.emit('admin:emailSaved', { email: bar.adminEmail });
        console.log(`[${barId}] Email gérant : ${bar.adminEmail ?? 'supprimé'}`);
      } catch (err) {
        console.error('[admin:setEmail] erreur :', err.message);
      }
    });

    socket.on('admin:getMonthlyWinner', (payload) => {
      try {
        if (!isAdmin) return;
        const { barId } = payload ?? {};
        if (barId !== currentBarId) return;
        const monthly  = loadMonthlyScores(barId);
        const entries  = Object.entries(monthly).sort(([, a], [, b]) => b.wins - a.wins);
        const winner   = entries.length > 0 ? entries[0][1] : null;
        socket.emit('admin:monthlyWinner', { winner, leaderboard: monthly });
      } catch (err) {
        console.error('[admin:getMonthlyWinner] erreur :', err.message);
      }
    });

    socket.on('admin:sendTestReport', async (payload) => {
      try {
        if (!isAdmin) return;
        const { barId } = payload ?? {};
        if (barId !== currentBarId) return;

        // Rate limit : 1 envoi test par 30 s
        if (isRateLimited(socket.id, 'admin:sendTestReport', 1, 30_000)) {
          socket.emit('admin:testReportResult', { ok: false, error: 'Attendez 30 secondes avant un nouvel envoi.' });
          return;
        }

        console.log(`[${barId}] Rapport test demandé par admin`);
        const result = await sendWeeklyReport(barId);
        socket.emit('admin:testReportResult', result);
      } catch (err) {
        console.error('[admin:sendTestReport] erreur :', err.message);
        socket.emit('admin:testReportResult', { ok: false, error: err.message });
      }
    });

    // ── PARTAGE DE CONTACT DIRECT ─────────────────────────────────────────────

    socket.on('contact:send', (payload) => {
      try {
        const { barId, toTableId, pseudo, photo, contact } = payload ?? {};

        if (barId !== currentBarId) {
          console.warn(`[contact:send] barId mismatch: reçu="${barId}" attendu="${currentBarId}" — socket=${socket.id}`);
          return;
        }
        if (!isStr(toTableId, 50)) { console.warn(`[contact:send] toTableId invalide`); return; }
        if (!isStr(pseudo, 30))    { console.warn(`[contact:send] pseudo invalide`); return; }
        if (!contact?.value)       { console.warn(`[contact:send] contact.value manquant`); return; }

        if (isRateLimited(socket.id, 'contact:send', 10, 60_000)) {
          console.warn(`[contact:send] rate limit atteint pour socket=${socket.id}`);
          return;
        }

        const bar = bars[barId];
        const target = bar?.tables[toTableId];
        if (!target) {
          const tableIds = Object.keys(bar?.tables ?? {});
          console.warn(`[${barId}] contact:send : table cible "${toTableId}" introuvable. Tables actives : [${tableIds.join(', ')}]`);
          return;
        }

        io.to(target.socketId).emit('contact:receive', {
          fromPseudo: pseudo.trim(),
          fromPhoto:  isValidPhoto(photo) ? photo : null,
          contact:    { type: contact.type ?? 'instagram', value: String(contact.value).trim().slice(0, 100) },
        });
        console.log(`[${barId}] Contact envoyé de "${pseudo}" (socket=${socket.id}) → table "${toTableId}" (socket=${target.socketId})`);
      } catch (err) {
        console.error('[contact:send] erreur :', err.message);
      }
    });

    // ── DÉCONNEXION ───────────────────────────────────────────────────────────

    socket.on('disconnect', () => {
      try {
        console.log(`[KLINK] ❌ Déconnexion : ${socket.id} (bar="${currentBarId}" table="${currentTableId}")`);
        purgeRateLimits(socket.id); // nettoyage rate limits

        if (!currentBarId) return;
        const bar = bars[currentBarId];
        if (!bar) return;

        bar.adminSockets.delete(socket.id);

        if (!isAdmin && currentTableId) {
          const entry = bar.tables[currentTableId];
          if (entry && entry.socketId === socket.id) {
            // Délai de grâce 8 s : absorbe les micro-coupures et l'upgrade polling→WS.
            // Si la table renvoie 'join' avant l'expiration, le timer est annulé.
            entry.disconnectTimer = setTimeout(() => {
              const cur = bar.tables[currentTableId];
              if (cur && cur.socketId === socket.id) {
                // Annuler la file d'invitations en attente pour cette table
                const pendingQueue = bar.inviteQueues[currentTableId];
                if (pendingQueue) {
                  pendingQueue.forEach((inv, idx) => {
                    const waitingSender = bar.tables[inv.fromTableId];
                    if (waitingSender) {
                      if (idx === 0) {
                        // Invite active (déjà affichée) → feedback refus clair pour l'expéditeur
                        io.to(waitingSender.socketId).emit('invite:response', {
                          responderPseudo: cur.pseudo,
                          accepted: false,
                        });
                      } else {
                        // Invites en file d'attente → notifier comme occupé
                        io.to(waitingSender.socketId).emit('invite:busy', { targetPseudo: cur.pseudo });
                      }
                    }
                  });
                  delete bar.inviteQueues[currentTableId];
                }
                // Marquer la table comme déconnectée dans le classement (reste visible en grisé)
                const removedUUID = cur.tableUUID || currentTableId;
                if (bar.scores[removedUUID]) {
                  bar.scores[removedUUID].connected = false;
                }
                delete bar.tables[currentTableId];
                io.to(currentBarId).emit('tables:updated', getActiveTables(currentBarId));
                io.to(currentBarId).emit('scores:updated', bar.scores);
                notifyAdmins(io, currentBarId);
                console.log(`[${currentBarId}] Table ${currentTableId} retirée après délai de grâce (socket=${socket.id})`);
                maybeCleanBar(currentBarId);
              }
            }, 8000);
            console.log(`[${currentBarId}] Table ${currentTableId} — délai de grâce 8 s (socket=${socket.id})`);
          } else if (entry) {
            // Socket obsolète — la table a déjà été ré-enregistrée par un nouveau socket
            console.log(`[${currentBarId}] Socket obsolète ${socket.id} pour table ${currentTableId} — table conservée (socket actif=${entry.socketId})`);
          }
        }

        // Nettoyer le bar s'il est devenu complètement vide (admin disconnect ou table sans barId)
        maybeCleanBar(currentBarId);
      } catch (err) {
        console.error('[disconnect] erreur :', err.message);
      }
    });
  });
};

/* ── Rapport hebdomadaire email ──────────────────────────────────────────── */

function buildWeeklyHtml(barId) {
  const snaps     = (history[barId] || []).slice(-7);
  const total     = snaps.reduce((a, s) => ({
    invites: a.invites + (s.stats.invitesSent    ?? 0),
    bets:    a.bets    + (s.stats.betsInProgress ?? 0),
    tables:  a.tables  + (s.stats.activeTables   ?? 0),
  }), { invites: 0, bets: 0, tables: 0 });
  const avgTables = snaps.length ? (total.tables / snaps.length).toFixed(1) : '—';

  const wd = bars[barId]?.weeklyData ?? initWeeklyData();

  /* 1 — Heure de pic d'activité */
  const hourlyAct       = wd.hourlyActivity;
  const totalHourlyActs = Object.values(hourlyAct).reduce((a, b) => a + b, 0);
  let peakHtml;
  if (totalHourlyActs > 0) {
    const [peakKey, peakCnt] = Object.entries(hourlyAct).sort(([, a], [, b]) => b - a)[0];
    const [day, hourStr]     = peakKey.split('-');
    const hour               = parseInt(hourStr, 10);
    const pct                = Math.round(peakCnt / totalHourlyActs * 100);
    peakHtml = `<strong style="color:#fff">${day} ${hour}h–${hour + 1}h</strong>
      <span style="color:rgba(255,255,255,0.45);font-size:13px;display:block;margin-top:2px">${pct}% de votre activité</span>`;
  } else {
    peakHtml = `<span style="color:rgba(255,255,255,0.3)">Données insuffisantes</span>`;
  }

  /* 2 — Taux d'acceptation */
  const wSent     = wd.invitesSent;
  const wAccepted = wd.invitesAccepted;
  let acceptHtml;
  if (wSent > 0) {
    const pct   = Math.round(wAccepted / wSent * 100);
    const color = pct >= 60 ? '#00FF87' : pct >= 35 ? '#FFD700' : '#FF6B6B';
    acceptHtml  = `<strong style="color:${color};font-size:22px">${pct}%</strong>
      <span style="color:rgba(255,255,255,0.45);font-size:13px;display:block;margin-top:2px">des invitations acceptées (${wAccepted}/${wSent})</span>`;
  } else {
    acceptHtml = `<span style="color:rgba(255,255,255,0.3)">Données insuffisantes</span>`;
  }

  /* 3 — Activité la plus populaire */
  const actTypes  = wd.activityTypes;
  const totalActs = Object.values(actTypes).reduce((a, b) => a + b, 0);
  let actHtml;
  if (totalActs > 0) {
    const [topType, topCnt] = Object.entries(actTypes).sort(([, a], [, b]) => b - a)[0];
    const pct               = Math.round(topCnt / totalActs * 100);
    const emoji             = ACTIVITY_EMOJIS[topType] ?? '✨';
    actHtml = `<strong style="color:#fff">${emoji} ${topType}</strong>
      <span style="color:rgba(255,255,255,0.45);font-size:13px;display:block;margin-top:2px">${pct}% des invitations</span>`;
  } else {
    actHtml = `<span style="color:rgba(255,255,255,0.3)">Données insuffisantes</span>`;
  }

  /* 4 — Soirées actives */
  const activeDaysCount = wd.activeDates.size;
  let soireesHtml;
  if (activeDaysCount > 0) {
    soireesHtml = `<strong style="color:#fff;font-size:22px">${activeDaysCount}</strong>
      <span style="color:rgba(255,255,255,0.45);font-size:13px;display:block;margin-top:2px">soir${activeDaysCount > 1 ? 's' : ''} actif${activeDaysCount > 1 ? 's' : ''} sur 7</span>`;
  } else {
    soireesHtml = `<span style="color:rgba(255,255,255,0.3)">Aucune activité cette semaine</span>`;
  }

  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const metric = (label, content) =>
    `<tr>
      <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
        <span style="color:rgba(255,255,255,0.45);font-size:12px;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:4px">${label}</span>
        ${content}
      </td>
    </tr>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="background:#0D0D0D;color:#fff;font-family:system-ui,sans-serif;padding:32px;max-width:520px;margin:0 auto">

  <div style="text-align:center;margin-bottom:28px">
    <img src="cid:klink-logo@klink" width="56" height="56" alt="KLINK"
         style="border-radius:10px;display:block;margin:0 auto 12px" />
    <h1 style="color:#00FF87;font-size:26px;margin:0 0 4px">KLINK</h1>
    <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0">Rapport hebdomadaire · ${dateStr}</p>
    <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:4px 0">Bar : <strong style="color:rgba(255,255,255,0.6)">${barId}</strong></p>
  </div>

  <div style="background:rgba(255,255,255,0.06);border-radius:16px;padding:20px 24px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.09)">
    <h2 style="color:#FFD700;font-size:14px;margin:0 0 14px;text-transform:uppercase;letter-spacing:.06em">📊 Statistiques de la semaine</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5)">Invitations envoyées</td><td style="text-align:right;font-weight:700;font-size:18px">${total.invites}</td></tr>
      <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5)">Paris joués</td><td style="text-align:right;font-weight:700;font-size:18px">${total.bets}</td></tr>
      <tr><td style="padding:6px 0;color:rgba(255,255,255,0.5)">Tables actives / soir</td><td style="text-align:right;font-weight:700;font-size:18px">${avgTables}</td></tr>
    </table>
  </div>

  <div style="background:rgba(255,255,255,0.06);border-radius:16px;padding:20px 24px;margin-bottom:28px;border:1px solid rgba(255,255,255,0.09)">
    <h2 style="color:#FFD700;font-size:14px;margin:0 0 4px;text-transform:uppercase;letter-spacing:.06em">📈 Insights de la semaine</h2>
    <table style="width:100%;border-collapse:collapse">
      ${metric('⏰ Heure de pic d\'activité', peakHtml)}
      ${metric('✅ Taux d\'acceptation des invitations', acceptHtml)}
      ${metric('🎯 Activité la plus populaire', actHtml)}
      ${metric('🌙 Soirées actives', soireesHtml)}
    </table>
  </div>

  <p style="color:rgba(255,255,255,0.2);font-size:11px;text-align:center">
    Cet email est envoyé automatiquement chaque lundi à 9h par KLINK.<br>
    Pour ne plus le recevoir, supprimez votre email dans le dashboard admin.
  </p>
</body></html>`;
}

async function sendWeeklyReport(barId) {
  if (!mailer) return { ok: false, error: 'Mailer non configuré (GMAIL_USER manquant)' };
  const email = bars[barId]?.adminEmail;
  if (!email) return { ok: false, error: 'Aucun email enregistré pour ce bar' };
  try {
    await mailer.sendMail({
      from:    `"KLINK" <${process.env.GMAIL_USER}>`,
      to:      email,
      subject: `🍺 KLINK — Rapport de la semaine`,
      html:    buildWeeklyHtml(barId),
      attachments: [{
        filename:    'klink-logo.svg',
        content:     LOGO_SVG_BUFFER,
        cid:         'klink-logo@klink',
        contentType: 'image/svg+xml',
      }],
    });
    // Réinitialise les stats hebdo après envoi réussi
    if (bars[barId]) bars[barId].weeklyData = initWeeklyData();
    console.log(`[KLINK] 📧 Rapport envoyé à ${email} pour le bar "${barId}"`);
    return { ok: true };
  } catch (err) {
    console.error(`[KLINK] ❌ Erreur envoi email (${barId}) :`, err.message);
    return { ok: false, error: err.message };
  }
}

async function sendWeeklyReports() {
  for (const barId of Object.keys(bars)) {
    await sendWeeklyReport(barId);
  }
}

function scheduleWeeklyReport() {
  const now  = new Date();
  const next = new Date();
  // Prochain lundi à 9h
  const daysUntilMonday = ((1 - now.getDay() + 7) % 7) || 7;
  next.setDate(now.getDate() + daysUntilMonday);
  next.setHours(9, 0, 0, 0);
  const delay = next - now;
  setTimeout(() => {
    sendWeeklyReports();
    scheduleWeeklyReport();
  }, delay);
  console.log(`[KLINK] 📧 Rapport hebdo planifié dans ${Math.round(delay / 3600000)}h (lundi 9h)`);
}

scheduleWeeklyReport();

/* ── Rapport mensuel email ───────────────────────────────────────────────── */

async function sendMonthlyReport(barId, monthly, bar) {
  if (!mailer) return;
  const email = bar?.adminEmail;
  if (!email) return;

  const entries = Object.entries(monthly).sort(([, a], [, b]) => b.wins - a.wins);
  if (entries.length === 0) return;

  const [winnerUUID, winner] = entries[0];
  const now    = new Date();
  const month  = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const totalBets = entries.reduce((s, [, e]) => s + e.wins, 0);

  const avatarHtml = winner.photo
    ? `<img src="${winner.photo}" width="80" height="80"
         style="border-radius:50%;border:3px solid #FFD700;display:block;margin:0 auto 12px" />`
    : `<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#00FF87,#00D4FF);
         display:flex;align-items:center;justify-content:center;margin:0 auto 12px;
         font-size:32px;font-weight:900;color:#0A1628">${(winner.pseudo || '?')[0].toUpperCase()}</div>`;

  const podiumHtml = entries.slice(0, 5).map(([, e], i) => {
    const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
    return `<tr>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
        <span style="color:rgba(255,255,255,0.45);margin-right:8px">${medals[i]}</span>
        <strong style="color:#fff">${e.pseudo ?? winnerUUID}</strong>
        <span style="float:right;color:#00FF87;font-weight:700">${e.wins} ⚡</span>
      </td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="background:#0D0D0D;color:#fff;font-family:system-ui,sans-serif;padding:32px;max-width:520px;margin:0 auto">
  <div style="text-align:center;margin-bottom:28px">
    <img src="cid:klink-logo@klink" width="56" height="56" alt="KLINK"
         style="border-radius:10px;display:block;margin:0 auto 12px" />
    <h1 style="color:#00FF87;font-size:26px;margin:0 0 4px">KLINK</h1>
    <p style="color:rgba(255,255,255,0.45);font-size:14px;margin:0">Classement du mois — ${month}</p>
  </div>
  <div style="background:rgba(255,215,0,0.08);border:1.5px solid rgba(255,215,0,0.5);
       border-radius:16px;padding:24px;text-align:center;margin-bottom:20px">
    <p style="color:#FFD700;font-size:12px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 12px">👑 Légende du mois</p>
    ${avatarHtml}
    <h2 style="color:#FFD700;font-size:24px;margin:0 0 4px">${winner.pseudo ?? winnerUUID}</h2>
    <p style="color:#00FF87;font-size:18px;font-weight:700;margin:0">${winner.wins} ⚡ paris gagnés</p>
  </div>
  <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:16px 20px;margin-bottom:20px">
    <table style="width:100%;border-collapse:collapse">
      <tr><td colspan="2" style="padding-bottom:8px;color:rgba(255,255,255,0.45);font-size:12px;
           text-transform:uppercase;letter-spacing:.08em">Top 5 du mois</td></tr>
      ${podiumHtml}
    </table>
  </div>
  <div style="background:rgba(0,212,255,0.06);border:1px solid rgba(0,212,255,0.2);
       border-radius:12px;padding:16px 20px;margin-bottom:24px">
    <p style="color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px">Stats du mois</p>
    <p style="margin:4px 0;color:#fff"><strong style="color:#00D4FF">${totalBets}</strong> paris résolus</p>
    <p style="margin:4px 0;color:#fff"><strong style="color:#00D4FF">${entries.length}</strong> joueurs uniques</p>
    <p style="margin:4px 0;color:rgba(255,255,255,0.6);font-size:13px">Période : ${month}</p>
  </div>
  <div style="background:linear-gradient(135deg,rgba(0,255,135,0.10),rgba(0,212,255,0.10));
       border:1px solid rgba(0,255,135,0.25);border-radius:12px;padding:16px 20px;margin-bottom:24px">
    <p style="color:#00FF87;font-weight:700;margin:0 0 8px">🏆 Affichez le champion dans votre bar !</p>
    <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0">
      L'équipe <strong style="color:#fff">${winner.pseudo ?? winnerUUID}</strong> a dominé ce mois —
      connectez-vous à votre dashboard KLINK pour télécharger l'affiche du gagnant et l'imprimer.
    </p>
  </div>
  <p style="color:rgba(255,255,255,0.25);font-size:11px;text-align:center">
    KLINK · Bar ${barId} · Ce classement se remet à zéro automatiquement chaque 1er du mois
  </p>
</body></html>`;

  try {
    await mailer.sendMail({
      from:    `"KLINK Bar" <${process.env.GMAIL_USER}>`,
      to:      email,
      subject: `👑 Classement du mois ${month} — ${winner.pseudo ?? 'Votre champion'} domine !`,
      html,
      attachments: [{
        filename:    'klink-logo.svg',
        content:     LOGO_SVG_BUFFER,
        cid:         'klink-logo@klink',
        contentType: 'image/svg+xml',
      }],
    });
    console.log(`[KLINK] 📧 Rapport mensuel envoyé à ${email} pour "${barId}"`);
  } catch (err) {
    console.error(`[KLINK] ❌ Erreur email mensuel (${barId}) :`, err.message);
  }
}

