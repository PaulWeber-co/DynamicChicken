/**
 * Stellungen zeichnen.
 *
 * Sechzig Stellungen als sechzig gemalte Bilder wären sechzig Dateien, die
 * niemand pflegen kann — und im Dunkelmodus alle falsch. Also wird gerechnet
 * statt gemalt: Ein Körper besteht aus Hüfte, Rumpf, Kopf, zwei Armen und
 * zwei Beinen, jedes Glied aus zwei Segmenten mit je einem Winkel. Eine
 * Stellung ist damit nur eine Handvoll Zahlen, und alle sehen aus wie aus
 * derselben Hand.
 *
 * Winkel in Grad, wie im Mathebuch: 0° zeigt nach rechts, 90° nach oben,
 * 180° nach links, 270° nach unten. Das Bildschirm-Y wächst nach unten,
 * deshalb steht in `punkt` ein Minus.
 *
 * Damit man die beiden auseinanderhält, bekommt jede Figur eine eigene Farbe
 * und einen Rand in Flächenfarbe. Der Rand ist der ganze Trick: Wo sich zwei
 * Körper überlagern, entsteht dadurch eine sichtbare Kante statt eines
 * Farbklumpens — und man erkennt, wer vorn liegt.
 */

/* Körpermaße in Zeichenfläche-Einheiten (Fläche ist 240 × 160) */
const RUMPF = 30, HALS = 11, KOPF = 8.2;
const OARM = 16, UARM = 15;
const OBEIN = 21, UBEIN = 20;

const rad = (g) => (g * Math.PI) / 180;
const punkt = (x, y, a, l) => [x + l * Math.cos(rad(a)), y - l * Math.sin(rad(a))];
const r1 = (v) => Math.round(v * 10) / 10;
const poly = (pts) => pts.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');

/**
 * Die Punkte einer Figur.
 *
 * Reihenfolge zählt: Was hinten liegt (das abgewandte Bein, der abgewandte
 * Arm), wird zuerst gezeichnet und vom Rumpf halb verdeckt. Sonst klebt bei
 * jeder Seitenansicht ein zweites Bein wie angeschraubt oben drauf.
 */
function teile(f) {
  const t = f.t ?? 90;
  const hueX = f.x, hueY = f.y;
  const [sx, sy] = punkt(hueX, hueY, t, RUMPF * (f.rumpf || 1));
  const [kx, ky] = punkt(sx, sy, t + (f.k || 0), HALS);
  const [a1, e1, a2, e2] = f.arm || [252, 254, 288, 286];
  const [h1, k1, h2, k2] = f.bein || [264, 268, 276, 272];

  const arm = (a, e) => {
    const p = punkt(sx, sy, a, OARM);
    return [[sx, sy], p, punkt(p[0], p[1], e, UARM)];
  };
  const bein = (h, k) => {
    const p = punkt(hueX, hueY, h, OBEIN);
    return [[hueX, hueY], p, punkt(p[0], p[1], k, UBEIN)];
  };

  return {
    hinten: [bein(h1, k1), arm(a1, e1)],
    rumpf: [[hueX, hueY], [sx, sy]],
    kopf: [kx, ky],
    vorn: [bein(h2, k2), arm(a2, e2)]
  };
}

function figur(f, farbe) {
  const T = teile(f);
  const glieder = (arr, w, col) => arr.map((p) =>
    `<polyline points="${poly(p)}" fill="none" stroke="${col}" stroke-width="${w}"
      stroke-linecap="round" stroke-linejoin="round"/>`).join('');

  // `d` weitet jeden Strich auf — einmal in Flächenfarbe als Rand, einmal in
  // der Figurfarbe darüber.
  const zug = (col, d) => `${glieder(T.hinten, 8 + d, col)}
    <polyline points="${poly(T.rumpf)}" fill="none" stroke="${col}"
      stroke-width="${13 + d}" stroke-linecap="round"/>
    <circle cx="${r1(T.kopf[0])}" cy="${r1(T.kopf[1])}" r="${r1(KOPF + d / 2)}" fill="${col}"/>
    ${glieder(T.vorn, 8 + d, col)}`;

  /**
   * Ein Auge — und plötzlich sind es zwei verschiedene Stellungen.
   *
   * Ohne Blickrichtung sehen „Reiten" und „Reiten mit dem Rücken zu mir"
   * exakt gleich aus: zwei Striche, ein Kreis obendrauf. Der helle Punkt am
   * Rand des Kopfes sagt, wohin jemand schaut, und macht damit den
   * Unterschied zwischen zugewandt und abgewandt sichtbar.
   */
  const [ax, ay] = punkt(T.kopf[0], T.kopf[1], f.bl ?? 0, KOPF * 0.46);
  // `bl: null` heißt: verbundene Augen. Dann steht statt des Punktes ein
  // Band quer über dem Kopf.
  const auge = f.bl === null
    ? `<rect x="${r1(T.kopf[0] - KOPF)}" y="${r1(T.kopf[1] - 2.4)}" width="${r1(KOPF * 2)}"
        height="4.8" rx="2.4" fill="var(--surface)"/>`
    : `<circle cx="${r1(ax)}" cy="${r1(ay)}" r="2.5" fill="var(--surface)"/>`;

  return `<g>${zug('var(--surface)', 5)}${zug(farbe, 0)}${auge}</g>`;
}

