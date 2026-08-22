/**
 * Der Katalog: neunundsechzig Stellungen als Zahlen.
 *
 * Jeder Eintrag beschreibt zwei Körper — Hüftpunkt, Rumpfwinkel, Blick­richtung
 * und vier Gliedmaßen mit je zwei Winkeln — dazu ein Möbelstück und die
 * Angabe, wer vorn liegt. Gezeichnet wird das in `stellungBild.js`.
 *
 * Warum gerechnet und nicht gemalt: Siebzig gezeichnete Bilder wären siebzig
 * Dateien, die im Dunkelmodus alle falsch aussehen und die niemand
 * nachträglich verschiebt. So ist eine Stellung eine Zeile, alle sehen aus
 * wie aus derselben Hand, und eine neue dazuzunehmen kostet zwei Minuten.
 *
 * Die Namen sind die geläufigen deutschen — teils aus dem Kamasutra, teils
 * das, was man heute sagt. Die Beschreibung sagt nüchtern, was passiert:
 * Man kann nur ehrlich benoten, was man auch verstanden hat.
 *
 * Winkelkonvention: 0° rechts, 90° oben, 180° links, 270° unten.
 * Höhen: Fußboden 130, Matratze 112, Sitzfläche 106, Tischplatte 96.
 */

/* ── Grundhaltungen ─────────────────────────────────────── */
/* Von diesen sechzehn leiten sich fast alle Stellungen ab; überschrieben
   wird nur, was die jeweilige Stellung ausmacht. `bl` ist die Blick-
   richtung — daran erkennt man zugewandt und abgewandt. */

const RUECK   = { t: 178, bl: 92,  arm: [341, 351, 19, 9],   bein: [354, 359, 6, 1] };
const RUECK_R = { t: 2,   bl: 88,  arm: [199, 189, 161, 171], bein: [186, 181, 174, 179] };
const BAUCH   = { t: 176, bl: 250, arm: [206, 250, 165, 115], bein: [356, 351, 4, 9] };
const BAUCH_R = { t: 4,   bl: 290, arm: [334, 290, 15, 65],   bein: [184, 189, 176, 171] };
const STEH_R  = { t: 91,  bl: 0,   arm: [256, 258, 286, 284], bein: [266, 269, 275, 272] };
const STEH_L  = { t: 89,  bl: 180, arm: [284, 282, 254, 256], bein: [274, 271, 265, 268] };
const KNIE_R  = { t: 90,  bl: 0,   arm: [255, 249, 288, 296], bein: [263, 183, 277, 177] };
const KNIE_L  = { t: 90,  bl: 180, arm: [285, 291, 252, 244], bein: [277, 357, 263, 3] };
const VIER_R  = { t: 20,  bl: 340, arm: [285, 265, 300, 272], bein: [262, 186, 280, 172] };
const VIER_L  = { t: 160, bl: 200, arm: [255, 275, 240, 268], bein: [278, 354, 260, 8] };
const SITZ_R  = { t: 96,  bl: 0,   arm: [300, 332, 332, 352], bein: [350, 356, 4, 358] };
const SITZ_L  = { t: 84,  bl: 180, arm: [240, 208, 208, 188], bein: [190, 184, 176, 182] };
/* Hocke: Knie hoch, Füße unter dem Körper — für alles auf dem Schoß */
const HOCK_L  = { t: 92,  bl: 180, arm: [200, 170, 230, 200], bein: [225, 300, 210, 290] };
const HOCK_R  = { t: 88,  bl: 0,   arm: [340, 10, 310, 340],  bein: [315, 240, 330, 250] };
/* Seitenlage, Kopf links bzw. rechts */
const SEIT    = { t: 177, bl: 186, arm: [345, 350, 15, 5],   bein: [356, 2, 4, 356] };
const SEIT_R  = { t: 3,   bl: 354, arm: [195, 190, 165, 175], bein: [184, 178, 176, 184] };

const f = (basis, x, y, o = {}) => ({ ...basis, x, y, ...o });

/**
 * Die Stellungen.
 *
 * `g` gruppiert für die Liste, `s` ist die Gangart: 1 geht immer, 2 will
 * etwas Übung, 3 braucht Kraft oder Gelenke. Das ist keine Wertung, sondern
 * eine Warnung vor dem Krampf im Oberschenkel.
 */
