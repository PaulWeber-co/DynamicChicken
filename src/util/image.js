/**
 * Bilder klein bekommen, bevor sie irgendwohin reisen.
 *
 * Ein Handyfoto oder ein gespeichertes Meme hat gern 2–5 MB. Das passt
 * weder in den localStorage (der ist bei ~5 MB komplett am Ende) noch
 * vernünftig durch die Datenbank. Also wird jedes Bild vor dem Verschicken
 * einmal durch eine Leinwand geschickt: auf eine sinnvolle Kantenlänge
 * verkleinert und als JPEG neu gespeichert.
 *
 * Zielgröße ist bewusst konservativ. Ein Meme muss auf einem Handy lesbar
 * sein, mehr nicht — dafür reichen 720 Pixel locker.
 */

const MAX_EDGE = 720;
const TARGET_BYTES = 140 * 1024;   // ab hier wird die Qualität nachgezogen

/** Wie groß ist ein data:-URL ungefähr in Bytes? */
export const dataUrlBytes = (url) => Math.round((String(url).length - 22) * 0.75);

export const prettyBytes = (n) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} kB`;

/**
 * Datei einlesen, verkleinern, als JPEG-DataURL zurückgeben.
 *
 * Die Qualität wird in mehreren Schritten gesenkt, bis das Ergebnis unter
 * die Zielgröße rutscht. Lieber ein etwas weicheres Bild als eines, das
 * den Speicher sprengt.
 *
 * @param {File} file
 * @returns {Promise<{url:string, bytes:number, w:number, h:number}>}
 */
export async function shrink(file) {
  if (!file || !file.type?.startsWith('image/')) throw new Error('Das ist kein Bild.');

  const bitmap = await load(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  // Weißer Grund, sonst wird Transparenz im JPEG schwarz
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  let url = '';
  for (const q of [0.72, 0.6, 0.5, 0.42, 0.34]) {
    url = canvas.toDataURL('image/jpeg', q);
    if (dataUrlBytes(url) <= TARGET_BYTES) break;
  }
  return { url, bytes: dataUrlBytes(url), w, h };
}

/** createImageBitmap ist schneller, fehlt aber älteren Browsern. */
async function load(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file); } catch { /* Rückfall unten */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const el = new Image();
      el.onload = () => res(el);
      el.onerror = () => rej(new Error('Bild konnte nicht gelesen werden.'));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
