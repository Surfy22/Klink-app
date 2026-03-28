/**
 * Logo KLINK — éclair dans un carré arrondi, dégradé vert → bleu.
 * Remplace l'emoji 🍺 pour la marque.
 */
export default function KlinkLogo({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="klink-g" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="#00FF87" />
          <stop offset="1" stopColor="#0099FF" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#klink-g)" />
      {/* Éclair */}
      <path d="M20 5L10 17L16 17L12 27L22 15L16 15Z" fill="white" />
    </svg>
  );
}
