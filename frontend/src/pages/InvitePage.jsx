import { useState } from 'react';
import Avatar from '../components/Avatar';

/* ── Données ──────────────────────────────────────────────────────────────── */

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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  '🎱': {
    bg: 'rgba(30,30,30,0.08)',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#1a1a2e" />
        <circle cx="12" cy="10.5" r="5" fill="white" />
        <text x="12" y="14.5" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#1a1a2e" fontFamily="system-ui,sans-serif">8</text>
      </svg>
    ),
  },
  '🍺': {
    bg: 'rgba(251,191,36,0.10)',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#6366F1">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  '🎳': {
    bg: 'rgba(168,85,247,0.10)',
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#A855F7">
        <circle cx="12" cy="5" r="3" />
        <path d="M9 8.5c-.6 1.1-1.2 2.7-1.2 4.8 0 2.1.5 3.2 4.2 3.2s4.2-1.1 4.2-3.2c0-2.1-.6-3.7-1.2-4.8H9z" />
        <ellipse cx="12" cy="20.5" rx="4.2" ry="2" />
      </svg>
    ),
  },
};

/* ── Carte ──────────────────────────────────────────────────────────────── */

function Card({ emojiKey, text, selected, onClick }) {
  const [bouncing, setBouncing] = useState(false);
  const icon = ICONS[emojiKey];

  function handleClick() {
    if (!selected) {
      setBouncing(true);
      setTimeout(() => setBouncing(false), 500);
    }
    onClick();
  }

  return (
    <button
      onClick={handleClick}
      className="text-left"
      style={{
        background:   selected
          ? 'linear-gradient(135deg, rgba(28,200,138,0.12), rgba(0,180,216,0.08))'
          : '#FFFFFF',
        border:       selected ? '2px solid #1CC88A' : '1.5px solid #E8EDF5',
        borderRadius: 18,
        padding:      18,
        boxShadow:    selected
          ? '0 0 0 4px rgba(28,200,138,0.15), inset 0 1px 3px rgba(28,200,138,0.20)'
          : '0 2px 12px rgba(0,0,0,0.06)',
        transition:   'all 200ms ease',
        transform:    'scale(1)',
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={(e)   => { e.currentTarget.style.transform = 'scale(1.02)'; setTimeout(() => { e.currentTarget.style.transform = 'scale(1)'; }, 100); }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
      onTouchEnd={(e)   => { e.currentTarget.style.transform = 'scale(1.02)'; setTimeout(() => { if (e.currentTarget) e.currentTarget.style.transform = 'scale(1)'; }, 100); }}
    >
      {/* Icône dans cercle coloré */}
      <div
        style={{
          width: 48, height: 48,
          borderRadius: '50%',
          background: icon.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 10,
          animation: bouncing ? 'icon-bounce 450ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
        }}
      >
        {icon.svg}
      </div>

      <span
        style={{
          fontSize:   14,
          fontWeight: selected ? 600 : 500,
          color:      selected ? '#0d9e6e' : '#1a1a2e',
          lineHeight: 1.4,
          display:    'block',
        }}
      >
        {text}
      </span>
    </button>
  );
}

/* ── Page principale ─────────────────────────────────────────────────────── */

export default function InvitePage({ user, target, onSend, onBack }) {
  const [mode, setMode]               = useState('defi');
  const [slideAnim, setSlideAnim]     = useState('slide-in-right');
  const [selectedDefi, setSelectedDefi] = useState(null);
  const [selectedPari, setSelectedPari] = useState(null);
  const [sending, setSending]         = useState(false);

  function getMessage() {
    if (mode === 'defi' && selectedDefi !== null) {
      const q = QUICK_MESSAGES[selectedDefi];
      return `${q.emoji} ${q.text}`;
    }
    if (mode === 'pari' && selectedPari !== null) {
      return `🍺 ${PRESET_BETS[selectedPari].text}`;
    }
    return null;
  }

  const message = getMessage();

  function switchMode(next) {
    if (next === mode) return;
    setSlideAnim(next === 'pari' ? 'slide-in-right' : 'slide-in-left');
    setMode(next);
  }

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

          {/* Toggle Défi / Pari bière */}
          <div
            className="flex p-1 gap-1"
            style={{ background: '#F0F4FF', borderRadius: 14, border: '1px solid #E8EDF5' }}
          >
            {[
              { key: 'defi', label: 'Défi' },
              { key: 'pari', label: 'Pari bière 🍺' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className="flex-1 py-2 text-sm font-bold"
                style={{
                  borderRadius: 10,
                  background:   mode === key
                    ? 'linear-gradient(135deg, #1CC88A, #00B4D8)'
                    : 'transparent',
                  color:        mode === key ? '#fff' : '#9CA3AF',
                  transition:   'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Grille 2×2 — key force remount + animation au switch */}
          <div
            key={mode}
            className="grid grid-cols-2 gap-3"
            style={{ animation: `${slideAnim} 300ms ease both` }}
          >
            {mode === 'defi'
              ? QUICK_MESSAGES.map((msg, i) => (
                  <Card
                    key={i}
                    emojiKey={msg.emoji}
                    text={msg.text}
                    selected={selectedDefi === i}
                    onClick={() => setSelectedDefi(selectedDefi === i ? null : i)}
                  />
                ))
              : PRESET_BETS.map((bet, i) => (
                  <Card
                    key={i}
                    emojiKey={bet.emoji}
                    text={bet.text}
                    selected={selectedPari === i}
                    onClick={() => setSelectedPari(selectedPari === i ? null : i)}
                  />
                ))
            }
          </div>

          {/* Bouton CTA */}
          <button
            onClick={() => {
              if (!message || sending) return;
              setSending(true);
              onSend(message);
            }}
            disabled={!message || sending}
            className="w-full py-4 rounded-2xl font-black text-lg"
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
            {sending ? 'Envoi…' : "Envoyer l'invitation 🚀"}
          </button>
        </div>
      </main>
    </div>
  );
}
