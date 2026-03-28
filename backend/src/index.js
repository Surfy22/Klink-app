require('dotenv').config();
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');

const app    = express();
const server = http.createServer(app);

const CORS_ORIGIN = process.env.CLIENT_URL || [
  // Réseau local (PC + appareils LAN)
  /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/,
  // Tunnels HTTPS (localhost.run et Cloudflare — pour iOS Safari)
  /^https:\/\/[a-z0-9]+\.lhr\.life$/,
  /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/,
];

const io = new Server(server, {
  cors: {
    origin:      CORS_ORIGIN,
    methods:     ['GET', 'POST'],
    credentials: false,
  },
  // Polling en premier — WebSocket en upgrade. Garantit la compatibilité
  // avec Safari iOS sur HTTP (ws:// peut être bloqué par ATS sur certains réseaux).
  transports: ['polling', 'websocket'],
  // 2.5 MB suffit pour une JPEG 160×160 en base64 (~30 KB).
  maxHttpBufferSize: 2.5e6,
  // Ping toutes les 25 s, timeout à 20 s — détection rapide des déconnexions
  pingInterval: 25000,
  pingTimeout:  20000,
});

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', uptime: process.uptime() }),
);

const handlers = require('./socket/handlers');
handlers(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`KLINK backend running on port ${PORT}`);
});

// Empêche le serveur de crasher sur des erreurs non gérées
process.on('unhandledRejection', (reason) => {
  console.error('[KLINK] unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[KLINK] uncaughtException:', err);
});
