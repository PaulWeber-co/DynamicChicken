/**
 * Die Physik der Federschleuder.
 *
 * Eine kleine, ehrliche Starrkörper-Simulation: Kisten als achsenparallele
 * Rechtecke mit Masse, Geschwindigkeit und Gesundheit, dazu ein rundes Ei.
 * Keine Rotation — das spart die Hälfte des Codes und sieht trotzdem
 * richtig aus, weil Kisten stattdessen *kippen* dürfen: Wer zu weit über
 * der Kante hängt, legt sich hin, und das ist genau der Moment, den man in
 * so einem Spiel sehen will.
 *
 * Warum überhaupt selbst geschrieben statt einer Bibliothek? Weil beide
 * Geräte dasselbe Ergebnis brauchen. Die Simulation läuft mit festem
 * Zeitschritt und ausschließlich mit Grundrechenarten und `Math.sqrt` —
 * alles davon ist nach IEEE 754 exakt definiert. Derselbe Bau plus dieselben
 * Schüsse ergeben auf beiden Seiten denselben Trümmerhaufen.
 *
 * Der Kern in vier Zeilen:
 *   1. Schwerkraft aufaddieren, Positionen fortschreiben
 *   2. Überlappungen suchen und mit einem Impuls auseinanderdrücken
 *   3. Reibung an den Kontaktstellen
 *   4. Was fast steht, einschlafen lassen — sonst zittert der Stapel ewig
 */

export const SCHWERKRAFT = 900;
export const SCHRITT = 1 / 120;      // fester Zeitschritt
const RUHE = 12;                     // darunter gilt ein Körper als still
const RUHE_ZEIT = 0.3;               // so lange, dann schläft er
const ELAST = 0.05;                  // wie stark Kisten zurückfedern
const REIBUNG = 0.6;
const KORREKTUR = 0.5;               // wie hart Überlappungen aufgelöst werden
const SLOP = 0.5;                    // erlaubte Restüberlappung
const RUNDEN = 4;                    // Auflösungsdurchgänge pro Schritt

/**
 * Ab welcher Aufprallgeschwindigkeit tut ein Stoß weh — und wie sehr.
 *
 * Zwei getrennte Sätze, weil sich sonst kein vernünftiges Spiel einstellt:
 * Fällt eine Kiste zwei Meter tief, soll sie nicht zerspringen (sonst löst
 * sich der Bau nach dem ersten Streifschuss von allein auf), ein Ei dagegen
 * soll deutlich mehr anrichten als sein Gewicht hergibt. Füchse sind weich.
 */
const STOSS_AB = 260, STOSS_MAL = 0.12;
const EI_AB = 60, EI_MAL = 0.6;
const FUCHS_AB = 120, FUCHS_MAL = 0.5;

/** Baustoffe: Gewicht, Härte, Wert. */
export const STOFFE = {
  holz:  { leben: 90,  masse: 1.0, punkte: 10, farbe: '#C99268', kante: '#A9724A' },
  glas:  { leben: 30,  masse: 0.6, punkte: 15, farbe: '#A9D6F5', kante: '#7FB9E4' },
  stein: { leben: 220, masse: 2.4, punkte: 25, farbe: '#B9AFA2', kante: '#8E857A' }
};

export const EI_R = 10;
const EI_MASSE = 1.6;

/** Ein Körper aus der Level-Beschreibung. */
export function kiste(x, y, w, h, stoff) {
  const s = STOFFE[stoff];
  return {
    x, y, w, h, stoff,
    vx: 0, vy: 0,
    leben: s.leben, maxLeben: s.leben,
    masse: s.masse * (w * h) / 3600,
    weg: false, schlaeft: false, still: 0
  };
}

/** Ein Fuchs — rund, leicht, empfindlich. */
export function fuchs(x, y) {
  return { x, y, r: 15, vx: 0, vy: 0, leben: 40, weg: false, schlaeft: false, still: 0 };
}

const boden = (k) => k.y;
const oben = (k) => k.y + k.h;
const links = (k) => k.x;
const rechts = (k) => k.x + k.w;

