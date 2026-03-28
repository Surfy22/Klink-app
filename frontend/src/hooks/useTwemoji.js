import { useEffect } from 'react';
import twemoji from 'twemoji';

const OPTS = {
  folder:    'svg',
  ext:       '.svg',
  base:      'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
  className: 'twemoji',
};

/**
 * Parse automatiquement les emojis du document après chaque render.
 * Remplace les emojis Unicode par des <img> SVG Twemoji uniformes.
 */
export function useTwemoji() {
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      twemoji.parse(document.body, OPTS);
    });
    return () => cancelAnimationFrame(frame);
  });
}
