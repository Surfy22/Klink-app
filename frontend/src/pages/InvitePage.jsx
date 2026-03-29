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

function SelectBtn({ emoji, text, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-3.5 rounded-xl text-left text-sm transition-all"
      style={{
        background: selected ? 'rgba(0,255,135,0.10)' : 'rgba(10,22,40,0.06)',
        border:     selected ? '1px solid rgba(0,255,135,0.55)' : '1px solid rgba(10,22,40,0.10)',
        color:      selected ? '#00FF87' : '#0A1628',
      }}
    >
      <span className="text-xl block mb-1">{emoji}</span>
      <span className="leading-snug">{text}</span>
    </button>
  );
}

export default function InvitePage({ user, target, onSend, onBack }) {
  const [selectedQuick, setSelectedQuick] = useState(null);
  const [betOpen, setBetOpen]             = useState(false);
  const [selectedBet, setSelectedBet]     = useState(null);
  const [customBet, setCustomBet]         = useState('');
  const [sending, setSending]             = useState(false);

  function getMessage() {
    if (betOpen) {
      if (selectedBet !== null) return `🍺 ${PRESET_BETS[selectedBet].text}`;
      const custom = customBet.trim();
      return custom ? `🍺 Je parie une bière que ${custom}` : null;
    }
    if (selectedQuick !== null) {
      const q = QUICK_MESSAGES[selectedQuick];
      return `${q.emoji} ${q.text}`;
    }
    return null;
  }

  const message = getMessage();

  function selectQuick(i) {
    setBetOpen(false); setSelectedBet(null); setCustomBet('');
    setSelectedQuick(selectedQuick === i ? null : i);
  }

  function toggleBet() {
    const next = !betOpen;
    setBetOpen(next);
    setSelectedQuick(null);
    if (!next) { setSelectedBet(null); setCustomBet(''); }
  }

  function selectBet(i) {
    setSelectedBet(selectedBet === i ? null : i);
    setCustomBet('');
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
        <div className="max-w-sm mx-auto space-y-6">

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

          {/* ─── Messages rapides ─── */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#4A6FA5' }}>
              Message rapide
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_MESSAGES.map((msg, i) => (
                <SelectBtn key={i} emoji={msg.emoji} text={msg.text} selected={selectedQuick === i} onClick={() => selectQuick(i)} />
              ))}
            </div>
          </section>

          {/* ─── Pari bière ─── */}
          <section>
            <button
              onClick={toggleBet}
              className="w-full p-4 rounded-2xl text-left transition-all"
              style={{
                background: betOpen ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.80)',
                border:     betOpen ? '1px solid rgba(255,215,0,0.40)' : '1px solid rgba(10,22,40,0.10)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍺</span>
                  <span className="font-black text-sm" style={{ color: betOpen ? '#B8860B' : '#0A1628' }}>
                    Pari bière
                  </span>
                </div>
                <span className="text-sm" style={{ color: 'rgba(74,111,165,0.55)' }}>{betOpen ? '▲' : '▼'}</span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgba(74,111,165,0.60)' }}>
                "Je parie une bière que..."
              </p>
            </button>

            {betOpen && (
              <div className="mt-2 space-y-2 animate-fade-in">
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_BETS.map((bet, i) => (
                    <SelectBtn key={i} emoji={bet.emoji} text={bet.text} selected={selectedBet === i} onClick={() => selectBet(i)} />
                  ))}
                </div>

                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-3.5 text-sm pointer-events-none select-none" style={{ color: 'rgba(74,111,165,0.45)' }}>
                    ...
                  </span>
                  <input
                    type="text"
                    value={customBet}
                    onChange={(e) => { setCustomBet(e.target.value); setSelectedBet(null); }}
                    placeholder="tu finis ton verre le premier !"
                    maxLength={80}
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                    style={{
                      background: 'rgba(255,255,255,0.80)',
                      border:     customBet ? '1px solid rgba(0,255,135,0.5)' : '1px solid rgba(10,22,40,0.10)',
                      color:      '#0A1628',
                      outline:    'none',
                    }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* ─── Aperçu ─── */}
          {message && (
            <div
              className="rounded-2xl px-4 py-4 animate-fade-in"
              style={{
                background: 'rgba(240,244,255,0.85)',
                border:     '1px solid rgba(0,212,255,0.18)',
              }}
            >
              <p className="text-xs mb-1.5 uppercase tracking-widest font-semibold" style={{ color: '#4A6FA5' }}>
                Aperçu
              </p>
              <p className="text-base leading-relaxed" style={{ color: '#0A1628' }}>{message}</p>
            </div>
          )}

          {/* ─── Envoyer ─── */}
          <button
            onClick={() => {
              if (!message || sending) return;
              setSending(true);
              onSend(message);
            }}
            disabled={!message || sending}
            className="w-full py-4 rounded-2xl font-black text-lg"
            style={(message && !sending) ? {
              background: 'linear-gradient(135deg, #00FF87, #0099FF)',
              color:      '#000',
              boxShadow:  '0 4px 24px rgba(0,255,135,0.3)',
            } : {
              background: 'rgba(10,22,40,0.07)',
              color:      'rgba(10,22,40,0.30)',
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