/**
 * Ein Simulationsschritt.
 *
 * @param {object} welt  { kisten, fuechse, ei, boden }
 * @param {function} beiSchaden  (körper, wucht) — für Punkte und Funken
 * @returns {boolean} bewegt sich noch irgendetwas?
 */
export function schritt(welt, beiSchaden = () => {}) {
  const dt = SCHRITT;
  const koerper = [...welt.kisten, ...welt.fuechse].filter((k) => !k.weg);
  let bewegt = false;

  /* 1 — Schwerkraft und Bewegung */
  for (const k of koerper) {
    if (k.schlaeft) continue;
    k.vy -= SCHWERKRAFT * dt;
    k.x += k.vx * dt;
    k.y += k.vy * dt;
  }
  if (welt.ei) {
    welt.ei.vy -= SCHWERKRAFT * dt;
    welt.ei.x += welt.ei.vx * dt;
    welt.ei.y += welt.ei.vy * dt;
  }

  /* 2 — Boden */
  for (const k of koerper) {
    const unten = k.r != null ? k.y - k.r : k.y;
    if (unten >= 0) continue;
    const tief = -unten;
    k.y += tief;
    if (k.vy < 0) {
      schaden(k, trefferSchaden(k, -k.vy, false), beiSchaden);
      k.vy = -k.vy * ELAST;
      k.vx *= 1 - REIBUNG * 0.6;
    }
  }

  /**
   * 3 — Körper gegen Körper, mehrfach.
   *
   * Ein einzelner Durchgang reicht bei gestapelten Kisten nicht: Die unterste
   * wird nach oben geschoben, drückt dabei in die darüber, und das bleibt bis
   * zum nächsten Bild stehen. Über ein paar Sekunden sackt der Turm dadurch
   * sichtbar zusammen. Vier Durchgänge pro Schritt reichen für vier Etagen.
   */
  for (let runde = 0; runde < RUNDEN; runde++) {
    for (let i = 0; i < koerper.length; i++) {
      for (let j = i + 1; j < koerper.length; j++) {
        stoss(koerper[i], koerper[j], beiSchaden, runde === 0);
      }
    }
  }

  /* 3b — Boden nachziehen: Kontakte können Körper darunter gedrückt haben */
  for (const k of koerper) {
    const unten = k.r != null ? k.y - k.r : k.y;
    if (unten < 0) { k.y -= unten; if (k.vy < 0) k.vy = 0; }
  }

  /* 4 — Das Ei gegen alles */
  if (welt.ei) {
    for (const k of koerper) eiGegen(welt.ei, k, beiSchaden);
    if (welt.ei.y - EI_R < 0) {
      welt.ei.y = EI_R;
      welt.ei.vy = -welt.ei.vy * 0.3;
      welt.ei.vx *= 0.7;
    }
  }

  /**
   * 5 — Kippen.
   *
   * Ohne Drehung sähe ein Turm beim Einsturz aus wie ein Regal, das jemand
   * ordentlich abbaut. Deshalb der eine Sonderfall: Liegt der Schwerpunkt
   * eines stehenden Teils außerhalb dessen, worauf es steht, legt es sich
   * hin — Breite und Höhe tauschen, ein kleiner Schubs in die Fallrichtung.
   * Das ist eine Abkürzung, aber es ist genau die Bewegung, auf die man in
   * diesem Spiel wartet.
   */
  for (const k of welt.kisten) {
    if (k.weg || k.h <= k.w * 1.4) continue;
    const st = auflageBereich(k, welt.kisten);
    if (!st) continue;
    const mitte = k.x + k.w / 2;
    const rand = k.w * 0.15;
    const kippt = mitte < st.von - rand ? -1 : mitte > st.bis + rand ? 1 : 0;
    if (!kippt) continue;
    const alt = { w: k.w, h: k.h };
    k.w = alt.h; k.h = alt.w;
    k.x = mitte - k.w / 2 + kippt * k.w * 0.2;
    k.vx += kippt * 110;
    k.vy -= 20;
    k.schlaeft = false;
    k.still = 0;
  }

  /**
   * 6 — Einschlafen, gemessen an der Strecke statt an der Geschwindigkeit.
   *
   * Ein ruhender Stapel behält eine kleine Restgeschwindigkeit: Die
   * Schwerkraft schiebt jeden Schritt nach unten, der Kontakt drückt zurück,
   * und übrig bleibt ein Zappeln von ein paar Pixeln pro Sekunde. Nach
   * `vy` würde deshalb nie etwas einschlafen und die Runde nie enden.
   * Was sich über eine Drittelsekunde nicht bewegt hat, liegt aber
   * offensichtlich still — egal, was in seinem Geschwindigkeitsfeld steht.
   */
  for (const k of koerper) {
    if (k.schlaeft) continue;
    const weit = Math.abs(k.x - (k.px ?? k.x)) + Math.abs(k.y - (k.py ?? k.y));
    k.px = k.x; k.py = k.y;
    if (weit < 0.35) {
      k.still += dt;
      if (k.still > RUHE_ZEIT) { k.schlaeft = true; k.vx = 0; k.vy = 0; }
    } else {
      k.still = 0;
      bewegt = true;
    }
  }
  if (welt.ei) bewegt = true;
  return bewegt;
}

