/**
 * Knuddl — prozeduraler SVG-Chicken.
 *
 * Kein einziges Bild-Asset: Das Huhn wird aus einem `look`-Objekt gezeichnet.
 * Dadurch ist jede Kombination aus Farbe, Kamm, Augen, Hut und Accessoire
 * sofort verfügbar, skaliert verlustfrei und wiegt null Kilobyte Download.
 */

let uid = 0;

/* ── Farbpaletten ───────────────────────────────────────── */

export const BODY_COLORS = [
  { id: 'sonne',    label: 'Sonne',     base: '#FFC94D', lite: '#FFE5A0', dark: '#EDA820' },
  { id: 'butter',   label: 'Butter',    base: '#FFE29B', lite: '#FFF3D2', dark: '#F0C868' },
  { id: 'pfirsich', label: 'Pfirsich',  base: '#FFB693', lite: '#FFD6C1', dark: '#EE9270' },
  { id: 'rose',     label: 'Rosé',      base: '#FFB3CB', lite: '#FFD5E3', dark: '#EE8FAF' },
  { id: 'lavendel', label: 'Lavendel',  base: '#C7BAF7', lite: '#E1D9FC', dark: '#A392E8' },
  { id: 'minze',    label: 'Minze',     base: '#A9E3C3', lite: '#CDF1DE', dark: '#7FCBA3' },
  { id: 'himmel',   label: 'Himmel',    base: '#A9D6F5', lite: '#CDE8FB', dark: '#7FB9E4' },
  { id: 'schnee',   label: 'Schnee',    base: '#FDF3E6', lite: '#FFFCF7', dark: '#E7D6C2' },
  { id: 'kakao',    label: 'Kakao',     base: '#C99268', lite: '#E2B994', dark: '#A9724A' },
  { id: 'nacht',    label: 'Nacht',     base: '#7C7590', lite: '#A29BB4', dark: '#5E586F' }
];

export const BELLY_COLORS = [
  { id: 'creme',  label: 'Creme',  base: '#FFF6E4' },
  { id: 'wolke',  label: 'Wolke',  base: '#FFFFFF' },
  { id: 'sand',   label: 'Sand',   base: '#FBE7C6' },
  { id: 'rosa',   label: 'Rosa',   base: '#FFE4EE' },
  { id: 'mint',   label: 'Mint',   base: '#E1F7EC' },
  { id: 'flieder',label: 'Flieder',base: '#EDE7FD' }
];

export const COMB_COLORS = [
  { id: 'kirsche', label: 'Kirsche', base: '#FF7E8E' },
  { id: 'koralle', label: 'Koralle', base: '#FF9E7A' },
  { id: 'beere',   label: 'Beere',   base: '#D98BC9' },
  { id: 'gold',    label: 'Gold',    base: '#FFCE5C' },
  { id: 'petrol',  label: 'Petrol',  base: '#7FC8D9' }
];

export const COMBS = [
  { id: 'classic', label: 'Klassisch', emoji: '🐔' },
  { id: 'heart',   label: 'Herzchen',  emoji: '💗' },
  { id: 'tuft',    label: 'Wuschel',   emoji: '🌾' },
  { id: 'punk',    label: 'Punk',      emoji: '⚡️' },
  { id: 'sprout',  label: 'Sprössling',emoji: '🌱' },
  { id: 'none',    label: 'Glatt',     emoji: '✨' }
];

export const EYE_STYLES = [
  { id: 'dot',     label: 'Knopf',    emoji: '👀' },
  { id: 'sparkle', label: 'Funkel',   emoji: '✨' },
  { id: 'anime',   label: 'Groß',     emoji: '🥺' },
  { id: 'sleepy',  label: 'Verträumt',emoji: '😌' },
  { id: 'happy',   label: 'Lach',     emoji: '😊' }
];

