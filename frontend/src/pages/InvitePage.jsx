import { useState } from 'react';
import Avatar from '../components/Avatar';

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

function Card({ emoji, text, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left transition-transform duration-150 active:scale-[0.97]"
      style={{
        background:   selected ? 'rgba(28,200,138,0.08)' : '#fff',
        border:       selected ? '2px solid #1CC88A'     : '1.5px solid #E5E7EB',
        borderRadius: 16,
        padding:      16,
        boxShadow:    '0 2px 8px rgba(0,0,0,0.06)',
        transition:   'transform 0.15s ease, border 0.15s ease, background 0.15s ease',
      }}
    >
      <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>{emoji}</span>
      <span
        style={{
          fontSize:   13,
          fontWeight: 500,
          color:      selected ? '#1CC88A' : '#1a1a2e',
          lineHeight: 1.4,
        }}
      >
        {text}
      </span>
    </button>
  );
}

export default function InvitePage({ user, target, onSend, onBack }) {
  const [mode, setMode]             = useState('defi');
  const [selectedDefi, setSelectedDefi] = useState(null);
  const [selectedPari, setSelectedPari] = useState(null);
  const [sending, setSending]       = useState(false);

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
    setMode(next);
  }

  function toggleDefi(i) {
    setSelectedDefi(selectedDefi === i ? null : i);
  }

  function togglePari(i) {
    setSelectedPari(selectedPari === i ? null : i);
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
            style={{ background: '#1a1a2e', borderRadius: 12 }}
          >
            {[
              { key: 'defi', label: 'Défi' },
              { key: 'pari', label: 'Pari bière 🍺' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className="flex-1 py-2 text-sm font-bold transition-all duration-150"
                style={{
                  borderRadius: 9,
                  background:   mode === key ? '#1CC88A' : 'transparent',
                  color:        mode === key ? '#fff'    : '#9CA3AF',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Grille 2×2 */}
          <div className="grid grid-cols-2 gap-3">
            {mode === 'defi'
              ? QUICK_MESSAGES.map((msg, i) => (
                  <Card
                    key={i}
                    emoji={msg.emoji}
                    text={msg.text}
                    selected={selectedDefi === i}
                    onClick={() => toggleDefi(i)}
                  />
                ))
              : PRESET_BETS.map((bet, i) => (
                  <Card
                    key={i}
                    emoji={bet.emoji}
                    text={bet.text}
                    selected={selectedPari === i}
                    onClick={() => togglePari(i)}
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
              background: 'linear-gradient(135deg, #00FF87, #00D4FF)',
              color:      '#000',
              fontWeight: 900,
              boxShadow:  '0 4px 32px rgba(0,255,135,0.40), 0 2px 12px rgba(0,212,255,0.25)',
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
