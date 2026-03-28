import { io } from 'socket.io-client';

// Connexion same-origin : Vite proxifie /socket.io → localhost:3001.
// Fonctionne sur localhost, LAN (192.168.x.x) et tunnel HTTPS (lhr.life).
const BACKEND_URL = window.location.origin;

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
