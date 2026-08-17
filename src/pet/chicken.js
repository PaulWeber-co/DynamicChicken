/**
 * Knuddl — prozedurales Hühnchen, Fassung 2.
 *
 * Kein Bild-Asset, sondern eine kleine Anatomie: Schwanzfedern, zwei Flügel
 * mit Federkanten, Bauchflaum, Beine mit Zehen, Lider, Brauen, Kehllappen.
 * Alles in benannten Gruppen, damit CSS einzelne Körperteile bewegen kann —
 * der Kopf pickt, die Flügel schlagen, die Beine laufen.
 *
 * Aufbau (von hinten nach vorn):
 *   Schatten → Schwanz → Beine → Rumpf → Flügel → Kopf → Accessoire → Effekte
 *
 * Kopf und Rumpf sind getrennte Formen, teilen sich aber denselben
 * userSpaceOnUse-Verlauf. Dadurch ist die Naht unsichtbar, obwohl sich der
 * Kopf unabhängig bewegen kann.
 */

let uid = 0;

/* ── Paletten ───────────────────────────────────────────── */

export const BODY_COLORS = [
  { id: 'sonne',    label: 'Sonne',    lite: '#FFE9AE', base: '#FFC94D', dark: '#EBA525', deep: '#C9861A' },
  { id: 'butter',   label: 'Butter',   lite: '#FFF6DC', base: '#FFE29B', dark: '#EFC86B', deep: '#CFA648' },
  { id: 'pfirsich', label: 'Pfirsich', lite: '#FFDDCB', base: '#FFB693', dark: '#EC8F6C', deep: '#C86E4E' },
  { id: 'rose',     label: 'Rosé',     lite: '#FFDCE7', base: '#FFB3CB', dark: '#EC8CAC', deep: '#C96A8B' },
  { id: 'lavendel', label: 'Lavendel', lite: '#E6DEFD', base: '#C7BAF7', dark: '#A390E6', deep: '#8271C4' },
  { id: 'minze',    label: 'Minze',    lite: '#D4F3E3', base: '#A9E3C3', dark: '#7EC9A2', deep: '#5FA782' },
  { id: 'himmel',   label: 'Himmel',   lite: '#D3EBFC', base: '#A9D6F5', dark: '#7CB8E3', deep: '#5C97C2' },
  { id: 'schnee',   label: 'Schnee',   lite: '#FFFDFA', base: '#FBF1E4', dark: '#E5D5C1', deep: '#C3B29C' },
  { id: 'kakao',    label: 'Kakao',    lite: '#E5BE9B', base: '#C99268', dark: '#A9724A', deep: '#875734' },
  { id: 'nacht',    label: 'Nacht',    lite: '#A9A2BC', base: '#7C7590', dark: '#5D5670', deep: '#443F53' }
];

export const BELLY_COLORS = [
  { id: 'creme',   label: 'Creme',   base: '#FFF6E4', edge: '#F6E5CC' },
  { id: 'wolke',   label: 'Wolke',   base: '#FFFFFF', edge: '#EFE7DC' },
  { id: 'sand',    label: 'Sand',    base: '#FBE7C6', edge: '#EDD3AA' },
  { id: 'rosa',    label: 'Rosa',    base: '#FFE4EE', edge: '#F5CCDC' },
  { id: 'mint',    label: 'Mint',    base: '#E1F7EC', edge: '#C6EBD9' },
  { id: 'flieder', label: 'Flieder', base: '#EDE7FD', edge: '#D8CEF6' }
];

export const COMB_COLORS = [
  { id: 'kirsche', label: 'Kirsche', base: '#FF7E8E', dark: '#E05A72' },
  { id: 'koralle', label: 'Koralle', base: '#FF9E7A', dark: '#E07A5A' },
  { id: 'beere',   label: 'Beere',   base: '#D98BC9', dark: '#B96BAA' },
  { id: 'gold',    label: 'Gold',    base: '#FFCE5C', dark: '#E0AC38' },
  { id: 'petrol',  label: 'Petrol',  base: '#7FC8D9', dark: '#5DA6B8' }
];

export const COMBS = [
  { id: 'classic', label: 'Klassisch',  icon: 'tabPet' },
  { id: 'heart',   label: 'Herzchen',   icon: 'statJoy' },
  { id: 'tuft',    label: 'Wuschel',    icon: 'feather' },
  { id: 'punk',    label: 'Punk',       icon: 'statEnergy' },
  { id: 'sprout',  label: 'Sprössling', icon: 'salad' },
  { id: 'none',    label: 'Glatt',      icon: 'sparkle' }
];

