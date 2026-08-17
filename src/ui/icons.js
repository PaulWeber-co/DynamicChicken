/**
 * Icons — alles selbst gezeichnet, kein einziges Emoji.
 *
 * Emojis sehen auf jedem Gerät anders aus, brechen die Pastell-Palette und
 * wirken geliehen. Hier ist stattdessen jede Kleinigkeit ein SVG: gleiche
 * Strichstärke, gleiche Rundungen, gleiche Farben wie der Rest der App.
 *
 * Zwei Familien:
 *   glyph  Strichzeichnungen in currentColor — Navigation und Bedienelemente
 *   art    kleine farbige Illustrationen — Futter, Stimmungen, Spiele
 *
 * Benutzung:  icon('corn', { size: 28 })
 */

/* ── Farben, die alle Illustrationen teilen ─────────────── */
const C = {
  yolk: '#FFC94D', yolkD: '#EDA820', yolkL: '#FFE5A0',
  cream: '#FFF6E4', shell: '#FBE7C6',
  rose: '#FF7E8E', roseL: '#FFB3C6', roseD: '#E05A72',
  beak: '#FFB44D', beakD: '#EE9430',
  leaf: '#7FC98F', leafD: '#5CA871', leafL: '#A9E3C3',
  sky: '#A9D6F5', skyD: '#7FB9E4',
  lav: '#C7BAF7', lavD: '#9A88E0',
  cocoa: '#3A2C21', wood: '#C99268', woodD: '#A9724A',
  white: '#FFFFFF', mud: '#8C6B4A'
};

const S = (d, extra = '') => `<path d="${d}" ${extra}/>`;

/* ── Wiederverwendbares Hühnergesicht für die Stimmungen ── */
function face(expr, extra = '') {
  const head = `
    <path d="M16 5.2c-1.1-2-4.3-1.4-4.3 1 0 .9.5 1.7 1.3 2.2" fill="${C.rose}"/>
    <path d="M16 5.2c1.1-2 4.3-1.4 4.3 1 0 .9-.5 1.7-1.3 2.2" fill="${C.rose}"/>
    <circle cx="16" cy="17" r="10.4" fill="${C.yolkL}"/>
    <path d="M16 6.6a10.4 10.4 0 0 1 0 20.8 10.4 10.4 0 0 0 0-20.8z" fill="${C.yolk}"/>`;
  const beak = `<path d="M13.4 19.6q2.6-1 5.2 0-1 3.1-2.6 3.1t-2.6-3.1z" fill="${C.beak}"/>`;
  const cheeks = `<ellipse cx="9.6" cy="19.4" rx="2.1" ry="1.3" fill="${C.rose}" opacity=".45"/>
                  <ellipse cx="22.4" cy="19.4" rx="2.1" ry="1.3" fill="${C.rose}" opacity=".45"/>`;
  return `<g>${head}${cheeks}${expr}${beak}${extra}</g>`;
}

const eyeDot = (x, y = 15.4, r = 1.7) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.cocoa}"/><circle cx="${x + 0.6}" cy="${y - 0.6}" r=".6" fill="#fff"/>`;
const eyeArc = (x, y = 15.6) =>
  `<path d="M${x - 2.2} ${y + .8}q2.2-2.6 4.4 0" stroke="${C.cocoa}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
const eyeClosed = (x, y = 15.6) =>
  `<path d="M${x - 2.2} ${y}q2.2 2.2 4.4 0" stroke="${C.cocoa}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;

/* ═══════════════════════════════════════════════════════════
   Registry
   ═══════════════════════════════════════════════════════════ */
