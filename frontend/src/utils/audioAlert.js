/**
 * Singleton AudioContext.
 * Doit être initialisé pendant un geste utilisateur (clic)
 * pour contourner la restriction autoplay des navigateurs.
 * Appeler initAudio() lors du clic "Entrer dans le bar".
 */
let _ac = null;

export function initAudio() {
  try {
    if (!_ac) {
      _ac = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_ac.state === 'suspended') {
      _ac.resume();
    }
    // Joue un buffer silencieux pour débloquer l'audio sur iOS Safari
    const buf = _ac.createBuffer(1, 1, 22050);
    const src = _ac.createBufferSource();
    src.buffer = buf;
    src.connect(_ac.destination);
    src.start(0);
  } catch (_) {}
}

function getCtx() {
  if (!_ac) {
    // Tentative de création hors geste (fallback) — peut être bloquée par le navigateur
    try {
      _ac = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) { return null; }
  }
  if (_ac.state === 'suspended') {
    _ac.resume();
  }
  return _ac;
}

/**
 * KLINK — tintement de verre qui trinque (son original).
 * Deux "hits" décalés de 45 ms avec partiels inharmoniques
 * typiques d'un verre en cristal : f, f×2.76, f×5.4, f×8.9.
 */
export function playInvitationSound() {
  try {
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime;

    function glassHit(t, fundamental) {
      const partials = [1, 2.76, 5.4, 8.9];
      const volumes  = [0.30, 0.18, 0.10, 0.05];

      partials.forEach((mult, i) => {
        const osc  = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'sine';
        osc.frequency.value = fundamental * mult;

        // Attaque instantanée, décroissance progressive (queue de verre)
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(volumes[i], t + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9 - i * 0.12);

        osc.start(t);
        osc.stop(t + 1.0);
      });
    }

    // Premier verre (1320 Hz ≈ mi6)
    glassHit(now, 1320);
    // Deuxième verre 45 ms après (fréquence légèrement différente)
    glassHit(now + 0.045, 1560);
  } catch (_) {}
}

/** Accord montant doux — invitation acceptée */
export function playAcceptSound() {
  try {
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime;

    [[523, now], [659, now + 0.13], [784, now + 0.26]].forEach(([freq, t]) => {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch (_) {}
}

/** Descente rapide — invitation refusée */
export function playDeclineSound() {
  try {
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.3);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch (_) {}
}
