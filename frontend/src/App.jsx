import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import socket from './socket';
import { useTwemoji } from './hooks/useTwemoji';
import { initAudio } from './utils/audioAlert';
import JoinPage from './pages/JoinPage';
import TablesPage from './pages/TablesPage';
import InvitePage from './pages/InvitePage';
import CelebrationPopup from './components/CelebrationPopup';
import BetResultModal from './components/BetResultModal';
import ContactAlert from './components/ContactAlert';
import InvitationAlert from './components/InvitationAlert';

/** Retourne l'UUID persistant de cette table (localStorage), le crée si absent. */
function getOrCreateTableUUID(barId, tableId) {
  const key = `klink_table_id_${barId}_${tableId}`;
  let uuid = localStorage.getItem(key);
  if (!uuid) {
    uuid = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15);
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    localStorage.setItem(key, uuid);
  }
  return uuid;
}

export default function App() {
  const { barId, tableId } = useParams();

  useTwemoji();

  const [screen, setScreen]                         = useState('join');
  const [user, setUser]                             = useState(null);
  const [myStatus, setMyStatus]                     = useState(null);
  const [tables, setTables]                         = useState([]);
  const [scores, setScores]                         = useState({});
  const [leaderboard, setLeaderboard]               = useState({ hourly: {}, evening: {}, monthly: {} });
  const [roundReset, setRoundReset]                 = useState(0); // incrémenté à chaque reset horaire
  const [leaderboardMessage, setLeaderboardMessage] = useState('');
  const [inviteTarget, setInviteTarget]             = useState(null);
  const [pendingInvite, setPendingInvite]           = useState(null);
  const [inviteResponse, setInviteResponse]         = useState(null);
  const [celebration, setCelebration]               = useState(null);
  const [betPending, setBetPending]                 = useState(null);
  const [announcement, setAnnouncement]             = useState(null);
  const [receivedContact, setReceivedContact]       = useState(null);
  const [connected, setConnected]                   = useState(false);
  const [senderNotif, setSenderNotif]               = useState(null); // { type: 'queued'|'busy', pseudo }
  const [joinError, setJoinError]                   = useState(null);
  const [joinRetryIn, setJoinRetryIn]               = useState(null);  // null | 2 | 1
  const [betCancelled, setBetCancelled]             = useState(null);  // message annulation

  // Refs stables — jamais recréés, lisibles depuis n'importe quel handler socket
  const userRef         = useRef(null);   // { pseudo, photo } de l'utilisateur courant
  const hasJoined       = useRef(false);  // true après le premier join (pour re-join sur reconnexion)
  const joinRetryCredsRef = useRef(null); // { pseudo, photo } sauvegardés pour auto-retry
  const joinRetryTimerRef = useRef(null); // handle du setInterval de compte à rebours
  // On stocke barId/tableId dans des refs pour que les handlers socket (fermés sur [])
  // lisent toujours les valeurs courantes sans être des dépendances du useEffect.
  const barIdRef   = useRef(barId);
  const tableIdRef = useRef(tableId);

  // ── Enregistrement des handlers Socket.io ──────────────────────────────────
  // Deps = [] : l'effet ne tourne QU'UNE SEULE FOIS (au montage).
  // Le cleanup ne s'exécute qu'au démontage réel du composant.
  // ⚠️  Avec [barId, tableId] comme deps, tout changement (même apparent) de
  // useParams() relancerait l'effet et appellerait socket.disconnect() pendant
  // que l'utilisateur est connecté — c'est la cause de la disparition des tables.
  useEffect(() => {
    const onTablesUpdated = (updatedTables) => {
      setTables(updatedTables.filter((t) => t.tableId !== tableIdRef.current));
    };
    const onScoresUpdated = (updatedScores) => {
      setScores(updatedScores);
    };
    const onLeaderboardUpdated = (data) => {
      setLeaderboard(data);
    };
    const onRoundReset = () => {
      setRoundReset((n) => n + 1);
    };
    const onLeaderboardMsg = ({ message }) => {
      setLeaderboardMessage(message);
    };
    const onInviteReceive = (invite) => {
      // Accuser réception immédiatement pour annuler le timer de re-tentative serveur
      socket.emit('invite:ack', {
        barId:       barIdRef.current,
        fromTableId: invite.fromTableId,
      });
      setPendingInvite(invite);
    };
    const onInviteResponse = ({ responderPseudo, accepted }) => {
      if (!accepted) {
        setInviteResponse({ responderPseudo, accepted: false });
        setTimeout(() => setInviteResponse(null), 4500);
      }
    };
    const onInviteAccepted = (celebrationData) => {
      setPendingInvite(null);
      setMyStatus('En jeu');
      setCelebration(celebrationData);
    };
    const onAnnouncement = ({ message }) => {
      setAnnouncement(message);
    };
    const onContactReceive = (data) => {
      setReceivedContact(data);
    };
    const onBetTie = (tieData) => {
      setBetPending(null);
      setMyStatus(null);
      setCelebration({ isTie: true, ...tieData });
    };

    // Bug 5 — Scores restaurés : mettre à jour le leaderboard immédiatement
    const onScoresRestored = (lb) => {
      setLeaderboard(lb);
      console.log('[socket] scores:restored — classements rechargés');
    };

    // Bug 2 — Pari annulé : libérer l'interface et afficher le message
    const onBetCancelled = ({ message }) => {
      setBetPending(null);
      setCelebration(null);
      setMyStatus(null);
      setBetCancelled(message || 'Pari annulé — pas de réponse');
      setTimeout(() => setBetCancelled(null), 5_000);
      console.log('[socket] bet:cancelled :', message);
    };

    // Bug 6 — join:error : auto-retry 2s pour les erreurs non-bloquantes
    const onJoinError = ({ message }) => {
      const isNameConflict = typeof message === 'string' && message.includes('Ce nom est déjà pris');

      setScreen('join');
      hasJoined.current = false;
      socket.disconnect();
      setJoinError(message);

      // Arrêter tout retry en cours
      if (joinRetryTimerRef.current) {
        clearInterval(joinRetryTimerRef.current);
        joinRetryTimerRef.current = null;
      }

      if (!isNameConflict && joinRetryCredsRef.current) {
        // Erreur transitoire → réessayer automatiquement dans 2s
        setJoinRetryIn(2);
        const creds = joinRetryCredsRef.current;
        joinRetryTimerRef.current = setInterval(() => {
          setJoinRetryIn((prev) => {
            if (prev === null) return null;
            if (prev <= 1) {
              clearInterval(joinRetryTimerRef.current);
              joinRetryTimerRef.current = null;
              // Réinitialiser et relancer la connexion
              userRef.current   = creds;
              hasJoined.current = true;
              setJoinError(null);
              setJoinRetryIn(null);
              getOrCreateTableUUID(barIdRef.current, tableIdRef.current);
              setUser({ pseudo: creds.pseudo, photo: creds.photo, tableId: tableIdRef.current, barId: barIdRef.current });
              socket.connect();
              setScreen('tables');
              return null;
            }
            return prev - 1;
          });
        }, 1_000);
      } else {
        // Conflit de nom ou pas de creds → laisser l'utilisateur choisir
        userRef.current = null;
        joinRetryCredsRef.current = null;
        setJoinRetryIn(null);
      }
    };

    const onInviteQueued = ({ targetPseudo }) => {
      setSenderNotif({ type: 'queued', pseudo: targetPseudo });
      setTimeout(() => setSenderNotif(null), 5000);
    };
    const onInviteBusy = ({ targetPseudo }) => {
      setSenderNotif({ type: 'busy', pseudo: targetPseudo });
      setTimeout(() => setSenderNotif(null), 5000);
    };

    // Appelé à chaque connexion (initiale et reconnexion automatique).
    // Émet 'join' pour (ré)enregistrer la table côté serveur.
    const onConnect = () => {
      console.log('[socket] ✅ connecté — id :', socket.id);
      setConnected(true);
      if (hasJoined.current && userRef.current) {
        socket.emit('join', {
          barId:     barIdRef.current,
          tableId:   tableIdRef.current,
          tableUUID: getOrCreateTableUUID(barIdRef.current, tableIdRef.current),
          pseudo:    userRef.current.pseudo,
          photo:     userRef.current.photo,
        });
      }
    };

    const onDisconnect = (reason) => {
      console.log('[socket] ❌ déconnecté — raison :', reason);
      setConnected(false);
    };

    socket.on('connect',                 onConnect);
    socket.on('disconnect',              onDisconnect);
    socket.on('tables:updated',          onTablesUpdated);
    socket.on('scores:updated',          onScoresUpdated);
    socket.on('leaderboard:updated',     onLeaderboardUpdated);
    socket.on('leaderboard:round-reset', onRoundReset);
    socket.on('bar:leaderboard-message', onLeaderboardMsg);
    socket.on('invite:receive',          onInviteReceive);
    socket.on('invite:response',         onInviteResponse);
    socket.on('invite:accepted',         onInviteAccepted);
    socket.on('bar:announcement',        onAnnouncement);
    socket.on('contact:receive',         onContactReceive);
    socket.on('bet:tie',                 onBetTie);
    socket.on('invite:queued',           onInviteQueued);
    socket.on('invite:busy',             onInviteBusy);
    socket.on('join:error',              onJoinError);
    socket.on('scores:restored',         onScoresRestored);
    socket.on('bet:cancelled',           onBetCancelled);

    return () => {
      // Retire exactement les handlers de cette instance (safe en StrictMode).
      // socket.disconnect() ici = démontage réel → la table quitte proprement.
      if (joinRetryTimerRef.current) clearInterval(joinRetryTimerRef.current);
      socket.off('connect',                 onConnect);
      socket.off('disconnect',              onDisconnect);
      socket.off('tables:updated',          onTablesUpdated);
      socket.off('scores:updated',          onScoresUpdated);
      socket.off('leaderboard:updated',     onLeaderboardUpdated);
      socket.off('leaderboard:round-reset', onRoundReset);
      socket.off('bar:leaderboard-message', onLeaderboardMsg);
      socket.off('invite:receive',          onInviteReceive);
      socket.off('invite:response',         onInviteResponse);
      socket.off('invite:accepted',         onInviteAccepted);
      socket.off('bar:announcement',        onAnnouncement);
      socket.off('contact:receive',         onContactReceive);
      socket.off('bet:tie',                 onBetTie);
      socket.off('invite:queued',           onInviteQueued);
      socket.off('invite:busy',             onInviteBusy);
      socket.off('join:error',              onJoinError);
      socket.off('scores:restored',         onScoresRestored);
      socket.off('bet:cancelled',           onBetCancelled);
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoin = useCallback((pseudo, photo) => {
    initAudio(); // déverrouille AudioContext pendant le geste utilisateur

    setJoinError(null);
    setJoinRetryIn(null);
    if (joinRetryTimerRef.current) {
      clearInterval(joinRetryTimerRef.current);
      joinRetryTimerRef.current = null;
    }
    // Sauvegarder les creds pour l'auto-retry en cas de join:error transitoire
    joinRetryCredsRef.current = { pseudo, photo };
    userRef.current  = { pseudo, photo };
    // On marque hasJoined = true AVANT connect() pour que onConnect()
    // envoie le 'join' dès que la connexion est établie.
    // On n'émet PAS join ici (évite le double-envoi qui causait des re-renders
    // inutiles et pouvait perturber l'état des tables côté serveur).
    hasJoined.current = true;

    // Génère / récupère l'UUID stable de cette table dès le premier join
    getOrCreateTableUUID(barId, tableId);
    setUser({ pseudo, photo, tableId, barId });
    socket.connect();   // → déclenche onConnect() → émet 'join'
    setScreen('tables');
  }, [barId, tableId]);

  const handleStatusChange = useCallback((status) => {
    setMyStatus(status);
    socket.emit('table:status', { barId, tableId, status });
  }, [barId, tableId]);

  const handleInvite = useCallback((target) => {
    setInviteTarget(target);
    setScreen('invite');
  }, []);

  const handleSendInvite = useCallback((message) => {
    socket.emit('invite:send', {
      barId,
      fromTableId: tableId,
      fromPseudo:  userRef.current?.pseudo ?? '',
      fromPhoto:   userRef.current?.photo  ?? null,
      toTableId:   inviteTarget.tableId,
      message,
    });
    setInviteTarget(null);
    setScreen('tables');
  }, [barId, tableId, inviteTarget]);

  const handleAcceptInvite = useCallback(() => {
    if (!pendingInvite) return;
    socket.emit('invite:respond', {
      barId,
      toTableId:   tableId,
      fromTableId: pendingInvite.fromTableId,
      accepted:    true,
      message:     pendingInvite.message,
      fromPseudo:  pendingInvite.fromPseudo,
      fromPhoto:   pendingInvite.fromPhoto,
    });
    setPendingInvite(null); // ferme le popup immédiatement
  }, [barId, tableId, pendingInvite]);

  const handleDeclineInvite = useCallback(() => {
    if (!pendingInvite) return;
    socket.emit('invite:respond', {
      barId,
      toTableId:   tableId,
      fromTableId: pendingInvite.fromTableId,
      accepted:    false,
      message:     pendingInvite.message,
    });
    setPendingInvite(null);
  }, [barId, tableId, pendingInvite]);

  const closeCelebration = useCallback(() => {
    if (celebration?.isBet) {
      setBetPending(celebration);
    } else if (!celebration?.isTie) {
      // Invitation simple (non-pari) : libérer le statut "En jeu"
      socket.emit('table:status', { barId, tableId, status: null });
      setMyStatus(null);
    }
    setCelebration(null);
    setScreen('tables');
  }, [celebration, barId, tableId]);

  const handleBetResult = useCallback((winnerPseudo, winnerTableId, winnerPhoto) => {
    if (!betPending) return;
    socket.emit('bet:result', {
      barId:         betPending.barId,
      betId:         betPending.betId,
      winnerPseudo,
      winnerTableId,
      winnerPhoto:   winnerPhoto ?? null,
    });
    setBetPending(null);
    setCelebration(null);
    setPendingInvite(null);
    setMyStatus(null);
    setScreen('tables');
  }, [betPending]);

  if (screen === 'join') {
    return <JoinPage tableId={tableId} onJoin={handleJoin} joinError={joinError} joinRetryIn={joinRetryIn} />;
  }

  return (
    <>
      {screen === 'tables' && (
        <TablesPage
          user={user}
          myStatus={myStatus}
          onStatusChange={handleStatusChange}
          tables={tables}
          scores={scores}
          leaderboard={leaderboard}
          roundReset={roundReset}
          leaderboardMessage={leaderboardMessage}
          tableId={tableId}
          barId={barId}
          connected={connected}
          onInvite={handleInvite}
          inviteResponse={inviteResponse}
          announcement={announcement}
          onDismissAnnouncement={() => setAnnouncement(null)}
          senderNotif={senderNotif}
        />
      )}

      {screen === 'invite' && (
        <InvitePage
          user={user}
          target={inviteTarget}
          onSend={handleSendInvite}
          onBack={() => setScreen('tables')}
        />
      )}

      {celebration && (
        <CelebrationPopup celebration={celebration} onClose={closeCelebration} />
      )}

      {betPending && (
        <BetResultModal
          celebration={betPending}
          currentTableId={tableId}
          onResult={handleBetResult}
        />
      )}

      {pendingInvite && (
        <InvitationAlert
          invite={pendingInvite}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite}
        />
      )}

      {receivedContact && (
        <ContactAlert
          contact={receivedContact}
          onDismiss={() => setReceivedContact(null)}
        />
      )}

      {/* Bannière annulation de pari */}
      {betCancelled && (
        <div
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,100,60,0.95)', color: '#fff',
            padding: '12px 24px', borderRadius: 16, fontWeight: 700,
            fontSize: 14, zIndex: 9999, textAlign: 'center',
            boxShadow: '0 4px 24px rgba(255,60,0,0.35)',
            maxWidth: 'calc(100vw - 48px)',
          }}
        >
          {betCancelled}
        </div>
      )}
    </>
  );
}
