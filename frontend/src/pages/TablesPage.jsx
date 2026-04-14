import { useState, useEffect, useRef } from 'react';
import Avatar from '../components/Avatar';
import ContactModal from '../components/QRModal';
import KlinkLogo from '../components/KlinkLogo';
import AnnouncementOverlay from '../components/AnnouncementToast';

const MEDAL = ['🥇', '🥈', '🥉'];

function cardBorder(i) {
  if (i === 0) return '1.5px solid rgba(255,215,0,0.55)';
  if (i === 1) return '1px solid rgba(0,212,255,0.45)';
  if (i === 2) return '1px solid rgba(0,255,135,0.35)';
  return '1px solid rgba(0,212,255,0.12)';
}

function cardBg(i) {
  if (i === 0) return 'rgba(255,215,0,0.08)';
  if (i === 1) return 'rgba(0,212,255,0.07)';
  if (i === 2) return 'rgba(0,255,135,0.06)';
  return 'rgba(0,212,255,0.03)';
}

function pseudoColor(i) {
  if (i === 0) return '#FFD700';
  if (i === 1) return '#00D4FF';
  if (i === 2) return '#00FF87';
  return 'rgba(74,111,165,0.80)';
}

/** Éclair SVG néon inline pour les scores */
function LightningScore({ wins }) {
  return (
    <span className="flex items-center gap-1 font-black text-xs" style={{ color: '#00FF87' }}>
      {wins}
      <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
        <defs>
          <linearGradient id="ls-g" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#00FF87" />
            <stop offset="1" stopColor="#00D4FF" />
          </linearGradient>
        </defs>
        <path d="M5 0L0 7H3.5L1.5 12L8 5H4Z" fill="url(#ls-g)" />
      </svg>
    </span>
  );
}

