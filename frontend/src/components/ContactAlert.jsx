import { useEffect } from 'react';
import Avatar from './Avatar';

export default function ContactAlert({ contact, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 20000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const { fromPseudo, fromPhoto, contact: { type, value } } = contact;
  const isInstagram = type === 'instagram';
  const href = isInstagram
    ? `https://instagram.com/${value.replace(/^@/, '')}`
    : `tel:${value}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(5,10,20,0.88)', backdropFilter: 'blur(14px)' }}
    >
      <div
        className="rounded-3xl w-full max-w-sm animate-bounce-in overflow-hidden"
        style={{
          background:          'rgba(0,212,255,0.05)',
          border:              '1.5px solid rgba(0,212,255,0.35)',
          backdropFilter:      'blur(24px)',
          WebkitBackdropFilter:'blur(24px)',
          boxShadow:           '0 0 60px rgba(0,212,255,0.14), 0 20px 40px rgba(0,0,0,0.70)',
        }}
      >
        {/* Liseré gradient */}
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #00D4FF, #00FF87)' }} />

        <div className="p-6">
          {/* Label */}
          <div className="flex items-center justify-between mb-4">
            <span
              className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{ color: '#00D4FF', background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.25)' }}
            >
              Contact reçu
            </span>
            <button
              onClick={onDismiss}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.08)', color: 'rgba(139,184,212,0.60)' }}
            >
              ✕
            </button>
          </div>

          {/* Expéditeur */}
          <div className="flex items-center gap-3 mb-5">
            <Avatar pseudo={fromPseudo} photo={fromPhoto ?? null} size={52} active />
            <div>
              <p className="text-white font-black text-base">{fromPseudo}</p>
              <p className="text-xs" style={{ color: '#8BB8D4' }}>vous partage son contact</p>
            </div>
          </div>

          {/* Lien contact */}
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-black text-base transition-all active:scale-95 mb-3"
            style={{
              background:     'linear-gradient(135deg, #00FF87, #00D4FF)',
              textDecoration: 'none',
              boxShadow:      '0 4px 20px rgba(0,255,135,0.30)',
            }}
          >
            <span>{isInstagram ? '📸' : '📱'}</span>
            <span>{value}</span>
          </a>

          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(0,212,255,0.06)', color: 'rgba(139,184,212,0.55)' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
