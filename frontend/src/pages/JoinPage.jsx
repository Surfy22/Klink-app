import { useState } from 'react';
import { generateName } from '../utils/nameGenerator';
import Avatar from '../components/Avatar';
import CameraCapture from '../components/CameraCapture';
import KlinkLogo from '../components/KlinkLogo';

export default function JoinPage({ tableId, onJoin, joinError }) {
  const [pseudo, setPseudo]         = useState(() => generateName());
  const [photo, setPhoto]           = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!pseudo.trim()) return;
    onJoin(pseudo.trim(), photo);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
         style={{ background: '#F0F4FF' }}>
      <div className="w-full max-w-sm">

        {/* Logo néon */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5 animate-float">
            <KlinkLogo size={80} />
          </div>
          <h1
            className="text-5xl font-black text-white neon-text"
            style={{ letterSpacing: '-0.04em' }}
          >
            KLINK
          </h1>
          <p className="text-sm font-semibold tracking-widest uppercase mt-3"
             style={{ color: '#00FF87' }}>
            Table <span className="font-black">{tableId}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Zone avatar */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative p-[3px] rounded-full"
              style={{ background: 'linear-gradient(135deg, #00FF87, #00D4FF)', boxShadow: '0 0 16px rgba(0,255,135,0.30), 0 0 32px rgba(0,212,255,0.14)' }}
            >
              <div className="rounded-full p-[2px]" style={{ background: '#F0F4FF' }}>
                <Avatar pseudo={pseudo} photo={photo} size={76} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="text-sm font-semibold transition-colors"
              style={{ color: '#00D4FF' }}
            >
              {photo ? '📷 Changer la photo' : '📷 Prendre une photo'}
            </button>

            {photo && (
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="text-xs transition-colors"
                style={{ color: 'rgba(74,111,165,0.55)' }}
              >
                Supprimer la photo
              </button>
            )}
          </div>

          {/* Nom de table */}
          <div>
            <label className="block text-sm font-black uppercase tracking-widest mb-2.5" style={{ color: '#0A1628' }}>
              Nom de votre table
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                maxLength={30}
                autoFocus
                placeholder="Ex: Les Loups, Table des Champions..."
                className="glass-input flex-1 rounded-xl px-4 py-4 text-lg font-bold"
                style={{ color: '#0A1628' }}
              />
              <button
                type="button"
                onClick={() => setPseudo(generateName())}
                title="Générer un nom de table"
                className="glass-input rounded-xl px-3 py-3 text-lg transition-colors"
                style={{ color: 'rgba(74,111,165,0.60)' }}
              >
                🎲
              </button>
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'rgba(74,111,165,0.55)' }}>
              30 caractères · visible par les autres tables
            </p>
          </div>

          {/* Erreur nom déjà pris */}
          {joinError && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-bold text-center"
              style={{ background: 'rgba(255,60,60,0.12)', color: '#FF3C3C', border: '1.5px solid rgba(255,60,60,0.30)' }}
            >
              {joinError}
            </div>
          )}

          {/* Bouton principal */}
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
            Entrer dans le bar 🚪
          </button>
        </form>
      </div>

      {showCamera && (
        <CameraCapture onCapture={setPhoto} onClose={() => setShowCamera(false)} />
      )}
    </div>
  );
}