/** Calcule le temps restant jusqu'au prochain reset horaire (heure pile) */
function useRoundCountdown(roundReset) {
  const [timeLeft, setTimeLeft] = useState('');
  const [showFlash, setShowFlash] = useState(false);
  const prevReset = useRef(roundReset);

  useEffect(() => {
    if (roundReset !== prevReset.current) {
      prevReset.current = roundReset;
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3500);
    }
  }, [roundReset]);

  useEffect(() => {
    function update() {
      const now     = new Date();
      const nextHr  = new Date(now);
      nextHr.setHours(nextHr.getHours() + 1, 0, 0, 0);
      const diff    = Math.max(0, nextHr - now);
      const m       = Math.floor(diff / 60000);
      const s       = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return { timeLeft, showFlash };
}

export default function TablesPage({
  user, tables, scores, leaderboard, roundReset, leaderboardMessage, tableId, barId,
  connected,
  onInvite,
  inviteResponse,
  announcement, onDismissAnnouncement,
  senderNotif,
}) {
  const [showQR, setShowQR]           = useState(false);
  const [lbTab, setLbTab]             = useState('round'); // 'round' | 'evening' | 'month'
  const { timeLeft, showFlash }       = useRoundCountdown(roundReset);

  // Classements triés (top 5)
  const lb = leaderboard ?? { hourly: {}, evening: {}, monthly: {} };
  const toTop5 = (obj) => Object.entries(obj || {}).sort(([, a], [, b]) => b.wins - a.wins).slice(0, 5);
  const topRound   = toTop5(lb.hourly);
  const topEvening = toTop5(lb.evening);
  const topMonth   = toTop5(lb.monthly);

  // scores = { [uuid]: { wins, pseudo, photo, tableId, connected } }
  const topScores = Object.entries(scores)
    .sort(([, a], [, b]) => b.wins - a.wins)
    .slice(0, 5);

  const hasLeaderboard = topScores.length > 0 || topRound.length > 0 || topEvening.length > 0 || topMonth.length > 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F0F4FF' }}>

      {/* Header glassmorphism */}
      <header
        className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{
          background:     'rgba(240,244,255,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom:   '1px solid rgba(0,212,255,0.18)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <KlinkLogo size={28} />
          <div>
            <p className="text-white font-black text-sm leading-tight neon-text" style={{ fontSize: 15, letterSpacing: '-0.03em' }}>
              KLINK
            </p>
            <p className="text-xs" style={{ color: '#4A6FA5' }}>Table {tableId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Avatar pseudo={user.pseudo} photo={user.photo} size={32} />
          <span className="text-white text-sm font-semibold max-w-[90px] truncate">
            {user.pseudo}
          </span>
        </div>
      </header>

      {/* Annonce gérant */}
      {announcement && (
        <AnnouncementOverlay message={announcement} onDismiss={onDismissAnnouncement} />
      )}

      {/* Corps */}
      <main className="flex-1 overflow-y-auto p-4" style={{ paddingBottom: hasLeaderboard ? '0' : '16px' }}>
        <div className="max-w-sm mx-auto">

          {/* Partager contact */}
          <button
            onClick={() => setShowQR(true)}
            className="w-full mb-4 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              background: 'rgba(0,212,255,0.08)',
              border:     '1px solid rgba(0,212,255,0.28)',
              color:      '#00D4FF',
            }}
          >
            <span>📲</span> Partager mon contact
          </button>

          {/* Compteur */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-black text-lg">Tables actives</h2>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                color:      '#00FF87',
                background: 'rgba(0,255,135,0.10)',
                border:     '1px solid rgba(0,255,135,0.22)',
              }}
            >
              {tables.length} table{tables.length !== 1 ? 's' : ''}
            </span>
          </div>

          {tables.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4 animate-float">🪑</div>
              <p className="text-white font-bold text-base">Aucune autre table active</p>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(74,111,165,0.70)' }}>
                Les autres tables apparaîtront ici<br />quand elles rejoindront le bar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tables.map((table) => (
                <div
                  key={table.tableId}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3"
                  style={{ transition: 'border-color 0.2s' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar pseudo={table.pseudo} photo={table.photo} size={52} active />
                    <div className="min-w-0">
                      <p className="text-white font-bold truncate">{table.pseudo}</p>
                      <p className="text-xs" style={{ color: '#4A6FA5' }}>Table {table.tableId}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => !table.status && onInvite(table)}
                    disabled={!!table.status}
                    className="shrink-0 px-4 py-2.5 rounded-xl font-black text-sm text-black transition-all active:scale-95"
                    style={{
                      background:  'linear-gradient(135deg, #00FF87, #00D4FF)',
                      boxShadow:   table.status ? 'none' : '0 2px 14px rgba(0,255,135,0.30)',
                      opacity:     table.status ? 0.4 : 1,
                      cursor:      table.status ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Inviter
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Widget classement en bas */}
      {hasLeaderboard && (
        <div
          className="w-full"
          style={{
            background:     'rgba(240,244,255,0.97)',
            backdropFilter: 'blur(24px)',
            borderTop:      '1px solid rgba(0,255,135,0.14)',
          }}
        >
          {/* Message gérant — inchangé, au-dessus des onglets */}
          {leaderboardMessage && (
            <p style={{
              background:           'linear-gradient(135deg, #00FF87, #00D4FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor:  'transparent',
              backgroundClip:       'text',
              fontSize:             '20px',
              fontWeight:           800,
              textAlign:            'center',
              lineHeight:           1.3,
              margin:               '14px 16px 0',
              filter:               'drop-shadow(0 0 6px rgba(0,255,135,0.35))',
              wordBreak:            'break-word',
            }}>
              {leaderboardMessage}
            </p>
          )}

          {/* Animation "Nouveau round !" */}
          {showFlash && (
            <div
              className="mx-4 mt-3 py-2 rounded-xl text-center text-sm font-black"
              style={{
                background:  'linear-gradient(135deg, rgba(0,255,135,0.18), rgba(0,212,255,0.18))',
                border:      '1px solid rgba(0,255,135,0.45)',
                color:       '#00FF87',
                boxShadow:   '0 0 14px rgba(0,255,135,0.25)',
                animation:   'neon-pulse 1s ease-in-out 3',
              }}
            >
              ⚡ Nouveau round !
            </div>
          )}

          {/* 3 onglets */}
          <div className="flex gap-2 px-4 pt-3 pb-2">
            {[
              { key: 'round',   label: '⚡ Ce round' },
              { key: 'evening', label: '🌙 Ce soir' },
              { key: 'month',   label: '👑 Ce mois' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setLbTab(key)}
                className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={lbTab === key ? {
                  background: 'linear-gradient(135deg, #00FF87, #00D4FF)',
                  color:      '#0A1628',
                  boxShadow:  '0 0 10px rgba(0,255,135,0.35)',
                  border:     '1px solid rgba(0,255,135,0.5)',
                } : {
                  background: 'rgba(255,255,255,0.6)',
                  color:      '#0A1628',
                  border:     '1px solid rgba(0,212,255,0.2)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{
            height:     '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0,255,135,0.25), transparent)',
            margin:     '0 16px',
          }} />

          {/* Compte à rebours round */}
          {lbTab === 'round' && (
            <div className="flex items-center justify-between px-4 pt-2 pb-1">
              <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#00FF87' }}>
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                  <path d="M5 0L0 7H3.5L1.5 12L8 5H4Z" fill="#00FF87" />
                </svg>
                CLASSEMENT PARIS
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full tabular-nums"
                style={{ color: '#00D4FF', background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.22)' }}>
                Nouveau round dans {timeLeft}
              </span>
            </div>
          )}

          {/* Badge soirée */}
          {lbTab === 'evening' && (
            <div className="flex items-center justify-between px-4 pt-2 pb-1">
              <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#00FF87' }}>
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                  <path d="M5 0L0 7H3.5L1.5 12L8 5H4Z" fill="#00FF87" />
                </svg>
                CLASSEMENT PARIS
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ color: '#00D4FF', background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.22)' }}>
                En direct
              </span>
            </div>
          )}

          {/* Badge mois */}
          {lbTab === 'month' && (
            <div className="flex items-center justify-between px-4 pt-2 pb-1">
              <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#00FF87' }}>
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                  <path d="M5 0L0 7H3.5L1.5 12L8 5H4Z" fill="#00FF87" />
                </svg>
                CLASSEMENT PARIS
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ color: '#00D4FF', background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.22)' }}>
                En direct
              </span>
            </div>
          )}

          {/* Cards du classement */}
          <div className="flex gap-3 overflow-x-auto px-4 pb-4 pt-1 scrollbar-none">
            {(lbTab === 'round' ? topRound : lbTab === 'evening' ? topEvening : topMonth).map(
              ([uuid, entry], i) => {
                const { wins, pseudo, photo, connected: conn } = entry;
                const isFirst = i === 0;
                const badge = lbTab === 'evening' && isFirst
                  ? '🌙 Leader de la soirée'
                  : lbTab === 'month' && isFirst
                  ? '👑 Légende du mois'
                  : null;
                return (
                  <div key={uuid} className="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl"
                    style={{
                      background: cardBg(i),
                      border:     cardBorder(i),
                      minWidth:   '72px',
                      boxShadow:  i === 0 ? '0 0 12px rgba(255,215,0,0.18)' :
                                  i === 1 ? '0 0 10px rgba(0,212,255,0.15)' :
                                  i === 2 ? '0 0 10px rgba(0,255,135,0.12)' : 'none',
                      opacity:    conn === false ? 0.42 : 1,
                      transition: 'opacity 0.4s',
                    }}
                  >
                    {badge && (
                      <span className="text-center leading-tight font-black"
                        style={{ fontSize: '9px', color: i === 0 ? '#FFD700' : '#00FF87', maxWidth: '64px' }}>
                        {badge}
                      </span>
                    )}
                    <span className="text-base leading-none">{MEDAL[i] ?? `#${i + 1}`}</span>
                    <Avatar pseudo={pseudo ?? uuid} photo={photo ?? null} size={36} />
                    <span className="text-xs font-bold truncate max-w-[64px] text-center"
                      style={{ color: conn === false ? 'rgba(74,111,165,0.50)' : pseudoColor(i) }}>
                      {pseudo ?? uuid}
                    </span>
                    <LightningScore wins={wins} />
                  </div>
                );
              }
            )}
            {(lbTab === 'round' ? topRound : lbTab === 'evening' ? topEvening : topMonth).length === 0 && (
              <div className="flex-1 py-4 text-center">
                <p className="text-xs" style={{ color: 'rgba(74,111,165,0.60)' }}>
                  {lbTab === 'round' ? 'Aucun pari ce round encore' :
                   lbTab === 'evening' ? 'Aucun pari ce soir encore' :
                   'Aucun pari ce mois encore'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer statut */}
      <footer
        className="px-4 py-2.5 flex items-center justify-center gap-2"
        style={{
          background: 'rgba(240,244,255,0.92)',
          borderTop:  '1px solid rgba(0,212,255,0.14)',
        }}
      >
        {connected ? (
          <>
            <svg
              width="9" height="13" viewBox="0 0 8 12" fill="none"
              style={{ animation: 'neon-pulse 2.4s ease-in-out infinite' }}
            >
              <path d="M5 0L0 7H3.5L1.5 12L8 5H4Z" fill="#00FF87" />
            </svg>
            <span className="text-xs" style={{ color: '#00D4FF' }}>Connecté · Bar {barId}</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FF4D6D' }} />
            <span className="text-xs" style={{ color: 'rgba(255,77,109,0.75)' }}>Reconnexion en cours…</span>
          </>
        )}
      </footer>

      {/* Toast expéditeur : invitation en file ou table occupée */}
      {senderNotif && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 max-w-[88vw]"
          style={{
            background:     senderNotif.type === 'queued'
              ? 'rgba(240,244,255,0.95)' : 'rgba(240,244,255,0.95)',
            border:         senderNotif.type === 'queued'
              ? '1px solid rgba(0,212,255,0.40)' : '1px solid rgba(255,150,0,0.40)',
            backdropFilter: 'blur(14px)',
            color:          senderNotif.type === 'queued' ? '#00D4FF' : '#FF9500',
            boxShadow:      '0 4px 20px rgba(0,0,0,0.12)',
          }}
        >
          {senderNotif.type === 'queued' ? '⏳' : '🍺'}
          <span style={{ color: '#0A1628' }}>
            {senderNotif.type === 'queued'
              ? <><span style={{ fontWeight: 900 }}>{senderNotif.pseudo}</span> reçoit déjà une invitation — la tienne est en attente</>
              : <><span style={{ fontWeight: 900 }}>{senderNotif.pseudo}</span> a rejoint une autre table</>
            }
          </span>
        </div>
      )}

      {/* Toast refus */}
      {inviteResponse && !inviteResponse.accepted && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-3 rounded-2xl text-sm font-semibold animate-slide-up flex items-center gap-2 max-w-[88vw]"
          style={{
            background:     'rgba(240,244,255,0.95)',
            border:         '1px solid rgba(255,77,109,0.35)',
            backdropFilter: 'blur(14px)',
            color:          '#FF4D6D',
          }}
        >
          ❌ <span className="truncate">
            <span className="font-bold text-white">{inviteResponse.responderPseudo}</span>
            <span style={{ color: 'rgba(74,111,165,0.80)' }}> a refusé votre invitation</span>
          </span>
        </div>
      )}


      {showQR && (
        <ContactModal
          user={{ pseudo: user.pseudo, photo: user.photo, barId, tableId }}
          tables={tables}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}
