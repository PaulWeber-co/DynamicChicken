/**
 * Die Bauten der Federschleuder.
 *
 * Handgebaut statt gewürfelt. Ein zufällig gestapelter Turm ist entweder
 * trivial oder unmöglich, und beides merkt man beim zweiten Schuss. Zwölf
 * gebaute Level dagegen können etwas beibringen: Level 1 zeigt, dass Glas
 * bricht; Level 3, dass Stein liegen bleibt; Level 6, dass man manchmal die
 * Statik treffen muss statt den Fuchs. Danach wiederholen sie sich mit mehr
 * Füchsen und weniger Eiern.
 *
 * Koordinaten: x nach rechts, y nach oben, Boden bei 0. Eine Einheit ist
 * ungefähr ein Pixel bei voller Größe; das Spiel skaliert alles auf die
 * Bildschirmbreite.
 */

import { kiste, fuchs } from './slingPhysik.js';

/** Kurzschreibweisen fürs Bauen. */
const H = (x, y, w, h) => kiste(x, y, w, h, 'holz');
const G = (x, y, w, h) => kiste(x, y, w, h, 'glas');
const S = (x, y, w, h) => kiste(x, y, w, h, 'stein');
const F = (x, y) => fuchs(x, y);

/** Ein Balken auf zwei Pfosten — der Grundbaustein jedes Turms. */
function bock(x, y, breite, stoff = 'holz', hoehe = 60) {
  const P = stoff === 'stein' ? S : stoff === 'glas' ? G : H;
  return [
    P(x, y, 16, hoehe),
    P(x + breite - 16, y, 16, hoehe),
    P(x, y + hoehe, breite, 16)
  ];
}

/**
 * Die Level. `eier` sinkt später, `titel` steht im Vorspann.
 * `bau()` liefert frische Körper — nie geteilte Objekte, sonst nimmt ein
 * zweiter Versuch die Trümmer des ersten mit.
 */