/**
 * Möbel.
 *
 * Ohne sie sehen „auf der Bettkante" und „auf dem Stuhl" identisch aus —
 * beides zwei Strichfiguren im Nichts. Die Kante, an der jemand sitzt, ist
 * oft das einzige, was eine Stellung von der nächsten unterscheidet.
 */
const MOEBEL = {
  bett: `<rect x="10" y="112" width="220" height="28" rx="10" fill="var(--surface-sunk)"/>
    <rect x="18" y="101" width="50" height="16" rx="7" fill="var(--surface-sunk)"/>`,
  boden: `<rect x="6" y="130" width="228" height="9" rx="4.5" fill="var(--surface-sunk)"/>`,
  /* Matratze links, Fußboden rechts — für alles, wo einer davor steht */
  kante: `<rect x="6" y="130" width="228" height="9" rx="4.5" fill="var(--surface-sunk)"/>
    <rect x="10" y="112" width="132" height="26" rx="10" fill="var(--surface-sunk)"/>
    <rect x="14" y="101" width="46" height="15" rx="7" fill="var(--surface-sunk)"/>`,
  /* Und andersherum: Matratze rechts, damit ein Kopf links überhängen kann */
  kanteR: `<rect x="6" y="130" width="228" height="9" rx="4.5" fill="var(--surface-sunk)"/>
    <rect x="112" y="112" width="120" height="26" rx="10" fill="var(--surface-sunk)"/>`,
  stuhl: `<rect x="6" y="130" width="228" height="9" rx="4.5" fill="var(--surface-sunk)"/>
    <rect x="54" y="62" width="13" height="56" rx="6" fill="var(--surface-sunk)"/>
    <rect x="54" y="106" width="76" height="13" rx="6" fill="var(--surface-sunk)"/>
    <rect x="60" y="117" width="9" height="16" rx="4" fill="var(--surface-sunk)"/>
    <rect x="116" y="117" width="9" height="16" rx="4" fill="var(--surface-sunk)"/>`,
  tisch: `<rect x="6" y="130" width="228" height="9" rx="4.5" fill="var(--surface-sunk)"/>
    <rect x="28" y="96" width="122" height="12" rx="5" fill="var(--surface-sunk)"/>
    <rect x="36" y="106" width="9" height="26" rx="4" fill="var(--surface-sunk)"/>
    <rect x="134" y="106" width="9" height="26" rx="4" fill="var(--surface-sunk)"/>`,
  wand: `<rect x="6" y="130" width="228" height="9" rx="4.5" fill="var(--surface-sunk)"/>
    <rect x="16" y="16" width="13" height="118" rx="6" fill="var(--surface-sunk)"/>`,
  /* Sitzfläche, Rückenlehne links, eine Armlehne rechts — sonst sieht das
     Sofa aus wie zwei Treppenstufen. */
  sofa: `<rect x="6" y="130" width="228" height="9" rx="4.5" fill="var(--surface-sunk)"/>
    <path d="M30 112h150a6 6 0 0 1 0 12H30a6 6 0 0 1 0-12z" fill="var(--surface-sunk)"/>
    <rect x="24" y="62" width="17" height="58" rx="8" fill="var(--surface-sunk)"/>
    <rect x="168" y="92" width="15" height="28" rx="7" fill="var(--surface-sunk)"/>`,
  treppe: `<rect x="10" y="124" width="220" height="15" rx="5" fill="var(--surface-sunk)"/>
    <rect x="10" y="106" width="150" height="19" rx="5" fill="var(--surface-sunk)"/>
    <rect x="10" y="88" width="82" height="19" rx="5" fill="var(--surface-sunk)"/>`,
  dusche: `<rect x="6" y="130" width="228" height="9" rx="4.5" fill="var(--surface-sunk)"/>
    <rect x="16" y="16" width="13" height="118" rx="6" fill="var(--surface-sunk)"/>
    <circle cx="46" cy="24" r="9" fill="var(--surface-sunk)"/>
    <path d="M40 36v8M48 36v12M56 36v7" stroke="var(--surface-sunk)" stroke-width="3.4" stroke-linecap="round"/>`
};

/**
 * Eine Stellung als fertiges SVG.
 *
 * `z` sagt, wer vorn liegt: Die zuletzt gezeichnete Figur überdeckt die
 * andere. Genau daran erkennt man oben und unten.
 */
export function bild(p, { cls = '' } = {}) {
  if (!p) return '';
  const A = figur(p.a, 'var(--love)');
  const B = figur(p.b, 'var(--calm)');
  return `<svg class="pose-svg ${cls}" viewBox="0 0 240 160" role="img"
    aria-label="${(p.n || 'Stellung').replace(/[<>&"]/g, '')}" focusable="false">
    ${MOEBEL[p.m] || ''}
    ${p.z === 'a' ? B + A : A + B}
  </svg>`;
}

/** Winziges Vorschaubild für Listen — dieselbe Zeichnung, nur kleiner. */
export const miniBild = (p) => bild(p, { cls: 'pose-mini' });