export const HATS = [
  { id: 'none',    label: 'Ohne',       emoji: '🚫', price: 0 },
  { id: 'beanie',  label: 'Mütze',      emoji: '🧢', price: 40 },
  { id: 'crown',   label: 'Krönchen',   emoji: '👑', price: 120 },
  { id: 'flower',  label: 'Blümchen',   emoji: '🌸', price: 60 },
  { id: 'party',   label: 'Partyhut',   emoji: '🎉', price: 55 },
  { id: 'bow',     label: 'Schleife',   emoji: '🎀', price: 45 },
  { id: 'halo',    label: 'Heiligensch.',emoji: '😇', price: 200 },
  { id: 'bucket',  label: 'Fischerhut', emoji: '🎣', price: 80 }
];

export const ACCESSORIES = [
  { id: 'none',       label: 'Ohne',        emoji: '🚫', price: 0 },
  { id: 'scarf',      label: 'Schal',       emoji: '🧣', price: 50 },
  { id: 'bowtie',     label: 'Fliege',      emoji: '🎩', price: 45 },
  { id: 'glasses',    label: 'Brille',      emoji: '🤓', price: 65 },
  { id: 'sunglasses', label: 'Sonnenbrille',emoji: '😎', price: 90 },
  { id: 'headphones', label: 'Kopfhörer',   emoji: '🎧', price: 110 },
  { id: 'necklace',   label: 'Herzkette',   emoji: '💝', price: 150 },
  { id: 'blush',      label: 'Extra Bäckchen', emoji: '☺️', price: 30 }
];

export function defaultLook(seed = 0) {
  return {
    body: BODY_COLORS[seed % BODY_COLORS.length].id,
    belly: 'creme',
    comb: 'classic',
    combColor: 'kirsche',
    eyes: 'dot',
    hat: 'none',
    acc: 'none',
    chub: 1
  };
}

const byId = (list, id, fallback = 0) => list.find((x) => x.id === id) || list[fallback];

export const bodyPalette = (look) => byId(BODY_COLORS, look?.body);
export const bellyPalette = (look) => byId(BELLY_COLORS, look?.belly);

/* ── Bauteile ───────────────────────────────────────────── */

function comb(style, color) {
  const c = color;
  switch (style) {
    case 'none':
      return '';
    case 'heart':
      return `<g class="ck-comb">
        <path d="M120 18c-9-13-28-8-28 7 0 12 16 20 28 30 12-10 28-18 28-30 0-15-19-20-28-7z" fill="${c}"/>
      </g>`;
    case 'tuft':
      return `<g class="ck-comb">
        <path d="M120 52C112 40 106 20 116 12c6-5 12 0 11 9 4-11 13-13 17-6 4 6-1 13-7 18 9-3 15 3 12 10-3 6-13 8-29 9z" fill="${c}"/>
        <path d="M120 52c-9-4-20-6-24-13-3-6 3-12 11-9-5-7-4-15 3-16 6-1 10 8 10 19z" fill="${c}" opacity=".78"/>
      </g>`;
    case 'punk':
      return `<g class="ck-comb">
        <path d="M92 50 100 16 108 50z" fill="${c}"/>
        <path d="M108 50 120 6 132 50z" fill="${c}"/>
        <path d="M132 50 140 16 148 50z" fill="${c}"/>
      </g>`;
    case 'sprout':
      return `<g class="ck-comb">
        <path d="M120 50v-26" stroke="#7FC98F" stroke-width="6" stroke-linecap="round" fill="none"/>
        <path d="M120 32c-14-2-20-12-14-18 7-6 16 4 14 18z" fill="#8FD9A0"/>
        <path d="M120 40c12-3 18-13 12-19-7-6-15 5-12 19z" fill="#A6E6B4"/>
      </g>`;
    default: // classic
      return `<g class="ck-comb">
        <path d="M96 52c-6-10-4-24 6-24 3 0 6 2 7 6 2-11 6-16 11-16s10 6 11 16c1-4 4-6 7-6 10 0 12 14 6 24z" fill="${c}"/>
      </g>`;
  }
}

