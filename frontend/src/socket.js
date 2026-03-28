import { io } from 'socket.io-client';

// En prod : VITE_BACKEND_URL pointe vers le backend Railway.
// En dev local : fallback sur window.location.origin (proxy Vite).
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

const socket = io(BACKEND_URL, {
  autoConnect:          false,
  // Polling d'abord → upgrade WebSocket. Contourne les blocages Safari iOS
  // sur HTTP (ws:// parfois refusé, xhr-polling toujours autorisé).
  transports:           ['polling'],
  // 10 tentatives avec backoff exponentiel — couvre une coupure de ~2 min
  reconnectionAttempts: 10,
  reconnectionDelay:    1500,
  reconnectionDelayMax: 8000,
  // Timeout de connexion
  timeout:              10000,
});

export default socket;
