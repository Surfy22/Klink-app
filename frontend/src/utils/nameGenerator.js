const prefixes = ['Les', 'Team', 'Les', 'La', 'Les', 'Les', 'Team'];

const groups = [
  'Aigles', 'Loups', 'Champions', 'Invincibles', 'Légendes',
  'Tigres', 'Lions', 'Faucons', 'Requins', 'Cobras',
  'Guerriers', 'Fantômes', 'Rois', 'Indomptables', 'Furieux',
];

const suffixes = [
  'du Bar', 'de la Nuit', 'du Fond', 'Sauvages', 'Infernaux',
  'du Billard', 'des Fléchettes', 'Sans Pitié', 'Légendaires',
];

export function generateName() {
  const prefix  = prefixes[Math.floor(Math.random() * prefixes.length)];
  const group   = groups[Math.floor(Math.random() * groups.length)];
  const suffix  = suffixes[Math.floor(Math.random() * suffixes.length)];
  const name    = `${prefix} ${group} ${suffix}`;
  // Limiter à 30 caractères
  return name.length <= 30 ? name : `${prefix} ${group}`;
}
