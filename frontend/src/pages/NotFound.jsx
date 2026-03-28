export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
         style={{ background: '#0D0D0D' }}>
      <div className="text-7xl mb-6 animate-float">🍺</div>
      <h1 className="text-white text-2xl font-black mb-2 neon-text">Scannez le QR code</h1>
      <p className="text-white/40 text-base max-w-xs leading-relaxed">
        Pour rejoindre une table, scannez le QR code affiché sur votre table.
      </p>
      <p className="text-white/15 text-xs mt-6 font-mono">
        /table/[barId]/[tableId]
      </p>
    </div>
  );
}