/** Von wo bis wo wird eine Kiste unterstützt? `null`, wenn sie frei hängt. */
function auflageBereich(k, kisten) {
  let von = Infinity, bis = -Infinity;
  if (boden(k) < 2) { von = links(k); bis = rechts(k); }
  for (const o of kisten) {
    if (o === k || o.weg) continue;
    if (Math.abs(oben(o) - boden(k)) > 4) continue;
    const l = Math.max(links(k), links(o));
    const r = Math.min(rechts(k), rechts(o));
    if (r <= l) continue;
    von = Math.min(von, l);
    bis = Math.max(bis, r);
  }
  return bis > von ? { von, bis } : null;
}

/**
 * Schaden aus einer Aufprallgeschwindigkeit — je nachdem, was getroffen wird.
 * Unterhalb der Schwelle passiert gar nichts; ein ruhender Stapel darf sich
 * nicht von selbst zerlegen.
 */
function trefferSchaden(k, tempo, vomEi) {
  const [ab, mal] = vomEi ? [EI_AB, EI_MAL] : k.r != null ? [FUCHS_AB, FUCHS_MAL] : [STOSS_AB, STOSS_MAL];
  return tempo > ab ? (tempo - ab) * mal : 0;
}

function schaden(k, wucht, beiSchaden) {
  if (wucht <= 0 || k.weg) return;
  k.leben -= wucht;
  k.schlaeft = false;
  k.still = 0;
  if (k.leben <= 0) { k.weg = true; beiSchaden(k, wucht, true); }
  else beiSchaden(k, wucht, false);
}

/**
 * Zwei Körper auseinanderdrücken und Impuls austauschen.
 *
 * `zaehlt` sagt, ob dieser Durchgang Schaden verursachen darf — nur der
 * erste tut das. Sonst würde derselbe Aufprall viermal pro Schritt zählen
 * und alles zerspringen.
 */
