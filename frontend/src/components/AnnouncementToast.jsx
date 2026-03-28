import { useEffect } from 'react';

/**
 * Annonce gérant — overlay fixe centré, couvre 80% de l'écran.
 * Auto-fermeture après 15 secondes. Tables visibles en arrière-plan.
 */
export default function AnnouncementOverlay({ message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 15000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

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
        background:          'rgba(5,10,20,0.70)',
        backdropFilter:      'blur(6px)',
        WebkitBackdropFilter:'blur(6px)',
        animation:           'fade-in 0.25s ease',
      }}
    >
      <div
        style={{
          width:               '90vw',
          maxWidth:            '480px',
          minHeight:           '40vh',
          display:             'flex',
          flexDirection:       'column',
          alignItems:          'center',
          justifyContent:      'center',
          gap:                 '18px',
          borderRadius:        '28px',
          background:          'rgba(5,10,20,0.95)',
          border:              '2px solid #FFD700',
          boxShadow:           '0 0 60px rgba(255,215,0,0.30), 0 0 120px rgba(255,215,0,0.10), inset 0 0 60px rgba(255,215,0,0.04)',
          backdropFilter:      'blur(24px)',
          WebkitBackdropFilter:'blur(24px)',
          padding:             '40px 28px 28px',
          position:            'relative',
          animation:           'announce-in 0.35s cubic-bezier(0.34,1.56,0.64,1)',
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
            width:               '38px',
            height:              '38px',
            borderRadius:        '50%',
            background:          'rgba(255,255,255,0.10)',
            border:              '1px solid rgba(255,255,255,0.18)',
            color:               'rgba(255,255,255,0.75)',
            fontSize:            '18px',
            cursor:              'pointer',
            display:             'flex',
            alignItems:          'center',
            justifyContent:      'center',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          ✕
        </button>

        {/* Icône */}
        <span style={{ fontSize: '52px', lineHeight: 1 }}>📢</span>

        {/* Label */}
        <p style={{
          color:         '#FFD700',
          fontSize:      '12px',
          fontWeight:    800,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          margin:        0,
        }}>
          Annonce du gérant
        </p>

        {/* Message */}
        <p style={{
          color:      '#ffffff',
          fontSize:   '24px',
          fontWeight: 700,
          textAlign:  'center',
          lineHeight: 1.35,
          margin:     0,
          padding:    '0 8px',
          wordBreak:  'break-word',
        }}>
          {message}
        </p>

        {/* Barre de progression */}
        <div style={{
          width:        '100%',
          height:       '3px',
          background:   'rgba(255,215,0,0.15)',
          borderRadius: '2px',
          overflow:     'hidden',
          marginTop:    '8px',
        }}>
          <div style={{
            height:     '100%',
            background: 'linear-gradient(90deg, #FFD700, #FF9500)',
            animation:  'shrink-bar 15s linear forwards',
            width:      '100%',
          }} />
        </div>
      </div>
    </div>
  );
}