function eyePair(style, mood, ink) {
  const L = 99, R = 141, Y = 96;

  const closed = (x) =>
    `<path d="M${x - 10} ${Y} q10 10 20 0" stroke="${ink}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
  const arch = (x) =>
    `<path d="M${x - 10} ${Y + 4} q10 -13 20 0" stroke="${ink}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
  const heart = (x) =>
    `<path d="M${x} ${Y + 9}c-8-6-12-10-12-15 0-4 3-6 6-6 2.5 0 4.5 1.5 6 4 1.5-2.5 3.5-4 6-4 3 0 6 2 6 6 0 5-4 9-12 15z" fill="#FF6E96"/>`;
  const spiral = (x) =>
    `<path d="M${x} ${Y - 7}a7 7 0 1 1-6 10.5a4.5 4.5 0 1 0 4-6.5" stroke="${ink}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;

  if (mood === 'sleepy' || mood === 'asleep') return closed(L) + closed(R);
  if (mood === 'love') return heart(L) + heart(R);
  if (mood === 'dizzy') return spiral(L) + spiral(R);
  if (mood === 'happy' || mood === 'proud') return arch(L) + arch(R);

  const eye = (x) => {
    switch (style) {
      case 'sparkle':
        return `<g class="ck-eye">
          <circle cx="${x}" cy="${Y}" r="8.5" fill="${ink}"/>
          <circle cx="${x + 3}" cy="${Y - 3.5}" r="3" fill="#fff"/>
          <circle cx="${x - 3}" cy="${Y + 3}" r="1.7" fill="#fff" opacity=".85"/>
        </g>`;
      case 'anime':
        return `<g class="ck-eye">
          <ellipse cx="${x}" cy="${Y}" rx="9.5" ry="11" fill="${ink}"/>
          <ellipse cx="${x + 3}" cy="${Y - 4}" rx="3.6" ry="4.2" fill="#fff"/>
          <circle cx="${x - 3.5}" cy="${Y + 4}" r="2.1" fill="#fff" opacity=".8"/>
        </g>`;
      case 'sleepy':
        return `<g class="ck-eye">
          <path d="M${x - 9} ${Y - 2}a9 9 0 0 0 18 0z" fill="${ink}"/>
          <path d="M${x - 9} ${Y - 2}h18" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
        </g>`;
      case 'happy':
        return arch(x);
      default:
        return `<g class="ck-eye">
          <circle cx="${x}" cy="${Y}" r="7.5" fill="${ink}"/>
          <circle cx="${x + 2.6}" cy="${Y - 2.8}" r="2.6" fill="#fff"/>
        </g>`;
    }
  };
  return eye(L) + eye(R);
}

function beak(mood) {
  const open = mood === 'hungry' || mood === 'excited' || mood === 'sing';
  if (open) {
    return `<g class="ck-beak">
      <path d="M107 106q13-4 26 0-4 7-13 7t-13-7z" fill="#FFB44D"/>
      <path d="M107 106q13 16 26 0-4 14-13 14t-13-14z" fill="#F08A3C"/>
    </g>`;
  }
  return `<g class="ck-beak">
    <path d="M106 105q14-5 28 0-5 15-14 15t-14-15z" fill="#FFB44D"/>
    <path d="M106 105q14 6 28 0-5 4-14 4t-14-4z" fill="#EE8F3A" opacity=".55"/>
  </g>`;
}

function hat(id) {
  switch (id) {
    case 'beanie':
      return `<g class="ck-hat">
        <path d="M78 52c0-26 19-42 42-42s42 16 42 42z" fill="#8FB8F0"/>
        <rect x="72" y="48" width="96" height="15" rx="7.5" fill="#B7D4F7"/>
        <circle cx="120" cy="8" r="10" fill="#FFF1D6"/>
      </g>`;
    case 'crown':
      return `<g class="ck-hat">
        <path d="M80 50 74 14l20 14 26-24 26 24 20-14-6 36z" fill="#FFD34E"/>
        <rect x="80" y="46" width="80" height="11" rx="5.5" fill="#FFC02E"/>
        <circle cx="120" cy="26" r="5" fill="#FF7E8E"/>
        <circle cx="93" cy="34" r="3.6" fill="#8ED3F2"/>
        <circle cx="147" cy="34" r="3.6" fill="#8ED3F2"/>
      </g>`;
    case 'flower':
      return `<g class="ck-hat">
        <g transform="translate(158 42)">
          ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-13" rx="8" ry="11.5" fill="#FFC0D8" transform="rotate(${a})"/>`).join('')}
          <circle r="7" fill="#FFDE7A"/>
        </g>
      </g>`;
    case 'party':
      return `<g class="ck-hat">
        <path d="M120 0 148 52H92z" fill="#FF9EC0"/>
        <path d="M120 0l-9 52h9z" fill="#FFC9DE" opacity=".85"/>
        <circle cx="120" cy="-2" r="8" fill="#9BE0C0"/>
        <circle cx="106" cy="34" r="3.4" fill="#FFF1D6"/>
        <circle cx="132" cy="42" r="3.4" fill="#FFF1D6"/>
      </g>`;
    case 'bow':
      return `<g class="ck-hat">
        <g transform="translate(150 40) rotate(-12)">
          <path d="M0 0-24-13v26z" fill="#FF9EC0"/>
          <path d="M0 0 24-13v26z" fill="#FF9EC0"/>
          <circle r="6.5" fill="#FFB9D2"/>
        </g>
      </g>`;
    case 'halo':
      return `<g class="ck-hat ck-halo">
        <ellipse cx="120" cy="14" rx="34" ry="10" fill="none" stroke="#FFE68C" stroke-width="7"/>
        <ellipse cx="120" cy="14" rx="34" ry="10" fill="none" stroke="#FFF6D0" stroke-width="2.5"/>
      </g>`;
    case 'bucket':
      return `<g class="ck-hat">
        <path d="M84 50c0-22 16-34 36-34s36 12 36 34z" fill="#A8DBC4"/>
        <path d="M62 50h116c0 9-26 14-58 14S62 59 62 50z" fill="#8FCCB2"/>
        <path d="M84 34h72" stroke="#FFF1D6" stroke-width="6" stroke-linecap="round"/>
      </g>`;
    default:
      return '';
  }
}

function accessory(id) {
  switch (id) {
    case 'scarf':
      return `<g class="ck-acc">
        <path d="M78 128q42 20 84 0 4 14-4 20-38 16-76 0-8-6-4-20z" fill="#FF9EB5"/>
        <path d="M150 146q14 6 12 30-2 16-16 12 6-20-4-36z" fill="#FFB4C6" class="ck-scarf-tail"/>
      </g>`;
    case 'bowtie':
      return `<g class="ck-acc" transform="translate(120 140)">
        <path d="M0 0-22-12v24z" fill="#F08497"/>
        <path d="M0 0 22-12v24z" fill="#F08497"/>
        <circle r="6" fill="#FFA8B8"/>
      </g>`;
    case 'glasses':
      return `<g class="ck-acc" fill="none" stroke="#6B5A4E" stroke-width="3.4">
        <circle cx="99" cy="96" r="15"/>
        <circle cx="141" cy="96" r="15"/>
        <path d="M114 94q6-4 12 0M84 92l-12-4M156 92l12-4" stroke-linecap="round"/>
      </g>`;
    case 'sunglasses':
      return `<g class="ck-acc">
        <path d="M78 86h84v8c0 12-9 20-20 20s-19-8-20-18h-4c-1 10-9 18-20 18s-20-8-20-20z" fill="#2F2A3A"/>
        <path d="M86 92h22l-4 10h-16z" fill="#fff" opacity=".22"/>
        <path d="M132 92h22l-4 10h-16z" fill="#fff" opacity=".22"/>
      </g>`;
    case 'headphones':
      return `<g class="ck-acc">
        <path d="M70 92a50 50 0 0 1 100 0" fill="none" stroke="#8D7FE8" stroke-width="8" stroke-linecap="round"/>
        <rect x="58" y="84" width="20" height="30" rx="10" fill="#A79BF0"/>
        <rect x="162" y="84" width="20" height="30" rx="10" fill="#A79BF0"/>
      </g>`;
    case 'necklace':
      return `<g class="ck-acc">
        <path d="M84 130q36 26 72 0" fill="none" stroke="#FFD86B" stroke-width="3.4"/>
        <path d="M120 156c-7-5-11-9-11-13.5 0-3.4 2.7-5.5 5.5-5.5 2.2 0 4 1.3 5.5 3.4 1.5-2.1 3.3-3.4 5.5-3.4 2.8 0 5.5 2.1 5.5 5.5 0 4.5-4 8.5-11 13.5z" fill="#FF7E9E"/>
      </g>`;
    case 'blush':
      return ''; // wird als kräftigere Bäckchen im Gesicht gezeichnet
    default:
      return '';
  }
}

function cheeks(strong) {
  const o = strong ? 0.72 : 0.42;
  const rx = strong ? 13 : 10.5;
  const ry = strong ? 8 : 6.5;
  return `<g class="ck-cheeks" opacity="${o}">
    <ellipse cx="84" cy="114" rx="${rx}" ry="${ry}" fill="#FF8FA8"/>
    <ellipse cx="156" cy="114" rx="${rx}" ry="${ry}" fill="#FF8FA8"/>
  </g>`;
}

function moodFx(mood) {
  switch (mood) {
    case 'asleep':
    case 'sleepy':
      return `<g class="ck-zzz">
        <text x="176" y="70" font-size="20" font-weight="800" fill="#A79BF0" opacity=".9">z</text>
        <text x="192" y="50" font-size="15" font-weight="800" fill="#A79BF0" opacity=".7">z</text>
        <text x="204" y="34" font-size="11" font-weight="800" fill="#A79BF0" opacity=".5">z</text>
      </g>`;
    case 'love':
      return `<g class="ck-hearts">
        <text x="184" y="86" font-size="20">💗</text>
        <text x="26" y="72" font-size="15" opacity=".8">💗</text>
      </g>`;
    case 'hungry':
      return `<g class="ck-hearts"><text x="184" y="86" font-size="19">🌽</text></g>`;
    case 'sad':
      return `<g class="ck-tear"><ellipse cx="150" cy="112" rx="4" ry="6" fill="#8FC9F0" opacity=".9"/></g>`;
    case 'dirty':
      return `<g opacity=".65">
        <circle cx="92" cy="176" r="5" fill="#B79877"/>
        <circle cx="146" cy="196" r="4" fill="#B79877"/>
        <circle cx="112" cy="212" r="3.4" fill="#B79877"/>
      </g>`;
    case 'excited':
      return `<g class="ck-hearts"><text x="182" y="80" font-size="18">✨</text><text x="26" y="94" font-size="14">✨</text></g>`;
    default:
      return '';
  }
}

/* ── Hauptrenderer ──────────────────────────────────────── */

/**
 * @param {object} look   Aussehen (siehe defaultLook)
 * @param {object} [opts] { mood, size, animate, shadow, className }
 * @returns {string} SVG-Markup
 */
export function renderChicken(look = defaultLook(), opts = {}) {
  const {
    mood = 'happy',
    size = 200,
    animate = true,
    shadow = true,
    className = ''
  } = opts;

  const id = `ck${++uid}`;
  const bp = bodyPalette(look);
  const belly = bellyPalette(look).base;
  const combCol = byId(COMB_COLORS, look.combColor).base;
  const ink = '#3A2C21';
  const chub = Math.max(0.9, Math.min(1.12, look.chub ?? 1));

  const anim = animate ? 'is-animated' : '';
  const moodClass = `mood-${mood}`;

  return `
<svg class="chicken ${anim} ${moodClass} ${className}" viewBox="0 0 240 268" width="${size}" height="${size * 268 / 240}"
     role="img" aria-label="Chicken" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bp.lite}"/>
      <stop offset=".55" stop-color="${bp.base}"/>
      <stop offset="1" stop-color="${bp.dark}"/>
    </linearGradient>
    <radialGradient id="${id}-belly" cx=".5" cy=".35" r=".8">
      <stop offset="0" stop-color="#fff" stop-opacity=".95"/>
      <stop offset="1" stop-color="${belly}"/>
    </radialGradient>
  </defs>

  ${shadow ? `<ellipse class="ck-shadow" cx="120" cy="252" rx="62" ry="11" fill="#8C6B4A" opacity=".16"/>` : ''}

  <g class="ck-root" transform="translate(120 268) scale(${chub} 1) translate(-120 -268)">
    <g class="ck-bob">

      <!-- Füße -->
      <g class="ck-feet" fill="#F5A64B">
        <path class="ck-foot-l" d="M98 232v14M88 254l10-8 10 8" stroke="#F5A64B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path class="ck-foot-r" d="M142 232v14M132 254l10-8 10 8" stroke="#F5A64B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>

      <!-- Kamm sitzt hinter dem Kopf -->
      ${comb(look.comb, combCol)}

      <!-- Körper + Kopf als eine Silhouette -->
      <path class="ck-body" d="M120 34c-32 0-56 24-56 58 0 14 4 26 12 35-24 11-38 37-38 63 0 30 36 50 82 50s82-20 82-50c0-26-14-52-38-63 8-9 12-21 12-35 0-34-24-58-56-58z"
            fill="url(#${id}-body)"/>

      <!-- Bauch -->
      <ellipse class="ck-belly" cx="120" cy="204" rx="46" ry="33" fill="url(#${id}-belly)"/>

      <!-- Flügel -->
      <g class="ck-wing ck-wing-l">
        <ellipse cx="52" cy="184" rx="17" ry="26" fill="${bp.dark}" transform="rotate(-16 52 184)"/>
        <ellipse cx="54" cy="180" rx="12" ry="19" fill="${bp.base}" transform="rotate(-16 54 180)" opacity=".75"/>
      </g>
      <g class="ck-wing ck-wing-r">
        <ellipse cx="188" cy="184" rx="17" ry="26" fill="${bp.dark}" transform="rotate(16 188 184)"/>
        <ellipse cx="186" cy="180" rx="12" ry="19" fill="${bp.base}" transform="rotate(16 186 180)" opacity=".75"/>
      </g>

      <!-- Gesicht -->
      <g class="ck-face">
        ${cheeks(look.acc === 'blush')}
        ${eyePair(look.eyes, mood, ink)}
        ${beak(mood)}
      </g>

      ${accessory(look.acc)}
      ${hat(look.hat)}
      ${moodFx(mood)}
    </g>
  </g>
