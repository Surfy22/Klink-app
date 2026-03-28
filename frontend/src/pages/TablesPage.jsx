import { useState } from 'react';
import Avatar from '../components/Avatar';
import InvitationAlert from '../components/InvitationAlert';
import ContactModal from '../components/QRModal';
import KlinkLogo from '../components/KlinkLogo';
import AnnouncementOverlay from '../components/AnnouncementToast';

const MEDAL = ['🥇', '🥈', '🥉'];

function cardBorder(i) {
  if (i === 0) return '1.5px solid rgba(255,215,0,0.40)';
  if (i === 1) return '1px solid rgba(192,192,192,0.28)';
  if (i === 2) return '1px solid rgba(205,127,50,0.30)';
  return '1px solid rgba(255,255,255,0.07)';
}

function cardBg(i) {
  if (i === 0) return 'rgba(255,215,0,0.08)';
  if (i === 1) return 'rgba(192,192,192,0.05)';
  if (i === 2) return 'rgba(205,127,50,0.07)';
  return 'rgba(255,255,255,0.04)';
}

function pseudoColor(i) {
  if (i === 0) return '#FFD700';
  if (i === 1) return 'rgba(210,210,210,0.90)';
  if (i === 2) return 'rgba(205,127,50,0.95)';
  return 'rgba(255,255,255,0.75)';
}

/** Éclair SVG néon inline pour les scores */
function LightningScore({ wins }) {
  return (
    <span className="flex items-center gap-1 font-black text-xs" style={{ color: '#00FF87' }}>
      {wins}
      <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
        <path d="M5 0L0 7H3.5L1.5 12L8 5H4Z" fill="#00FF87" />
      </svg>
    </span>
  );
}

export default function TablesPage({
  user, tables, scores, leaderboardMessage, tableId, barId,
  connected,
  onInvite,
  pendingInvite, onAcceptInvite, onDeclineInvite,
  inviteResponse,
  announcement, onDismissAnnouncement,
}) {
  const [showQR, setShowQR] = useState(false);
  const topScores = Object.entries(scores)
    .sort(([, a], [, b]) => b.wins - a.wins)
    .slice(0, 5);

  const hasLeaderboard = topScores.length > 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D0D0D' }}>

      {/* Header glassmorphism */}
      <header
        className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{
          background:     'rgba(13,13,13,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom:   '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <KlinkLogo size={28} />
          <div>
            <p className="text-white font-black text-sm leading-tight neon-text" style={{ fontSize: 15 }}>
              KLINK
            </p>
            <p className="text-white/35 text-xs">Table {tableId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Avatar pseudo={user.pseudo} photo={user.photo} size={32} />
          <span className="text-white text-sm font-semibold max-w-[90px] truncate">
            {user.pseudo}
          </span>
        </div>
      </header>

      {/* Annonce gérant — en-ligne entre header et main */}
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
              background: 'rgba(0,153,255,0.10)',
              border:     '1px solid rgba(0,153,255,0.25)',
              color:       '#0099FF',
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
                background: 'rgba(0,255,135,0.1)',
                border:     '1px solid rgba(0,255,135,0.2)',
              }}
            >
              {tables.length} table{tables.length !== 1 ? 's' : ''}
            </span>
          </div>

          {tables.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4 animate-float">🪑</div>
              <p className="text-white font-bold text-base">Aucune autre table active</p>
              <p className="text-white/30 text-sm mt-2 leading-relaxed">
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
                      <p className="text-white/35 text-xs">Table {table.tableId}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onInvite(table)}
                    className="shrink-0 px-4 py-2.5 rounded-xl font-black text-sm text-black transition-all active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #00FF87, #0099FF)',
                      boxShadow:  '0 2px 12px rgba(0,255,135,0.25)',
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
            background:     'rgba(13,13,13,0.96)',
            backdropFilter: 'blur(24px)',
            borderTop:      '1px solid rgba(0,255,135,0.12)',
          }}
        >
          {/* Message personnalisé du gérant */}
          {leaderboardMessage && (
            <div className="px-4 pt-3 pb-1 text-center animate-fade-in">
              <p className="text-sm font-bold" style={{ color: '#FFD700' }}>
                {leaderboardMessage}
              </p>
            </div>
          )}

          {/* En-tête du widget */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span
              className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5"
              style={{ color: '#00FF87' }}
            >
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                <path d="M5 0L0 7H3.5L1.5 12L8 5H4Z" fill="#00FF87" />
              </svg>
              CLASSEMENT PARIS
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ color: '#00FF87', background: 'rgba(0,255,135,0.10)', border: '1px solid rgba(0,255,135,0.20)' }}
            >
              En direct
            </span>
          </div>

          {/* Séparateur gradient */}
          <div style={{
            height:     '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0,255,135,0.25), transparent)',
            margin:     '0 16px 0',
          }} />

          {/* Lignes du classement */}
          <div className="flex gap-3 overflow-x-auto px-4 pb-4 pt-2 scrollbar-none">
            {topScores.map(([pseudo, { wins, photo }], i) => (
              <div
                key={pseudo}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl"
                style={{
                  background: cardBg(i),
                  border:     cardBorder(i),
                  minWidth:   '72px',
                }}
              >
                <span className="text-base leading-none">{MEDAL[i] ?? `#${i + 1}`}</span>
                <Avatar pseudo={pseudo} photo={photo ?? null} size={36} />
                <span
                  className="text-xs font-bold truncate max-w-[64px] text-center"
                  style={{ color: pseudoColor(i) }}
                >
                  {pseudo}
                </span>
                <LightningScore wins={wins} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer statut */}
      <footer
        className="px-4 py-2.5 flex items-center justify-center gap-2"
        style={{
          background: 'rgba(13,13,13,0.85)',
          borderTop:  '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {connected ? (
          <>
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: '#00FF87', boxShadow: '0 0 6px #00FF87' }}
            />
            <span className="text-white/30 text-xs">Connecté · Bar {barId}</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FF6B6B' }} />
            <span className="text-white/40 text-xs">Reconnexion en cours…</span>
          </>
        )}
      </footer>

      {/* Toast refus */}
      {inviteResponse && !inviteResponse.accepted && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-3 rounded-2xl text-sm font-semibold animate-slide-up flex items-center gap-2 max-w-[88vw]"
          style={{
            background:     'rgba(255,255,255,0.08)',
            border:         '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
          }}
        >
          ❌ <span className="truncate">
            <span className="font-bold text-white">{inviteResponse.responderPseudo}</span>
            <span className="text-white/60"> a refusé votre invitation</span>
          </span>
        </div>
      )}

      {pendingInvite && (
        <InvitationAlert
          invite={pendingInvite}
          onAccept={onAcceptInvite}
          onDecline={onDeclineInvite}
        />
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