export const EYE_STYLES = [
  { id: 'dot',     label: 'Knopf',     icon: 'moodHappy' },
  { id: 'sparkle', label: 'Funkel',    icon: 'moodExcited' },
  { id: 'anime',   label: 'Groß',      icon: 'moodMissing' },
  { id: 'sleepy',  label: 'Verträumt', icon: 'moodTired' },
  { id: 'happy',   label: 'Lach',      icon: 'moodProud' }
];

export const HATS = [
  { id: 'none',   label: 'Ohne',        icon: 'hatNone',   price: 0 },
  { id: 'beanie', label: 'Mütze',       icon: 'hatBeanie', price: 40 },
  { id: 'flower', label: 'Blümchen',    icon: 'hatFlower', price: 60 },
  { id: 'bow',    label: 'Schleife',    icon: 'hatBow',    price: 45 },
  { id: 'party',  label: 'Partyhut',    icon: 'hatParty',  price: 55 },
  { id: 'bucket', label: 'Fischerhut',  icon: 'hatBucket', price: 80 },
  { id: 'crown',  label: 'Krönchen',    icon: 'hatCrown',  price: 120 },
  { id: 'halo',   label: 'Heiligenschein', icon: 'hatHalo', price: 200 }
];

export const ACCESSORIES = [
  { id: 'none',       label: 'Ohne',         icon: 'accNone',       price: 0 },
  { id: 'blush',      label: 'Bäckchen',     icon: 'accBlush',      price: 30 },
  { id: 'bowtie',     label: 'Fliege',       icon: 'accBowtie',     price: 45 },
  { id: 'scarf',      label: 'Schal',        icon: 'accScarf',      price: 50 },
  { id: 'glasses',    label: 'Brille',       icon: 'accGlasses',    price: 65 },
  { id: 'sunglasses', label: 'Sonnenbrille', icon: 'accSun',        price: 90 },
  { id: 'headphones', label: 'Kopfhörer',    icon: 'accHeadphones', price: 110 },
  { id: 'necklace',   label: 'Herzkette',    icon: 'accNecklace',   price: 150 }
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

const byId = (list, id) => list.find((x) => x.id === id) || list[0];
export const bodyPalette = (look) => byId(BODY_COLORS, look?.body);
export const bellyPalette = (look) => byId(BELLY_COLORS, look?.belly);

const INK = '#3A2C21';
const FOOT = '#F5A64B';
const FOOT_D = '#DE8A2E';

/* ═══════════════════════════════════════════════════════════
   Körperteile
   ═══════════════════════════════════════════════════════════ */

function tail(p) {
  // Drei Federn, die hinter dem Rumpf nach rechts oben zeigen
  return `<g class="ck-tail">
    <path d="M232 214c26-10 44-30 52-52-6 30-20 52-42 64z" fill="${p.deep}"/>
    <path d="M236 232c28-4 50-20 62-40-10 30-28 50-52 58z" fill="${p.dark}"/>
    <path d="M238 250c28 2 52-8 68-24-16 26-38 42-64 44z" fill="${p.base}"/>
  </g>`;
}

function legs() {
  const leg = (x, cls) => `<g class="ck-leg ${cls}">
    <path d="M${x} 288v30" stroke="${FOOT_D}" stroke-width="9" stroke-linecap="round"/>
    <path d="M${x} 316l-16 12M${x} 316v14M${x} 316l16 12" stroke="${FOOT}" stroke-width="8"
      stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>`;
  return `<g class="ck-legs">${leg(134, 'ck-leg-l')}${leg(186, 'ck-leg-r')}</g>`;
}

/**
 * Der rechte Flügel ist der gespiegelte linke. Die Spiegelung sitzt in einer
 * äußeren Gruppe, weil eine CSS-Animation ein transform-Attribut am selben
 * Element sonst überschreiben würde — und dann klappte der Flügel weg.
 */
function wing(p, side) {
  const feather = `
    <path d="M101 192c-21 5-34 27-32 60 1 21 12 33 24 28 11-5 15-45 8-88z" fill="${p.dark}"/>
    <path d="M98 202c-14 6-22 24-21 48 1 15 9 24 17 20 7-4 10-36 4-68z" fill="${p.base}" opacity=".7"/>
    <g stroke="${p.deep}" stroke-width="2.6" fill="none" opacity=".4" stroke-linecap="round">
      <path d="M72 252q12 9 22 6"/>
      <path d="M71 264q13 9 23 5"/>
      <path d="M73 275q11 8 20 4"/>
    </g>`;
  const inner = `<g class="ck-wing ck-wing-${side}">${feather}</g>`;
  return side === 'r'
    ? `<g class="ck-wing-flip" transform="translate(320 0) scale(-1 1)">${inner}</g>`
    : inner;
}

function torso(id, p, belly) {
  return `<g class="ck-torso">
    <ellipse cx="160" cy="226" rx="97" ry="85" fill="url(#${id}-body)"/>

    <!-- Bauchflaum mit weicher Kante -->
    <ellipse cx="160" cy="252" rx="63" ry="49" fill="${belly.base}"/>
    <path d="M100 240q15-13 30 0 15 13 30 0 15-13 30 0 10 9 7 14-15-11-29 0-15 13-30 0-15-13-30 0-10 10-8-14z"
      fill="${belly.edge}" opacity=".42"/>

    <!-- angedeutete Federreihen an den Flanken -->
    <g stroke="${p.deep}" stroke-width="2.6" fill="none" opacity=".14" stroke-linecap="round">
      <path d="M80 232q13 11 26 0"/>
      <path d="M214 232q13 11 26 0"/>
      <path d="M84 258q12 10 24 0"/>
      <path d="M212 258q12 10 24 0"/>
    </g>

    <!-- Bodenkontakt-Schatten -->
    <ellipse cx="160" cy="296" rx="70" ry="16" fill="${p.deep}" opacity=".12"/>
  </g>`;
}

function head(id, p, look, combCol) {
  return `<g class="ck-head">
    ${comb(look.comb, combCol)}
    <circle cx="160" cy="118" r="67" fill="url(#${id}-body)"/>
    <!-- Lichtkante oben links -->
    <path d="M113 71a67 67 0 0 1 62-16" stroke="${p.lite}" stroke-width="7" fill="none"
      stroke-linecap="round" opacity=".55"/>
    <!-- Schatten unterm Kinn -->
    <path d="M100 152a67 67 0 0 0 120 0 67 67 0 0 1-120 0z" fill="${p.deep}" opacity=".14"/>
    ${cheeks(look.acc === 'blush')}
    ${eyes(look.eyes)}
    ${brows()}
    ${beak()}
    ${faceAcc(look.acc)}
    ${hat(look.hat)}
  </g>`;
}

function comb(style, c) {
  switch (style) {
    case 'none': return '';
    case 'heart':
      return `<g class="ck-comb">
        <path d="M160 26c-12-19-38-11-38 10 0 17 22 28 38 42 16-14 38-25 38-42 0-21-26-29-38-10z" fill="${c.base}"/>
        <path d="M160 78c16-14 38-25 38-42 0-9-5-15-11-18 3 4 4 9 4 14 0 15-17 28-31 40z" fill="${c.dark}"/>
      </g>`;
    case 'tuft':
      return `<g class="ck-comb">
        <path d="M160 70c-11-17-19-45-5-56 9-7 17 1 15 13 6-16 18-19 24-9 6 9-1 19-10 26 12-4 21 4 17 14-4 9-19 11-41 12z" fill="${c.base}"/>
        <path d="M160 70c-13-5-28-9-33-19-4-9 4-17 15-13-7-10-6-21 4-23 9-1 14 12 14 27z" fill="${c.dark}" opacity=".8"/>
      </g>`;
    case 'punk':
      return `<g class="ck-comb">
        <path d="M118 66 130 14l12 52z" fill="${c.dark}"/>
        <path d="M142 66 160 2l18 64z" fill="${c.base}"/>
        <path d="M178 66 190 14l12 52z" fill="${c.dark}"/>
      </g>`;
    case 'sprout':
      return `<g class="ck-comb">
        <path d="M160 68V28" stroke="#7FC98F" stroke-width="9" stroke-linecap="round" fill="none"/>
        <path d="M160 40c-20-3-29-18-20-27 10-9 23 6 20 27z" fill="#8FD9A0"/>
        <path d="M160 52c17-4 26-19 17-27-10-9-21 7-17 27z" fill="#A6E6B4"/>
      </g>`;
    default:
      return `<g class="ck-comb">
        <path d="M124 70c-9-15-6-36 9-36 5 0 9 3 11 9 3-17 9-24 16-24s13 7 16 24c2-6 6-9 11-9 15 0 18 21 9 36z" fill="${c.base}"/>
        <path d="M160 19c7 0 13 7 16 24 2-6 6-9 11-9 15 0 18 21 9 36h-14c7-13 6-30-5-32-4-1-8 2-10 8-3-15-8-24-14-27z" fill="${c.dark}" opacity=".75"/>
      </g>`;
  }
}

function cheeks(strong) {
  const o = strong ? 0.66 : 0.34;
  const rx = strong ? 23 : 19;
  return `<g class="ck-cheeks" opacity="${o}">
    <ellipse cx="112" cy="144" rx="${rx}" ry="${rx * 0.62}" fill="#FF8FA8"/>
    <ellipse cx="208" cy="144" rx="${rx}" ry="${rx * 0.62}" fill="#FF8FA8"/>
  </g>`;
}

/**
 * Beide Augenvarianten werden immer gezeichnet; CSS entscheidet, welche
 * sichtbar ist. Das erlaubt weiche Übergänge zwischen offen und zu.
 */
function eyes(style) {
  const one = (x) => {
    const open = (() => {
      switch (style) {
        case 'sparkle':
          return `<circle cx="${x}" cy="112" r="15" fill="${INK}"/>
                  <circle cx="${x + 5}" cy="106" r="5.4" fill="#fff"/>
                  <circle cx="${x - 5}" cy="117" r="3" fill="#fff" opacity=".85"/>
                  <path d="M${x + 11} 118l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#fff" opacity=".9"/>`;
        case 'anime':
          return `<ellipse cx="${x}" cy="112" rx="17" ry="19" fill="#2A2035"/>
                  <ellipse cx="${x}" cy="115" rx="13" ry="14" fill="${INK}"/>
                  <ellipse cx="${x + 5}" cy="105" rx="6.4" ry="7.4" fill="#fff"/>
                  <circle cx="${x - 6}" cy="119" r="3.6" fill="#fff" opacity=".8"/>`;
        case 'sleepy':
          return `<path d="M${x - 15} 110a15 15 0 0 0 30 0z" fill="${INK}"/>
                  <path d="M${x - 15} 110h30" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
                  <circle cx="${x + 4}" cy="116" r="3.4" fill="#fff" opacity=".7"/>`;
        case 'happy':
          return `<path d="M${x - 14} 117q14-19 28 0" stroke="${INK}" stroke-width="6.4" fill="none" stroke-linecap="round"/>`;
        default:
          return `<ellipse cx="${x}" cy="112" rx="13" ry="14" fill="${INK}"/>
                  <circle cx="${x + 4.4}" cy="106.6" r="4.6" fill="#fff"/>
                  <circle cx="${x - 4}" cy="117" r="2.4" fill="#fff" opacity=".75"/>`;
      }
    })();
    return `<g class="ck-eye ${x < 160 ? 'ck-eye-a' : 'ck-eye-b'}">
      <g class="ck-eye-open">${open}</g>
      <g class="ck-eye-shut">
        <path d="M${x - 14} 110q14 15 28 0" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/>
      </g>
      <g class="ck-eye-love">
        <path d="M${x} 126c-13-9-20-16-20-24 0-6 5-10 10-10 4 0 7 2 10 6 3-4 6-6 10-6 5 0 10 4 10 10 0 8-7 15-20 24z" fill="#FF6E96"/>
      </g>
      <g class="ck-eye-swirl">
        <path d="M${x} 100a12 12 0 1 1-10 18 7.5 7.5 0 1 0 7-11" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>
      <g class="ck-eye-x">
        <path d="M${x - 10} 102l20 20M${x + 10} 102l-20 20" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/>
      </g>
    </g>`;
  };
  return `<g class="ck-eyes">${one(132)}${one(188)}</g>`;
}

function brows() {
  return `<g class="ck-brows">
    <path class="ck-brow ck-brow-l" d="M118 86q14-7 28-1" stroke="${INK}" stroke-width="4.6" fill="none" stroke-linecap="round"/>
    <path class="ck-brow ck-brow-r" d="M174 85q14-6 28 1" stroke="${INK}" stroke-width="4.6" fill="none" stroke-linecap="round"/>
  </g>`;
}

function beak() {
  return `<g class="ck-beak">
    <path class="ck-beak-up" d="M136 142q24-9 48 0-8 14-24 14t-24-14z" fill="#FFB44D"/>
    <path class="ck-beak-up-shade" d="M136 142q24 6 48 0-8 5-24 5t-24-5z" fill="#EE9430" opacity=".45"/>
    <path class="ck-beak-low" d="M143 152q17 6 34 0-6 15-17 15t-17-15z" fill="#EE9430"/>
    <circle cx="152" cy="146" r="1.9" fill="#C77A22" opacity=".7"/>
    <circle cx="168" cy="146" r="1.9" fill="#C77A22" opacity=".7"/>
  </g>`;
}

function faceAcc(id) {
  switch (id) {
    case 'glasses':
      return `<g class="ck-face-acc" fill="none" stroke="#6B5A4E" stroke-width="5">
        <circle cx="132" cy="112" r="24"/>
        <circle cx="188" cy="112" r="24"/>
        <path d="M156 108q4-4 8 0M108 104l-16-6M212 104l16-6" stroke-linecap="round"/>
      </g>`;
    case 'sunglasses':
      return `<g class="ck-face-acc">
        <path d="M100 96h120v12c0 17-13 28-28 28s-27-11-28-25h-8c-1 14-13 25-28 25s-28-11-28-28z" fill="#38324A"/>
        <path d="M110 104h30l-6 14h-22z" fill="#fff" opacity=".22"/>
        <path d="M172 104h30l-6 14h-22z" fill="#fff" opacity=".22"/>
        <path d="M92 92l8 4M228 92l-8 4" stroke="#38324A" stroke-width="5" stroke-linecap="round"/>
      </g>`;
    case 'headphones':
      return `<g class="ck-face-acc">
        <path d="M94 112a66 66 0 0 1 132 0" fill="none" stroke="#8D7FE8" stroke-width="11" stroke-linecap="round"/>
        <rect x="80" y="100" width="26" height="42" rx="13" fill="#A79BF0"/>
        <rect x="214" y="100" width="26" height="42" rx="13" fill="#A79BF0"/>
        <rect x="86" y="108" width="14" height="26" rx="7" fill="#C7BEF7"/>
        <rect x="220" y="108" width="14" height="26" rx="7" fill="#C7BEF7"/>
      </g>`;
    default:
      return '';
  }
}

function neckAcc(id) {
  switch (id) {
    case 'scarf':
      return `<g class="ck-acc">
        <path d="M92 186q68 30 136 0 6 20-6 30-62 24-124 0-12-10-6-30z" fill="#FF9EB5"/>
        <path d="M92 186q68 30 136 0 2 7 1 13-68 27-138 0-1-6 1-13z" fill="#FFB4C6" opacity=".8"/>
        <path class="ck-scarf-tail" d="M206 212q22 10 20 46-3 24-26 18 10-30-6-54z" fill="#FFB4C6"/>
      </g>`;
    case 'bowtie':
      return `<g class="ck-acc" transform="translate(160 196)">
        <path d="M0 0-34-18v36z" fill="#F08497"/>
        <path d="M0 0 34-18v36z" fill="#F08497"/>
        <path d="M0 0-34-18v10L0 0z" fill="#D4667A" opacity=".6"/>
        <circle r="9.5" fill="#FFA8B8"/>
      </g>`;
    case 'necklace':
      return `<g class="ck-acc">
        <path d="M108 186q52 38 104 0" fill="none" stroke="#FFD86B" stroke-width="5"/>
        <path d="M160 232c-11-8-17-14-17-21 0-5 4-9 9-9 3 0 6 2 8 5 2-3 5-5 8-5 5 0 9 4 9 9 0 7-6 13-17 21z" fill="#FF7E9E"/>
      </g>`;
    default:
      return '';
  }
}

function hat(id) {
  switch (id) {
    case 'beanie':
      return `<g class="ck-hat">
        <path d="M100 68c0-34 27-56 60-56s60 22 60 56z" fill="#8FB8F0"/>
        <path d="M160 12c33 0 60 22 60 56h-22c0-30-16-50-38-56z" fill="#7AA3DC"/>
        <rect x="92" y="62" width="136" height="22" rx="11" fill="#B7D4F7"/>
        <circle cx="160" cy="8" r="15" fill="#FFF1D6"/>
      </g>`;
    case 'crown':
      return `<g class="ck-hat">
        <path d="M104 66 96 14l28 20 36-32 36 32 28-20-8 52z" fill="#FFD34E"/>
        <path d="M160 2l36 32 28-20-8 52h-22l6-38-24 14z" fill="#EDBB2E"/>
        <rect x="104" y="60" width="112" height="16" rx="8" fill="#FFC02E"/>
        <circle cx="160" cy="32" r="7.4" fill="#FF7E8E"/>
        <circle cx="122" cy="42" r="5.4" fill="#8ED3F2"/>
        <circle cx="198" cy="42" r="5.4" fill="#8ED3F2"/>
      </g>`;
    case 'flower':
      return `<g class="ck-hat"><g transform="translate(212 54)">
        ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-18" rx="11" ry="16" fill="#FFC0D8" transform="rotate(${a})"/>`).join('')}
        <circle r="9.6" fill="#FFDE7A"/>
      </g></g>`;
    case 'party':
      return `<g class="ck-hat">
        <path d="M160 -8 198 66h-76z" fill="#FF9EC0"/>
        <path d="M160 -8l-12 74h12z" fill="#FFC9DE" opacity=".85"/>
        <circle cx="160" cy="-10" r="11" fill="#9BE0C0"/>
        <circle cx="141" cy="40" r="4.6" fill="#FFF1D6"/>
        <circle cx="177" cy="52" r="4.6" fill="#FFF1D6"/>
      </g>`;
    case 'bow':
      return `<g class="ck-hat"><g transform="translate(204 50) rotate(-12)">
        <path d="M0 0-32-18v36z" fill="#FF9EC0"/>
        <path d="M0 0 32-18v36z" fill="#FF9EC0"/>
        <circle r="9" fill="#FFB9D2"/>
      </g></g>`;
    case 'halo':
      return `<g class="ck-hat ck-halo">
        <ellipse cx="160" cy="18" rx="46" ry="13" fill="none" stroke="#FFE68C" stroke-width="9"/>
        <ellipse cx="160" cy="18" rx="46" ry="13" fill="none" stroke="#FFF6D0" stroke-width="3.4"/>
      </g>`;
    case 'bucket':
      return `<g class="ck-hat">
        <path d="M110 68c0-30 22-46 50-46s50 16 50 46z" fill="#A8DBC4"/>
        <path d="M160 22c28 0 50 16 50 46h-20c0-25-12-40-30-46z" fill="#93CBB1"/>
        <path d="M80 68h160c0 12-36 19-80 19s-80-7-80-19z" fill="#8FCCB2"/>
        <path d="M112 46h96" stroke="#FFF1D6" stroke-width="9" stroke-linecap="round"/>
      </g>`;
    default:
      return '';
  }
}

/* ── Effekte über dem Huhn ──────────────────────────────── */

function fxFor(mood) {
  const zzz = `<g class="ck-fx-zzz">
    <path d="M232 96h26l-26 26h26" stroke="#A79BF0" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M266 62h18l-18 18h18" stroke="#A79BF0" stroke-width="4.6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>
    <path d="M290 34h13l-13 13h13" stroke="#A79BF0" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>
  </g>`;

  const heart = (x, y, s, o) =>
    `<path d="M${x} ${y}c-13-9-20-16-20-24 0-6 5-10 10-10 4 0 7 2 10 6 3-4 6-6 10-6 5 0 10 4 10 10 0 8-7 15-20 24z"
      fill="#FF7E9E" opacity="${o}" transform="translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})"/>`;

  const sparkle = (x, y, s) =>
    `<path d="M${x} ${y - 14}l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#FFE08A" transform="translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})"/>`;

  switch (mood) {
    case 'asleep':
    case 'sleepy':
      return zzz;
    case 'love':
      return `<g class="ck-fx-hearts">${heart(258, 96, 1, .95)}${heart(48, 76, .7, .8)}${heart(280, 150, .5, .6)}</g>`;
    case 'excited':
    case 'proud':
      return `<g class="ck-fx-sparks">${sparkle(256, 78, 1)}${sparkle(56, 96, .78)}${sparkle(272, 148, .6)}</g>`;
    case 'hungry':
      return `<g class="ck-fx-hearts">
        <ellipse cx="256" cy="96" rx="16" ry="22" fill="#FFC94D"/>
        <path d="M244 84c-8-4-14-2-16 3 5 6 11 8 16 6" fill="#7FC98F"/>
      </g>`;
    case 'sad':
      return `<g class="ck-fx-tear"><path d="M204 152c0 9 5 14 6 14s6-5 6-14c0-6-6-12-6-12s-6 6-6 12z" fill="#8FC9F0" opacity=".9"/></g>`;
    case 'dirty':
      return `<g class="ck-fx-dirt" opacity=".55">
        <circle cx="118" cy="212" r="8" fill="#B79877"/>
        <circle cx="196" cy="248" r="6.4" fill="#B79877"/>
        <circle cx="142" cy="272" r="5" fill="#B79877"/>
      </g>`;
    case 'dizzy':
      return `<g class="ck-fx-stars">
        <path d="M160 22l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#FFD34E"/>
        <path d="M112 34l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FFD34E" opacity=".7"/>
        <path d="M208 34l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FFD34E" opacity=".7"/>
      </g>`;
    default:
      return '';
  }
}

/* ── Zusätzliche Effektschicht für Aktionen ─────────────── */

function actionFx(action) {
  switch (action) {
    case 'wash':
      return `<g class="ck-fx-bubbles">
        <circle cx="88" cy="180" r="14" fill="#A9D6F5" opacity=".65"/>
        <circle cx="236" cy="150" r="10" fill="#A9D6F5" opacity=".55"/>
        <circle cx="212" cy="238" r="16" fill="#A9D6F5" opacity=".5"/>
        <circle cx="102" cy="250" r="9" fill="#A9D6F5" opacity=".6"/>
        <circle cx="84" cy="176" r="4" fill="#fff" opacity=".8"/>
        <circle cx="208" cy="232" r="5" fill="#fff" opacity=".7"/>
      </g>`;
    case 'eat':
      return `<g class="ck-fx-crumbs">
        <circle cx="140" cy="196" r="4.4" fill="#EDA825"/>
        <circle cx="176" cy="202" r="3.6" fill="#EDA825"/>
        <circle cx="158" cy="208" r="3" fill="#C9861A"/>
      </g>`;
    case 'sing':
      return `<g class="ck-fx-notes">
        <path d="M240 70v34a10 10 0 1 1-6-9V76l22-6v28a10 10 0 1 1-6-9V64z" fill="#C7BAF7"/>
        <path d="M66 108v22a7 7 0 1 1-4-6v-18z" fill="#A9D6F5" opacity=".85"/>
      </g>`;
    case 'celebrate':
      return `<g class="ck-fx-confetti">
        <rect x="72" y="60" width="10" height="14" rx="3" fill="#FF9EC0" transform="rotate(-20 77 67)"/>
        <rect x="238" y="52" width="10" height="14" rx="3" fill="#A9D6F5" transform="rotate(25 243 59)"/>
        <rect x="196" y="34" width="9" height="13" rx="3" fill="#A9E3C3" transform="rotate(-12 200 40)"/>
        <rect x="110" y="30" width="9" height="13" rx="3" fill="#FFD34E" transform="rotate(38 114 36)"/>
      </g>`;
    default:
      return '';
  }
}

/* ═══════════════════════════════════════════════════════════
   Hauptrenderer
   ═══════════════════════════════════════════════════════════ */

/**
 * @param {object} look  Aussehen (siehe defaultLook)
 * @param {object} [opts] { mood, action, size, animate, shadow, className }
 * @returns {string} SVG-Markup
 */
export function renderChicken(look = defaultLook(), opts = {}) {
  const {
    mood = 'happy',
    action = '',
    size = 220,
    animate = true,
    shadow = true,
    className = ''
  } = opts;

  const id = `ck${++uid}`;
  const p = bodyPalette(look);
  const belly = bellyPalette(look);
  const combCol = byId(COMB_COLORS, look.combColor);
  const chub = Math.max(0.88, Math.min(1.14, look.chub ?? 1));

  const classes = [
    'chicken',
    animate ? 'is-animated' : '',
    `mood-${mood}`,
    action ? `act-${action}` : '',
    className
  ].filter(Boolean).join(' ');

  return `
<svg class="${classes}" viewBox="0 0 320 360" width="${size}" height="${Math.round(size * 360 / 320)}"
     role="img" aria-label="Chicken" xmlns="http://www.w3.org/2000/svg" data-chicken>
  <defs>
    <linearGradient id="${id}-body" gradientUnits="userSpaceOnUse" x1="96" y1="52" x2="230" y2="310">
      <stop offset="0"   stop-color="${p.lite}"/>
      <stop offset=".42" stop-color="${p.base}"/>
      <stop offset="1"   stop-color="${p.dark}"/>
    </linearGradient>
  </defs>

  ${shadow ? `<ellipse class="ck-shadow" cx="160" cy="330" rx="84" ry="14" fill="#8C6B4A" opacity=".17"/>` : ''}

  <g class="ck-scale" transform="translate(160 330) scale(${chub} 1) translate(-160 -330)">
    <g class="ck-body">
      ${tail(p)}
      ${legs()}
      ${torso(id, p, belly)}
      ${wing(p, 'l')}
      ${wing(p, 'r')}
      ${neckAcc(look.acc)}
      ${head(id, p, look, combCol)}
    </g>
    <g class="ck-fx">
      ${fxFor(mood)}
      ${actionFx(action)}
    </g>
  </g>
</svg>`.trim();
}

/**
 * Kleiner Kopf für Avatare und Listen — dieselbe Anatomie, weniger Details.
 */
export function renderHead(look = defaultLook(), size = 32, mood = 'happy') {
  const id = `hd${++uid}`;
  const p = bodyPalette(look);
  const c = byId(COMB_COLORS, look.combColor);
  const shut = mood === 'asleep' || mood === 'sleepy';
  const love = mood === 'love';

  const eye = (x) => {
    if (shut) return `<path d="M${x - 7} 55q7 7 14 0" stroke="${INK}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
    if (love) return `<path d="M${x} 63c-6.5-4.5-10-8-10-12 0-3 2.5-5 5-5 2 0 3.5 1 5 3 1.5-2 3-3 5-3 2.5 0 5 2 5 5 0 4-3.5 7.5-10 12z" fill="#FF6E96"/>`;
    return `<ellipse cx="${x}" cy="55" rx="6.4" ry="7" fill="${INK}"/>
            <circle cx="${x + 2.2}" cy="52.4" r="2.3" fill="#fff"/>`;
  };

  return `
<svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}-g" gradientUnits="userSpaceOnUse" x1="20" y1="16" x2="80" y2="92">
      <stop offset="0" stop-color="${p.lite}"/><stop offset=".5" stop-color="${p.base}"/><stop offset="1" stop-color="${p.dark}"/>
    </linearGradient>
  </defs>
  <path d="M50 20c-5-8-17-5-17 4 0 4 2 7 6 9" fill="${c.base}"/>
  <path d="M50 20c5-8 17-5 17 4 0 4-2 7-6 9" fill="${c.dark}"/>
  <circle cx="50" cy="58" r="34" fill="url(#${id}-g)"/>
  <path d="M26 36a34 34 0 0 1 26-9" stroke="${p.lite}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>
  <ellipse cx="30" cy="68" rx="8" ry="5" fill="#FF8FA8" opacity=".35"/>
  <ellipse cx="70" cy="68" rx="8" ry="5" fill="#FF8FA8" opacity=".35"/>
  ${eye(36)}${eye(64)}
  <path d="M42 70q8-3 16 0-4 9-8 9t-8-9z" fill="#FFB44D"/>
  <path d="M45 76q5 3 10 0-2 6-5 6t-5-6z" fill="#EE9430"/>
</svg>`.trim();
}