export const LEVEL = [
  {
    titel: 'Der Anfang', tipp: 'Glas bricht. Holz nicht.',
    eier: 3,
    bau: () => ({
      kisten: [...bock(240, 0, 100, 'glas')],
      fuechse: [F(290, 20)]
    })
  },
  {
    titel: 'Zwei Etagen', tipp: 'Was oben sitzt, fällt am weitesten.',
    eier: 3,
    bau: () => ({
      kisten: [...bock(240, 0, 100, 'holz'), ...bock(248, 76, 84, 'glas')],
      fuechse: [F(290, 20), F(290, 96)]
    })
  },
  {
    titel: 'Steinbruch', tipp: 'Stein hält. Stein ist aber auch schwer.',
    eier: 3,
    bau: () => ({
      kisten: [...bock(230, 0, 110, 'stein'), ...bock(240, 76, 90, 'holz')],
      fuechse: [F(285, 20), F(285, 96)]
    })
  },
  {
    titel: 'Nebeneinander', tipp: 'Zwei Türme, drei Eier. Rechne nach.',
    eier: 3,
    bau: () => ({
      kisten: [...bock(210, 0, 90, 'holz'), ...bock(330, 0, 90, 'glas')],
      fuechse: [F(255, 20), F(375, 20), F(375, 96)]
    })
  },
  {
    titel: 'Der Keller', tipp: 'Unten sitzt einer im Trockenen.',
    eier: 3,
    bau: () => ({
      kisten: [...bock(220, 0, 120, 'stein'), ...bock(232, 76, 96, 'holz'), G(250, 152, 60, 16)],
      fuechse: [F(280, 20), F(280, 96), F(280, 176)]
    })
  },
  {
    titel: 'Wackelig', tipp: 'Ein Pfosten weniger, und der Rest kippt.',
    eier: 3,
    bau: () => ({
      kisten: [
        H(220, 0, 16, 90), H(320, 0, 16, 90),
        H(212, 90, 132, 16),
        ...bock(232, 106, 92, 'glas', 50)
      ],
      fuechse: [F(270, 20), F(278, 126)]
    })
  },
  {
    titel: 'Die Brücke', tipp: 'Der Balken in der Mitte hält alles.',
    eier: 3,
    bau: () => ({
      kisten: [
        S(200, 0, 18, 70), S(400, 0, 18, 70),
        H(200, 70, 218, 16),
        ...bock(240, 86, 70, 'glas', 46),
        ...bock(330, 86, 70, 'glas', 46)
      ],
      fuechse: [F(270, 106), F(360, 106), F(310, 20)]
    })
  },
  {
    titel: 'Der Bunker', tipp: 'Von vorn kommst du hier nicht rein.',
    eier: 4,
    bau: () => ({
      kisten: [
        S(230, 0, 20, 100), S(360, 0, 20, 100),
        S(230, 100, 150, 18),
        H(252, 0, 16, 100), H(340, 0, 16, 100),
        G(268, 0, 72, 16)
      ],
      fuechse: [F(300, 20), F(300, 128)]
    })
  },
  {
    titel: 'Turmspitze', tipp: 'Hoch bauen ist eine Einladung.',
    eier: 3,
    bau: () => ({
      kisten: [
        ...bock(240, 0, 100, 'stein'),
        ...bock(248, 76, 84, 'holz'),
        ...bock(256, 152, 68, 'glas'),
        G(268, 228, 44, 16)
      ],
      fuechse: [F(290, 20), F(290, 96), F(290, 172), F(290, 250)]
    })
  },
  {
    titel: 'Drei Häuser', tipp: 'Vier Eier, sechs Füchse. Kettenreaktion.',
    eier: 4,
    bau: () => ({
      kisten: [
        ...bock(190, 0, 84, 'holz'), ...bock(290, 0, 84, 'glas'), ...bock(390, 0, 84, 'holz'),
        H(198, 76, 268, 16)
      ],
      fuechse: [F(232, 20), F(332, 20), F(432, 20), F(250, 100), F(340, 100), F(430, 100)]
    })
  },
  {
    titel: 'Das Nest', tipp: 'Die Füchse sitzen zwischen Stein.',
    eier: 4,
    bau: () => ({
      kisten: [
        S(200, 0, 22, 120), S(430, 0, 22, 120),
        S(200, 120, 252, 20),
        H(260, 0, 16, 70), H(370, 0, 16, 70),
        H(252, 70, 142, 16),
        G(300, 86, 46, 34)
      ],
      fuechse: [F(240, 20), F(320, 20), F(410, 20), F(322, 152)]
    })
  },
  {
    titel: 'Der letzte Turm', tipp: 'Nur drei Eier. Viel Glück.',
    eier: 3,
    bau: () => ({
      kisten: [
        ...bock(210, 0, 120, 'stein'),
        ...bock(222, 76, 96, 'stein'),
        ...bock(234, 152, 72, 'holz'),
        ...bock(360, 0, 90, 'holz'),
        ...bock(368, 76, 74, 'glas')
      ],
      fuechse: [F(270, 20), F(270, 96), F(270, 172), F(405, 20), F(405, 96)]
    })
  }
];

/**
 * Welcher Bau gehört zu Runde `n`?
 *
 * Nach dem zwölften geht es von vorn los — aber mit einem Ei weniger, ab der
 * dritten Runde mit zweien. Damit bleibt auch der bekannte Bau eine Aufgabe,
 * statt zur Pflichtübung zu werden.
 */
export function levelFuer(n) {
  const runde = Math.max(1, Math.floor(n));
  const i = (runde - 1) % LEVEL.length;
  const durchgang = Math.floor((runde - 1) / LEVEL.length);
  const l = LEVEL[i];
  const { kisten, fuechse } = l.bau();
  return {
    nummer: runde,
    index: i + 1,
    durchgang,
    titel: l.titel + (durchgang ? ` · ${durchgang + 1}. Durchgang` : ''),
    tipp: l.tipp,
    eier: Math.max(2, l.eier - Math.min(2, durchgang)),
    kisten,
    fuechse,
    // Nur so breit wie nötig: Jede leere Einheit rechts macht den ganzen Bau
    // auf dem Handy kleiner. Weiter entfernte Bauten werden dadurch von allein
    // etwas kleiner gezeichnet — was gut passt, sie sind ja auch schwerer.
    breite: Math.max(430, 70 + Math.max(...kisten.map((k) => k.x + k.w), ...fuechse.map((f) => f.x + 40))),
    hoehe: Math.max(230, 80 + Math.max(...kisten.map((k) => k.y + k.h), ...fuechse.map((f) => f.y + 40)))
  };
}

/** Punkte: Füchse zählen am meisten, übrige Eier bringen den Rest. */
export function bewerten(fuechseWeg, kaestenWeg, restEier, stufe = 1) {
  return Math.round((fuechseWeg * 120 + kaestenWeg * 12 + restEier * 150) * (1 + (stufe - 1) * 0.05));
}
