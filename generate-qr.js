#!/usr/bin/env node
/**
 * Génère les QR codes KLINK pour un bar.
 *
 * Usage :
 *   node generate-qr.js <barId> <nbTables>
 *
 * Exemple :
 *   node generate-qr.js la-luck 30
 *
 * Sortie :
 *   qrcodes/<barId>/table-1.png … table-N.png + table-admin.png
 *   qrcodes/<barId>/planche-qrcodes-<barId>.pdf  (2 col × 5 lignes / page A4)
 */

const QRCode     = require('qrcode');
const PDFDocument = require('pdfkit');
const fs         = require('fs');
const path       = require('path');

/* ── Paramètres CLI ───────────────────────────────────────────────────────── */

const [,, barId, nbTablesArg] = process.argv;

if (!barId || !nbTablesArg) {
  console.error('Usage : node generate-qr.js <barId> <nbTables>');
  console.error('Ex    : node generate-qr.js la-luck 30');
  process.exit(1);
}

const nbTables = parseInt(nbTablesArg, 10);
if (isNaN(nbTables) || nbTables < 1 || nbTables > 500) {
  console.error('Erreur : nbTables doit être un entier entre 1 et 500.');
  process.exit(1);
}

/* ── Config ───────────────────────────────────────────────────────────────── */

const BASE_URL = 'https://klink-app.vercel.app';
const OUT_DIR  = path.join(__dirname, 'qrcodes', barId);

const QR_OPTIONS = {
  type:                 'png',
  width:                500,
  margin:               2,
  errorCorrectionLevel: 'H',
  color: { dark: '#0A1628', light: '#FFFFFF' },
};

/* ── Mise en page PDF (A4 en points — 1 pt = 1/72 inch) ─────────────────── */

const PAGE_W   = 595.28;   // A4 largeur
const PAGE_H   = 841.89;   // A4 hauteur
const MARGIN   = 28;       // marges page
const COLS     = 2;
const ROWS     = 5;
const PER_PAGE = COLS * ROWS;  // 10 QR par page

const CELL_W   = (PAGE_W - 2 * MARGIN) / COLS;   // ≈ 269 pt
const CELL_H   = (PAGE_H - 2 * MARGIN) / ROWS;   // ≈ 157 pt

const LABEL_H  = 30;       // hauteur réservée au texte "Table N"
const CELL_PAD = 10;       // padding interne (espace blanc autour du QR)
const QR_SIZE  = Math.floor(
  Math.min(CELL_W - 2 * CELL_PAD, CELL_H - LABEL_H - 2 * CELL_PAD)
);                          // taille du carré QR dans la cellule (≈ 117 pt ≈ 4.1 cm)

/* ── Helpers ─────────────────────────────────────────────────────────────── */

async function generateQR(url, filePath, label) {
  await QRCode.toFile(filePath, url, QR_OPTIONS);
  console.log(`  ✓ ${label.padEnd(22)} → ${url}`);
}

async function generatePDF(outDir) {
  const pdfPath = path.join(outDir, `planche-qrcodes-${barId}.pdf`);
  const doc     = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
  const stream  = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  const totalPages = Math.ceil(nbTables / PER_PAGE);

  for (let page = 0; page < totalPages; page++) {
    doc.addPage();

    for (let slot = 0; slot < PER_PAGE; slot++) {
      const tableNum = page * PER_PAGE + slot + 1;
      if (tableNum > nbTables) break;

      const col   = slot % COLS;
      const row   = Math.floor(slot / COLS);

      // Coin haut-gauche de la cellule
      const cellX = MARGIN + col * CELL_W;
      const cellY = MARGIN + row * CELL_H;

      // Tirets de découpe autour de la cellule
      doc
        .save()
        .rect(cellX + 4, cellY + 4, CELL_W - 8, CELL_H - 8)
        .dash(5, { space: 4 })
        .lineWidth(0.5)
        .strokeColor('#BBBBBB')
        .stroke()
        .restore();

      // QR centré dans la cellule (au-dessus du label)
      const qrX = cellX + (CELL_W - QR_SIZE) / 2;
      const qrY = cellY + CELL_PAD + (CELL_H - LABEL_H - 2 * CELL_PAD - QR_SIZE) / 2;

      doc.image(path.join(outDir, `table-${tableNum}.png`), qrX, qrY, {
        width:  QR_SIZE,
        height: QR_SIZE,
      });

      // Label "Table N"
      doc
        .font('Helvetica-Bold')
        .fontSize(15)
        .fillColor('#0A1628')
        .text(
          `Table ${tableNum}`,
          cellX,
          qrY + QR_SIZE + 6,
          { width: CELL_W, align: 'center' }
        );
    }
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`\n  ✓ PDF généré (${totalPages} page${totalPages > 1 ? 's' : ''}) → ${pdfPath}`);
      resolve();
    });
    stream.on('error', reject);
  });
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\nKLINK — Génération QR codes`);
  console.log(`Bar     : ${barId}`);
  console.log(`Tables  : ${nbTables}`);
  console.log(`Dossier : ${OUT_DIR}\n`);

  // PNG individuels — tables 1 … N
  for (let i = 1; i <= nbTables; i++) {
    const url      = `${BASE_URL}/table/${barId}/${i}`;
    const filePath = path.join(OUT_DIR, `table-${i}.png`);
    await generateQR(url, filePath, `table-${i}.png`);
  }

  // PNG admin (dashboard gérant)
  const adminUrl  = `${BASE_URL}/admin/${barId}`;
  const adminPath = path.join(OUT_DIR, 'table-admin.png');
  await generateQR(adminUrl, adminPath, 'table-admin.png');

  // PDF planche A4
  await generatePDF(OUT_DIR);

  console.log(`\n✅ ${nbTables + 1} PNG + 1 PDF dans :\n   ${OUT_DIR}\n`);
})().catch((err) => {
  console.error('Erreur :', err.message);
  process.exit(1);
});
