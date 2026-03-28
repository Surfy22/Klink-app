import { useState, useRef, useEffect } from 'react';

/**
 * Overlay plein écran pour prendre une selfie.
 * onCapture(dataUrl) → image base64 JPEG 160×160.
 */
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [captured, setCaptured] = useState(null);
  const [error, setError]       = useState(null);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    startCamera();
    return stopCamera;
  }, []);

  async function startCamera() {
    setError(null);
    setReady(false);
    try {
      let stream;
      // Essaie d'abord avec facingMode 'user', fallback sans contrainte
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
      }
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;

      // Attendre que la vidéo soit prête avant d'afficher
      await new Promise((resolve, reject) => {
        video.oncanplay = resolve;
        video.onerror   = reject;
        // Timeout de sécurité
        setTimeout(resolve, 3000);
      });

      await video.play().catch(() => {});
      setReady(true);
    } catch {
      setError("Impossible d'accéder à la caméra.\nVérifie les autorisations dans ton navigateur.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  function capture() {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    const SIZE = 200;
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const vw = video.videoWidth, vh = video.videoHeight;
    const side = Math.min(vw, vh);

    ctx.translate(SIZE, 0); ctx.scale(-1, 1); // effet miroir
    ctx.drawImage(video, (vw - side) / 2, (vh - side) / 2, side, side, 0, 0, SIZE, SIZE);

    setCaptured(canvas.toDataURL('image/jpeg', 0.7));
    stopCamera();
  }

  function retake() { setCaptured(null); startCamera(); }

  function confirm() { onCapture(captured); onClose(); }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(16px)' }}
    >
      <div className="glass-card rounded-3xl overflow-hidden w-full max-w-sm shadow-2xl">

        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h3 className="text-white font-bold">Prendre une photo</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors text-xl"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">📷</div>
            <p className="text-white/50 text-sm leading-relaxed whitespace-pre-line">{error}</p>
            <button
              onClick={onClose}
              className="mt-5 px-5 py-2.5 rounded-xl text-white text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="relative bg-black aspect-square">
              {/* Indicateur de chargement pendant que la caméra démarre */}
              {!ready && !captured && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-3 animate-float">📷</div>
                    <p className="text-white/40 text-sm">Activation de la caméra…</p>
                  </div>
                </div>
              )}

              {!captured ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    transform: 'scaleX(-1)',
                    opacity: ready ? 1 : 0,
                    transition: 'opacity 0.3s',
                  }}
                />
              ) : (
                <img src={captured} alt="preview" className="w-full h-full object-cover" />
              )}

              {/* Cadre circulaire */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="w-40 h-40 rounded-full"
                  style={{ border: '2px solid rgba(0,255,135,0.4)' }}
                />
              </div>
            </div>

            <div className="p-4 flex gap-3">
              {!captured ? (
                <button
                  onClick={capture}
                  disabled={!ready}
                  className="flex-1 py-3.5 rounded-2xl font-black text-black btn-gradient disabled:opacity-40"
                >
                  📸 Capturer
                </button>
              ) : (
                <>
                  <button
                    onClick={retake}
                    className="flex-1 py-3.5 rounded-2xl text-white font-semibold"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}
                  >
                    Reprendre
                  </button>
                  <button
                    onClick={confirm}
                    className="flex-1 py-3.5 rounded-2xl font-black text-black btn-gradient"
                  >
                    Utiliser ✓
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
