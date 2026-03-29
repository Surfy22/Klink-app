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

  /* ── Styles partagés ── */
  const gradientWrap = {
    background: 'linear-gradient(135deg, #00FF87, #00D4FF)',
    padding:    '1.5px',
    borderRadius: '29px',
    boxShadow: '0 0 28px rgba(0,255,135,0.28), 0 0 56px rgba(0,212,255,0.16), 0 24px 64px rgba(0,0,0,0.85)',
  };

  const cardInner = {
    background:  'rgba(255,255,255,0.92)',
    borderRadius:'28px',
    padding:     '24px 20px 20px',
    width:       '90vw',
    maxWidth:    '420px',
    maxHeight:   '90vh',
    overflowY:   'auto',
    animation:   'announce-in 0.30s cubic-bezier(0.34,1.56,0.64,1)',
  };

  const gradientTitle = {
    background:             'linear-gradient(135deg, #00FF87, #00D4FF)',
    WebkitBackgroundClip:   'text',
    WebkitTextFillColor:    'transparent',
    backgroundClip:         'text',
    fontWeight: 900,
    fontSize:   '20px',
    margin:     0,
  };

  const neonBar = (
    <div style={{
      height:       '3px',
      background:   'linear-gradient(90deg, transparent, #00FF87, #00D4FF, transparent)',
      borderRadius: '2px',
      marginBottom: '20px',
    }} />
  );

  /* ── Éclair animé KLINK ── */
  const NeonBolt = () => (
    <svg
      width="34" height="48" viewBox="0 0 8 12" fill="none"
      style={{ animation: 'neon-pulse 2s ease-in-out infinite', display: 'block', margin: '0 auto 8px' }}
    >
      <defs>
        <linearGradient id="bolt-modal" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#00FF87" />
          <stop offset="1" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
      <path d="M5 0L0 7H3.5L1.5 12L8 5H4Z" fill="url(#bolt-modal)" />
    </svg>
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
        background:          'rgba(8,15,30,0.75)',
        backdropFilter:      'blur(14px)',
        WebkitBackdropFilter:'blur(14px)',
      }}
    >
      {step === 'pick' ? (
        <div style={gradientWrap}>
          <div style={cardInner}>
            {neonBar}

            {/* Titre */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <NeonBolt />
              <p style={gradientTitle}>Qui a gagné le pari ?</p>
              <p style={{
                color:        'rgba(74,111,165,0.75)',
                fontSize:     '13px',
                background:   'rgba(0,212,255,0.06)',
                border:       '1px solid rgba(0,212,255,0.18)',
                borderRadius: '12px',
                padding:      '8px 14px',
                display:      'inline-block',
                maxWidth:     '100%',
                lineHeight:   1.4,
                marginTop:    '12px',
              }}>
                {message}
              </p>
            </div>

            {/* Avertissement néon cyan */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              background:   'rgba(0,212,255,0.07)',
              border:       '1px solid rgba(0,212,255,0.32)',
              borderRadius: '12px',
              padding:      '10px 14px',
              marginBottom: '18px',
            }}>
              <span style={{ fontSize: '15px' }}>⚡</span>
              <p style={{ color: '#00D4FF', fontSize: '12px', fontWeight: 700, margin: 0 }}>
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
                    background:     'rgba(240,244,255,0.85)',
                    border:         '1.5px solid rgba(0,212,255,0.22)',
                    cursor:         'pointer',
                    transition:     'transform 0.1s, border-color 0.15s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
                  onTouchEnd={(e)   => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <Avatar pseudo={t.pseudo} photo={t.photo} size={64} />
                  <span style={{
                    color:      '#0A1628',
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
                    background:   'linear-gradient(135deg, #00FF87, #00D4FF)',
                    color:        '#000',
                    borderRadius: '999px',
                    padding:      '4px 12px',
                    fontSize:     '11px',
                    fontWeight:   800,
                    boxShadow:    '0 2px 10px rgba(0,255,135,0.35)',
                  }}>
                    ⚡ Gagnant
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={gradientWrap}>
          <div style={cardInner}>
            {neonBar}

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <NeonBolt />
              <p style={gradientTitle}>Confirmer le gagnant ?</p>
            </div>

            {/* Profil choisi */}
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              gap:            '10px',
              padding:        '20px 16px',
              borderRadius:   '20px',
              background:     'rgba(0,255,135,0.06)',
              border:         '1.5px solid rgba(0,255,135,0.38)',
              marginBottom:   '20px',
              boxShadow:      '0 0 22px rgba(0,255,135,0.12)',
            }}>
              <Avatar pseudo={chosen.pseudo} photo={chosen.photo} size={76} active />
              <p style={{ color: '#0A1628', fontWeight: 900, fontSize: '18px', margin: 0, textAlign: 'center' }}>
                {chosen.pseudo}
              </p>
              <span style={{
                color:        '#00FF87',
                background:   'rgba(0,255,135,0.12)',
                border:       '1px solid rgba(0,255,135,0.30)',
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
                  background:   'transparent',
                  border:       '1.5px solid rgba(255,77,109,0.55)',
                  color:        '#FF4D6D',
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
                  background:   'linear-gradient(135deg, #00FF87, #00D4FF)',
                  color:        '#000',
                  border:       'none',
                  cursor:       'pointer',
                  boxShadow:    '0 4px 24px rgba(0,255,135,0.42), 0 2px 12px rgba(0,212,255,0.25)',
                }}
              >
                ✅ Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
