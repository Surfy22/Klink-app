import { useState } from 'react';
import { generateName } from '../utils/nameGenerator';
import Avatar from '../components/Avatar';
import CameraCapture from '../components/CameraCapture';
import KlinkLogo from '../components/KlinkLogo';

export default function JoinPage({ tableId, onJoin }) {
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
         style={{ background: '#0D0D0D' }}>
      <div className="w-full max-w-sm">

        {/* Logo néon */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4 animate-float">
            <KlinkLogo size={72} />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight neon-text">
            KLINK
          </h1>
          <p className="text-sm font-semibold tracking-widest uppercase mt-2"
             style={{ color: '#00FF87' }}>
            Table <span className="font-black">{tableId}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Zone avatar */}
          <div className="flex flex-col items-center gap-3">
            {/* Halo autour de l'avatar */}
            <div
              className="relative p-[3px] rounded-full"
              style={{ background: 'linear-gradient(135deg, #00FF87, #0099FF)' }}
            >
              <div className="rounded-full bg-[#0D0D0D] p-[2px]">
                <Avatar pseudo={pseudo} photo={photo} size={96} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="text-sm font-semibold transition-colors"
              style={{ color: '#0099FF' }}
            >
              {photo ? '📷 Changer la photo' : '📷 Prendre une photo'}
            </button>

            {photo && (
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Supprimer la photo
              </button>
            )}
          </div>

          {/* Nom de table */}
          <div>
            <label className="block text-white/50 text-xs font-bold uppercase tracking-widest mb-2">
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
                className="glass-input flex-1 rounded-xl px-4 py-3 text-base"
              />
              <button
                type="button"
                onClick={() => setPseudo(generateName())}
                title="Générer un nom de table"
                className="glass-input rounded-xl px-3 py-3 text-lg text-white/60 hover:text-white transition-colors"
              >
                🎲
              </button>
            </div>
            <p className="text-white/25 text-xs mt-1.5">
              30 caractères · visible par les autres tables
            </p>
          </div>

          {/* Bouton principal */}
          <button
            type="submit"
            disabled={!pseudo.trim()}
            className="w-full py-4 rounded-2xl text-lg"
            style={pseudo.trim() ? {
              background:  'linear-gradient(135deg, #00FF87, #0099FF)',
              color:       '#000',
              fontWeight:  900,
              boxShadow:   '0 4px 24px rgba(0,255,135,0.3)',
              transition:  'all 0.15s',
            } : {
              background: 'rgba(255,255,255,0.06)',
              color:      'rgba(255,255,255,0.25)',
              fontWeight:  700,
              cursor:      'not-allowed',
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
