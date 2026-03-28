/**
 * Compresse une image (dataURL ou File) via Canvas API.
 * @param {string|File} source  dataURL base64 ou objet File
 * @param {number}      maxSize Résolution max (côté le plus long), défaut 200px
 * @param {number}      quality Qualité JPEG 0–1, défaut 0.7
 * @returns {Promise<string>}   dataURL JPEG compressé
 */
export function compressImage(source, maxSize = 200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const ratio  = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const width  = Math.round(img.width  * ratio);
      const height = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = reject;

    if (typeof source === 'string') {
      img.src = source;
    } else {
      // File / Blob
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}
