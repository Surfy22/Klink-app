import { useEffect } from 'react';
import Avatar from './Avatar';
import { playInvitationSound, playAcceptSound, playDeclineSound } from '../utils/audioAlert';

/**
 * Overlay plein écran — invitation reçue.
 * invite : { fromTableId, fromPseudo, fromPhoto, message }
 */
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-fade-in"
         style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>

      {/* Anneaux pulsants néon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {[0, 0.5, 1].map((delay) => (
          <div
            key={delay}
            className="absolute w-80 h-80 rounded-full animate-pulse-ring"
            style={{
              border: '1.5px solid rgba(0,255,135,0.4)',
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>

      {/* Carte */}
      <div
        className="relative glass-card rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-bounce-in"
        style={{ boxShadow: '0 0 60px rgba(0,255,135,0.12), 0 20px 40px rgba(0,0,0,0.6)' }}
      >
        {/* Liseré gradient en haut */}
        <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-3xl"
             style={{ background: 'linear-gradient(90deg, #00FF87, #0099FF)' }} />

        <div className="text-center mb-5">
          <span
            className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
            style={{
              color: '#00FF87',
              background: 'rgba(0,255,135,0.1)',
              border: '1px solid rgba(0,255,135,0.2)',
            }}
          >
            Invitation reçue !
          </span>

          <div className="flex justify-center mb-3">
            <div className="relative">
              <Avatar pseudo={invite.fromPseudo} photo={invite.fromPhoto} size={84} active />
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-lg"
                style={{ background: 'linear-gradient(135deg, #00FF87, #0099FF)' }}
              >
                🍺
              </div>
            </div>
          </div>

          <p className="text-white font-black text-xl">{invite.fromPseudo}</p>
          <p className="text-white/40 text-xs mt-0.5">Table {invite.fromTableId}</p>
        </div>

        {/* Message */}
        <div
          className="rounded-2xl px-4 py-4 mb-5 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-white text-base leading-relaxed">{invite.message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 py-4 rounded-2xl font-bold text-white/80 transition-all active:scale-95 text-base"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            ❌ Refuser
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-4 rounded-2xl font-black text-black transition-all active:scale-95 text-base btn-gradient"
          >
            ✅ Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
