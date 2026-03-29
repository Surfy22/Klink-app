import { useEffect } from 'react';

/**
 * Annonce gérant — effet "promotion flash" percutant.
 * Auto-fermeture après 15 secondes.
 */
export default function AnnouncementOverlay({ message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 15000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const WhiteBolt = () => (
    <svg
      width="38" height="54" viewBox="0 0 8 12" fill="none"
      style={{ animation: 'white-pulse 0.8s ease-in-out infinite', display: 'block', margin: '0 auto 10px' }}
    >
      <path d="M5 0L0 7H3.5L1.5 12L8 5H4Z" fill="#ffffff" />
    </svg>
  );

  return (
    <div
      style={{
        position:            'fixed',
        inset:               0,
        zIndex:              150,
        display:             'flex',
        alignItems:          'center',
        justifyContent:      'center',
        padding:             '16px',
        background:          'rgba(8,15,30,0.80)',
        backdropFilter:      'blur(8px)',
        WebkitBackdropFilter:'blur(8px)',
        animation:           'fade-in 0.20s ease',
      }}
    >
      <div
        style={{
          width:               '90vw',
          maxWidth:            '420px',
          display:             'flex',
          flexDirection:       'column',
          alignItems:          'center',
          gap:                 '0',
          borderRadius:        '28px',
          background:          'linear-gradient(135deg, #00FF87 0%, #00C8F8 60%, #00D4FF 100%)',
          border:              '2.5px solid rgba(255,255,255,0.95)',
          animation:           'promo-in 0.40s cubic-bezier(0.34,1.56,0.64,1), flash-border 1s ease-in-out infinite',
          padding:             '36px 24px 28px',
          position:            'relative',
          overflow:            'hidden',
        }}
      >
        {/* Bouton fermer */}
        <button
          onClick={onDismiss}
          aria-label="Fermer"
          style={{
            position:            'absolute',
            top:                 '14px',
            right:               '14px',
            width:               '36px',
            height:              '36px',
            borderRadius:        '50%',
            background:          'rgba(0,0,0,0.18)',
            border:              '1.5px solid rgba(255,255,255,0.55)',
            color:               '#ffffff',
            fontSize:            '16px',
            cursor:              'pointer',
            display:             'flex',
            alignItems:          'center',
            justifyContent:      'center',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          ✕
        </button>

        {/* Éclair */}
        <WhiteBolt />

        {/* Label */}
        <p style={{
          color:         '#ffffff',
          fontSize:      '13px',
          fontWeight:    900,
          textTransform: 'uppercase',
          letterSpacing: '0.20em',
          margin:        '0 0 20px',
          textShadow:    '0 0 12px rgba(255,255,255,0.6)',
        }}>
          ANNONCE DU BAR
        </p>

        {/* Zone message */}
        <div style={{
          background:   'rgba(0,0,0,0.20)',
          borderRadius: '18px',
          padding:      '20px 20px',
          width:        '100%',
          marginBottom: '20px',
        }}>
          <p style={{
            color:      '#ffffff',
            fontSize:   '32px',
            fontWeight: 800,
            textAlign:  'center',
            lineHeight: 1.25,
            margin:     0,
            wordBreak:  'break-word',
            textShadow: '0 0 20px rgba(255,255,255,0.75), 0 2px 8px rgba(0,0,0,0.30)',
          }}>
            {message}
          </p>
        </div>

        {/* Barre de progression */}
        <div style={{
          width:        '100%',
          height:       '4px',
          background:   'rgba(255,255,255,0.25)',
          borderRadius: '2px',
          overflow:     'hidden',
        }}>
          <div style={{
            height:     '100%',
            background: 'rgba(255,255,255,0.85)',
            animation:  'shrink-bar 15s linear forwards',
            width:      '100%',
          }} />
        </div>
      </div>
    </div>
  );
}
