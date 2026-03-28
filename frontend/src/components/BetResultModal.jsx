import { useState } from 'react';
import Avatar from './Avatar';

/**
 * Modal de désignation du gagnant — BLOQUANT.
 * Les deux tables DOIVENT désigner un gagnant avant de continuer.
 */
export default function BetResultModal({ celebration, currentTableId, onResult }) {
  const { table1, table2, message } = celebration;
  const [step, setStep]     = useState('pick');
  const [chosen, setChosen] = useState(null);

  const cardStyle = {
    width:         '90vw',
    maxWidth:      '420px',
    maxHeight:     '90vh',
    overflowY:     'auto',
    borderRadius:  '28px',
    background:    'rgba(13,10,0,0.95)',
    border:        '1.5px solid rgba(255,215,0,0.40)',
    boxShadow:     '0 0 50px rgba(255,215,0,0.18), 0 0 100px rgba(255,215,0,0.08), 0 24px 64px rgba(0,0,0,0.85)',
    backdropFilter:      'blur(24px)',
    WebkitBackdropFilter:'blur(24px)',
    padding:       '24px 20px 20px',
    animation:     'announce-in 0.30s cubic-bezier(0.34,1.56,0.64,1)',
  };

  const goldBar = (
    <div style={{
      height: '3px',
      background: 'linear-gradient(90deg, transparent, #FFD700, #FF9500, #FFD700, transparent)',
      borderRadius: '2px',
      marginBottom: '20px',
    }} />
  );

  return (
    <div
      style={{
        position:            'fixed',
        inset:               0,
        zIndex:              200,
        display:             'flex',
        alignItems:          'center',
        justifyContent:      'center',
        padding:             '16px',
        background:          'rgba(0,0,0,0.90)',
        backdropFilter:      'blur(14px)',
        WebkitBackdropFilter:'blur(14px)',
      }}
    >
      {step === 'pick' ? (
        <div style={cardStyle}>
          {goldBar}

          {/* Titre */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏆</div>
            <p style={{ color: '#fff', fontWeight: 900, fontSize: '20px', margin: '0 0 10px' }}>
              Qui a gagné le pari ?
            </p>
            <p style={{
              color:        'rgba(255,255,255,0.55)',
              fontSize:     '13px',
              background:   'rgba(255,255,255,0.06)',
              border:       '1px solid rgba(255,255,255,0.09)',
              borderRadius: '12px',
              padding:      '8px 14px',
              display:      'inline-block',
              maxWidth:     '100%',
              lineHeight:   1.4,
            }}>
              {message}
            </p>
          </div>

          {/* Avertissement */}
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
            background:   'rgba(255,200,0,0.08)',
            border:       '1px solid rgba(255,200,0,0.22)',
            borderRadius: '12px',
            padding:      '10px 14px',
            marginBottom: '18px',
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <p style={{ color: 'rgba(255,200,0,0.90)', fontSize: '12px', fontWeight: 700, margin: 0 }}>
              Désignez un gagnant pour continuer
            </p>
          </div>

          {/* Choix des deux tables */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {[table1, table2].map((t) => (
              <button
                key={t.tableId}
                onClick={() => { setChosen(t); setStep('confirm'); }}
                style={{
                  flex:           1,
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  gap:            '10px',
                  padding:        '18px 8px',
                  borderRadius:   '20px',
                  background:     'rgba(255,255,255,0.06)',
                  border:         '1.5px solid rgba(255,255,255,0.12)',
                  cursor:         'pointer',
                  transition:     'transform 0.1s, border-color 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                onTouchEnd={(e)   => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Avatar pseudo={t.pseudo} photo={t.photo} size={64} />
                <span style={{
                  color:      '#fff',
                  fontWeight: 700,
                  fontSize:   '13px',
                  textAlign:  'center',
                  wordBreak:  'break-word',
                  lineHeight: 1.3,
                  padding:    '0 4px',
                }}>
                  {t.pseudo}
                </span>
                <span style={{
                  background:   'rgba(255,215,0,0.12)',
                  color:        '#FFD700',
                  border:       '1px solid rgba(255,215,0,0.28)',
                  borderRadius: '999px',
                  padding:      '4px 12px',
                  fontSize:     '11px',
                  fontWeight:   800,
                }}>
                  🏆 Gagnant
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={cardStyle}>
          {goldBar}

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏆</div>
            <p style={{ color: '#fff', fontWeight: 900, fontSize: '20px', margin: 0 }}>
              Confirmer le gagnant ?
            </p>
          </div>

          {/* Profil choisi */}
          <div style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            gap:            '10px',
            padding:        '20px 16px',
            borderRadius:   '20px',
            background:     'rgba(255,215,0,0.08)',
            border:         '1.5px solid rgba(255,215,0,0.38)',
            marginBottom:   '20px',
          }}>
            <Avatar pseudo={chosen.pseudo} photo={chosen.photo} size={76} active />
            <p style={{ color: '#fff', fontWeight: 900, fontSize: '18px', margin: 0, textAlign: 'center' }}>
              {chosen.pseudo}
            </p>
            <span style={{
              color:        '#FFD700',
              background:   'rgba(255,215,0,0.12)',
              border:       '1px solid rgba(255,215,0,0.28)',
              borderRadius: '999px',
              padding:      '4px 14px',
              fontSize:     '12px',
              fontWeight:   700,
            }}>
              Table {chosen.tableId}
            </span>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => { setStep('pick'); setChosen(null); }}
              style={{
                flex:         1,
                padding:      '15px 8px',
                borderRadius: '18px',
                fontWeight:   700,
                fontSize:     '15px',
                background:   'rgba(255,255,255,0.07)',
                border:       '1px solid rgba(255,255,255,0.13)',
                color:        'rgba(255,255,255,0.60)',
                cursor:       'pointer',
              }}
            >
              ❌ Annuler
            </button>
            <button
              onClick={() => onResult(chosen.pseudo, chosen.tableId, chosen.photo)}
              style={{
                flex:         1,
                padding:      '15px 8px',
                borderRadius: '18px',
                fontWeight:   900,
                fontSize:     '15px',
                background:   'linear-gradient(135deg, #FFD700, #FF9500)',
                color:        '#000',
                border:       'none',
                cursor:       'pointer',
                boxShadow:    '0 4px 20px rgba(255,215,0,0.35)',
              }}
            >
              ✅ Confirmer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