function stoss(a, b, beiSchaden, zaehlt) {
  const ab = box(a), bb = box(b);
  const dx = Math.min(bb.r - ab.l, ab.r - bb.l);
  const dy = Math.min(bb.o - ab.u, ab.o - bb.u);
  if (dx <= 0 || dy <= 0) return;

  /**
   * Flachste Richtung ist die Trennachse. Die Normale zeigt von A nach B —
   * daran hängt jedes Vorzeichen weiter unten, und ein Dreher hier bedeutet,
   * dass genau die zusammenstoßenden Körper *nicht* behandelt werden.
   */
  let nx = 0, ny = 0, tief;
  if (dx < dy) {
    tief = dx;
    nx = (ab.l + ab.r) < (bb.l + bb.r) ? 1 : -1;
  } else {
    tief = dy;
    ny = (ab.u + ab.o) < (bb.u + bb.o) ? 1 : -1;
  }

  const ma = a.masse ?? 1, mb = b.masse ?? 1;
  const summe = ma + mb;
  if (a.schlaeft && b.schlaeft) return;

  const rvx = (b.vx || 0) - (a.vx || 0);
  const rvy = (b.vy || 0) - (a.vy || 0);
  const rel = rvx * nx + rvy * ny;      // > 0 heißt: sie entfernen sich

  // Ein wirklich harter Stoß weckt auch einen schlafenden Nachbarn
  if (-rel > RUHE * 2) { a.schlaeft = false; b.schlaeft = false; }

  // Positionen korrigieren — mit etwas Restüberlappung, sonst pumpt der Stapel
  const schub = (Math.max(0, tief - SLOP) * KORREKTUR) / summe;
  if (!a.schlaeft) { a.x -= nx * schub * mb; a.y -= ny * schub * mb; }
  if (!b.schlaeft) { b.x += nx * schub * ma; b.y += ny * schub * ma; }

  if (rel > 0) return;                       // entfernen sich schon
  const wucht = -rel;

  const j = -(1 + ELAST) * rel / (1 / ma + 1 / mb);
  if (!a.schlaeft) { a.vx -= (j * nx) / ma; a.vy -= (j * ny) / ma; }
  if (!b.schlaeft) { b.vx += (j * nx) / mb; b.vy += (j * ny) / mb; }

  // Reibung quer zur Normalen
  const tx = -ny, ty = nx;
  const relT = rvx * tx + rvy * ty;
  const jt = -relT * REIBUNG / (1 / ma + 1 / mb);
  if (!a.schlaeft) { a.vx -= (jt * tx) / ma; a.vy -= (jt * ty) / ma; }
  if (!b.schlaeft) { b.vx += (jt * tx) / mb; b.vy += (jt * ty) / mb; }

  // Nur ein spürbarer Stoß hält die Körper wach und macht kaputt
  if (wucht > RUHE) { a.still = 0; b.still = 0; }
  if (zaehlt) {
    schaden(a, trefferSchaden(a, wucht, false), beiSchaden);
    schaden(b, trefferSchaden(b, wucht, false), beiSchaden);
  }
}

/** Das Ei ist rund und schwer — es prallt ab und teilt aus. */
function eiGegen(ei, k, beiSchaden) {
  const kb = box(k);
  const nx = Math.max(kb.l, Math.min(ei.x, kb.r));
  const ny = Math.max(kb.u, Math.min(ei.y, kb.o));
  const dx = ei.x - nx, dy = ei.y - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= EI_R * EI_R) return;

  const d = Math.sqrt(d2) || 0.001;
  const ux = dx / d, uy = dy / d;
  const tief = EI_R - d;

  const wucht = Math.hypot(ei.vx - (k.vx || 0), ei.vy - (k.vy || 0));
  const mk = k.masse ?? 1;

  ei.x += ux * tief * 0.8;
  ei.y += uy * tief * 0.8;

  const rel = (ei.vx - (k.vx || 0)) * ux + (ei.vy - (k.vy || 0)) * uy;
  if (rel < 0) {
    const j = -(1 + 0.18) * rel / (1 / EI_MASSE + 1 / mk);
    ei.vx += (j * ux) / EI_MASSE;
    ei.vy += (j * uy) / EI_MASSE;
    if (!k.schlaeft || wucht > 40) {
      k.vx -= (j * ux) / mk;
      k.vy -= (j * uy) / mk;
      k.schlaeft = false;
      k.still = 0;
    }
  }
  // Ein Ei tut mehr weh als seine Masse hergibt — sonst wäre es nutzlos
  schaden(k, trefferSchaden(k, wucht, true), beiSchaden);
}

const box = (k) => k.r != null
  ? { l: k.x - k.r, r: k.x + k.r, u: k.y - k.r, o: k.y + k.r }
  : { l: k.x, r: k.x + k.w, u: k.y, o: k.y + k.h };
