/**
 * Erzeugt die PWA-Icons als echte PNGs — ohne Bibliothek.
 *
 * Warum von Hand? Ein Icon-Generator wäre die einzige Abhängigkeit im ganzen
 * Projekt. Ein Huhn aus Kreisen lässt sich in fünfzig Zeilen selbst rastern,
 * und `zlib` für die PNG-Kompression bringt Node schon mit.
 *
 *   node tools/make-icons.mjs
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
mkdirSync(OUT, { recursive: true });

/* ── PNG-Encoder ────────────────────────────────────────── */

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // Filter: None
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // Bittiefe
  ihdr[9] = 6;   // Farbtyp RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ── Winziger Vektor-Rasterer ───────────────────────────── */

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

class Canvas {
  constructor(size) {
    this.n = size;
    this.buf = Buffer.alloc(size * size * 4);
    this.ss = 3; // 3×3 Supersampling für weiche Kanten
  }

  /** shape(x, y) → true, wenn der Punkt innerhalb liegt (Koordinaten 0..1) */
  paint(shape, color, alpha = 1) {
    const [r, g, b] = hex(color);
    const { n, ss } = this;
    for (let py = 0; py < n; py++) {
      for (let px = 0; px < n; px++) {
        let hits = 0;
        for (let sy = 0; sy < ss; sy++) {
          for (let sx = 0; sx < ss; sx++) {
            const x = (px + (sx + 0.5) / ss) / n;
            const y = (py + (sy + 0.5) / ss) / n;
            if (shape(x, y)) hits++;
          }
        }
        if (!hits) continue;
        const a = (hits / (ss * ss)) * alpha;
        const i = (py * n + px) * 4;
        const dst = this.buf[i + 3] / 255;
        const out = a + dst * (1 - a);
        this.buf[i] = Math.round((r * a + this.buf[i] * dst * (1 - a)) / (out || 1));
        this.buf[i + 1] = Math.round((g * a + this.buf[i + 1] * dst * (1 - a)) / (out || 1));
        this.buf[i + 2] = Math.round((b * a + this.buf[i + 2] * dst * (1 - a)) / (out || 1));
        this.buf[i + 3] = Math.round(out * 255);
      }
    }
  }
}

