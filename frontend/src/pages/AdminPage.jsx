import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import adminSocket from '../adminSocket';
import Avatar from '../components/Avatar';
import KlinkLogo from '../components/KlinkLogo';

export default function AdminPage() {
  const { barId, password } = useParams();

  const [status, setStatus]                   = useState('connecting');
  const [errorMsg, setErrorMsg]               = useState('');
  const [dashboard, setDashboard]             = useState(null);
  const [announcement, setAnnouncement]       = useState('');
  const [sent, setSent]                       = useState(false);
  const [leaderMsg, setLeaderMsg]             = useState('');
  const [leaderSent, setLeaderSent]           = useState(false);
  const [activeTab, setActiveTab]             = useState('live'); // 'live' | 'history'
  const [historyData, setHistoryData]         = useState([]);
  const [adminEmail, setAdminEmail]           = useState('');
  const [emailSaved, setEmailSaved]           = useState(false);
  const [testReportState, setTestReportState] = useState('idle'); // 'idle' | 'sending' | 'ok' | 'error'
  const [testReportError, setTestReportError] = useState('');

  useEffect(() => {
    adminSocket.connect();

    adminSocket.on('connect', () => {
      adminSocket.emit('admin:join', { barId, password });
    });

    adminSocket.on('admin:dashboard', (data) => {
      setStatus('ok');
      setDashboard(data);
      if (data.leaderboardMessage !== undefined) setLeaderMsg(data.leaderboardMessage);
      if (data.adminEmail) setAdminEmail(data.adminEmail);
    });

    adminSocket.on('admin:emailSaved', ({ email }) => {
      setAdminEmail(email ?? '');
      setEmailSaved(true);
      setTimeout(() => setEmailSaved(false), 3000);
    });

    adminSocket.on('admin:testReportResult', ({ ok, error }) => {
      setTestReportState(ok ? 'ok' : 'error');
      if (!ok) setTestReportError(error ?? 'Erreur inconnue');
      setTimeout(() => setTestReportState('idle'), 4000);
    });

    adminSocket.on('admin:history', (data) => {
      setHistoryData([...data].reverse()); // plus récent en premier
    });

    adminSocket.on('admin:error', ({ message }) => {
      setStatus('error');
      setErrorMsg(message);
    });

    return () => {
      adminSocket.off('connect');
      adminSocket.off('admin:dashboard');
      adminSocket.off('admin:history');
      adminSocket.off('admin:error');
      adminSocket.off('admin:emailSaved');
      adminSocket.off('admin:testReportResult');
      adminSocket.disconnect();
    };
  }, [barId, password]);

  const handleAnnounce = useCallback((e) => {
    e.preventDefault();
    if (!announcement.trim()) return;
    adminSocket.emit('admin:announce', { barId, message: announcement.trim() });
    setAnnouncement('');
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  }, [barId, announcement]);

  const handleSetLeaderMsg = useCallback((e) => {
    e.preventDefault();
    adminSocket.emit('admin:setLeaderboardMessage', { barId, message: leaderMsg.trim() });
    setLeaderSent(true);
    setTimeout(() => setLeaderSent(false), 2500);
  }, [barId, leaderMsg]);

  const handleLoadHistory = useCallback(() => {
    adminSocket.emit('admin:getHistory', { barId });
    setActiveTab('history');
  }, [barId]);

  /* ── États de chargement / erreur ── */
  if (status === 'connecting') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <div className="text-center">
          <div className="flex justify-center mb-4 animate-float">
            <KlinkLogo size={56} />
          </div>
          <p className="text-white font-bold">Connexion en cours…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0D0D0D' }}>
        <div className="text-center glass-card rounded-3xl p-8 max-w-sm w-full">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-white font-black text-xl mb-2">Accès refusé</p>
          <p className="text-white/40 text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const { tables, stats, scores } = dashboard;
  const topScores = Object.entries(scores)
    .sort(([, a], [, b]) => b.wins - a.wins)
    .slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D0D0D' }}>

      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{
          background:     'rgba(13,13,13,0.90)',
          backdropFilter: 'blur(20px)',
          borderBottom:   '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <KlinkLogo size={28} />
          <div>
            <p className="text-white font-black text-sm neon-text">KLINK Admin</p>
            <p className="text-white/35 text-xs">Bar {barId}</p>
          </div>
        </div>
        <span
          className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            color:      '#00FF87',
            background: 'rgba(0,255,135,0.10)',
            border:     '1px solid rgba(0,255,135,0.20)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87] animate-pulse inline-block" />
          En direct
        </span>
      </header>

      {/* Onglets */}
      <div
        className="flex border-b sticky top-[57px] z-10"
        style={{
          background:   'rgba(13,13,13,0.90)',
          borderColor:  'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {[
          { id: 'live',    label: '📊 En direct' },
          { id: 'history', label: '📅 Historique' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => id === 'history' ? handleLoadHistory() : setActiveTab(id)}
            className="flex-1 py-3 text-sm font-bold transition-colors"
            style={{
              color:        activeTab === id ? '#00FF87' : 'rgba(255,255,255,0.35)',
              borderBottom: activeTab === id ? '2px solid #00FF87' : '2px solid transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-5 max-w-lg mx-auto w-full">

        {/* ── Onglet EN DIRECT ── */}
        {activeTab === 'live' && (
          <>
            {/* Annonce */}
            <div>
              <h2 className="text-white font-black text-base mb-3">Envoyer une annonce</h2>
              <form onSubmit={handleAnnounce} className="space-y-3">
                <textarea
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="Ex : Happy hour jusqu'à 20h — 2 bières achetées = 1 offerte !"
                  rows={3}
                  maxLength={200}
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm resize-none"
                />
                <button
                  type="submit"
                  disabled={!announcement.trim()}
                  className="w-full py-3.5 rounded-2xl font-black text-base transition-all active:scale-95"
                  style={announcement.trim() ? {
                    background: 'linear-gradient(135deg, #FFD700, #FF9500)',
                    color:      '#000',
                    boxShadow:  '0 4px 20px rgba(255,215,0,0.25)',
                  } : {
                    background: 'rgba(255,255,255,0.06)',
                    color:      'rgba(255,255,255,0.25)',
                    cursor:     'not-allowed',
                  }}
                >
                  {sent ? '✅ Annonce envoyée !' : '📢 Envoyer à toutes les tables'}
                </button>
              </form>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Tables actives', value: stats.activeTables,   emoji: '🪑' },
                { label: 'Invitations',    value: stats.invitesSent,    emoji: '✉️' },
                { label: 'Paris en cours', value: stats.betsInProgress, emoji: '🎲' },
              ].map(({ label, value, emoji }) => (
                <div key={label} className="glass-card rounded-2xl p-3 text-center">
                  <div className="text-2xl mb-1">{emoji}</div>
                  <p className="text-white font-black text-xl">{value}</p>
                  <p className="text-white/35 text-[11px] leading-tight mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Tables connectées */}
            <div>
              <h2 className="text-white font-black text-base mb-3">Tables connectées</h2>
              {tables.length === 0 ? (
                <div className="text-center py-10 glass-card rounded-2xl">
                  <p className="text-white/30 text-sm">Aucune table connectée</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tables.map((t) => (
                    <div
                      key={t.tableId}
                      className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3"
                    >
                      <Avatar pseudo={t.pseudo} photo={t.photo} size={40} active />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{t.pseudo}</p>
                        <p className="text-white/35 text-xs">Table {t.tableId}</p>
                      </div>
                      {t.status && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
                          style={{
                            background: 'rgba(255,255,255,0.07)',
                            color:      'rgba(255,255,255,0.55)',
                            border:     '1px solid rgba(255,255,255,0.10)',
                          }}
                        >
                          {t.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Classement */}
            {topScores.length > 0 && (
              <div>
                <h2 className="text-white font-black text-base mb-3">Classement paris</h2>
                <div className="glass-card rounded-2xl overflow-hidden">
                  {topScores.map(([pseudo, { wins, photo }], i) => (
                    <div
                      key={pseudo}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{
                        borderBottom: i < topScores.length - 1
                          ? '1px solid rgba(255,255,255,0.06)'
                          : 'none',
                      }}
                    >
                      <span
                        className="font-black text-sm w-6 text-center shrink-0"
                        style={{ color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.35)' }}
                      >
                        {i + 1}
                      </span>
                      <Avatar pseudo={pseudo} photo={photo ?? null} size={32} />
                      <p className="text-white font-semibold text-sm flex-1 truncate">{pseudo}</p>
                      <span className="text-white font-black text-sm shrink-0">
                        {wins} 🍺
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message classement sur les tables */}
            <div>
              <h2 className="text-white font-black text-base mb-1">Message du classement</h2>
              <p className="text-white/35 text-xs mb-3">
                Affiché au-dessus du classement sur toutes les tables en temps réel
              </p>
              <form onSubmit={handleSetLeaderMsg} className="space-y-3">
                <input
                  type="text"
                  value={leaderMsg}
                  onChange={(e) => setLeaderMsg(e.target.value)}
                  placeholder="Ex : Bière offerte au gagnant ! 🍺"
                  maxLength={80}
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl font-black text-base transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700, #FF9500)',
                    color:      '#000',
                    boxShadow:  '0 4px 20px rgba(255,215,0,0.20)',
                  }}
                >
                  {leaderSent ? '✅ Message envoyé !' : '🏆 Envoyer aux tables'}
                </button>
                {leaderMsg && (
                  <button
                    type="button"
                    onClick={() => { setLeaderMsg(''); adminSocket.emit('admin:setLeaderboardMessage', { barId, message: '' }); }}
                    className="w-full py-2 rounded-xl text-white/35 text-sm hover:text-white/60 transition-colors"
                  >
                    Effacer le message
                  </button>
                )}
              </form>
            </div>

            {/* Email rapport hebdomadaire */}
            <div>
              <h2 className="text-white font-black text-base mb-1">Rapport hebdomadaire</h2>
              <p className="text-white/35 text-xs mb-3">
                Reçois un email chaque lundi à 9h avec les stats de la semaine
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  adminSocket.emit('admin:setEmail', { barId, email: adminEmail.trim() });
                }}
                className="space-y-3"
              >
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl font-black text-base transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #0099FF, #00FF87)',
                    color:      '#000',
                    boxShadow:  '0 4px 20px rgba(0,153,255,0.20)',
                  }}
                >
                  {emailSaved ? '✅ Email enregistré !' : '📧 Enregistrer l\'email'}
                </button>
              </form>
              <button
                type="button"
                disabled={testReportState === 'sending' || !adminEmail}
                onClick={() => {
                  setTestReportState('sending');
                  setTestReportError('');
                  adminSocket.emit('admin:sendTestReport', { barId });
                }}
                className="w-full mt-2 py-3 rounded-2xl font-black text-base transition-all active:scale-95"
                style={adminEmail ? {
                  background: testReportState === 'ok'    ? 'rgba(0,255,135,0.15)'  :
                               testReportState === 'error' ? 'rgba(255,80,80,0.15)'  :
                               'rgba(255,255,255,0.07)',
                  color:      testReportState === 'ok'    ? '#00FF87' :
                               testReportState === 'error' ? '#FF5050' :
                               'rgba(255,255,255,0.70)',
                  border:     testReportState === 'ok'    ? '1px solid rgba(0,255,135,0.30)'  :
                               testReportState === 'error' ? '1px solid rgba(255,80,80,0.30)'  :
                               '1px solid rgba(255,255,255,0.10)',
                } : {
                  background: 'rgba(255,255,255,0.04)',
                  color:      'rgba(255,255,255,0.20)',
                  border:     '1px solid rgba(255,255,255,0.06)',
                  cursor:     'not-allowed',
                }}
              >
                {testReportState === 'sending' ? '⏳ Envoi en cours…'  :
                 testReportState === 'ok'       ? '✅ Rapport envoyé !' :
                 testReportState === 'error'    ? `❌ ${testReportError}` :
                 '🧪 Envoyer rapport test'}
              </button>
            </div>

          </>
        )}

        {/* ── Onglet HISTORIQUE ── */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-white font-black text-base mb-3">Historique journalier</h2>
            <p className="text-white/35 text-xs mb-4">
              Snapshots sauvegardés chaque nuit à minuit. 30 derniers jours.
            </p>

            {historyData.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-2xl">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-white/40 text-sm">Aucun historique disponible</p>
                <p className="text-white/25 text-xs mt-1">
                  Les données s'accumulent après minuit
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {historyData.map((snap, i) => {
                  const snapScores = Object.entries(snap.scores)
                    .sort(([, a], [, b]) => b.wins - a.wins)
                    .slice(0, 3);
                  return (
                    <div key={i} className="glass-card rounded-2xl overflow-hidden">
                      {/* En-tête date */}
                      <div
                        className="px-4 py-3 flex items-center justify-between"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <span className="text-white font-black text-sm">📅 {snap.date}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}
                        >
                          J-{i + 1}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-0">
                        {[
                          { label: 'Tables', value: snap.stats.activeTables,  emoji: '🪑' },
                          { label: 'Invits', value: snap.stats.invitesSent,   emoji: '✉️' },
                          { label: 'Paris',  value: snap.stats.betsInProgress ?? 0, emoji: '🎲' },
                        ].map(({ label, value, emoji }, idx) => (
                          <div
                            key={label}
                            className="p-3 text-center"
                            style={{
                              borderRight: idx < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                            }}
                          >
                            <p className="text-lg">{emoji}</p>
                            <p className="text-white font-black text-base">{value}</p>
                            <p className="text-white/35 text-[10px]">{label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Top 3 */}
                      {snapScores.length > 0 && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          {snapScores.map(([pseudo, { wins }], j) => (
                            <div
                              key={pseudo}
                              className="flex items-center gap-3 px-4 py-2"
                              style={{
                                borderBottom: j < snapScores.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                              }}
                            >
                              <span
                                className="font-black text-xs w-5 text-center shrink-0"
                                style={{ color: j === 0 ? '#FFD700' : j === 1 ? '#C0C0C0' : '#CD7F32' }}
                              >
                                {j + 1}
                              </span>
                              <p className="text-white/75 text-xs flex-1 truncate">{pseudo}</p>
                              <span className="text-white/60 text-xs">{wins} 🍺</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
