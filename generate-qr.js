#!/usr/bin/env node
/**
 * Génère les QR codes KLINK pour un bar.
 *
 * Usage :
 *   node generate-qr.js <barId> <nbTables>
 *
 * Exemple :
 *   node generate-qr.js la-luck 20
 *
 * Sortie :
 *   qrcodes/la-luck/table-1.png … table-20.png + table-admin.png
 */

const QRCode = require('qrcode');
const fs     = require('fs');
const path   = require('path');

/* ── Paramètres CLI ───────────────────────────────────────────────────────── */

const [,, barId, nbTablesArg] = process.argv;

if (!barId || !nbTablesArg) {
  console.error('Usage : node generate-qr.js <barId> <nbTables>');
  console.error('Ex    : node generate-qr.js la-luck 20');
  process.exit(1);
}

const nbTables = parseInt(nbTablesArg, 10);
if (isNaN(nbTables) || nbTables < 1 || nbTables > 500) {
  console.error('Erreur : nbTables doit être un entier entre 1 et 500.');
  process.exit(1);
}

/* ── Config ───────────────────────────────────────────────────────────────── */

const BASE_URL   = 'https://klink-app.vercel.app';
const OUT_DIR    = path.join(__dirname, 'qrcodes', barId);

const QR_OPTIONS = {
  type:           'png',
  width:          500,
  margin:         2,
  errorCorrectionLevel: 'H',
  color: {
    dark:  '#0A1628',
    light: '#FFFFFF',
  },
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

async function generateQR(url, filePath, label) {
  await QRCode.toFile(filePath, url, QR_OPTIONS);
  console.log(`  ✓ ${label.padEnd(20)} → ${url}`);
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\nKLINK — Génération QR codes`);
  console.log(`Bar     : ${barId}`);
  console.log(`Tables  : ${nbTables}`);
  console.log(`Dossier : ${OUT_DIR}\n`);

  // Tables 1 … N
  for (let i = 1; i <= nbTables; i++) {
    const url      = `${BASE_URL}/table/${barId}/${i}`;
    const filePath = path.join(OUT_DIR, `table-${i}.png`);
    await generateQR(url, filePath, `table-${i}.png`);
  }

  // QR admin (dashboard gérant)
  const adminUrl  = `${BASE_URL}/admin/${barId}`;
  const adminPath = path.join(OUT_DIR, 'table-admin.png');
  await generateQR(adminUrl, adminPath, 'table-admin.png');

  console.log(`\n✅ ${nbTables + 1} QR codes générés dans :\n   ${OUT_DIR}\n`);
})().catch((err) => {
  console.error('Erreur :', err.message);
  process.exit(1);
});
