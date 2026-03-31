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

  // Refs stables — jamais recréés, lisibles depuis n'importe quel handler socket
  const userRef    = useRef(null);   // { pseudo, photo } de l'utilisateur courant
  const hasJoined  = useRef(false);  // true après le premier join (pour re-join sur reconnexion)
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
    const onLeaderboardMsg = ({ message }) => {
      setLeaderboardMessage(message);
    };
    const onInviteReceive = (invite) => {
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
      setCelebration({ isTie: true, ...tieData });
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
    socket.on('bar:leaderboard-message', onLeaderboardMsg);
    socket.on('invite:receive',          onInviteReceive);
    socket.on('invite:response',         onInviteResponse);
    socket.on('invite:accepted',         onInviteAccepted);
    socket.on('bar:announcement',        onAnnouncement);
    socket.on('contact:receive',         onContactReceive);
    socket.on('bet:tie',                 onBetTie);
    socket.on('invite:queued',           onInviteQueued);
    socket.on('invite:busy',             onInviteBusy);

    return () => {
      // Retire exactement les handlers de cette instance (safe en StrictMode).
      // socket.disconnect() ici = démontage réel → la table quitte proprement.
      socket.off('connect',                 onConnect);
      socket.off('disconnect',              onDisconnect);
      socket.off('tables:updated',          onTablesUpdated);
      socket.off('scores:updated',          onScoresUpdated);
      socket.off('bar:leaderboard-message', onLeaderboardMsg);
      socket.off('invite:receive',          onInviteReceive);
      socket.off('invite:response',         onInviteResponse);
      socket.off('invite:accepted',         onInviteAccepted);
      socket.off('bar:announcement',        onAnnouncement);
      socket.off('contact:receive',         onContactReceive);
      socket.off('bet:tie',                 onBetTie);
      socket.off('invite:queued',           onInviteQueued);
      socket.off('invite:busy',             onInviteBusy);
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoin = useCallback((pseudo, photo) => {
    initAudio(); // déverrouille AudioContext pendant le geste utilisateur

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
    setScreen('tables');
  }, [betPending]);

  if (screen === 'join') {
    return <JoinPage tableId={tableId} onJoin={handleJoin} />;
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
          leaderboardMessage={leaderboardMessage}
          tableId={tableId}
          barId={barId}
          connected={connected}
          onInvite={handleInvite}
          pendingInvite={pendingInvite}
          onAcceptInvite={handleAcceptInvite}
          onDeclineInvite={handleDeclineInvite}
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

      {receivedContact && (
        <ContactAlert
          contact={receivedContact}
          onDismiss={() => setReceivedContact(null)}
        />
      )}
    </>
  );
}
