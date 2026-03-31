import { useState, useRef } from 'react';
import Avatar from '../components/Avatar';

/* ── Données ─────────────────────────────────────────────────────────────── */

const QUICK_MESSAGES = [
  { emoji: '🎯', text: 'On vous défie aux fléchettes !' },
  { emoji: '🎱', text: 'Partie de billard ?' },
  { emoji: '🍺', text: 'On vous offre un verre !' },
  { emoji: '💬', text: 'On vient discuter ?' },
];

const PRESET_BETS = [
  { emoji: '🎯', text: 'Je parie une bière que tu perds aux fléchettes !' },
  { emoji: '🎱', text: 'Je parie une bière que je gagne au billard !' },
  { emoji: '🍺', text: 'Je parie une bière sur celui qui finit son verre en premier !' },
  { emoji: '🎳', text: 'Je parie une bière que vous ratez votre prochain lancer !' },
];

/* ── Icônes SVG ──────────────────────────────────────────────────────────── */

const ICONS = {
  '🎯': {
    bg: 'rgba(239,68,68,0.10)',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
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

/* ── Carte ───────────────────────────────────────────────────────────────── */

function Card({ emojiKey, text, selected, onClick, enterAnimClass, enterDelay }) {
  const [iconBouncing, setIconBouncing] = useState(false);
  const [tapping,      setTapping]      = useState(false);
  const [shimmer,      setShimmer]      = useState(false);
  const icon = ICONS[emojiKey];

  function handleClick() {
    // Tap bounce (toujours)
    setTapping(true);
    setTimeout(() => setTapping(false), 300);

    // Shimmer + icône uniquement à la sélection
    if (!selected) {
      setShimmer(true);
      setTimeout(() => setShimmer(false), 450);

      setIconBouncing(true);
      setTimeout(() => setIconBouncing(false), 500);
    }

    onClick();
  }

  return (
    // Wrapper d'entrée : translateX + scaleY sans conflit avec les autres transforms
    <div style={{
      height:    '100%',
      boxSizing: 'border-box',
      animation: enterAnimClass
        ? `${enterAnimClass} 320ms cubic-bezier(0.34, 1.3, 0.64, 1) ${enterDelay}ms both`
        : 'none',
    }}>
      {/* Bouton : tap bounce */}
      <button
        onClick={handleClick}
        className={shimmer ? 'card-shimmer' : ''}
        style={{
          position:     'relative',
          overflow:     'hidden',
          width:        '100%',
          height:       '100%',
          boxSizing:    'border-box',
          textAlign:    'left',
          cursor:       'pointer',
          background:   selected
            ? 'linear-gradient(135deg, rgba(28,200,138,0.15), rgba(0,180,216,0.10))'
            : '#FFFFFF',
          border:       selected ? '2px solid #1CC88A' : '1.5px solid #E8EDF5',
          borderRadius: 18,
          padding:      18,
          boxShadow:    selected
            ? '0 0 0 3px rgba(28,200,138,0.12), 0 4px 16px rgba(28,200,138,0.25), inset 0 1px 0 rgba(255,255,255,0.80)'
            : '0 2px 12px rgba(0,0,0,0.06)',
          transition:   'background 200ms ease, border 200ms ease, box-shadow 200ms ease',
          animation:    tapping ? 'card-tap-bounce 280ms both' : 'none',
        }}
      >
        {/* Icône dans cercle coloré */}
        <div style={{
          width:         48,
          height:        48,
          borderRadius:  '50%',
          background:    icon.bg,
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          marginBottom:  10,
          animation:     iconBouncing
            ? 'icon-bounce 450ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            : 'none',
        }}>
          {icon.svg}
        </div>

        <span style={{
          fontSize:   14,
          fontWeight: selected ? 600 : 500,
          color:      selected ? '#0d9e6e' : '#1a1a2e',
          lineHeight: 1.4,
          display:    'block',
        }}>
          {text}
        </span>
      </button>
    </div>
  );
}

/* ── Page principale ─────────────────────────────────────────────────────── */

export default function InvitePage({ user, target, onSend, onBack }) {
  const [displayMode,  setDisplayMode]  = useState('defi');
  const [animPhase,    setAnimPhase]    = useState('idle'); // 'idle' | 'exit' | 'enter'
  const [exitDir,      setExitDir]      = useState(-1);    // -1=sortie gauche, +1=sortie droite
  const [enterFromRight, setEnterFromRight] = useState(true); // direction d'entrée
  const [selectedDefi, setSelectedDefi] = useState(null);
  const [selectedPari, setSelectedPari] = useState(null);
  const [sending,      setSending]      = useState(false);
  const [gridScale,    setGridScale]    = useState(1);
  const [scaleTiming,  setScaleTiming]  = useState('none');
  const lockRef = useRef(false);

  function getMessage() {
    if (displayMode === 'defi' && selectedDefi !== null) {
      const q = QUICK_MESSAGES[selectedDefi];
      return `${q.emoji} ${q.text}`;
    }
    if (displayMode === 'pari' && selectedPari !== null) {
      return `🍺 ${PRESET_BETS[selectedPari].text}`;
    }
    return null;
  }

  const message = getMessage();

  // Mode actif du toggle (suit displayMode sauf pendant la phase exit)
  const [toggleMode, setToggleMode] = useState('defi');

  function switchMode(next) {
    if (next === displayMode || lockRef.current) return;
    lockRef.current = true;

    const goingRight = next === 'pari';
    // Effet scale squeeze → regrossissement spring (subtil)
    setScaleTiming('150ms ease-in');
    setGridScale(0.97);
    setTimeout(() => {
      setScaleTiming('300ms cubic-bezier(0.34, 1.56, 0.64, 1)');
      setGridScale(1);
    }, 150);

    setToggleMode(next);                // indicateur glisse immédiatement
    setExitDir(goingRight ? -1 : 1);   // cartes actuelles sortent vers la gauche si on va à droite
    setEnterFromRight(goingRight);      // nouvelles cartes entrent depuis la droite
    setAnimPhase('exit');

    setTimeout(() => {
      setDisplayMode(next);
      setAnimPhase('enter');

      setTimeout(() => {
        setAnimPhase('idle');
        lockRef.current = false;
      }, 300 + 180 + 80);
    }, 250);
  }

  // Style du conteneur de cartes pendant la phase exit
  const gridExitStyle = animPhase === 'exit' ? {
    transform:  `translateX(${exitDir * 30}px) scaleY(0.96)`,
    opacity:    0,
    transition: 'transform 250ms ease-in, opacity 250ms ease-in',
  } : {};

  // Vague horizontale : 180ms délai global + 120ms entre les deux rangées
  const enterAnimClass = animPhase === 'enter' ? 'card-wave-in' : null;
  function cardEnterDelay(i) { return 180 + Math.floor(i / 2) * 120; }

  const items = displayMode === 'defi' ? QUICK_MESSAGES : PRESET_BETS;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F0F4FF' }}>

      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{
          background:     'rgba(240,244,255,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom:   '1px solid rgba(0,212,255,0.18)',
        }}
      >
        <button
          onClick={onBack}
          className="text-sm flex items-center gap-1 font-semibold"
          style={{ color: '#4A6FA5' }}
        >
          ← Retour
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-10">
        <div className="max-w-sm mx-auto space-y-5">

          {/* Table cible */}
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background:     'rgba(255,255,255,0.80)',
              border:         '1px solid rgba(0,212,255,0.22)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <Avatar pseudo={target.pseudo} photo={target.photo} size={56} active />
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: '#4A6FA5' }}>Invitation pour</p>
              <p className="font-black text-lg leading-tight" style={{ color: '#0A1628' }}>{target.pseudo}</p>
              <p className="text-xs" style={{ color: 'rgba(74,111,165,0.70)' }}>Table {target.tableId}</p>
            </div>
          </div>

          {/* ── Toggle avec indicateur glissant ── */}
          <div
            style={{
              position:     'relative',
              display:      'flex',
              padding:      4,
              background:   '#F0F4FF',
              borderRadius: 14,
              border:       '1px solid #E8EDF5',
            }}
          >
            {/* Indicateur absolu qui glisse */}
            <div style={{
              position:     'absolute',
              top:          4,
              bottom:       4,
              left:         4,
              width:        'calc(50% - 4px)',
              background:   'linear-gradient(135deg, #1CC88A, #00B4D8)',
              borderRadius: 10,
              transform:    toggleMode === 'defi' ? 'translateX(0)' : 'translateX(100%)',
              transition:   'transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              pointerEvents:'none',
            }} />

            {/* Labels au-dessus de l'indicateur */}
            {[
              { key: 'defi', label: 'Défi' },
              { key: 'pari', label: 'Pari bière 🍺' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                style={{
                  flex:         1,
                  position:     'relative',
                  zIndex:       1,
                  padding:      '8px 0',
                  fontSize:     14,
                  fontWeight:   700,
                  color:        toggleMode === key ? '#fff' : '#9CA3AF',
                  background:   'transparent',
                  border:       'none',
                  cursor:       'pointer',
                  transition:   'color 300ms ease',
                  borderRadius: 10,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Grille 2×2 avec animation d'exit + scale squeeze ── */}
          <div style={{
            transform:  `scale(${gridScale})`,
            transition: `transform ${scaleTiming}`,
          }}>
          <div
            style={{
              display:             'grid',
              gridTemplateColumns: '1fr 1fr',
              gridAutoRows:        '1fr',
              gap:                 12,
              ...gridExitStyle,
            }}
          >
            {items.map((item, i) => (
              <Card
                key={`${displayMode}-${i}`}
                emojiKey={item.emoji}
                text={item.text}
                selected={displayMode === 'defi' ? selectedDefi === i : selectedPari === i}
                onClick={() => {
                  if (displayMode === 'defi') {
                    setSelectedDefi(selectedDefi === i ? null : i);
                  } else {
                    setSelectedPari(selectedPari === i ? null : i);
                  }
                }}
                enterAnimClass={enterAnimClass}
                enterDelay={cardEnterDelay(i)}
              />
            ))}
          </div>
          </div>

          {/* ── Bouton CTA ── */}
          <button
            onClick={() => {
              if (!message || sending) return;
              setSending(true);
              onSend(message);
            }}
            disabled={!message || sending}
            className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2"
            style={(message && !sending) ? {
              background: 'linear-gradient(135deg, #1CC88A, #00B4D8)',
              color:      '#fff',
              fontWeight: 900,
              boxShadow:  '0 4px 32px rgba(28,200,138,0.35), 0 2px 12px rgba(0,180,216,0.20)',
              transition: 'all 0.15s',
            } : {
              background: 'rgba(10,22,40,0.07)',
              color:      'rgba(10,22,40,0.28)',
              fontWeight: 700,
              cursor:     'not-allowed',
            }}
          >
            {sending ? 'Envoi…' : (
              <>
                Envoyer l'invitation
                <svg
                  width="18" height="18" viewBox="0 0 18 18" fill="none"
                  style={{
                    marginLeft: 8,
                    flexShrink: 0,
                    filter: (message && !sending)
                      ? 'drop-shadow(0 0 4px rgba(255,255,255,0.9)) drop-shadow(0 0 10px rgba(28,200,138,0.8)) drop-shadow(0 0 20px rgba(0,180,216,0.6))'
                      : 'none',
                  }}
                >
                  {/* Corps arrondi */}
                  <rect x="3" y="7" width="12" height="9" rx="3" stroke="white" strokeWidth="1.5" />
                  {/* Broche gauche */}
                  <rect x="6" y="2" width="2" height="6" rx="1" fill="white" />
                  {/* Broche droite */}
                  <rect x="10" y="2" width="2" height="6" rx="1" fill="white" />
                </svg>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
