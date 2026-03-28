import { useEffect } from 'react';

/**
 * Annonce gérant — bannière en-ligne (non fixed), à placer entre le header et le main.
 * Auto-fermeture après 15 secondes.
 */
export default function AnnouncementOverlay({ message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 15000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      style={{
        animation: 'slide-down 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        padding:   '6px 12px 0',
      }}
    >
      <div
        style={{
          borderRadius:    '16px',
          background:      'rgba(18, 14, 0, 0.95)',
          border:          '1.5px solid rgba(255,200,0,0.45)',
          backdropFilter:  'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow:       '0 4px 24px rgba(255,200,0,0.18), 0 2px 12px rgba(0,0,0,0.70)',
          overflow:        'hidden',
        }}
      >
        {/* Liseré doré en haut */}
        <div style={{
          height:     '2px',
          background: 'linear-gradient(90deg, #FFD700, #FF9500, #FFD700)',
        }} />

        {/* Contenu */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '10px',
          padding:    '10px 12px 8px',
        }}>
          {/* Icône */}
          <span style={{ fontSize: '18px', flexShrink: 0 }}>📢</span>

          {/* Label + message */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              color:         '#FFD700',
              fontSize:      '10px',
              fontWeight:    700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin:        '0 0 2px',
            }}>
              Annonce du gérant
            </p>
            <p style={{
              color:      'white',
              fontSize:   '14px',
              fontWeight: 600,
              margin:     0,
              lineHeight: 1.35,
            }}>
              {message}
            </p>
          </div>

          {/* Bouton fermer */}
          <button
            onClick={onDismiss}
            aria-label="Fermer"
            style={{
              flexShrink:     0,
              width:          '28px',
              height:         '28px',
              borderRadius:   '50%',
              background:     'rgba(255,255,255,0.10)',
              border:         'none',
              color:          'rgba(255,255,255,0.55)',
              fontSize:       '14px',
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Barre de progression */}
        <div style={{ height: '2px', background: 'rgba(255,200,0,0.15)', overflow: 'hidden' }}>
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
