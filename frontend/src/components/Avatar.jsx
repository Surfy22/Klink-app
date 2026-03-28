import { getAvatarColor, getInitials } from '../utils/avatarColor';

/**
 * Avatar avec photo ou initiales colorées.
 * active=true → anneau néon pulsant autour de l'avatar.
 */
export default function Avatar({ pseudo, photo, size = 48, active = false }) {
  const bg       = getAvatarColor(pseudo);
  const initials = getInitials(pseudo);

  const inner = photo ? (
    <img
      src={photo}
      alt={pseudo}
      className="rounded-full object-cover w-full h-full"
    />
  ) : (
    <div
      className="rounded-full w-full h-full flex items-center justify-center font-black text-white select-none"
      style={{ backgroundColor: bg, fontSize: Math.round(size * 0.34) }}
    >
      {initials}
    </div>
  );

  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{ width: size, height: size }}
    >
      {/* Anneau pulsant néon sur les avatars actifs */}
      {active && (
        <>
          <div
            className="absolute rounded-full animate-pulse-ring"
            style={{
              inset: -4,
              border: '2px solid rgba(0,255,135,0.7)',
            }}
          />
          <div
            className="absolute rounded-full animate-pulse-ring"
            style={{
              inset: -4,
              border: '2px solid rgba(0,255,135,0.4)',
              animationDelay: '0.6s',
            }}
          />
        </>
      )}

      {/* Bordure fixe */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          border: `2px solid ${active ? 'rgba(0,255,135,0.6)' : 'rgba(255,255,255,0.15)'}`,
        }}
      >
        {inner}
      </div>
    </div>
  );
}
