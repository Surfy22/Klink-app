import { io } from 'socket.io-client';

// En prod : VITE_BACKEND_URL pointe vers le backend Railway.
// En dev local : fallback sur window.location.origin (proxy Vite).
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

const socket = io(BACKEND_URL, {
  autoConnect:          false,
  // Polling d'abord → upgrade WebSocket. Contourne les blocages Safari iOS
  // sur HTTP (ws:// parfois refusé, xhr-polling toujours autorisé).
  // L'upgrade vers WebSocket réduit la charge réseau avec plusieurs tables.
  transports:           ['polling', 'websocket'],
  // Reconnexion illimitée — une table ne doit jamais rester déconnectée définitivement
  reconnectionAttempts: Infinity,
  reconnectionDelay:    1000,
  reconnectionDelayMax: 5000,
  // Timeout de connexion
  timeout:              10000,
});

export default socket;
