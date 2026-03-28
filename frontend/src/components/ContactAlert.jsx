import { useEffect } from 'react';
import Avatar from './Avatar';

/**
 * Notification de contact reçu — overlay plein écran.
 * contact : { fromPseudo, fromPhoto, contact: { type, value } }
 * Auto-fermeture après 20 secondes.
 */
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
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="glass-card rounded-3xl w-full max-w-sm animate-bounce-in overflow-hidden"
        style={{ border: '1px solid rgba(0,153,255,0.30)', boxShadow: '0 0 60px rgba(0,153,255,0.12)' }}
      >
        {/* Liseré gradient */}
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #0099FF, #00FF87)' }} />

        <div className="p-6">
          {/* Label */}
          <div className="flex items-center justify-between mb-4">
            <span
              className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{ color: '#0099FF', background: 'rgba(0,153,255,0.10)', border: '1px solid rgba(0,153,255,0.20)' }}
            >
              Contact reçu
            </span>
            <button
              onClick={onDismiss}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/35"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              ✕
            </button>
          </div>

          {/* Expéditeur */}
          <div className="flex items-center gap-3 mb-5">
            <Avatar pseudo={fromPseudo} photo={fromPhoto ?? null} size={52} active />
            <div>
              <p className="text-white font-black text-base">{fromPseudo}</p>
              <p className="text-white/35 text-xs">vous partage son contact</p>
            </div>
          </div>

          {/* Lien contact */}
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-black text-base transition-all active:scale-95 mb-3"
            style={{ background: 'linear-gradient(135deg, #0099FF, #00FF87)', textDecoration: 'none' }}
          >
            <span>{isInstagram ? '📸' : '📱'}</span>
            <span>{value}</span>
          </a>

          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl text-white/40 text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
