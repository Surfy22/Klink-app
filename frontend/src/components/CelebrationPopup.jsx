import { useEffect } from 'react';
import Avatar from './Avatar';
import { playAcceptSound } from '../utils/audioAlert';

const CONFETTI_COLORS = ['#00FF87', '#00D4FF', '#FFD700', '#FF4D6D', '#A855F7', '#FF9500', '#FF3CAC'];

/* ── Icônes SVG message card ─────────────────────────────────────────────── */
const ICONS = {
  '🎯': {
    bg: 'rgba(239,68,68,0.10)',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  '🎱': {
    bg: 'rgba(30,30,30,0.08)',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#1a1a2e" />
        <circle cx="12" cy="10.5" r="5" fill="white" />
        <text x="12" y="14.5" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#1a1a2e" fontFamily="system-ui,sans-serif">8</text>
      </svg>
    ),
  },
  '🍺': {
    bg: 'rgba(251,191,36,0.10)',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M6 4h9L13.5 18H7.5L6 4z" fill="#F59E0B" />
        <path d="M15 7.5h3a1.5 1.5 0 010 3h-3" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="8" y="8" width="5" height="4" rx="1" fill="rgba(255,255,255,0.30)" />
        <path d="M9 4v2M12 4v2" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  '💬': {
    bg: 'rgba(99,102,241,0.10)',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#6366F1">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  '🎳': {
    bg: 'rgba(168,85,247,0.10)',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#A855F7">
        <circle cx="12" cy="5" r="3" />
        <path d="M9 8.5c-.6 1.1-1.2 2.7-1.2 4.8 0 2.1.5 3.2 4.2 3.2s4.2-1.1 4.2-3.2c0-2.1-.6-3.7-1.2-4.8H9z" />
        <ellipse cx="12" cy="20.5" rx="4.2" ry="2" />
      </svg>
    ),
  },
};

/* ── Flamme SVG ──────────────────────────────────────────────────────────── */
const FlameSVG = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
       style={{ filter: 'drop-shadow(0 0 6px rgba(255,100,0,0.7))', display: 'inline-block', verticalAlign: 'middle' }}>
    <defs>
      <linearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%"   stopColor="#FF6B35" />
        <stop offset="50%"  stopColor="#FF0000" />
        <stop offset="100%" stopColor="#FFD700" />
      </linearGradient>
    </defs>
    <path d="M12 2c-1 3-4 6.5-4 10a4 4 0 008 0c0-2-.8-3.8-2-5.2.1 1.6-.9 3.1-2.1 3.5A2.5 2.5 0 019.5 8C9.5 5.2 11 2 12 2z" fill="url(#flameGrad)" />
  </svg>
);

/* ── Mains SVG ───────────────────────────────────────────────────────────── */
const HandsSVG = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       style={{ filter: 'drop-shadow(0 0 6px rgba(28,200,138,0.6))', display: 'inline-block', verticalAlign: 'middle' }}>
    <defs>
      <linearGradient id="handsGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#1CC88A" />
        <stop offset="100%" stopColor="#00B4D8" />
      </linearGradient>
    </defs>
    <path d="M2 17l4-5h3.5L12 14l2.5-2H18l4 5" stroke="url(#handsGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 14v4h4v-4" stroke="url(#handsGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 12V9M12 12V8M16 12V9" stroke="url(#handsGrad)" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

function ConfettiPiece({ idx }) {
  const color    = CONFETTI_COLORS[idx % CONFETTI_COLORS.length];
  const left     = ((idx * 7.53 + 2.3) % 100).toFixed(1) + '%';
  const delay    = ((idx * 0.19) % 3.2).toFixed(2) + 's';
  const duration = (2.2 + (idx * 0.11) % 2.1).toFixed(2) + 's';
  const size     = 5 + (idx * 3) % 9;
  const isCircle = idx % 3 !== 0;

  return (
    <div
      style={{
        position:        'absolute',
        left,
        top:             -12,
        width:           size,
        height:          isCircle ? size : size * 1.7,
        backgroundColor: color,
        borderRadius:    isCircle ? '50%' : 3,
        animation:       `confetti-fall ${duration} ${delay} ease-in infinite`,
        willChange:      'transform',
        opacity:         0.9,
      }}
    />
  );
}

