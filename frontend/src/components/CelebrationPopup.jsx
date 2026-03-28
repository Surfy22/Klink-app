import { useEffect } from 'react';
import Avatar from './Avatar';
import { playAcceptSound } from '../utils/audioAlert';

const CONFETTI_COLORS = ['#00FF87', '#0099FF', '#FFD700', '#FF6B6B', '#A855F7', '#FF9500', '#FF3CAC'];

/** Pièce de confetti déterministe (pas de random au render) */
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

  const isBet    = !isTie && (message?.includes('Je parie') ?? false);
  const headline = isTie ? 'Égalité ! 🤝' : (isBet ? 'Le défi est lancé ! 🔥' : "C'est parti ! 🎉");
  const subtitle = isTie
    ? 'Vos votes ne concordent pas...'
    : (isBet ? 'Que le meilleur gagne !' : 'Allez vous retrouver !');

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}
    >
      {/* Confettis — seulement si pas d'égalité */}
      {!isTie && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 55 }, (_, i) => <ConfettiPiece key={i} idx={i} />)}
        </div>
      )}

      {/* Carte principale */}
      <div
        className="relative glass-card rounded-3xl overflow-hidden w-full max-w-sm animate-bounce-in flex flex-col"
        style={{
          height:    '80vh',
          maxHeight: 620,
          boxShadow: isTie
            ? '0 0 60px rgba(255,107,107,0.12), 0 30px 60px rgba(0,0,0,0.7)'
            : '0 0 80px rgba(0,255,135,0.15), 0 0 120px rgba(0,153,255,0.08), 0 30px 60px rgba(0,0,0,0.7)',
        }}
      >
        {/* Barre gradient */}
        <div
          className="h-1 w-full shrink-0"
          style={{
            background: isTie
              ? 'linear-gradient(90deg, #FF6B6B, #FFD700, #FF6B6B)'
              : 'linear-gradient(90deg, #00FF87, #0099FF, #FFD700)',
          }}
        />

        <div className="flex flex-col flex-1 p-6 overflow-hidden">

          {/* Titre */}
          <div className="text-center mb-6 shrink-0">
            <p className="text-3xl font-black text-white leading-tight neon-text">
              {headline}
            </p>
            <p className="text-white/50 text-sm mt-1">{subtitle}</p>
          </div>

          {/* Deux avatars */}
          <div className="flex items-center justify-center gap-5 mb-6 shrink-0">
            <div className="flex flex-col items-center gap-2">
              <Avatar pseudo={table1.pseudo} photo={table1.photo} size={76} active />
              <span className="text-white font-bold text-sm text-center max-w-[90px] truncate">
                {table1.pseudo}
              </span>
              <span className="text-white/35 text-xs">Table {table1.tableId}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="text-4xl animate-float">{isTie ? '⚡' : '🤝'}</div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar pseudo={table2.pseudo} photo={table2.photo} size={76} active />
              <span className="text-white font-bold text-sm text-center max-w-[90px] truncate">
                {table2.pseudo}
              </span>
              <span className="text-white/35 text-xs">Table {table2.tableId}</span>
            </div>
          </div>

          {/* Message / pari / égalité */}
          <div className="flex-1 flex items-center justify-center mx-0">
            <div
              className="w-full rounded-2xl p-4 text-center"
              style={{
                background: isTie ? 'rgba(255,107,107,0.07)' : 'rgba(255,255,255,0.05)',
                border:     isTie ? '1px solid rgba(255,107,107,0.18)' : '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <p className="text-white/40 text-xs uppercase tracking-widest mb-2 font-semibold">
                {isTie ? 'Résultat' : (isBet ? 'Le pari' : 'Le message')}
              </p>
              <p className="text-white text-lg font-semibold leading-snug">
                {isTie
                  ? "Décidez à l'amiable qui a gagné ! 🏆"
                  : message}
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full py-4 mt-5 rounded-2xl font-black text-xl shrink-0 transition-all active:scale-95"
            style={isTie ? {
              background: 'rgba(255,255,255,0.09)',
              color:      'rgba(255,255,255,0.75)',
              border:     '1px solid rgba(255,255,255,0.12)',
            } : {
              background: 'linear-gradient(135deg, #00FF87, #0099FF)',
              color:      '#000',
            }}
          >
            {isTie ? 'Fermer' : "Let's go ! 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}
