const COLORS = [
  '#e11d48', '#db2777', '#9333ea', '#7c3aed',
  '#2563eb', '#0891b2', '#059669', '#16a34a',
  '#d97706', '#ea580c', '#dc2626', '#0284c7',
];

export function getAvatarColor(pseudo) {
  if (!pseudo) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < pseudo.length; i++) {
    hash = pseudo.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function getInitials(pseudo) {
  if (!pseudo) return '?';
  // Retire les chiffres, prend les 2 premiers caractères alphabétiques
  const alpha = pseudo.replace(/[0-9]/g, '').trim();
  return (alpha.slice(0, 2) || pseudo.slice(0, 2)).toUpperCase();
}