const circle = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const ellipse = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const rect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const roundRect = (x0, y0, x1, y1, r) => (x, y) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r + 1e-9;
};
const triangle = (ax, ay, bx, by, cx, cy) => (x, y) => {
  const s = (p, q, rr, ss) => (x - rr) * (q - ss) - (p - rr) * (y - ss);
  const d1 = s(ax, ay, bx, by), d2 = s(bx, by, cx, cy), d3 = s(cx, cy, ax, ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
};

/** Zeichnet Knuddl. `pad` = wie viel Luft ringsum (für maskable-Icons). */
function drawChicken(size, { bleed = false } = {}) {
  const c = new Canvas(size);

  // Hintergrund
  if (bleed) c.paint(() => true, '#FFE7A3');
  else c.paint(roundRect(0, 0, 1, 1, 0.235), '#FFE7A3');

  // sanfter Lichtschein oben
  c.paint(ellipse(0.5, 0.16, 0.62, 0.34), '#FFF3D2', 0.55);

  const k = bleed ? 0.80 : 0.92;                  // Maskable braucht mehr Rand
  const S = (v) => 0.5 + (v - 0.5) * k;
  const R = (v) => v * k;

  // Kamm
  c.paint(circle(S(0.418), S(0.198), R(0.058)), '#FF7E8E');
  c.paint(circle(S(0.5), S(0.163), R(0.070)), '#FF7E8E');
  c.paint(circle(S(0.582), S(0.198), R(0.058)), '#FF7E8E');

  // Körper (großer Tropfen aus zwei Kreisen)
  c.paint(circle(S(0.5), S(0.63), R(0.30)), '#F0B733');
  c.paint(circle(S(0.5), S(0.40), R(0.235)), '#F0B733');
  c.paint(circle(S(0.5), S(0.36), R(0.205)), '#FFCF5C');
  c.paint(circle(S(0.5), S(0.60), R(0.275)), '#FFC94D');

  // Bauch
  c.paint(ellipse(S(0.5), S(0.715), R(0.155), R(0.115)), '#FFF6E4');

  // Flügel
  c.paint(ellipse(S(0.235), S(0.615), R(0.062), R(0.115)), '#EDA820');
  c.paint(ellipse(S(0.765), S(0.615), R(0.062), R(0.115)), '#EDA820');

  // Bäckchen
  c.paint(ellipse(S(0.335), S(0.455), R(0.052), R(0.033)), '#FF9BB4', 0.55);
  c.paint(ellipse(S(0.665), S(0.455), R(0.052), R(0.033)), '#FF9BB4', 0.55);

  // Augen
  c.paint(circle(S(0.408), S(0.375), R(0.040)), '#3A2C21');
  c.paint(circle(S(0.592), S(0.375), R(0.040)), '#3A2C21');
  c.paint(circle(S(0.420), S(0.362), R(0.014)), '#FFFFFF');
  c.paint(circle(S(0.604), S(0.362), R(0.014)), '#FFFFFF');

  // Schnabel
  c.paint(triangle(S(0.452), S(0.428), S(0.548), S(0.428), S(0.5), S(0.505)), '#FFB44D');

  // Füße
  c.paint(roundRect(S(0.398), S(0.905), S(0.438), S(0.962), R(0.018)), '#F5A64B');
  c.paint(roundRect(S(0.562), S(0.905), S(0.602), S(0.962), R(0.018)), '#F5A64B');

  return c;
}

/* ── Ausgabe ────────────────────────────────────────────── */

const targets = [
  { file: 'icon-192.png', size: 192, bleed: false },
  { file: 'icon-512.png', size: 512, bleed: false },
  { file: 'apple-touch-icon.png', size: 180, bleed: true },
  { file: 'maskable-512.png', size: 512, bleed: true }
];

for (const t of targets) {
  const c = drawChicken(t.size, { bleed: t.bleed });
  writeFileSync(resolve(OUT, t.file), encodePng(t.size, t.size, c.buf));
  console.log(`✓ icons/${t.file} (${t.size}×${t.size})`);
}

/* Ein SVG-Favicon obendrauf — knackscharf in jedem Tab. */
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="23" fill="#FFE7A3"/>
  <circle cx="41.5" cy="23.5" r="6.2" fill="#FF7E8E"/>
  <circle cx="50" cy="20.5" r="7.2" fill="#FF7E8E"/>
  <circle cx="58.5" cy="23.5" r="6.2" fill="#FF7E8E"/>
  <circle cx="50" cy="63" r="30" fill="#FFC94D"/>
  <circle cx="50" cy="38" r="21" fill="#FFCF5C"/>
  <ellipse cx="50" cy="70" rx="18.5" ry="14.5" fill="#FFF6E4"/>
  <ellipse cx="23.5" cy="61.5" rx="6.2" ry="11.5" fill="#EDA820"/>
  <ellipse cx="76.5" cy="61.5" rx="6.2" ry="11.5" fill="#EDA820"/>
  <ellipse cx="33.5" cy="45.5" rx="5.2" ry="3.3" fill="#FF9BB4" opacity=".55"/>
  <ellipse cx="66.5" cy="45.5" rx="5.2" ry="3.3" fill="#FF9BB4" opacity=".55"/>
  <circle cx="40.8" cy="37.5" r="4" fill="#3A2C21"/>
  <circle cx="59.2" cy="37.5" r="4" fill="#3A2C21"/>
  <circle cx="42" cy="36.2" r="1.4" fill="#fff"/>
  <circle cx="60.4" cy="36.2" r="1.4" fill="#fff"/>
  <path d="M45.2 42.8h9.6L50 50.5z" fill="#FFB44D"/>
</svg>
`;
writeFileSync(resolve(OUT, 'favicon.svg'), favicon);
console.log('✓ icons/favicon.svg');