/* ═══════════════════════════════════════════════════════════
   Aktionen abspielen
   ═══════════════════════════════════════════════════════════ */

/** Wie lange eine Aktion läuft, bevor das Huhn wieder normal atmet. */
export const ACTION_MS = {
  peck: 1500, eat: 2200, wash: 2600, hop: 1400, dance: 3200, flap: 1400,
  walk: 2600, shiver: 1400, celebrate: 2400, wave: 1800, think: 2400,
  sing: 2800, stretch: 1800, bump: 700, nod: 1200, shake: 1200
};

const timers = new WeakMap();

/**
 * Spielt eine Aktion auf einem bereits gerenderten Huhn ab.
 * @param {Element} host  Element, das das SVG enthält (oder das SVG selbst)
 * @param {string} action
 */
export function playAction(host, action, ms) {
  if (!host) return;
  const svg = host.matches?.('[data-chicken]') ? host : host.querySelector('[data-chicken]');
  if (!svg) return;

  clearTimeout(timers.get(svg));
  Array.from(svg.classList).forEach((c) => { if (c.startsWith('act-')) svg.classList.remove(c); });
  // Reflow erzwingen, damit dieselbe Aktion direkt hintereinander neu startet
  void svg.getBoundingClientRect();
  svg.classList.add(`act-${action}`);

  const dur = ms ?? ACTION_MS[action] ?? 1400;
  timers.set(svg, setTimeout(() => svg.classList.remove(`act-${action}`), dur));
}

/** Alle Aktionen, die playAction kennt — praktisch für Vorschauen. */
export const ACTIONS = Object.keys(ACTION_MS);