export const STELLUNGEN = [
  /* ── Rückenlage ──────────────────────────────────────── */
  { id: 'missionar', n: 'Missionar', g: 'Liegend', s: 1,
    d: 'Der Klassiker: einer liegt auf dem Rücken, der andere darüber, Gesicht zu Gesicht.',
    m: 'bett', z: 'b',
    a: f(RUECK, 106, 108, { bein: [18, 342, 32, 334] }),
    b: f(BAUCH, 128, 88, { t: 170, bl: 244, arm: [238, 264, 208, 272], bein: [350, 356, 2, 350] }) },

  { id: 'beineHoch', n: 'Beine hoch', g: 'Liegend', s: 1,
    d: 'Auf dem Rücken, die Knie angezogen. Der andere kniet davor — deutlich tiefer als flach.',
    m: 'bett', z: 'b',
    a: f(RUECK, 100, 108, { bein: [58, 336, 74, 326] }),
    b: f(KNIE_L, 142, 92, { arm: [196, 210, 216, 230] }) },

  { id: 'schulterBeine', n: 'Beine auf den Schultern', g: 'Liegend', s: 2,
    d: 'Die Beine liegen gestreckt auf den Schultern des Knienden. Sehr tief, nichts für Ungeduldige.',
    m: 'bett', z: 'b',
    a: f(RUECK, 98, 108, { bein: [38, 34, 50, 46] }),
    b: f(KNIE_L, 146, 92, { arm: [200, 206, 220, 226] }) },

  { id: 'anker', n: 'Der Anker', g: 'Liegend', s: 2,
    d: 'Die Knie bis zur Brust gezogen, der andere liegt flach darüber. Eng, warm, kaum Bewegungsspielraum.',
    m: 'bett', z: 'b',
    a: f(RUECK, 112, 108, { bein: [88, 292, 104, 280] }),
    b: f(BAUCH, 136, 82, { t: 172, bl: 246, arm: [240, 266, 210, 274], bein: [352, 358, 4, 352] }) },

  { id: 'schmetterling', n: 'Der Schmetterling', g: 'Liegend', s: 1,
    d: 'Einer liegt quer auf der Bettkante, der andere steht davor und hält die Beine.',
    m: 'kante', z: 'b',
    a: f(RUECK, 108, 106, { bein: [28, 18, 44, 32] }),
    b: f(STEH_L, 168, 88, { arm: [206, 198, 222, 214] }) },

  { id: 'bruecke', n: 'Die Brücke', g: 'Liegend', s: 3,
    d: 'Der Liegende drückt die Hüfte hoch, nur Schultern und Füße auf der Matratze. Anstrengend, kurz, gut.',
    m: 'bett', z: 'b',
    a: f(RUECK, 108, 90, { t: 200, bl: 110, arm: [300, 250, 260, 240], bein: [330, 260, 344, 268] }),
    b: f(KNIE_L, 146, 92, { arm: [196, 212, 216, 232] }) },

  { id: 'kerze', n: 'Die Kerze', g: 'Liegend', s: 3,
    d: 'Schulterstand: die Beine zeigen senkrecht nach oben, der andere kniet darüber.',
    m: 'bett', z: 'b',
    a: f(RUECK, 112, 106, { t: 200, bl: 120, arm: [330, 300, 20, 40], bein: [84, 88, 96, 92] }),
    b: f(KNIE_L, 142, 86, { arm: [195, 212, 215, 232] }) },

  { id: 'frosch', n: 'Der Frosch', g: 'Liegend', s: 2,
    d: 'Auf dem Rücken, Knie weit auseinander, Fußsohlen aneinander. Öffnet alles.',
    m: 'bett', z: 'b',
    a: f(RUECK, 102, 108, { bein: [66, 2, 38, 354] }),
    b: f(KNIE_L, 144, 92, { arm: [196, 210, 216, 230] }) },

  { id: 'kreuz', n: 'Das Kreuz', g: 'Liegend', s: 2,
    d: 'Der eine liegt längs, der andere quer darüber — die Beine bilden ein X.',
    m: 'bett', z: 'b',
    a: f(RUECK, 100, 108, { bein: [352, 358, 8, 2] }),
    b: f(SEIT_R, 130, 90, { t: 30, bl: 300, arm: [250, 230, 300, 320], bein: [214, 200, 236, 222] }) },

  { id: 'zange', n: 'Die Zange', g: 'Liegend', s: 2,
    d: 'Die Beine geschlossen senkrecht nach oben, der andere kniet rittlings darüber. Sehr eng.',
    m: 'bett', z: 'b',
    a: f(RUECK, 108, 108, { bein: [78, 82, 86, 90] }),
    b: f(KNIE_L, 136, 88, { arm: [206, 220, 226, 240], bein: [284, 350, 258, 8] }) },

  { id: 'faecher', n: 'Der Fächer', g: 'Liegend', s: 2,
    d: 'Auf dem Rücken, die Beine weit im V gestreckt. Der andere kniet in der Mitte.',
    m: 'bett', z: 'b',
    a: f(RUECK, 102, 108, { bein: [26, 22, 340, 344] }),
    b: f(KNIE_L, 144, 92, { arm: [196, 208, 216, 228] }) },

  { id: 'wippe', n: 'Die Wippe', g: 'Liegend', s: 2,
    d: 'Beide sitzen einander gegenüber, lehnen sich zurück, die Beine ineinander verschränkt.',
    m: 'bett', z: 'b',
    a: f(SITZ_R, 84, 100, { t: 120, bl: 30, arm: [320, 300, 300, 285], bein: [352, 6, 8, 2] }),
    b: f(SITZ_L, 156, 100, { t: 60, bl: 150, arm: [240, 260, 220, 235], bein: [188, 174, 172, 178] }) },

  { id: 'rad', n: 'Das Rad', g: 'Liegend', s: 3,
    d: 'Beide liegen, die Oberkörper weit auseinander, nur die Beine verschränkt.',
    m: 'bett', z: 'b',
    a: f(RUECK, 106, 108, { arm: [330, 320, 30, 40], bein: [22, 348, 4, 6] }),
    b: f(RUECK_R, 142, 100, { arm: [210, 220, 150, 140], bein: [158, 192, 176, 174] }) },

  { id: 'halbmond', n: 'Der Halbmond', g: 'Liegend', s: 3,
    d: 'Der Liegende hohl im Rücken, der Kniende lehnt sich weit zurück. Zwei Bögen gegeneinander.',
    m: 'bett', z: 'b',
    a: f(RUECK, 106, 102, { t: 190, bl: 100, arm: [320, 290, 340, 310], bein: [30, 330, 44, 340] }),
    b: f(KNIE_L, 146, 94, { t: 106, bl: 166, arm: [320, 300, 340, 320] }) },

  { id: 'haengematte', n: 'Die Hängematte', g: 'Liegend', s: 2,
    d: 'Die Beine des Liegenden ruhen auf den Schultern des anderen, der sich dazwischen abstützt.',
    m: 'bett', z: 'b',
    a: f(RUECK, 102, 110, { bein: [50, 34, 64, 48] }),
    b: f(BAUCH, 138, 84, { t: 164, bl: 238, arm: [236, 262, 206, 270], bein: [348, 354, 0, 348] }) },

  /* ── Reiten ──────────────────────────────────────────── */
  { id: 'reiten', n: 'Reiten', g: 'Oben sitzen', s: 1,
    d: 'Einer liegt, der andere sitzt aufrecht darauf und bestimmt Tempo und Tiefe.',
    m: 'bett', z: 'b',
    a: f(RUECK, 104, 108, { arm: [340, 14, 20, 346], bein: [354, 0, 6, 0] }),
    b: f(KNIE_L, 124, 84, { arm: [248, 240, 292, 300] }) },

  { id: 'reitenRueck', n: 'Reiten, abgewandt', g: 'Oben sitzen', s: 1,
    d: 'Dasselbe, nur andersherum gedreht. Der Liegende sieht alles.',
    m: 'bett', z: 'b',
    a: f(RUECK, 104, 108, { arm: [340, 14, 20, 346], bein: [354, 0, 6, 0] }),
    b: f(KNIE_R, 124, 84, { arm: [252, 246, 294, 302] }) },

  { id: 'lotus', n: 'Der Lotus', g: 'Oben sitzen', s: 2,
    d: 'Beide sitzen, einer auf dem Schoß des anderen, Beine umeinander, Stirn an Stirn. Kaum Bewegung, sehr viel Nähe.',
    m: 'bett', z: 'b',
    a: f(SITZ_R, 96, 104, { arm: [10, 32, 340, 318], bein: [348, 150, 12, 200] }),
    b: f(HOCK_L, 124, 78, { arm: [192, 168, 216, 192] }) },

  { id: 'sessel', n: 'Der Sessel', g: 'Oben sitzen', s: 2,
    d: 'Der Untere stützt sich hinter sich ab und sitzt halb auf, der Obere sitzt rittlings davor.',
    m: 'bett', z: 'b',
    a: f(SITZ_R, 94, 102, { t: 118, bl: 28, arm: [326, 300, 312, 288], bein: [352, 358, 6, 352] }),
    b: f(HOCK_L, 124, 82, { arm: [190, 166, 214, 190] }) },

  { id: 'kobra', n: 'Die Kobra', g: 'Oben sitzen', s: 2,
    d: 'Oben sitzen und sich weit nach vorn auf die Hände lehnen. Flacher Winkel, viel Reibung.',
    m: 'bett', z: 'b',
    a: f(RUECK, 104, 108, { bein: [354, 0, 6, 0] }),
    b: f(VIER_L, 130, 84, { t: 152, bl: 208, arm: [252, 272, 238, 266] }) },

  { id: 'baumfrosch', n: 'Der Baumfrosch', g: 'Oben sitzen', s: 3,
    d: 'Oben in der Hocke auf den Füßen statt auf den Knien. Kostet Oberschenkel, gibt Kontrolle.',
    m: 'bett', z: 'b',
    a: f(RUECK, 104, 108, { bein: [354, 0, 6, 0] }),
    b: f(HOCK_L, 126, 80, { arm: [204, 184, 234, 208] }) },

  { id: 'lehne', n: 'Angelehnt', g: 'Oben sitzen', s: 1,
    d: 'Oben sitzen, abgewandt, und sich nach hinten auf die Brust des anderen legen.',
    m: 'bett', z: 'b',
    a: f(RUECK, 102, 108, { t: 190, bl: 100, arm: [330, 350, 10, 30], bein: [354, 0, 6, 0] }),
    b: f(KNIE_R, 134, 84, { t: 72, bl: 342, arm: [232, 212, 262, 242] }) },

  { id: 'saenfte', n: 'Die Sänfte', g: 'Oben sitzen', s: 3,
    d: 'Der Untere stellt die Füße auf, der Obere sitzt auf den Oberschenkeln und lehnt sich zurück.',
    m: 'bett', z: 'b',
    a: f(RUECK, 96, 108, { bein: [40, 292, 54, 284] }),
    b: f(SITZ_L, 140, 92, { t: 66, bl: 156, arm: [340, 320, 356, 336], bein: [196, 250, 210, 262] }) },

  { id: 'schaukel', n: 'Die Schaukel', g: 'Oben sitzen', s: 2,
    d: 'Oben sitzen und die Hüfte kreisen statt stoßen. Langsam, tief, endlos.',
    m: 'bett', z: 'b',
    a: f(RUECK, 104, 108, { arm: [24, 8, 8, 344], bein: [354, 0, 6, 0] }),
    b: f(KNIE_L, 126, 84, { t: 102, bl: 172, arm: [236, 254, 254, 268] }) },

  /* ── Von hinten ──────────────────────────────────────── */
  { id: 'hinten', n: 'Von hinten', g: 'Von hinten', s: 1,
    d: 'Auf allen vieren, der andere kniet dahinter. Der Klassiker unter den Klassikern.',
    m: 'bett', z: 'b',
    a: f(VIER_R, 138, 90),
    b: f(KNIE_R, 114, 92, { arm: [308, 328, 322, 342] }) },

  { id: 'ellbogen', n: 'Auf den Ellenbogen', g: 'Von hinten', s: 1,
    d: 'Wie von hinten, nur die Oberarme abgelegt. Der Rücken wird hohl, der Winkel steiler.',
    m: 'bett', z: 'b',
    a: f(VIER_R, 138, 92, { t: 8, arm: [300, 250, 315, 245] }),
    b: f(KNIE_R, 114, 92, { arm: [308, 328, 322, 342] }) },

  { id: 'muschel', n: 'Die Muschel', g: 'Von hinten', s: 1,
    d: 'Flach auf dem Bauch, Beine geschlossen, der andere liegt darauf. Sehr eng, sehr wenig Platz.',
    m: 'bett', z: 'b',
    a: f(BAUCH_R, 134, 108, { bein: [184, 180, 176, 180] }),
    b: f(BAUCH_R, 124, 88, { t: 10, bl: 296, arm: [330, 285, 350, 295], bein: [188, 184, 180, 176] }) },

  { id: 'tiger', n: 'Der Tiger', g: 'Von hinten', s: 2,
    d: 'Auf allen vieren, der Kniende hält die Hüfte fest und eine Hand in den Haaren.',
    m: 'bett', z: 'b',
    a: f(VIER_R, 140, 90, { t: 26 }),
    b: f(KNIE_R, 116, 92, { arm: [312, 332, 18, 8] }) },

  { id: 'hase', n: 'Der Hase', g: 'Von hinten', s: 2,
    d: 'Auf allen vieren an der Bettkante, der andere steht davor auf dem Boden.',
    m: 'kante', z: 'b',
    a: f(VIER_L, 130, 90),
    b: f(STEH_R, 158, 88, { t: 94, bl: 180, arm: [225, 250, 240, 265] }) },

  { id: 'katze', n: 'Die Katze', g: 'Von hinten', s: 1,
    d: 'Beide knien aufrecht hintereinander, die Arme von hinten um den Bauch. Nah wie Löffelchen, nur senkrecht.',
    m: 'bett', z: 'b',
    a: f(KNIE_R, 134, 92),
    b: f(KNIE_R, 108, 92, { arm: [350, 5, 10, 355] }) },

  { id: 'sphinx', n: 'Die Sphinx', g: 'Von hinten', s: 2,
    d: 'Bauchlage mit einem angezogenen Bein, der andere liegt seitlich dahinter.',
    m: 'bett', z: 'b',
    a: f(BAUCH_R, 138, 108, { bein: [184, 180, 224, 300] }),
    b: f(SEIT_R, 112, 96, { t: 8, bl: 348, arm: [332, 352, 348, 4], bein: [190, 176, 178, 186] }) },

  { id: 'bogen', n: 'Der Bogen', g: 'Von hinten', s: 3,
    d: 'Von hinten, dabei lehnt sich der Kniende weit zurück. Nur die Hüften berühren sich noch.',
    m: 'bett', z: 'b',
    a: f(VIER_R, 140, 90, { t: 24 }),
    b: f(KNIE_R, 116, 94, { t: 74, bl: 344, arm: [320, 300, 340, 320] }) },

  { id: 'reissverschluss', n: 'Der Reißverschluss', g: 'Von hinten', s: 2,
    d: 'Bauchlage, Beine geschlossen — der andere liegt darauf, Beine außen. Ineinander verzahnt.',
    m: 'bett', z: 'b',
    a: f(BAUCH_R, 136, 108, { bein: [182, 178, 178, 182] }),
    b: f(BAUCH_R, 122, 88, { t: 8, bl: 296, arm: [325, 282, 355, 292], bein: [192, 188, 172, 168] }) },

  { id: 'ueberTisch', n: 'Über den Tisch gebeugt', g: 'Von hinten', s: 2,
    d: 'Vornüber auf die Tischplatte gelehnt, der andere steht dahinter. Kein Bett nötig.',
    m: 'tisch', z: 'b',
    a: f(VIER_L, 140, 84, { t: 194, bl: 214, arm: [200, 190, 214, 204], bein: [268, 272, 278, 274] }),
    b: f(STEH_R, 176, 88, { t: 94, bl: 180, arm: [200, 188, 214, 202] }) },

  { id: 'aufSchoss', n: 'Rittlings von hinten', g: 'Von hinten', s: 2,
    d: 'Der eine sitzt, der andere setzt sich mit dem Rücken davor auf den Schoß.',
    m: 'stuhl', z: 'b',
    a: f(SITZ_R, 78, 100, { bein: [350, 356, 4, 358] }),
    b: f(HOCK_R, 114, 78, { arm: [340, 320, 10, 350] }) },

  /* ── Seitenlage ──────────────────────────────────────── */
  { id: 'loeffel', n: 'Löffelchen', g: 'Seitlich', s: 1,
    d: 'Beide auf der Seite, einer hinter dem anderen. Warm, faul, funktioniert immer.',
    m: 'bett', z: 'a',
    a: f(SEIT, 134, 108, { bein: [350, 4, 4, 350] }),
    b: f(SEIT, 110, 96, { arm: [334, 348, 350, 336], bein: [344, 4, 356, 348] }) },

  { id: 'loeffelBein', n: 'Löffelchen mit Bein', g: 'Seitlich', s: 1,
    d: 'Wie Löffelchen, nur das obere Bein angezogen. Ändert alles.',
    m: 'bett', z: 'a',
    a: f(SEIT, 134, 108, { bein: [352, 2, 44, 328] }),
    b: f(SEIT, 110, 96, { arm: [334, 348, 350, 336], bein: [346, 4, 358, 346] }) },

  { id: 'gabel', n: 'Die Gabel', g: 'Seitlich', s: 2,
    d: 'Beide auf der Seite, Gesicht zu Gesicht, die Beine ineinander gesteckt.',
    m: 'bett', z: 'b',
    a: f(SEIT, 92, 100, { bl: 6, arm: [340, 330, 10, 20], bein: [348, 14, 12, 348] }),
    b: f(SEIT_R, 146, 108, { bl: 174, arm: [200, 210, 160, 150], bein: [192, 168, 168, 192] }) },

  { id: 'waage', n: 'Die Waage', g: 'Seitlich', s: 2,
    d: 'Nebeneinander auf der Seite, ein Bein über der Hüfte des anderen.',
    m: 'bett', z: 'b',
    a: f(SEIT, 96, 98, { bein: [354, 2, 24, 336] }),
    b: f(SEIT_R, 146, 110, { arm: [204, 214, 164, 154], bein: [186, 176, 204, 254] }) },

  { id: 'knoten', n: 'Der Knoten', g: 'Seitlich', s: 3,
    d: 'Beide auf der Seite, die Beine über Kreuz verknotet. Dauert beim Aufbau, hält dann ewig.',
    m: 'bett', z: 'b',
    a: f(SEIT, 96, 98, { bein: [16, 336, 344, 24] }),
    b: f(SEIT_R, 146, 110, { arm: [206, 216, 166, 156], bein: [164, 204, 196, 156] }) },

  { id: 'schwan', n: 'Der Schwan', g: 'Seitlich', s: 2,
    d: 'Einer liegt seitlich, der andere kniet dahinter aufrecht und hebt das obere Bein an.',
    m: 'bett', z: 'b',
    a: f(SEIT_R, 142, 108, { bein: [190, 176, 148, 118] }),
    b: f(KNIE_R, 114, 92, { arm: [330, 350, 352, 6] }) },

  { id: 'ruecken', n: 'Rücken an Rücken', g: 'Seitlich', s: 3,
    d: 'Beide auf der Seite, Rücken an Rücken, die Hüften ineinander. Sieht unmöglich aus, geht überraschend gut.',
    m: 'bett', z: 'b',
    a: f(SEIT, 106, 98, { bein: [336, 16, 348, 6] }),
    b: f(SEIT_R, 130, 110, { arm: [200, 190, 160, 170], bein: [204, 164, 192, 174] }) },

  /* ── Sitzend ─────────────────────────────────────────── */
  { id: 'schoss', n: 'Auf dem Schoß', g: 'Sitzend', s: 1,
    d: 'Der eine sitzt auf dem Stuhl, der andere rittlings darauf, Gesicht zu Gesicht.',
    m: 'stuhl', z: 'b',
    a: f(SITZ_R, 78, 100),
    b: f(HOCK_L, 114, 78, { arm: [198, 176, 222, 200] }) },

  { id: 'bettkante', n: 'Die Bettkante', g: 'Sitzend', s: 1,
    d: 'Einer sitzt auf der Kante, der andere steht davor und hält ihn fest.',
    m: 'kante', z: 'b',
    a: f(SITZ_R, 116, 104, { bein: [322, 296, 338, 302] }),
    b: f(STEH_L, 160, 88, { arm: [208, 200, 224, 216] }) },

  { id: 'tisch', n: 'Auf dem Tisch', g: 'Sitzend', s: 1,
    d: 'Einer liegt auf der Tischkante, der andere steht davor. Genau die richtige Höhe.',
    m: 'tisch', z: 'b',
    a: f(RUECK, 104, 88, { bein: [26, 16, 42, 32] }),
    b: f(STEH_L, 164, 88, { arm: [206, 198, 222, 214] }) },

  { id: 'kueche', n: 'Auf der Arbeitsplatte', g: 'Sitzend', s: 1,
    d: 'Sitzend auf der Küchenzeile, der andere steht dazwischen. Kein Bett nötig.',
    m: 'tisch', z: 'b',
    a: f(SITZ_R, 106, 88, { bein: [332, 306, 348, 316] }),
    b: f(STEH_L, 160, 88, { arm: [208, 200, 224, 216] }) },

  { id: 'treppe', n: 'Auf der Treppe', g: 'Sitzend', s: 2,
    d: 'Einer sitzt zwei Stufen höher, der andere kniet davor. Höhenunterschied inklusive.',
    m: 'treppe', z: 'b',
    a: f(SITZ_R, 58, 80, { bein: [330, 300, 344, 308] }),
    b: f(KNIE_L, 124, 86, { arm: [198, 214, 218, 234] }) },

  { id: 'sofaSitz', n: 'Zurückgelehnt', g: 'Sitzend', s: 1,
    d: 'Der Sitzende lehnt sich zurück, der andere sitzt darauf und lehnt sich mit.',
    m: 'sofa', z: 'b',
    a: f(SITZ_R, 70, 106, { t: 116, bl: 26, bein: [348, 356, 4, 352] }),
    b: f(HOCK_L, 100, 88, { t: 100, bl: 172, arm: [202, 180, 228, 206] }) },

  { id: 'thronSitz', n: 'Rücken an Brust', g: 'Sitzend', s: 1,
    d: 'Einer sitzt zwischen den Beinen des anderen und lehnt sich an. Nur Hände, kein Eindringen.',
    m: 'sofa', z: 'b',
    a: f(SITZ_R, 68, 104, { bein: [346, 354, 6, 350] }),
    b: f(SITZ_R, 100, 104, { t: 102, bl: 8, arm: [236, 206, 256, 226], bein: [338, 348, 354, 342] }) },

  { id: 'stuhlRueck', n: 'Auf dem Stuhl, abgewandt', g: 'Sitzend', s: 2,
    d: 'Rittlings auf dem Schoß, mit dem Rücken zum Sitzenden, weit nach vorn gelehnt.',
    m: 'stuhl', z: 'b',
    a: f(SITZ_R, 84, 100),
    b: f(VIER_R, 112, 80, { t: 28, bein: [300, 240, 316, 250] }) },

  { id: 'umarmung', n: 'Die Umarmung', g: 'Sitzend', s: 1,
    d: 'Beide sitzen ineinander verschränkt, die Arme umeinander. Fast kein Rhythmus, nur Nähe.',
    m: 'bett', z: 'b',
    a: f(SITZ_R, 100, 104, { arm: [14, 34, 346, 326], bein: [342, 18, 18, 342] }),
    b: f(HOCK_L, 126, 84, { arm: [190, 166, 214, 190] }) },

  /* ── Stehend ─────────────────────────────────────────── */
  { id: 'stehen', n: 'Stehend', g: 'Stehend', s: 2,
    d: 'Beide stehen, Gesicht zu Gesicht. Klappt am besten, wenn die Höhe passt.',
    m: 'boden', z: 'b',
    a: f(STEH_R, 100, 88, { arm: [338, 354, 22, 6] }),
    b: f(STEH_L, 142, 88, { arm: [202, 186, 158, 174] }) },

  { id: 'stehenHinten', n: 'Stehend von hinten', g: 'Stehend', s: 2,
    d: 'Beide stehen hintereinander, der Vordere beugt sich leicht vor.',
    m: 'boden', z: 'b',
    a: f(STEH_R, 140, 88, { t: 76, bl: 346 }),
    b: f(STEH_R, 112, 88, { arm: [348, 2, 10, 354] }) },

  { id: 'wand', n: 'An der Wand', g: 'Stehend', s: 2,
    d: 'Einer mit dem Rücken zur Wand, der andere davor. Ein Bein angehoben.',
    m: 'wand', z: 'b',
    a: f(STEH_R, 50, 88, { arm: [214, 244, 166, 196], bein: [270, 272, 20, 350] }),
    b: f(STEH_L, 94, 88, { arm: [196, 184, 214, 202] }) },

  { id: 'klammeraffe', n: 'Der Klammeraffe', g: 'Stehend', s: 3,
    d: 'Der eine wird hochgehoben und schlingt die Beine um die Hüfte. Kraft, Vertrauen, kurze Dauer.',
    m: 'wand', z: 'b',
    a: f(STEH_L, 92, 76, { t: 96, bl: 184, arm: [212, 244, 240, 270], bein: [198, 248, 218, 268] }),
    b: f(STEH_R, 70, 88, { arm: [22, 348, 6, 338] }) },

  { id: 'vorgebeugt', n: 'Vorgebeugt', g: 'Stehend', s: 2,
    d: 'Der Vordere stützt sich auf die Knie, der andere steht dahinter.',
    m: 'boden', z: 'b',
    a: f(STEH_R, 142, 84, { t: 40, bl: 330, arm: [300, 280, 320, 285] }),
    b: f(STEH_R, 110, 88, { arm: [340, 354, 14, 358] }) },

  { id: 'einBein', n: 'Ein Bein hoch', g: 'Stehend', s: 3,
    d: 'Stehend, ein Bein auf der Hüfte des anderen. Gleichgewicht ist die halbe Miete.',
    m: 'boden', z: 'b',
    a: f(STEH_R, 100, 88, { arm: [344, 358, 22, 8], bein: [268, 270, 344, 6] }),
    b: f(STEH_L, 140, 88, { arm: [198, 186, 216, 204] }) },

  { id: 'schubkarre', n: 'Die Schubkarre', g: 'Stehend', s: 3,
    d: 'Der eine geht auf die Hände, der andere hält die Beine wie einen Karren. Kurz und laut.',
    m: 'boden', z: 'b',
    a: f(VIER_R, 92, 98, { t: 196, bl: 250, arm: [250, 268, 264, 272], bein: [10, 6, 350, 354] }),
    b: f(STEH_L, 152, 88, { arm: [200, 190, 214, 204] }) },

  { id: 'spiegel', n: 'Vor dem Spiegel', g: 'Stehend', s: 2,
    d: 'Beide stehen hintereinander vor dem Spiegel. Man sieht sich selbst zusehen.',
    m: 'wand', z: 'b',
    a: f(STEH_L, 72, 88, { t: 96, bl: 184, arm: [180, 160, 200, 180] }),
    b: f(STEH_L, 100, 88, { arm: [192, 178, 168, 184] }) },

  { id: 'dusche', n: 'In der Dusche', g: 'Stehend', s: 2,
    d: 'Einer mit dem Gesicht zur Wand, der andere dahinter. Warm, rutschig, laut.',
    m: 'dusche', z: 'b',
    a: f(STEH_L, 64, 88, { t: 94, bl: 184, arm: [176, 166, 196, 186] }),
    b: f(STEH_L, 94, 88, { arm: [188, 174, 164, 180] }) },

  { id: 'stufe', n: 'Eine Stufe höher', g: 'Stehend', s: 2,
    d: 'Einer steht eine Stufe höher — plötzlich passt die Höhe.',
    m: 'treppe', z: 'b',
    a: f(STEH_R, 118, 65, { t: 76, bl: 348, arm: [316, 300, 336, 320] }),
    b: f(STEH_R, 156, 83, { arm: [186, 176, 200, 190] }) },

  /* ── Mund und Hände ──────────────────────────────────── */
  { id: 'neunSechzig', n: 'Neunundsechzig', g: 'Mund und Hände', s: 2,
    d: 'Kopf an Fuß übereinander, beide gleichzeitig. Braucht Konzentration von beiden.',
    m: 'bett', z: 'b',
    a: f(RUECK, 112, 108, { arm: [340, 350, 20, 10], bein: [356, 2, 4, 358] }),
    b: f(BAUCH_R, 128, 88, { t: 4, bl: 286, arm: [200, 250, 160, 110], bein: [186, 180, 174, 180] }) },

  { id: 'thron', n: 'Der Thron', g: 'Mund und Hände', s: 2,
    d: 'Einer liegt auf dem Rücken, der andere kniet über dem Gesicht.',
    m: 'bett', z: 'b',
    a: f(RUECK, 124, 108, { bein: [356, 2, 4, 358] }),
    b: f(KNIE_R, 84, 91, { arm: [340, 320, 20, 40] }) },

  { id: 'knienDavor', n: 'Kniend davor', g: 'Mund und Hände', s: 1,
    d: 'Einer steht, der andere kniet davor. Eine Hand in den Haaren, wenn beide wollen.',
    m: 'boden', z: 'b',
    a: f(STEH_R, 96, 88, { arm: [338, 354, 18, 2] }),
    b: f(KNIE_L, 142, 110, { arm: [192, 206, 212, 226] }) },

  { id: 'kante', n: 'Über die Kante', g: 'Mund und Hände', s: 3,
    d: 'Der Kopf hängt über die Bettkante nach hinten, der andere steht davor. Ungewohnt und intensiv.',
    m: 'kanteR', z: 'b',
    a: f(RUECK, 150, 106, { t: 196, bl: 106, arm: [330, 300, 20, 50], bein: [354, 0, 6, 0] }),
    b: f(STEH_R, 86, 88, { t: 86, bl: 0, arm: [352, 6, 8, 358] }) },

  { id: 'nebeneinander', n: 'Nebeneinander', g: 'Mund und Hände', s: 1,
    d: 'Beide liegen auf dem Rücken, nur die Hände arbeiten. Man sieht dem anderen dabei zu.',
    m: 'bett', z: 'b',
    a: f(RUECK, 92, 98, { arm: [338, 346, 14, 348] }),
    b: f(RUECK, 116, 112, { arm: [344, 352, 20, 4] }) },

  { id: 'schosskissen', n: 'Kopf im Schoß', g: 'Mund und Hände', s: 1,
    d: 'Einer sitzt angelehnt, der andere liegt quer mit dem Kopf im Schoß.',
    m: 'sofa', z: 'b',
    a: f(SITZ_R, 66, 104, { bein: [348, 356, 4, 352] }),
    b: f(RUECK_R, 146, 114, { arm: [200, 190, 160, 170], bein: [184, 178, 176, 182] }) },

  { id: 'gefesselt', n: 'Hände über dem Kopf', g: 'Mund und Hände', s: 2,
    d: 'Der Liegende hat die Arme über dem Kopf, der andere hält die Handgelenke.',
    m: 'bett', z: 'b',
    a: f(RUECK, 112, 108, { arm: [172, 178, 188, 182], bein: [18, 342, 30, 334] }),
    b: f(BAUCH, 132, 88, { t: 170, bl: 244, arm: [208, 216, 198, 206], bein: [350, 356, 2, 350] }) },

  { id: 'augenbinde', n: 'Mit verbundenen Augen', g: 'Mund und Hände', s: 1,
    d: 'Einer sieht nichts und weiß nie, was als Nächstes kommt. Alles fühlt sich doppelt an.',
    m: 'bett', z: 'b',
    a: f(RUECK, 104, 108, { bl: null, arm: [340, 350, 18, 8], bein: [12, 348, 26, 340] }),
    b: f(KNIE_L, 148, 92, { arm: [196, 214, 218, 236] }) }
];

/** Nur die Ordnung, in der die Gruppen in Listen erscheinen. */
export const GRUPPEN = ['Liegend', 'Oben sitzen', 'Von hinten', 'Seitlich', 'Sitzend', 'Stehend', 'Mund und Hände'];

export const stellungById = (id) => STELLUNGEN.find((s) => s.id === id);

/** Wie anstrengend? Nur ein Hinweis, keine Wertung. */
export const GANGART = { 1: 'Geht immer', 2: 'Etwas Übung', 3: 'Sportlich' };
