import { useState } from 'react';
import Avatar from './Avatar';

/**
 * Modal de désignation du gagnant — BLOQUANT.
 * Les deux tables DOIVENT désigner un gagnant avant de continuer.
 * Pas de bouton "Décider plus tard", pas de fermeture en cliquant dehors.
 */
export default function BetResultModal({ celebration, currentTableId, onResult }) {
  const { table1, table2, message } = celebration;
  const [step, setStep]     = useState('pick');
  const [chosen, setChosen] = useState(null);

  const cardStyle = {
    position:  'fixed',
    top:       '50%',
    left:      '50%',
    transform: 'translate(-50%, -50%)',
    width:     '90vw',
    maxWidth:  '400px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 0 60px rgba(255,215,0,0.12), 0 20px 60px rgba(0,0,0,0.8)',
    border:    '1px solid rgba(255,215,0,0.20)',
  };

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
    >
      {/* Liseré néon en haut */}
      <div
        className="absolute top-0 inset-x-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, #FFD700, #00FF87, #0099FF)' }}
      />

      {step === 'pick' ? (
        <div className="glass-card rounded-3xl p-7 w-full animate-bounce-in" style={cardStyle}>
          {/* Titre */}
          <div className="text-center mb-2">
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-white font-black text-lg">Qui a gagné le pari ?</p>
            <p
              className="text-sm mt-1 px-3 py-1.5 rounded-xl inline-block"
              style={{ color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.05)' }}
            >
              {message}
            </p>
          </div>

          {/* Message obligatoire */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 mb-4 mt-3"
            style={{ background: 'rgba(255,200,0,0.08)', border: '1px solid rgba(255,200,0,0.20)' }}
          >
            <span className="text-sm">⚠️</span>
            <p className="text-xs font-semibold" style={{ color: 'rgba(255,200,0,0.85)' }}>
              Vous devez désigner le gagnant pour continuer
            </p>
          </div>

          {/* Choix des deux tables */}
          <div className="flex gap-3">
            {[table1, table2].map((t) => (
              <button
                key={t.tableId}
                onClick={() => { setChosen(t); setStep('confirm'); }}
                className="flex-1 flex flex-col items-center gap-3 py-5 rounded-2xl transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <Avatar pseudo={t.pseudo} photo={t.photo} size={64} />
                <span className="text-white font-bold text-sm truncate max-w-full px-2">{t.pseudo}</span>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(255,215,0,0.10)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.20)' }}
                >
                  🏆 Gagnant
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-7 w-full animate-bounce-in" style={cardStyle}>
          {/* Titre */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-white font-black text-xl">Confirmer le gagnant ?</p>
          </div>

          {/* Profil choisi */}
          <div
            className="flex flex-col items-center gap-3 py-6 rounded-2xl mb-6"
            style={{ background: 'rgba(255,215,0,0.08)', border: '1.5px solid rgba(255,215,0,0.35)' }}
          >
            <Avatar pseudo={chosen.pseudo} photo={chosen.photo} size={76} active />
            <p className="text-white font-black text-lg">{chosen.pseudo}</p>
            <span
              className="text-sm px-3 py-1 rounded-full font-bold"
              style={{ color: '#FFD700', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.25)' }}
            >
              Table {chosen.tableId}
            </span>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              onClick={() => { setStep('pick'); setChosen(null); }}
              className="flex-1 py-3.5 rounded-2xl font-bold text-base transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)' }}
            >
              ❌ Annuler
            </button>
            <button
              onClick={() => onResult(chosen.pseudo, chosen.tableId, chosen.photo)}
              className="flex-1 py-3.5 rounded-2xl font-black text-base text-black transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FF9500)', boxShadow: '0 4px 16px rgba(255,215,0,0.30)' }}
            >
              ✅ Confirmer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