export default function CelebrationPopup({ celebration, onClose }) {
  const { table1, table2, message, isTie } = celebration;

  useEffect(() => {
    if (!isTie) playAcceptSound();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isBet = !isTie && (message?.includes('Je parie') ?? false);

  // Parse emoji de tête du message pour l'icône SVG
  const [emojiChar, ...msgRest] = message ? [...message] : [];
  const msgText = msgRest.join('').trim();
  const msgIcon = ICONS[emojiChar];

  const subtitle = isTie
    ? 'Vos votes ne concordent pas...'
    : (isBet ? 'Que le meilleur gagne !' : 'Allez vous retrouver !');

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(8,15,30,0.75)', backdropFilter: 'blur(18px)' }}
    >
      {!isTie && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 55 }, (_, i) => <ConfettiPiece key={i} idx={i} />)}
        </div>
      )}

      <div
        className="relative rounded-3xl overflow-hidden w-full max-w-sm animate-bounce-in flex flex-col"
        style={{
          height:     '80vh',
          maxHeight:  620,
          background: 'rgba(255,255,255,0.88)',
          border:     isTie
            ? '1.5px solid rgba(255,77,109,0.40)'
            : '1.5px solid rgba(0,212,255,0.28)',
          backdropFilter:      'blur(24px)',
          WebkitBackdropFilter:'blur(24px)',
          boxShadow: isTie
            ? '0 0 40px rgba(255,77,109,0.12), 0 20px 40px rgba(0,0,0,0.20)'
            : '0 0 40px rgba(0,255,135,0.12), 0 20px 40px rgba(0,0,0,0.20)',
        }}
      >
        {/* Barre gradient */}
        <div
          className="h-1 w-full shrink-0"
          style={{
            background: isTie
              ? 'linear-gradient(90deg, #FF4D6D, #FFD700, #FF4D6D)'
              : 'linear-gradient(90deg, #00FF87, #00D4FF, #FFD700)',
          }}
        />

        <div className="flex flex-col flex-1 p-6 overflow-hidden">
          {/* Titre */}
          <div className="text-center mb-6 shrink-0">
            <p className="text-3xl font-black leading-tight" style={{ color: '#0A1628' }}>
              {isTie
                ? <>Égalité&nbsp;! <HandsSVG size={28} /></>
                : isBet
                  ? <>Le défi est lancé&nbsp;! <FlameSVG size={28} /></>
                  : "C'est parti ! 🎉"}
            </p>
            <p className="text-sm mt-1" style={{ color: '#4A6FA5' }}>{subtitle}</p>
          </div>

          {/* Deux avatars */}
          <div className="flex items-center justify-center gap-5 mb-6 shrink-0">
            <div className="flex flex-col items-center gap-2">
              <Avatar pseudo={table1.pseudo} photo={table1.photo} size={76} active />
              <span className="font-bold text-sm text-center max-w-[90px] truncate" style={{ color: '#0A1628' }}>
                {table1.pseudo}
              </span>
              <span className="text-xs" style={{ color: '#4A6FA5' }}>Table {table1.tableId}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="animate-float" style={{ lineHeight: 1 }}>
                {isTie ? <span style={{ fontSize: '2.25rem' }}>⚡</span> : <HandsSVG size={40} />}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar pseudo={table2.pseudo} photo={table2.photo} size={76} active />
              <span className="font-bold text-sm text-center max-w-[90px] truncate" style={{ color: '#0A1628' }}>
                {table2.pseudo}
              </span>
              <span className="text-xs" style={{ color: '#4A6FA5' }}>Table {table2.tableId}</span>
            </div>
          </div>

          {/* Message */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full" style={{
              background:   '#FFFFFF',
              border:       '1.5px solid #E8EDF5',
              borderRadius: 18,
              padding:      '16px 18px',
              boxShadow:    '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <p style={{
                fontSize:      11,
                fontWeight:    700,
                letterSpacing: '0.1em',
                color:         '#9CA3AF',
                textTransform: 'uppercase',
                marginBottom:  10,
              }}>
                {isTie ? 'Résultat' : (isBet ? 'Le pari' : 'Le message')}
              </p>
              {isTie ? (
                <p style={{ fontSize: 15, fontWeight: 600, color: '#0A1628', lineHeight: 1.4 }}>
                  {"Décidez à l'amiable qui a gagné ! 🏆"}
                </p>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {msgIcon && (
                    <div style={{
                      flexShrink:     0,
                      width:          48,
                      height:         48,
                      borderRadius:   '50%',
                      background:     msgIcon.bg,
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                    }}>
                      {msgIcon.svg}
                    </div>
                  )}
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#1a1a2e', lineHeight: 1.4 }}>
                    {msgText}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full py-4 mt-5 rounded-2xl font-black text-xl shrink-0 transition-all active:scale-95"
            style={isTie ? {
              background: 'rgba(10,22,40,0.07)',
              color:      'rgba(10,22,40,0.60)',
              border:     '1px solid rgba(255,77,109,0.28)',
            } : {
              background: 'linear-gradient(135deg, #00FF87, #00D4FF)',
              color:      '#000',
              boxShadow:  '0 4px 24px rgba(0,255,135,0.35)',
            }}
          >
            {isTie ? 'Fermer' : <>Let's go&nbsp;! <span className="electric-icon">🔌</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
