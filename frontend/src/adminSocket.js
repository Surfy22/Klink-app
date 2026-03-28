import { io } from 'socket.io-client';

const BACKEND_URL = window.location.origin;

// Socket séparé pour l'admin — n'interfère pas avec le socket client
const adminSocket = io(BACKEND_URL, {
  autoConnect:          false,
  transports:           ['polling'],
  reconnectionAttempts: 10,
  reconnectionDelay:    2000,
});

export default adminSocket;
