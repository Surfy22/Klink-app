import { useEffect } from 'react';
import Avatar from './Avatar';
import { playInvitationSound, playAcceptSound, playDeclineSound } from '../utils/audioAlert';

/* ── Icônes SVG (identiques aux cartes de sélection) ─────────────────────── */

const ICONS = {
  '🎯': {
    bg: 'rgba(239,68,68,0.10)',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  '🎱': {
    bg: 'rgba(30,30,30,0.08)',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#1a1a2e" />
        <circle cx="12" cy="10.5" r="5" fill="white" />
        <text x="12" y="14.5" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#1a1a2e" fontFamily="system-ui,sans-serif">8</text>
      </svg>
    ),
  },
  '🍺': {
    bg: 'rgba(251,191,36,0.10)',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
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
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#6366F1">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  '🎳': {
    bg: 'rgba(168,85,247,0.10)',
    svg: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#A855F7">
        <circle cx="12" cy="5" r="3" />
        <path d="M9 8.5c-.6 1.1-1.2 2.7-1.2 4.8 0 2.1.5 3.2 4.2 3.2s4.2-1.1 4.2-3.2c0-2.1-.6-3.7-1.2-4.8H9z" />
        <ellipse cx="12" cy="20.5" rx="4.2" ry="2" />
      </svg>
    ),
  },
};

export default function InvitationAlert({ invite, onAccept, onDecline }) {
  useEffect(() => {
    playInvitationSound();
  }, []);

  function handleAccept() {
    playAcceptSound();
    onAccept();
  }

  function handleDecline() {
    playDeclineSound();
    onDecline();
  }

  // Extrait l'emoji de tête et le texte du message
  const [emojiChar, ...rest] = [...invite.message];
  const msgText = rest.join('').trim();
  const icon = ICONS[emojiChar];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-fade-in"
         style={{ background: 'rgba(8,15,30,0.75)', backdropFilter: 'blur(14px)' }}>

      {/* Anneaux pulsants néon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {[0, 0.5, 1].map((delay) => (
          <div
            key={delay}
            className="absolute w-80 h-80 rounded-full animate-pulse-ring"
            style={{
              border: '1.5px solid rgba(0,255,135,0.35)',
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>

      {/* Gradient border wrapper */}
      <div
        style={{
          background:   'linear-gradient(135deg, #00FF87, #00D4FF)',
          padding:      '1.5px',
          borderRadius: '25px',
          boxShadow:    '0 0 28px rgba(0,255,135,0.28), 0 0 56px rgba(0,212,255,0.16), 0 20px 40px rgba(0,0,0,0.30)',
        }}
      >
      {/* Carte */}
      <div
        className="relative rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-bounce-in"
        style={{
          background:          'rgba(255,255,255,0.88)',
          borderRadius:        '24px',
          backdropFilter:      'blur(24px)',
          WebkitBackdropFilter:'blur(24px)',
        }}
      >

        <div className="text-center mb-5">
          <span
            className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
            style={{
              color:      '#00FF87',
              background: 'rgba(0,255,135,0.10)',
              border:     '1px solid rgba(0,255,135,0.25)',
            }}
          >
            Invitation reçue !
          </span>

          <div className="flex justify-center mb-3">
            <div className="relative">
              <Avatar pseudo={invite.fromPseudo} photo={invite.fromPhoto} size={84} active />
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-lg"
                style={{ background: 'linear-gradient(135deg, #00FF87, #00D4FF)' }}
              >
                🍺
              </div>
            </div>
          </div>

          <p className="font-black text-xl" style={{ color: '#0A1628' }}>{invite.fromPseudo}</p>
          <p className="text-xs mt-0.5" style={{ color: '#4A6FA5' }}>Table {invite.fromTableId}</p>
        </div>

        {/* Carte de contenu — défi ou pari */}
        <div
          className="mb-5"
          style={{
            background:   '#FFFFFF',
            border:       '1.5px solid #E8EDF5',
            borderRadius: 18,
            padding:      '16px 18px',
            boxShadow:    '0 2px 12px rgba(0,0,0,0.06)',
            display:      'flex',
            alignItems:   'flex-start',
            gap:          12,
          }}
        >
          {icon && (
            <div style={{
              flexShrink:     0,
              width:          48,
              height:         48,
              borderRadius:   '50%',
              background:     icon.bg,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}>
              {icon.svg}
            </div>
          )}
          <span style={{
            fontSize:   14,
            fontWeight: 500,
            color:      '#1a1a2e',
            lineHeight: 1.4,
            paddingTop: icon ? 4 : 0,
          }}>
            {msgText}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 12, width: '100%' }}>
          <button
            onClick={handleDecline}
            onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onTouchEnd={(e)   => { e.currentTarget.style.transform = 'scale(1)'; }}
            className="btn-action"
            style={{
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              color:      '#FFFFFF',
            }}
          >
            Refuser
          </button>
          <button
            onClick={handleAccept}
            onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onTouchEnd={(e)   => { e.currentTarget.style.transform = 'scale(1)'; }}
            className="btn-action btn-gradient"
            style={{ color: '#000' }}
          >
            ✅ Accepter
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
