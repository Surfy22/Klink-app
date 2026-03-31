import { useState } from 'react';
import { generateName } from '../utils/nameGenerator';
import CameraCapture from '../components/CameraCapture';
import KlinkLogo from '../components/KlinkLogo';

const CameraIcon = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
    <circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
  </svg>
);

export default function JoinPage({ tableId, onJoin, joinError }) {
  const [pseudo, setPseudo]         = useState('');
  const [photo, setPhoto]           = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!pseudo.trim()) return;
    onJoin(pseudo.trim(), photo);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: '#F0F4FF' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Logo KLINK */}
        <div className="text-center">
          <div className="flex justify-center mb-4 animate-float">
            <KlinkLogo size={80} />
          </div>
          <h1
            className="text-5xl font-black text-white neon-text"
            style={{ letterSpacing: '-0.04em' }}
          >
            KLINK
          </h1>
        </div>

        {/* Tag TABLE X */}
        <p
          className="text-sm font-semibold tracking-widest uppercase"
          style={{ color: '#00FF87', marginTop: -8 }}
        >
          Table <span className="font-black">{tableId}</span>
        </p>

        {/* Avatar 52px — icône caméra uniquement sur cette page */}
        <button
          type="button"
          onClick={() => setShowCamera(true)}
          className="relative rounded-full flex items-center justify-center overflow-hidden"
          style={{
            width: 52, height: 52,
            border: '2.5px solid #1CC88A',
            background: '#2A2A3D',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {photo ? (
            <img src={photo} alt="avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <CameraIcon size={20} color="#1CC88A" />
          )}
        </button>

        {/* Champ pseudo + CTA */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">

          <div>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              maxLength={30}
              autoFocus
              placeholder="Nom de votre table"
              className="glass-input w-full rounded-xl px-4 py-4 text-lg font-bold placeholder-gray-400"
              style={{ color: '#0A1628' }}
            />
          </div>

          {joinError && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-bold text-center"
              style={{
                background: 'rgba(255,60,60,0.12)',
                color: '#FF3C3C',
                border: '1.5px solid rgba(255,60,60,0.30)',
              }}
            >
              {joinError}
            </div>
          )}

          <button
            type="submit"
            disabled={!pseudo.trim()}
            className="w-full py-4 rounded-2xl text-lg"
            style={pseudo.trim() ? {
              background: 'linear-gradient(135deg, #00FF87, #00D4FF)',
              color:      '#000',
              fontWeight: 900,
              boxShadow:  '0 4px 32px rgba(0,255,135,0.40), 0 2px 12px rgba(0,212,255,0.25)',
              transition: 'all 0.15s',
            } : {
              background: 'rgba(10,22,40,0.07)',
              color:      'rgba(10,22,40,0.28)',
              fontWeight: 700,
              cursor:     'not-allowed',
            }}
          >
            Entrer dans le bar 🎟️
          </button>
        </form>
      </div>

      {showCamera && (
        <CameraCapture onCapture={setPhoto} onClose={() => setShowCamera(false)} />
      )}
    </div>
  );
}
