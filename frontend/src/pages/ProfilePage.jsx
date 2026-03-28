import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

/**
 * Page de profil éphémère — accessible via /profile/:token
 * Récupère les infos de contact stockées 24h côté backend.
 */
export default function ProfilePage() {
  const { token } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch(`/profile/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error('expired');
        return r.json();
      })
      .then(setProfile)
      .catch(() => setError('Ce profil a expiré ou n\'existe pas.'));
  }, [token]);

  const bgStyle = { background: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' };

  if (error) return (
    <div style={bgStyle}>
      <div className="text-center">
        <div className="text-5xl mb-4">⏱️</div>
        <p className="text-white font-bold text-lg">Profil introuvable</p>
        <p className="text-white/40 text-sm mt-2">{error}</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div style={bgStyle}>
      <div className="text-center">
        <div className="text-4xl mb-3 animate-float">🍺</div>
        <p className="text-white/50 text-sm">Chargement…</p>
      </div>
    </div>
  );

  const isInstagram = profile.contact.type === 'instagram';
  const contactHref = isInstagram
    ? `https://instagram.com/${profile.contact.value.replace(/^@/, '')}`
    : `tel:${profile.contact.value}`;

  return (
    <div style={bgStyle}>
      <div
        className="glass-card rounded-3xl p-8 w-full max-w-xs text-center animate-bounce-in"
        style={{ border: '1px solid rgba(0,153,255,0.20)', boxShadow: '0 0 60px rgba(0,153,255,0.10)' }}
      >
        {/* Liseré */}
        <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-3xl"
             style={{ background: 'linear-gradient(90deg, #0099FF, #00FF87)' }} />

        <div className="text-5xl mb-4">🍺</div>
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">BarLink · Contact</p>
        <p className="text-white font-black text-2xl mb-6">{profile.pseudo}</p>

        <a
          href={contactHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-black text-base transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0099FF, #00FF87)', textDecoration: 'none' }}
        >
          <span>{isInstagram ? '📸' : '📱'}</span>
          <span>{profile.contact.value}</span>
        </a>

        <p className="text-white/20 text-xs mt-5">Ce profil expire dans 24h</p>
      </div>
    </div>
  );
}