</svg>`.trim();
}

/**
 * Winziger Kopf für Dynamic Island, Avatare und Listen.
 */
export function renderHead(look = defaultLook(), size = 28, mood = 'happy') {
  const id = `hd${++uid}`;
  const bp = bodyPalette(look);
  const combCol = byId(COMB_COLORS, look.combColor).base;
  const closed = mood === 'asleep' || mood === 'sleepy';

  return `
<svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bp.lite}"/>
      <stop offset="1" stop-color="${bp.base}"/>
    </linearGradient>
  </defs>
  <path d="M50 12c-6-9-20-6-20 5 0 4 3 8 7 11" fill="${combCol}"/>
  <path d="M50 14c6-9 20-6 20 5 0 4-3 8-7 11" fill="${combCol}"/>
  <circle cx="50" cy="56" r="35" fill="url(#${id}-g)"/>
  ${closed
    ? `<path d="M30 52q7 7 14 0M56 52q7 7 14 0" stroke="#3A2C21" stroke-width="4.5" stroke-linecap="round" fill="none"/>`
    : `<circle cx="38" cy="52" r="5.4" fill="#3A2C21"/><circle cx="62" cy="52" r="5.4" fill="#3A2C21"/>
       <circle cx="39.8" cy="50" r="1.9" fill="#fff"/><circle cx="63.8" cy="50" r="1.9" fill="#fff"/>`}
  <path d="M42 66q8-3 16 0-3 9-8 9t-8-9z" fill="#FFB44D"/>
</svg>`.trim();
}

/** Schwarz-weiße Silhouette für die dormant-Island. */
export function renderPeek(look = defaultLook()) {
  const bp = bodyPalette(look);
  return `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="50" cy="55" r="38" fill="${bp.base}"/>
  <circle cx="37" cy="50" r="6" fill="#241B14"/>
  <circle cx="63" cy="50" r="6" fill="#241B14"/>
  <circle cx="39" cy="47.6" r="2.1" fill="#fff"/>
  <circle cx="65" cy="47.6" r="2.1" fill="#fff"/>
  <path d="M41 66q9-3 18 0-4 10-9 10t-9-10z" fill="#FFB44D"/>
</svg>`.trim();
}