const ICONS = {

  /* ── Navigation (gefüllt, farbig) ────────────────────── */
  tabPet: () => `
    <path d="M16 4.6c-1-1.9-4-1.3-4 .9 0 .8.4 1.6 1.2 2" fill="${C.rose}"/>
    <path d="M16 4.6c1-1.9 4-1.3 4 .9 0 .8-.4 1.6-1.2 2" fill="${C.rose}"/>
    <ellipse cx="16" cy="18.5" rx="10" ry="9.5" fill="${C.yolk}"/>
    <circle cx="16" cy="12.5" r="7.4" fill="${C.yolkL}"/>
    <ellipse cx="16" cy="21" rx="5.4" ry="4.4" fill="${C.cream}"/>
    ${eyeDot(13, 12)}${eyeDot(19, 12)}
    <path d="M14 15.4q2-.8 4 0-.8 2.4-2 2.4t-2-2.4z" fill="${C.beak}"/>`,

  tabUs: () => `
    <path d="M11.5 26.5C7 22.6 3 19.6 3 15.2 3 12 5.4 9.7 8.4 9.7c1.7 0 3.3 .8 4.3 2.1 1-1.3 2.6-2.1 4.3-2.1 3 0 5.4 2.3 5.4 5.5 0 4.4-4 7.4-8.5 11.3l-1.2 1z" fill="${C.rose}"/>
    <path d="M22 22.6c2.9-2.6 5.6-4.9 5.6-8.2 0-2.4-1.8-4.2-4-4.2-.9 0-1.8 .3-2.5 .8 1.3 1.2 2 2.9 2 4.9 0 2.6-1.3 4.6-3 6.3l1.9 .4z" fill="${C.roseL}"/>`,

  tabPlay: () => `
    <rect x="3" y="9" width="26" height="15" rx="7.5" fill="${C.lav}"/>
    <rect x="7.4" y="14.4" width="5.6" height="1.9" rx=".95" fill="#fff"/>
    <rect x="9.15" y="12.65" width="2.1" height="5.4" rx="1.05" fill="#fff"/>
    <circle cx="21" cy="14.4" r="1.7" fill="#fff"/>
    <circle cx="24.2" cy="17.6" r="1.7" fill="#fff"/>`,

  tabShop: () => `
    <path d="M6 12h20l-2 13.5a3 3 0 0 1-3 2.5H11a3 3 0 0 1-3-2.5L6 12z" fill="${C.wood}"/>
    <path d="M6 12h20l-.6 4H6.6L6 12z" fill="${C.woodD}"/>
    <path d="M11 12V9.5a5 5 0 0 1 10 0V12" stroke="${C.woodD}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="13" cy="20" r="1.6" fill="${C.yolk}"/>
    <circle cx="18.5" cy="22" r="1.6" fill="${C.leafL}"/>`,

  tabMore: () => `
    <path d="M13.6 3.4h4.8l.7 3.3a10 10 0 0 1 2.6 1.5l3.2-1.1 2.4 4.2-2.5 2.2a10 10 0 0 1 0 3l2.5 2.2-2.4 4.2-3.2-1.1a10 10 0 0 1-2.6 1.5l-.7 3.3h-4.8l-.7-3.3a10 10 0 0 1-2.6-1.5l-3.2 1.1-2.4-4.2 2.5-2.2a10 10 0 0 1 0-3L4.7 11.3l2.4-4.2 3.2 1.1a10 10 0 0 1 2.6-1.5z"
      fill="currentColor"/>
    <circle cx="16" cy="16" r="4.6" fill="var(--surface, #fff)"/>`,

  /* ── Pflege ──────────────────────────────────────────── */
  careFeed: () => `
    <path d="M8 15h16a1 1 0 0 1 1 1.2l-1.4 6.2a4 4 0 0 1-3.9 3.1h-7.4a4 4 0 0 1-3.9-3.1L7 16.2A1 1 0 0 1 8 15z" fill="${C.wood}"/>
    <path d="M7.6 15h16.8" stroke="${C.woodD}" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="13" cy="12.4" rx="2" ry="2.9" fill="${C.yolk}" transform="rotate(-16 13 12.4)"/>
    <ellipse cx="17.4" cy="11.4" rx="2" ry="2.9" fill="${C.yolkD}" transform="rotate(8 17.4 11.4)"/>
    <ellipse cx="20.8" cy="12.8" rx="1.7" ry="2.5" fill="${C.yolk}" transform="rotate(22 20.8 12.8)"/>`,

  careWash: () => `
    <circle cx="12" cy="18" r="6" fill="${C.sky}" opacity=".55"/>
    <circle cx="21" cy="13" r="4.4" fill="${C.sky}" opacity=".7"/>
    <circle cx="21.5" cy="22" r="3.2" fill="${C.sky}" opacity=".5"/>
    <circle cx="10.2" cy="15.6" r="1.5" fill="#fff" opacity=".9"/>
    <circle cx="20" cy="11.6" r="1.1" fill="#fff" opacity=".9"/>`,

  careSleep: () => `
    <path d="M22.6 19.6A9 9 0 0 1 11.4 8.4a9.6 9.6 0 1 0 11.2 11.2z" fill="${C.lav}"/>
    <path d="M20 5h5l-5 5.6h5" stroke="${C.lavD}" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,

  carePlay: () => `
    <circle cx="14" cy="13" r="8" fill="${C.rose}"/>
    <path d="M14 5c-3 3.4-3 12.6 0 16M6 13c3.4-3 12.6-3 16 0" stroke="${C.roseD}" stroke-width="1.4" fill="none" opacity=".6"/>
    <path d="M14 21c.6 3.4-2 4.6-1 7" stroke="${C.woodD}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <circle cx="11.4" cy="10.4" r="2" fill="#fff" opacity=".45"/>`,

  careCuddle: () => `
    <path d="M10.6 24C7 20.8 4 18.4 4 14.8 4 12.2 6 10.3 8.4 10.3c1.3 0 2.6 .6 3.4 1.7 .8-1.1 2.1-1.7 3.4-1.7 2.4 0 4.4 1.9 4.4 4.5 0 3.6-3 6-6.6 9.2l-1.2 1z" fill="${C.rose}"/>
    <path d="M21.6 21.4c2.6-2.3 5-4.4 5-7.3 0-2.1-1.6-3.7-3.5-3.7-.6 0-1.2 .1-1.7 .4 1 1 1.6 2.4 1.6 4 0 2.3-1.1 4-2.6 5.6l1.2 1z" fill="${C.roseL}"/>`,

  /* ── Statuswerte ─────────────────────────────────────── */
  statFull: () => ICONS.corn(),
  statEnergy: () => `<path d="M18 3 8 18h6l-2 11 12-16h-7l1-10z" fill="${C.yolk}" stroke="${C.yolkD}" stroke-width="1.2" stroke-linejoin="round"/>`,
  statClean: () => `<path d="M16 4c5 6.6 8 10.6 8 14.2A8 8 0 0 1 8 18.2C8 14.6 11 10.6 16 4z" fill="${C.sky}"/>
                    <path d="M12.4 18.6a3.6 3.6 0 0 0 2.6 3.4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".8"/>`,
  statJoy: () => `<path d="M16 27C9 21.6 4.4 18 4.4 12.9 4.4 9 7.4 6.2 11 6.2c2 0 3.9 1 5 2.5 1.1-1.5 3-2.5 5-2.5 3.6 0 6.6 2.8 6.6 6.7C27.6 18 23 21.6 16 27z" fill="${C.rose}"/>`,

  /* ── Futter ──────────────────────────────────────────── */
  corn: () => `
    <path d="M16 3.6c4 0 6.6 4.4 6.6 10.4S19.4 27.4 16 27.4 9.4 20 9.4 14 12 3.6 16 3.6z" fill="${C.yolk}"/>
    <path d="M16 3.6c4 0 6.6 4.4 6.6 10.4S19.4 27.4 16 27.4c1.6-3.4 2.4-8 2.4-11.9 0-4-.8-8.4-2.4-11.9z" fill="${C.yolkD}" opacity=".55"/>
    <g fill="${C.cream}" opacity=".55">
      <circle cx="14" cy="10" r=".9"/><circle cx="17.4" cy="11.6" r=".9"/><circle cx="13.4" cy="14.6" r=".9"/>
      <circle cx="17.8" cy="16.4" r=".9"/><circle cx="14.6" cy="19.4" r=".9"/><circle cx="17" cy="22" r=".9"/>
    </g>
    <path d="M9.6 12c-3.4-1.6-5.6-.6-6.2 1.4 2 2.6 4.6 3.4 6.6 2.6" fill="${C.leaf}"/>
    <path d="M22.4 9.6c3.4-1.8 5.8-.8 6.4 1.2-2 2.8-4.8 3.8-6.8 3" fill="${C.leafD}"/>`,

  worm: () => `
    <path d="M7 22c0-4 4-4 4-7.4S7 11.6 7 8.6C7 6 9.6 4.6 12.4 5.4" stroke="${C.roseL}" stroke-width="4.6"
      fill="none" stroke-linecap="round"/>
    <path d="M13 6c3.6-1 7 .6 8.6 3.6 2 3.8.4 8.2-3.2 10.4-3 1.8-5 3.4-5 5.6" stroke="${C.roseL}" stroke-width="4.6"
      fill="none" stroke-linecap="round"/>
    <circle cx="12.8" cy="25.4" r="2.4" fill="${C.roseL}"/>
    <circle cx="12" cy="24.8" r=".8" fill="${C.cocoa}"/>
    <circle cx="14.4" cy="25.2" r=".8" fill="${C.cocoa}"/>`,

  berries: () => `
    <circle cx="11.4" cy="19" r="6" fill="${C.lavD}"/>
    <circle cx="20.6" cy="20.4" r="5" fill="${C.lav}"/>
    <circle cx="17" cy="12.6" r="4.4" fill="${C.lavD}"/>
    <circle cx="9.4" cy="16.6" r="1.7" fill="#fff" opacity=".45"/>
    <path d="M17 8.2c0-2.4 1.6-4 4-4.2-.2 2.6-1.6 4-4 4.2z" fill="${C.leaf}"/>`,

  salad: () => `
    <path d="M4.6 16.4C4.6 11 9.6 6.6 16 6.6s11.4 4.4 11.4 9.8H4.6z" fill="${C.leafL}"/>
    <path d="M9 16.4c0-4 3-7 7-7" stroke="${C.leaf}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M18 16.4c.6-3 2.4-5 5-5.6" stroke="${C.leaf}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M3 17h26a1 1 0 0 1 1 1.2l-.6 2.6A6 6 0 0 1 23.5 25h-15A6 6 0 0 1 2.6 20.8L2 18.2A1 1 0 0 1 3 17z" fill="${C.white}"/>
    <path d="M2.4 17h27.2" stroke="${C.shell}" stroke-width="1.6" stroke-linecap="round"/>`,

  bread: () => `
    <path d="M6 13c0-4 4.4-6 10-6s10 2 10 6v9a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5v-9z" fill="${C.shell}"/>
    <path d="M6 13c0-4 4.4-6 10-6s10 2 10 6c0 2-4.4 3-10 3S6 15 6 13z" fill="${C.wood}"/>
    <path d="M11 11.4c1-1.4 3-2 5-2M18.6 9.8c1.4.2 2.6.8 3.4 1.6" stroke="${C.woodD}" stroke-width="1.3"
      fill="none" stroke-linecap="round" opacity=".55"/>`,

  smoothie: () => `
    <path d="M9 11h14l-1.6 14.4a3 3 0 0 1-3 2.6h-4.8a3 3 0 0 1-3-2.6L9 11z" fill="${C.roseL}" opacity=".85"/>
    <path d="M8.4 9.6h15.2a1.2 1.2 0 0 1 0 2.4H8.4a1.2 1.2 0 0 1 0-2.4z" fill="${C.rose}"/>
    <path d="M19.4 9 22 2.6" stroke="${C.leafD}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="14" cy="17" r="1.4" fill="#fff" opacity=".5"/>
    <circle cx="18" cy="21" r="1" fill="#fff" opacity=".4"/>`,

  coffee: () => `
    <path d="M6 11h16v9a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-9z" fill="${C.white}"/>
    <path d="M6.6 14h14.8v5.4a5 5 0 0 1-5 5h-4.8a5 5 0 0 1-5-5V14z" fill="${C.woodD}"/>
    <path d="M22 13h2.6a3.6 3.6 0 0 1 0 7.2H22" stroke="${C.white}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M11.4 7.6c-.8-1.4.4-2.2 0-3.6M16 7.6c-.8-1.4.4-2.2 0-3.6" stroke="${C.shell}" stroke-width="1.5"
      fill="none" stroke-linecap="round"/>`,

  soup: () => `
    <ellipse cx="16" cy="14.4" rx="11" ry="3.4" fill="${C.beak}"/>
    <path d="M5 14.4c0 5.6 4.9 10 11 10s11-4.4 11-10" fill="${C.white}"/>
    <ellipse cx="16" cy="14.2" rx="9" ry="2.6" fill="${C.beakD}" opacity=".5"/>
    <circle cx="13" cy="13.8" r="1.2" fill="${C.leafL}"/>
    <circle cx="18.6" cy="14.4" r="1.2" fill="${C.rose}" opacity=".7"/>
    <path d="M12.6 8.6c-.8-1.4.4-2.2 0-3.6M19.4 8.6c-.8-1.4.4-2.2 0-3.6" stroke="${C.shell}" stroke-width="1.5"
      fill="none" stroke-linecap="round"/>`,

  cake: () => `
    <path d="M6 17h20v6a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-6z" fill="${C.shell}"/>
    <path d="M6 14.6c0-2 4.5-3.6 10-3.6s10 1.6 10 3.6v3H6v-3z" fill="${C.roseL}"/>
    <path d="M6 14.8c1.6 1.6 3.4-1 5 .6s3.4-1 5 .6 3.4-1 5 .6 3.4-1 5 .6" stroke="${C.rose}" stroke-width="1.5"
      fill="none" stroke-linecap="round"/>
    <circle cx="16" cy="8.4" r="2.2" fill="${C.rose}"/>`,

  pizza: () => `
    <path d="M16 4 28 25.4a2 2 0 0 1-1.8 3H5.8a2 2 0 0 1-1.8-3L16 4z" fill="${C.beak}"/>
    <path d="M16 9.4 24.6 24.6H7.4L16 9.4z" fill="${C.yolkL}"/>
    <circle cx="16" cy="17" r="1.8" fill="${C.rose}"/>
    <circle cx="12" cy="21.4" r="1.6" fill="${C.rose}"/>
    <circle cx="20" cy="21.6" r="1.6" fill="${C.rose}"/>
    <path d="M4 25.4 16 4l12 21.4" stroke="${C.woodD}" stroke-width="1.6" fill="none" stroke-linejoin="round" opacity=".4"/>`,

  /* ── Stimmungen: kleine Hühnergesichter ──────────────── */
  moodHappy: () => face(eyeArc(12.6) + eyeArc(19.4)),
  moodLove: () => face(
    `<path d="M12.6 17.4c-1.9-1.4-2.9-2.4-2.9-3.6 0-.9.7-1.5 1.5-1.5.6 0 1.1.3 1.4 .9.3-.6.8-.9 1.4-.9.8 0 1.5.6 1.5 1.5 0 1.2-1 2.2-2.9 3.6z" fill="${C.roseD}"/>
     <path d="M19.4 17.4c-1.9-1.4-2.9-2.4-2.9-3.6 0-.9.7-1.5 1.5-1.5.6 0 1.1.3 1.4 .9.3-.6.8-.9 1.4-.9.8 0 1.5.6 1.5 1.5 0 1.2-1 2.2-2.9 3.6z" fill="${C.roseD}"/>`),
  moodCalm: () => face(eyeClosed(12.6) + eyeClosed(19.4),
    `<path d="M25 8.4c1.4 1.2 1.4 2.8 0 4s-1.4 2.8 0 4" stroke="${C.sky}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".85"/>`),
  moodTired: () => face(
    `<path d="M10.4 14.8a2.2 2.2 0 0 0 4.4 0z" fill="${C.cocoa}"/><path d="M10.4 14.8h4.4" stroke="${C.cocoa}" stroke-width="1.3" stroke-linecap="round"/>
     <path d="M17.2 14.8a2.2 2.2 0 0 0 4.4 0z" fill="${C.cocoa}"/><path d="M17.2 14.8h4.4" stroke="${C.cocoa}" stroke-width="1.3" stroke-linecap="round"/>`,
    `<path d="M24 4h4l-4 4.4h4" stroke="${C.lavD}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  moodStressed: () => face(
    `<path d="M12.6 13.4a1.9 1.9 0 1 1-1.6 2.9 1.2 1.2 0 1 0 1.1-1.8" stroke="${C.cocoa}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
     <path d="M19.4 13.4a1.9 1.9 0 1 1-1.6 2.9 1.2 1.2 0 1 0 1.1-1.8" stroke="${C.cocoa}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`,
    `<path d="M4 7c3-1.6 6.4-.4 8 1" stroke="${C.lavD}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
     <path d="M24 5.6c3 1.4 4 4 3.6 6" stroke="${C.lavD}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`),
  moodSad: () => face(
    eyeDot(12.6, 15) + eyeDot(19.4, 15) +
    `<path d="M10.8 12.2q1.8-1.2 3.6-.4M18 11.8q1.8-.8 3.4 .4" stroke="${C.cocoa}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
    `<ellipse cx="21.6" cy="19.6" rx="1.2" ry="1.9" fill="${C.sky}"/>`),
  moodMissing: () => face(eyeClosed(12.6, 15.2) + eyeClosed(19.4, 15.2),
    `<path d="M26 20.6c-1.9-1.4-2.9-2.4-2.9-3.6 0-.9.7-1.5 1.5-1.5.6 0 1.1.3 1.4 .9.3-.6.8-.9 1.4-.9.8 0 1.5.6 1.5 1.5 0 1.2-1 2.2-2.9 3.6z" fill="${C.rose}" opacity=".85"/>`),
  moodExcited: () => face(
    `<path d="M12.6 12.8 13.6 15.2 16 16.2 13.6 17.2 12.6 19.6 11.6 17.2 9.2 16.2 11.6 15.2z" fill="${C.cocoa}"/>
     <path d="M19.4 12.8 20.4 15.2 22.8 16.2 20.4 17.2 19.4 19.6 18.4 17.2 16 16.2 18.4 15.2z" fill="${C.cocoa}"/>`),
  moodProud: () => face(eyeClosed(12.6) + eyeClosed(19.4),
    `<path d="M9.6 11.6q2-1.4 4 -.4M18.4 11.2q2-1 3.8 .4" stroke="${C.cocoa}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`),
  moodHungry: () => face(
    eyeDot(12.6) + eyeDot(19.4),
    `<path d="M13.4 19.6q2.6-1 5.2 0-1 1.6-2.6 1.6t-2.6-1.6z" fill="${C.beakD}"/>
     <ellipse cx="16" cy="23.6" rx="2.6" ry="2" fill="${C.roseD}" opacity=".8"/>`),
  moodSick: () => face(
    `<path d="M10.6 14 14.6 17M14.6 14 10.6 17M17.4 14 21.4 17M21.4 14 17.4 17" stroke="${C.cocoa}" stroke-width="1.4" stroke-linecap="round"/>`,
    `<rect x="8" y="7.4" width="16" height="2.8" rx="1.4" fill="${C.sky}"/>`),
  moodSilly: () => face(
    `<path d="M10.4 14.6 14.8 16.4M10.4 16.4 14.8 14.6" stroke="${C.cocoa}" stroke-width="1.3" stroke-linecap="round"/>
     ${eyeDot(19.4, 15.4, 2)}`,
    `<path d="M14.4 22.4q1.6 3.4 3.4 0z" fill="${C.roseD}"/>`),

  /* ── Aktivitäten ─────────────────────────────────────── */
  actWork: () => `<rect x="5" y="7" width="22" height="15" rx="2.4" fill="${C.lav}"/>
    <rect x="7.4" y="9.4" width="17.2" height="10.2" rx="1.2" fill="${C.cream}"/>
    <path d="M2.6 22h26.8a3 3 0 0 1-3 3H5.6a3 3 0 0 1-3-3z" fill="${C.lavD}"/>`,
  actStudy: () => `<path d="M4 6.6h9a3 3 0 0 1 3 3V25a3 3 0 0 0-3-3H4V6.6z" fill="${C.sky}"/>
    <path d="M28 6.6h-9a3 3 0 0 0-3 3V25a3 3 0 0 1 3-3h9V6.6z" fill="${C.skyD}"/>
    <path d="M16 9.6V25" stroke="${C.cream}" stroke-width="1.5"/>`,
  actEat: () => `<circle cx="14" cy="16" r="9.4" fill="${C.white}"/><circle cx="14" cy="16" r="6" fill="${C.shell}"/>
    <path d="M25.6 6v20" stroke="${C.woodD}" stroke-width="2" stroke-linecap="round"/>
    <path d="M25.6 6c2 0 3 1.6 3 4s-1 4-3 4" fill="${C.wood}"/>`,
  actSport: () => `<rect x="3" y="12.6" width="4.4" height="7" rx="2" fill="${C.roseD}"/>
    <rect x="24.6" y="12.6" width="4.4" height="7" rx="2" fill="${C.roseD}"/>
    <rect x="7" y="14.4" width="18" height="3.4" rx="1.7" fill="${C.rose}"/>`,
  actTravel: () => `<rect x="6" y="5" width="20" height="18" rx="4" fill="${C.leaf}"/>
    <rect x="9" y="8.4" width="14" height="7" rx="1.6" fill="${C.cream}"/>
    <circle cx="11" cy="19.4" r="1.7" fill="${C.cream}"/><circle cx="21" cy="19.4" r="1.7" fill="${C.cream}"/>
    <path d="M9.6 23 6.6 28M22.4 23l3 5" stroke="${C.leafD}" stroke-width="2" stroke-linecap="round"/>`,
  actShow: () => `<rect x="3.4" y="9" width="25.2" height="16" rx="3" fill="${C.lavD}"/>
    <rect x="6" y="11.4" width="20" height="11.2" rx="1.6" fill="${C.sky}"/>
    <path d="M11 8.6 15.4 4M21 8.6 16.6 4" stroke="${C.lavD}" stroke-width="2" stroke-linecap="round"/>`,
  actOutside: () => `<circle cx="12.4" cy="12" r="6" fill="${C.yolk}"/>
    <path d="M12.4 2.6v2.4M12.4 19v2.4M22 12h-2.4M5.2 12H2.8M19 5.4l-1.7 1.7M7.5 16.9l-1.7 1.7M19 18.6l-1.7-1.7M7.5 7.1 5.8 5.4"
      stroke="${C.yolkD}" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M13 26a5.4 5.4 0 0 1 .6-10.8 7 7 0 0 1 13 1.6A4.6 4.6 0 0 1 25.4 26H13z" fill="${C.white}"/>`,
  actChill: () => `<path d="M4 15a3.4 3.4 0 0 1 6.8 0v3H4v-3z" fill="${C.roseL}"/>
    <path d="M21.2 15a3.4 3.4 0 0 1 6.8 0v3h-6.8v-3z" fill="${C.roseL}"/>
    <path d="M8 12.6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3V18H8v-5.4z" fill="${C.rose}"/>
    <rect x="4" y="17.6" width="24" height="6" rx="2.4" fill="${C.roseD}"/>
    <path d="M7.4 23.6V26M24.6 23.6V26" stroke="${C.woodD}" stroke-width="2" stroke-linecap="round"/>`,
  actSleep: () => ICONS.careSleep(),
  actFriends: () => `<path d="M5 11h9v8a4.5 4.5 0 0 1-9 0v-8z" fill="${C.beak}"/>
    <path d="M18 11h9v8a4.5 4.5 0 0 1-9 0v-8z" fill="${C.beak}"/>
    <path d="M5 11h9v3H5zM18 11h9v3h-9z" fill="${C.cream}" opacity=".8"/>
    <path d="M14 13.4 18 11" stroke="${C.beakD}" stroke-width="1.6" stroke-linecap="round"/>`,
  actCook: () => `<ellipse cx="14" cy="17" rx="10" ry="7.4" fill="${C.cocoa}" opacity=".75"/>
    <ellipse cx="14" cy="16" rx="8" ry="5.6" fill="${C.shell}"/>
    <circle cx="14" cy="16" r="2.6" fill="${C.yolk}"/>
    <path d="M23.6 15.4h5.4" stroke="${C.cocoa}" stroke-width="2.6" stroke-linecap="round" opacity=".75"/>`,
  actShower: () => `<path d="M9 5h14a3 3 0 0 1 3 3v2H6V8a3 3 0 0 1 3-3z" fill="${C.skyD}"/>
    <path d="M10 14v3M16 15v4M22 14v3M13 19v3M19 19v3" stroke="${C.sky}" stroke-width="2.4" stroke-linecap="round"/>`,

  /* ── Gesten ──────────────────────────────────────────── */
  nudgeHug: () => ICONS.careCuddle(),
  nudgeKiss: () => `
    <circle cx="14" cy="16" r="9" fill="${C.yolkL}"/>
    ${eyeClosed(11.4, 14.6)}${eyeClosed(17.4, 14.6)}
    <path d="M12.4 19.6q2.6 2.4 4.4 0-.6 2.6-2.2 2.6t-2.2-2.6z" fill="${C.roseD}"/>
    <path d="M25.4 11.6c-1.5-1.1-2.3-1.9-2.3-2.8 0-.7.6-1.2 1.2-1.2.4 0 .9.2 1.1.7.2-.5.7-.7 1.1-.7.6 0 1.2.5 1.2 1.2 0 .9-.8 1.7-2.3 2.8z" fill="${C.rose}"/>`,
  nudgeThink: () => `<path d="M9 5.6h14a5 5 0 0 1 5 5v5a5 5 0 0 1-5 5h-8l-5 4.4V20.6h-1a5 5 0 0 1-5-5v-5a5 5 0 0 1 5-5z" fill="${C.sky}"/>
    <circle cx="12" cy="13.2" r="1.6" fill="#fff"/><circle cx="16.4" cy="13.2" r="1.6" fill="#fff"/><circle cx="20.8" cy="13.2" r="1.6" fill="#fff"/>`,
  nudgeProud: () => `<circle cx="16" cy="19" r="7.6" fill="${C.yolk}"/><circle cx="16" cy="19" r="5.2" fill="${C.yolkD}"/>
    <path d="M16 15.4l1.1 2.4 2.6.3-2 1.8.6 2.6-2.3-1.3-2.3 1.3.6-2.6-2-1.8 2.6-.3z" fill="${C.cream}"/>
    <path d="M10.6 3h4l2 7h-6zM17.4 3h4l-1 7h-5z" fill="${C.rose}"/>`,
  nudgeCoffee: () => ICONS.coffee(),
  nudgeNight: () => `<path d="M22.6 19.6A9 9 0 0 1 11.4 8.4a9.6 9.6 0 1 0 11.2 11.2z" fill="${C.lav}"/>
    <path d="M25.4 5.4l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="${C.yolkL}"/>`,
  nudgeMorning: () => `<circle cx="16" cy="17" r="6.6" fill="${C.yolk}"/>
    <path d="M16 5.6v2.8M16 25.6v2.8M27.4 17h-2.8M7.4 17H4.6M24.1 8.9l-2 2M9.9 23.1l-2 2M24.1 25.1l-2-2M9.9 10.9l-2-2"
      stroke="${C.beak}" stroke-width="2.2" stroke-linecap="round"/>`,
  nudgeLuck: () => `<g fill="${C.leaf}">
      <path d="M16 15c-3.4-2.4-6.6-1-6.6 1.8 0 2.2 2.6 3.6 6.6 1.4z"/>
      <path d="M16 15c2.4-3.4 1-6.6-1.8-6.6-2.2 0-3.6 2.6-1.4 6.6z" transform="rotate(90 16 15)"/>
      <path d="M16 15c3.4 2.4 6.6 1 6.6-1.8 0-2.2-2.6-3.6-6.6-1.4z"/>
      <path d="M16 15c-2.4 3.4-1 6.6 1.8 6.6 2.2 0 3.6-2.6 1.4-6.6z" transform="rotate(90 16 15)"/>
    </g>
    <path d="M16 16.4c1.4 3.4 1.4 7 .4 10" stroke="${C.leafD}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`,

  /* ── Währung, Auszeichnungen, Kleinkram ──────────────── */
  grain: () => `<circle cx="16" cy="16" r="12" fill="${C.yolkD}"/>
    <circle cx="16" cy="16" r="9.8" fill="${C.yolk}"/>
    <circle cx="12.6" cy="12.2" r="3.2" fill="${C.yolkL}" opacity=".8"/>
    <path d="M16 22.6V11.4" stroke="${C.cream}" stroke-width="1.5" stroke-linecap="round"/>
    <g fill="${C.cream}">
      <path d="M16 11.6c1.9-.9 3.5-.1 3.4 1.8-1.8.7-3.2-.1-3.4-1.8z"/>
      <path d="M16 15.2c1.9-.9 3.5-.1 3.4 1.8-1.8.7-3.2-.1-3.4-1.8z"/>
      <path d="M16 11.6c-1.9-.9-3.5-.1-3.4 1.8 1.8.7 3.2-.1 3.4-1.8z"/>
      <path d="M16 15.2c-1.9-.9-3.5-.1-3.4 1.8 1.8.7 3.2-.1 3.4-1.8z"/>
      <path d="M16 9.6c1.2-1.3 1-2.8-.3-3.6-1 1.2-.9 2.6.3 3.6z"/>
    </g>`,
  flame: () => `<path d="M16 3c1 5-3 6.4-4.6 9.8-1.4 3-.6 5 .6 6.2-1.4-.4-2.4-1.6-2.8-3.2C7 18.4 6.4 21 7.6 23.6 9 26.6 12.2 28.4 16 28.4s7-1.8 8.4-4.8c2-4.2-.4-8-2.4-9.6.2 1.8-.4 3-1.4 3.6 1-3.6-1.2-8.4-4.6-14.6z" fill="${C.beak}"/>
    <path d="M16 28.4c-2.6 0-4.6-1.8-4.6-4.2 0-2.8 3-4 4.6-7.4 1.6 3.4 4.6 4.6 4.6 7.4 0 2.4-2 4.2-4.6 4.2z" fill="${C.yolkL}"/>`,
  trophy: () => `<path d="M10 5h12v7.4a6 6 0 0 1-12 0V5z" fill="${C.yolk}"/>
    <path d="M10 7H7a4 4 0 0 0 4 4M22 7h3a4 4 0 0 1-4 4" stroke="${C.yolkD}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M14.4 18.2h3.2V22h-3.2z" fill="${C.yolkD}"/>
    <rect x="9.4" y="22" width="13.2" height="3.6" rx="1.8" fill="${C.yolkD}"/>`,
  sparkle: () => `<path d="M16 4l2.2 7.8L26 14l-7.8 2.2L16 24l-2.2-7.8L6 14l7.8-2.2z" fill="${C.yolkL}"/>
    <path d="M24.6 20l1 3.2 3.2 1-3.2 1-1 3.2-1-3.2-3.2-1 3.2-1z" fill="${C.yolk}" opacity=".8"/>`,
  heart: () => ICONS.statJoy(),
  egg: () => `<path d="M16 3.4c5 0 9 6.6 9 12.6S21 27.4 16 27.4 7 22 7 16 11 3.4 16 3.4z" fill="${C.shell}"/>
    <path d="M16 3.4c5 0 9 6.6 9 12.6S21 27.4 16 27.4c2.4-3.6 3.4-8 3.4-11.9S18.4 7 16 3.4z" fill="${C.beakD}" opacity=".38"/>
    <ellipse cx="12.6" cy="12" rx="2.6" ry="3.6" fill="${C.cream}" opacity=".9" transform="rotate(-18 12.6 12)"/>`,
  feather: () => `<path d="M25.4 5.6C18 5 11 9.4 9 17c-.8 3-.6 5.4-.2 7l14.4-14.4-11 13.4c1.6.4 4 .6 6.8-.4 7.4-2.6 9.4-11 6.4-17z" fill="${C.sky}"/>
    <path d="M6.6 25.4 4 28" stroke="${C.skyD}" stroke-width="2" stroke-linecap="round"/>`,
  nest: () => `
    <ellipse cx="11.6" cy="14.6" rx="3.6" ry="4.6" fill="${C.shell}" transform="rotate(-14 11.6 14.6)"/>
    <ellipse cx="19.4" cy="13.8" rx="3.6" ry="4.6" fill="${C.cream}" transform="rotate(12 19.4 13.8)"/>
    <ellipse cx="15.6" cy="16.4" rx="3.6" ry="4.6" fill="${C.shell}"/>
    <path d="M3.6 17.4c0-1.5 1.7-2.3 3.1-1.6 3 1.4 15.6 1.4 18.6 0 1.4-.7 3.1.1 3.1 1.6 0 5.2-5.6 9.2-12.4 9.2S3.6 22.6 3.6 17.4z" fill="${C.wood}"/>
    <path d="M4.6 18.6c1.8 1.4 5 2.2 9 2.2M27.4 18.6c-1.8 1.4-5 2.2-9 2.2M8 22.6c3 1.6 13 1.6 16 0"
      stroke="${C.woodD}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  dove: () => `
    <path d="M3.4 17.4c3.6-6.4 9.8-10 16.8-10 2.4 0 4.6.5 6.6 1.4-1.4 1.5-2.9 2.3-4.4 2.6 1.6 1.1 2.4 2.6 2.4 4.4 0 4.8-4.8 8.8-11.4 8.8-3.8 0-7.4-1.3-10-3.2z" fill="${C.sky}"/>
    <path d="M3.4 17.4c3.6-6.4 9.8-10 16.8-10 1 0 2 .1 3 .3-6 1.4-11.2 5-14.6 10.7-1.8-.1-3.6-.4-5.2-1z" fill="${C.skyD}" opacity=".55"/>
    <path d="M8.6 19.4c3.8 1.7 8.8 1.5 12.6-1" stroke="${C.white}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <circle cx="21.8" cy="12.4" r="1.3" fill="${C.cocoa}"/>
    <path d="M26 13.4 29.6 15 26 16.6z" fill="${C.beak}"/>`,
  cloudSync: () => `<path d="M10 24a6.4 6.4 0 0 1-.6-12.8 8.4 8.4 0 0 1 15.8 2A5.4 5.4 0 0 1 23.4 24H10z" fill="${C.sky}"/>
    <path d="M13 18.6a3.4 3.4 0 0 1 5.6-1.6M19 19.4a3.4 3.4 0 0 1-5.6 1.6" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  mailHeart: () => `<rect x="3.4" y="7" width="25.2" height="18" rx="3.4" fill="${C.roseL}"/>
    <path d="M4.6 9.4 16 17.6 27.4 9.4" stroke="${C.white}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 24.4c-3.4-2.6-5.2-4.2-5.2-6.2 0-1.5 1.2-2.6 2.6-2.6 1 0 1.8.5 2.6 1.4.8-.9 1.6-1.4 2.6-1.4 1.4 0 2.6 1.1 2.6 2.6 0 2-1.8 3.6-5.2 6.2z" fill="${C.rose}"/>`,
  palette: () => `<path d="M16 4c7 0 12.4 4.8 12.4 10.6 0 3.6-3 5-5.6 5h-2.4c-1.6 0-2.6 1-2.6 2.4 0 1 .6 1.6.6 2.6 0 1.6-1.2 2.6-2.8 2.6C8.6 27.2 3.6 21.6 3.6 15 3.6 8.6 9 4 16 4z" fill="${C.cream}"/>
    <circle cx="10.4" cy="12" r="2" fill="${C.rose}"/><circle cx="16" cy="9.4" r="2" fill="${C.yolk}"/>
    <circle cx="21.6" cy="12" r="2" fill="${C.sky}"/><circle cx="9.6" cy="18.6" r="2" fill="${C.leaf}"/>`,

  /* ── Ei-Duell-Symbole ────────────────────────────────── */
  symKorn: () => ICONS.corn(),
  symEi: () => ICONS.egg(),
  symFeder: () => ICONS.feather(),
  symWurm: () => ICONS.worm(),
  symStein: () => `<path d="M6 20c-1.6-4 .6-9 5-11.4 4.6-2.6 10.6-1.6 13.6 2.2 3 3.8 1.6 9.4-2.6 12-4.4 2.8-14 1.6-16-2.8z" fill="#9E9689"/>
    <path d="M9.4 12.6c2-2.6 6-4 9.4-3.2-2.6.6-5 1.8-6.6 3.8-1.6 2-2 4.4-1.4 6.6-2-2-2.6-4.8-1.4-7.2z" fill="#B8B0A2"/>`,

  /* ── Spiele ──────────────────────────────────────────── */
  gameGrain: () => ICONS.corn(),
  gameEgg: () => ICONS.egg(),
  gameBeat: () => `<path d="M16 27C9 21.6 4.4 18 4.4 12.9 4.4 9 7.4 6.2 11 6.2c2 0 3.9 1 5 2.5 1.1-1.5 3-2.5 5-2.5 3.6 0 6.6 2.8 6.6 6.7C27.6 18 23 21.6 16 27z" fill="${C.rose}"/>
    <path d="M6.4 14.6h4l1.6-3.4 2.6 6.6 2.4-4.6 1.6 1.4h6.6" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  gameDuett: () => `<path d="M4 9.4h10.4v6.2a5.2 5.2 0 0 1-10.4 0V9.4z" fill="${C.lav}"/>
    <path d="M17.6 9.4H28v6.2a5.2 5.2 0 0 1-10.4 0V9.4z" fill="${C.rose}"/>
    <circle cx="7.4" cy="12.4" r="1.1" fill="#fff"/><circle cx="11" cy="12.4" r="1.1" fill="#fff"/>
    <circle cx="21" cy="12.4" r="1.1" fill="#fff"/><circle cx="24.6" cy="12.4" r="1.1" fill="#fff"/>
    <path d="M6.4 22.4c1.6 1.6 4.6 1.6 6 0M19.4 22.4c1.6 1.6 4.6 1.6 6 0" stroke="${C.woodD}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  gameMemo: () => `<rect x="4" y="8" width="12" height="17" rx="2.6" fill="${C.sky}" transform="rotate(-8 10 16.5)"/>
    <rect x="15" y="6.6" width="12" height="17" rx="2.6" fill="${C.yolkL}" transform="rotate(7 21 15)"/>
    <circle cx="21.4" cy="14.4" r="3" fill="${C.yolk}"/>`,
  gameFlight: () => `<path d="M4 22c4-1.6 6.6-4.6 8-8.4" stroke="${C.skyD}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>
    <ellipse cx="19" cy="15" rx="8" ry="7" fill="${C.yolk}"/>
    <circle cx="22.4" cy="12.4" r="1.5" fill="${C.cocoa}"/>
    <path d="M25.6 15.4q2.4-.8 4.4.6-2 1.6-4.4 1z" fill="${C.beak}"/>
    <path d="M13.6 13.4c-2.6-2.6-6.6-2-8.6.6 2.6 3 6.4 3.6 9 1.6z" fill="${C.yolkD}"/>`,
  gameTower: () => `<rect x="7" y="21.4" width="18" height="4.6" rx="2.3" fill="${C.wood}"/>
    <rect x="9.4" y="16" width="13.6" height="4.6" rx="2.3" fill="${C.woodD}"/>
    <rect x="11.4" y="10.6" width="10" height="4.6" rx="2.3" fill="${C.wood}"/>
    <ellipse cx="16.4" cy="7" rx="3.6" ry="2.8" fill="${C.cream}"/>`,
  gameDoodle: () => `<path d="M5 24.6l1-4.4L19.4 6.8a2.8 2.8 0 0 1 4 0l1.2 1.2a2.8 2.8 0 0 1 0 4L11.2 25.4l-4.4 1a1.4 1.4 0 0 1-1.8-1.8z" fill="${C.yolk}"/>
    <path d="M18.4 8.4l5.2 5.2" stroke="${C.yolkD}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M6 20.2l5.2 5.2" stroke="${C.woodD}" stroke-width="1.8" stroke-linecap="round"/>`,

  /* ── Hüte ────────────────────────────────────────────── */
  hatNone: () => `<circle cx="16" cy="16" r="10.4" fill="none" stroke="currentColor" stroke-width="2" opacity=".35"/>
    <path d="M9 23 23 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".35"/>`,
  hatBeanie: () => `<path d="M6.6 19c0-5.4 4.2-9.6 9.4-9.6s9.4 4.2 9.4 9.6z" fill="${C.sky}"/>
    <rect x="4.6" y="18.4" width="22.8" height="4.6" rx="2.3" fill="${C.skyD}"/>
    <circle cx="16" cy="7" r="2.8" fill="${C.cream}"/>`,
  hatCrown: () => `<path d="M6.6 21 4.6 8.6l5.2 3.6L16 5.4l6.2 6.8 5.2-3.6L25.4 21z" fill="${C.yolk}"/>
    <rect x="6.6" y="20" width="18.8" height="3.6" rx="1.8" fill="${C.yolkD}"/>
    <circle cx="16" cy="11.4" r="1.7" fill="${C.rose}"/>`,
  hatFlower: () => `<g transform="translate(16 16)">
      ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-6.4" rx="3.8" ry="5.4" fill="${C.roseL}" transform="rotate(${a})"/>`).join('')}
      <circle r="3.4" fill="${C.yolk}"/></g>`,
  hatParty: () => `<path d="M16 3.6 24.6 24H7.4z" fill="${C.rose}"/>
    <path d="M16 3.6 13.4 24H16z" fill="${C.roseL}" opacity=".8"/>
    <circle cx="16" cy="4.6" r="2.6" fill="${C.leafL}"/>
    <circle cx="12.6" cy="16" r="1.3" fill="${C.cream}"/><circle cx="19" cy="20" r="1.3" fill="${C.cream}"/>`,
  hatBow: () => `<g transform="translate(16 16)"><path d="M0 0-9.4-5.2v10.4z" fill="${C.rose}"/>
    <path d="M0 0 9.4-5.2v10.4z" fill="${C.rose}"/><circle r="2.8" fill="${C.roseL}"/></g>`,
  hatHalo: () => `<ellipse cx="16" cy="16" rx="11" ry="4.4" fill="none" stroke="${C.yolkL}" stroke-width="3.4"/>
    <ellipse cx="16" cy="16" rx="11" ry="4.4" fill="none" stroke="${C.cream}" stroke-width="1.2"/>`,
  hatBucket: () => `<path d="M9 18c0-4.6 3-7.4 7-7.4s7 2.8 7 7.4z" fill="${C.leafL}"/>
    <path d="M4.6 18h22.8c0 2.6-5.2 4.4-11.4 4.4S4.6 20.6 4.6 18z" fill="${C.leaf}"/>
    <path d="M9.4 14.6h13" stroke="${C.cream}" stroke-width="2.2" stroke-linecap="round"/>`,

  /* ── Accessoires ─────────────────────────────────────── */
  accNone: () => ICONS.hatNone(),
  accScarf: () => `<path d="M5.4 12.6q10.6 5.4 21.2 0 1 3.6-1 5.2-9.6 4.2-19.2 0-2-1.6-1-5.2z" fill="${C.rose}"/>
    <path d="M22.6 18.6q3.6 1.6 3 7.6-.6 4-4 3 1.6-5-1-9z" fill="${C.roseL}"/>`,
  accBowtie: () => `<g transform="translate(16 16)"><path d="M0 0-10-5.6v11.2z" fill="${C.roseD}"/>
    <path d="M0 0 10-5.6v11.2z" fill="${C.roseD}"/><circle r="2.8" fill="${C.rose}"/></g>`,
  accGlasses: () => `<circle cx="9.6" cy="16" r="5.6" fill="none" stroke="${C.woodD}" stroke-width="2"/>
    <circle cx="22.4" cy="16" r="5.6" fill="none" stroke="${C.woodD}" stroke-width="2"/>
    <path d="M15.2 15.2q.8-1 1.6 0M4 14 1.6 13M28 14l2.4-1" stroke="${C.woodD}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  accSun: () => `<path d="M3 11.4h26v3.2c0 4-3 7-6.8 7-3.4 0-6-2.4-6.6-5.6h-.6c-.6 3.2-3.2 5.6-6.6 5.6-3.8 0-6.8-3-6.8-7z" fill="#38324A"/>
    <path d="M6 13.4h6.6l-1.4 3.6H7.4z" fill="#fff" opacity=".25"/>
    <path d="M19.4 13.4H26l-1.4 3.6h-3.8z" fill="#fff" opacity=".25"/>`,
  accHeadphones: () => `<path d="M6.6 18a9.4 9.4 0 0 1 18.8 0" fill="none" stroke="${C.lavD}" stroke-width="3" stroke-linecap="round"/>
    <rect x="3.4" y="15.4" width="6" height="9.4" rx="3" fill="${C.lav}"/>
    <rect x="22.6" y="15.4" width="6" height="9.4" rx="3" fill="${C.lav}"/>`,
  accNecklace: () => `<path d="M8 8q8 9.4 16 0" fill="none" stroke="${C.yolk}" stroke-width="2"/>
    <path d="M16 24.4c-3.4-2.6-5.2-4.2-5.2-6.2 0-1.5 1.2-2.6 2.6-2.6 1 0 1.8.5 2.6 1.4.8-.9 1.6-1.4 2.6-1.4 1.4 0 2.6 1.1 2.6 2.6 0 2-1.8 3.6-5.2 6.2z" fill="${C.rose}"/>`,
  accBlush: () => `<circle cx="16" cy="16" r="10" fill="${C.yolkL}"/>
    <ellipse cx="10.6" cy="18" rx="3.4" ry="2.2" fill="${C.rose}" opacity=".7"/>
    <ellipse cx="21.4" cy="18" rx="3.4" ry="2.2" fill="${C.rose}" opacity=".7"/>
    ${eyeArc(12.6, 13.6)}${eyeArc(19.4, 13.6)}`,

  /* ── Glyphen (currentColor) ──────────────────────────── */
  chevron: () => S('M12 8l8 8-8 8', 'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"'),
  close: () => S('M9 9l14 14M23 9L9 23', 'fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"'),
  check: () => S('M7 17l6 6L25 9', 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"'),
  plus: () => S('M16 8v16M8 16h16', 'fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"'),
  copy: () => `<rect x="11" y="4.6" width="16.4" height="16.4" rx="3.4" fill="none" stroke="currentColor" stroke-width="2.2"/>
    <path d="M21 25.4a3.4 3.4 0 0 1-3.4 3.4H8a3.4 3.4 0 0 1-3.4-3.4V13a3.4 3.4 0 0 1 3.4-3.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
  share: () => `<path d="M16 21V4.6M16 4.6l-5 5M16 4.6l5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 16v8.4a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
  lock: () => `<rect x="7" y="14" width="18" height="13.4" rx="3.4" fill="currentColor"/>
    <path d="M11.4 14v-3.6a4.6 4.6 0 0 1 9.2 0V14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
  edit: () => ICONS.gameDoodle(),
  bell: () => `<path d="M16 4a8 8 0 0 1 8 8v5l2.4 4H5.6L8 17v-5a8 8 0 0 1 8-8z" fill="currentColor"/>
    <path d="M13 22.4a3 3 0 0 0 6 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
  clock: () => `<circle cx="16" cy="16" r="11.4" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <path d="M16 9.6V16l4.4 2.6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  person: () => `<circle cx="16" cy="11" r="5.4" fill="currentColor"/>
    <path d="M5.6 27.4a10.4 10.4 0 0 1 20.8 0z" fill="currentColor"/>`,
  moonPhase: () => ICONS.careSleep(),
  download: () => `<path d="M16 5v14M16 19l-5.4-5.4M16 19l5.4-5.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5.6 22v2.4a3 3 0 0 0 3 3h14.8a3 3 0 0 0 3-3V22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
  upload: () => `<path d="M16 19V5M16 5l-5.4 5.4M16 5l5.4 5.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5.6 22v2.4a3 3 0 0 0 3 3h14.8a3 3 0 0 0 3-3V22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
  broom: () => `<path d="M20.6 4.6 12 13.2" stroke="${C.woodD}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M11 12.2 8 15.2l8.8 8.8 3-3z" fill="${C.beak}"/>
    <path d="M16.8 24 8 15.2c-3.4 3.4-4.4 7.6-3 11 3.4 1.4 7.6.4 11.8-2.2z" fill="${C.yolk}"/>`,
  warn: () => `<path d="M16 4.6 29 26.4a2 2 0 0 1-1.7 3H4.7a2 2 0 0 1-1.7-3z" fill="${C.beak}"/>
    <path d="M16 12v7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="16" cy="23.6" r="1.6" fill="#fff"/>`,
  info: () => `<circle cx="16" cy="16" r="11.6" fill="none" stroke="currentColor" stroke-width="2.2"/>
    <path d="M16 14.4v7.2" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="16" cy="10.4" r="1.5" fill="currentColor"/>`,
  handTap: () => `<path d="M13 15V7.6a2.6 2.6 0 0 1 5.2 0V15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M18.2 13.6a2.2 2.2 0 0 1 4.4 0v1.8M22.6 15.4a2.2 2.2 0 0 1 4.4 0v5.2c0 4.4-3.4 8-8 8h-2.4c-2.6 0-4-1-5.6-3l-4-5.6a2.4 2.4 0 0 1 3.6-3.2l2.4 2.4"
      fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
};

/* ═══════════════════════════════════════════════════════════
   Öffentliche API
   ═══════════════════════════════════════════════════════════ */

/**
 * @param {string} name  Schlüssel aus der Registry
 * @param {object} [o]   { size, cls, title }
 * @returns {string} SVG-Markup (leer, wenn der Name unbekannt ist)
 */
export function icon(name, o = {}) {
  const draw = ICONS[name];
  if (!draw) {
    console.warn('[knuddl] Unbekanntes Icon:', name);
    return '';
  }
  const size = o.size ?? 24;
  return `<svg class="ic ${o.cls || ''}" viewBox="0 0 32 32" width="${size}" height="${size}"
    role="${o.title ? 'img' : 'presentation'}" ${o.title ? `aria-label="${o.title}"` : 'aria-hidden="true"'}
    xmlns="http://www.w3.org/2000/svg">${draw()}</svg>`;
}

export const hasIcon = (name) => Object.prototype.hasOwnProperty.call(ICONS, name);
export const iconNames = () => Object.keys(ICONS);
export { C as ICON_COLORS };
