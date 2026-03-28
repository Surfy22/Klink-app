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

/* Bouton de sélection — style partagé messages rapides ET paris */
function SelectBtn({ emoji, text, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-3.5 rounded-xl text-left text-sm transition-all"
      style={{
        background: selected
          ? 'rgba(0,255,135,0.10)'
          : 'rgba(255,255,255,0.04)',
        border: selected
          ? '1px solid rgba(0,255,135,0.55)'
          : '1px solid rgba(255,255,255,0.08)',
        color: selected ? '#00FF87' : 'rgba(255,255,255,0.75)',
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
  const [sending, setSending]             = useState(false); // anti double-envoi

  function getMessage() {
    if (betOpen) {
      if (selectedBet !== null) {
        return `🍺 ${PRESET_BETS[selectedBet].text}`;
      }
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
    <div className="min-h-screen flex flex-col" style={{ background: '#0D0D0D' }}>

      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{
          background:     'rgba(13,13,13,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom:   '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <button
          onClick={onBack}
          className="text-white/40 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          ← Retour
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-10">
        <div className="max-w-sm mx-auto space-y-6">

          {/* Table cible */}
          <div
            className="glass-card rounded-2xl p-4 flex items-center gap-3"
            style={{ borderColor: 'rgba(0,153,255,0.2)' }}
          >
            <Avatar pseudo={target.pseudo} photo={target.photo} size={56} active />
            <div>
              <p className="text-white/40 text-xs mb-0.5">Invitation pour</p>
              <p className="text-white font-black text-lg leading-tight">{target.pseudo}</p>
              <p className="text-white/30 text-xs">Table {target.tableId}</p>
            </div>
          </div>

          {/* ─── Messages rapides ─── */}
          <section>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">
              Message rapide
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_MESSAGES.map((msg, i) => (
                <SelectBtn
                  key={i}
                  emoji={msg.emoji}
                  text={msg.text}
                  selected={selectedQuick === i}
                  onClick={() => selectQuick(i)}
                />
              ))}
            </div>
          </section>

          {/* ─── Pari bière ─── */}
          <section>
            {/* Toggle */}
            <button
              onClick={toggleBet}
              className="w-full p-4 rounded-2xl text-left transition-all"
              style={{
                background: betOpen ? 'rgba(255,215,0,0.07)' : 'rgba(255,255,255,0.04)',
                border:     betOpen
                  ? '1px solid rgba(255,215,0,0.35)'
                  : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍺</span>
                  <span
                    className="font-black text-sm"
                    style={{ color: betOpen ? '#FFD700' : 'rgba(255,255,255,0.75)' }}
                  >
                    Pari bière
                  </span>
                </div>
                <span className="text-white/30 text-sm">{betOpen ? '▲' : '▼'}</span>
              </div>
              <p className="text-white/30 text-xs mt-1">
                "Je parie une bière que..."
              </p>
            </button>

            {/* Options de paris */}
            {betOpen && (
              <div className="mt-2 space-y-2 animate-fade-in">
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_BETS.map((bet, i) => (
                    <SelectBtn
                      key={i}
                      emoji={bet.emoji}
                      text={bet.text}
                      selected={selectedBet === i}
                      onClick={() => selectBet(i)}
                    />
                  ))}
                </div>

                {/* Pari personnalisé */}
                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-3.5 text-white/30 text-sm pointer-events-none select-none">
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
                      background:    'rgba(255,255,255,0.05)',
                      border:        customBet
                        ? '1px solid rgba(0,255,135,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                      color:         'white',
                      outline:       'none',
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
                background: 'rgba(255,255,255,0.04)',
                border:     '1px solid rgba(255,255,255,0.09)',
              }}
            >
              <p className="text-white/35 text-xs mb-1.5 uppercase tracking-widest font-semibold">
                Aperçu
              </p>
              <p className="text-white text-base leading-relaxed">{message}</p>
            </div>
          )}

          {/* ─── Envoyer ─── */}
          <button
            onClick={() => {
              if (!message || sending) return;
              setSending(true);
              onSend(message);
              // Le state 'sending' reste true — le composant est démonté par onSend
            }}
            disabled={!message || sending}
            className="w-full py-4 rounded-2xl font-black text-lg"
            style={(message && !sending) ? {
              background: 'linear-gradient(135deg, #00FF87, #0099FF)',
              color:      '#000',
              boxShadow:  '0 4px 24px rgba(0,255,135,0.3)',
            } : {
              background: 'rgba(255,255,255,0.06)',
              color:      'rgba(255,255,255,0.25)',
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
