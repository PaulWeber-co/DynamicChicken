/**
 * Wie lange bräuchte man zueinander?
 *
 * Die Luftlinie allein sagt wenig. „356 Kilometer" klingt nach viel; dass
 * das vier Stunden Autobahn sind, kann man sich vorstellen. Deshalb steht
 * neben der Zahl eine Zeit.
 *
 * Gerechnet, nicht abgefragt — und das ist eine bewusste Entscheidung:
 *
 *   Ein echter Routendienst (Google, OSRM, wie auch immer) müsste beide
 *   Positionen an einen Dritten schicken, bei jedem Standortwechsel neu.
 *   Diese App gibt bisher nichts nach außen außer dem groben Ort ans
 *   Wetter, und das soll so bleiben. Dazu käme ein Schlüssel oder ein
 *   Server — beides hat eine statische Seite auf GitHub Pages nicht — und
 *   eine Karte, die ohne Netz leer bliebe.
 *
 *   Der Preis: Es ist eine Schätzung, keine Route. Sie kennt keine Fähre,
 *   keine Alpenüberquerung und keine Baustelle. Deshalb steht überall
 *   „etwa" davor.
 *
 * Wie gut die Schätzung ist, steht in `EICHUNG` weiter unten: vierunddreißig
 * echte Strecken mit den Zeiten, die ein Routenplaner beziehungsweise die
 * Bahn ausgibt. Der Test rechnet sie nach — beim Auto liegt die mittlere
 * Abweichung bei fünf Prozent, bei der Bahn bei knapp vierzehn. Die Bahn
 * streut stärker, weil eine Schnellfahrstrecke den Unterschied macht und
 * die Luftlinie davon nichts weiß.
 */

/**
 * Umwegfaktor: Straßenkilometer je Luftlinienkilometer.
 *
 * Kurze Strecken sind am krummsten — innerorts fährt man um Blocks, über
 * Brücken und durch Einbahnstraßen. Auf langen Strecken nähert sich die
 * Autobahn der Geraden an, kommt ihr aber nie ganz nahe.
 */
export const umweg = (km) => 1.14 + 0.60 * Math.exp(-km / 40);

/**
 * Reisegeschwindigkeit auf der Straße, abhängig von der Streckenlänge.
 *
 * Nicht die Höchstgeschwindigkeit, sondern das, was am Ende herauskommt:
 * Ortsdurchfahrt, Ampeln und Parkplatzsuche fressen die ersten Kilometer,
 * ab etwa dreihundert Kilometern ist es fast reine Autobahn.
 */
export const tempoAuto = (strasse) => 91 - 73 * Math.exp(-strasse / 30);

/**
 * Bahn: Zuschlag plus Fahrt.
 *
 * Der Zuschlag ist der Teil, den kein Fahrplan zeigt — hin zum Bahnhof,
 * warten, umsteigen, am Ziel weiter. Ohne ihn wäre die Zahl schöner als
 * die Wirklichkeit. Das Tempo ist ein Mittel aus Schnellfahrstrecke und
 * Regionalbahn; wo eine ICE-Trasse liegt, ist die Bahn schneller als hier
 * geschätzt, quer durch die Provinz langsamer.
 */
export const ZUG_ZUSCHLAG = 28;      // Minuten
export const ZUG_TEMPO = 120;        // km/h auf der Schiene
export const ZUG_UMWEG = 1.15;       // Schiene je Luftlinie

/** Flug: der Weg zum Flughafen ist länger als der Flug selbst kurz ist. */
export const FLUG_ZUSCHLAG = 165;    // Minuten für Anfahrt, Abfertigung, Ankunft
export const FLUG_TEMPO = 720;       // km/h über Grund

/**
 * Ab hier lohnt sich Fahren nicht mehr.
 *
 * Keine Grenze der Rechnung, sondern eine der Ehrlichkeit: Über
 * anderthalbtausend Kilometer liegt fast immer Wasser, ein Gebirge oder
 * eine Grenze im Weg, und niemand setzt sich dafür ins Auto.
 */
export const FAHR_GRENZE = 1500;

const minuten = (m) => Math.max(1, Math.round(m));

/**
 * Alle Zeiten zu einer Luftlinie.
 *
 * @param {number} km Luftlinie in Kilometern
 * @returns {{auto:number|null, zug:number|null, flug:number|null, strasse:number}}
 *          Zeiten in Minuten; `null` heißt „ergibt hier keinen Sinn".
 */
export function reisezeiten(km) {
  if (!Number.isFinite(km) || km < 0) return { auto: null, zug: null, flug: null, strasse: 0 };

  const strasse = km * umweg(km);
  const weit = km > FAHR_GRENZE;

  return {
    strasse,
    auto: weit ? null : minuten((strasse / tempoAuto(strasse)) * 60),
    // Unter fünf Kilometern ist die Bahn eine Farce: Man ist zu Fuß da,
    // bevor der Zuschlag abgelaufen wäre.
    zug: weit || km < 5 ? null : minuten(ZUG_ZUSCHLAG + (km * ZUG_UMWEG / ZUG_TEMPO) * 60),
    // Fliegen erst, wenn es die anderen beiden schlägt
    flug: km < 600 ? null : minuten(FLUG_ZUSCHLAG + (km / FLUG_TEMPO) * 60)
  };
}

/** „4 Std. 20" — Minuten unter einer Stunde bleiben Minuten. */
export function dauer(min) {
  if (min == null) return '';
  if (min < 60) return `${min} Min.`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} Std. ${String(m).padStart(2, '0')}` : `${h} Std.`;
}

/**
 * Die Zeilen, die auf der Karte stehen — schon sortiert.
 *
 * Was am schnellsten geht, steht oben. Zu Fuß und mit dem Rad nur dann,
 * wenn es überhaupt eine Möglichkeit ist; sonst wäre „312 Std. zu Fuß" der
 * Witz, den niemand zweimal hören will.
 */
export function reiseZeilen(km) {
  if (!Number.isFinite(km) || km == null) return [];
  const t = reisezeiten(km);
  const zeilen = [];

  if (km < 6) zeilen.push({ id: 'fuss', icon: 'wegFuss', label: 'zu Fuß', min: minuten((km / 4.6) * 60) });
  if (km < 25) zeilen.push({ id: 'rad', icon: 'wegRad', label: 'mit dem Rad', min: minuten((km * 1.25 / 16) * 60) });
  if (t.auto != null) zeilen.push({ id: 'auto', icon: 'wegAuto', label: 'mit dem Auto', min: t.auto });
  if (t.zug != null) zeilen.push({ id: 'zug', icon: 'wegZug', label: 'mit dem Zug', min: t.zug });
  if (t.flug != null) zeilen.push({ id: 'flug', icon: 'wegFlug', label: 'mit dem Flugzeug', min: t.flug });

  return zeilen.sort((a, b) => a.min - b.min);
}

/**
 * Echte Strecken zum Nachrechnen.
 *
 * `km` ist die Luftlinie, `auto` und `zug` sind die Zeiten in Minuten, die
 * ein Routenplaner beziehungsweise die Bahn für die Verbindung angibt (bei
 * der Bahn inklusive der rund zwanzig Minuten, die man vor und nach dem
 * Zug braucht). Der Test in `reise.mjs` prüft damit, dass die Formeln
 * nicht wegdriften — und die vier Stadtstrecken oben sorgen dafür, dass die
 * Kurve auch unter zwanzig Kilometern etwas Vernünftiges tut, wo keine
 * Fernverbindung sie mehr festhält.
 */
export const EICHUNG = [
  /* Innerorts — hier entscheidet nicht die Autobahn, sondern die Ampel */
  { von: 'quer durch', nach: 'die Stadt', km: 2,  auto: 8,  zug: null },
  { von: 'ein Stadtteil', nach: 'weiter', km: 5,  auto: 14, zug: null },
  { von: 'Vorort', nach: 'Zentrum',    km: 10,  auto: 20, zug: null },
  { von: 'Nachbarort', nach: 'Stadt',  km: 15,  auto: 25, zug: null },

  { von: 'Köln', nach: 'Bonn',        km: 24,  auto: 30,  zug: 45 },
  { von: 'Köln', nach: 'Düsseldorf',  km: 35,  auto: 42,  zug: 48 },
  { von: 'Köln', nach: 'Dortmund',    km: 76,  auto: 65,  zug: 80 },
  { von: 'Köln', nach: 'Frankfurt',   km: 152, auto: 120, zug: 90 },
  { von: 'Köln', nach: 'Hamburg',     km: 356, auto: 250, zug: 270 },
  { von: 'Köln', nach: 'Berlin',      km: 477, auto: 340, zug: 285 },
  { von: 'Köln', nach: 'München',     km: 456, auto: 345, zug: 290 },
  { von: 'Köln', nach: 'Dresden',     km: 470, auto: 340, zug: 350 },
  { von: 'Hamburg', nach: 'Berlin',   km: 255, auto: 185, zug: 135 },
  { von: 'Hamburg', nach: 'München',  km: 505, auto: 440, zug: 375 },
  { von: 'Hamburg', nach: 'Bremen',   km: 95,  auto: 75,  zug: 80 },
  { von: 'Hamburg', nach: 'Hannover', km: 132, auto: 100, zug: 100 },
  { von: 'Berlin', nach: 'München',   km: 504, auto: 350, zug: 265 },
  { von: 'Berlin', nach: 'Leipzig',   km: 150, auto: 120, zug: 105 },
  { von: 'Berlin', nach: 'Dresden',   km: 165, auto: 125, zug: 145 },
  { von: 'Frankfurt', nach: 'München', km: 304, auto: 230, zug: 210 },
  { von: 'Frankfurt', nach: 'Stuttgart', km: 152, auto: 125, zug: 110 },
  { von: 'Frankfurt', nach: 'Hamburg', km: 393, auto: 285, zug: 250 },
  { von: 'Stuttgart', nach: 'München', km: 191, auto: 140, zug: 155 },
  { von: 'Stuttgart', nach: 'Hamburg', km: 535, auto: 390, zug: 350 },
  { von: 'München', nach: 'Nürnberg', km: 151, auto: 115, zug: 90 },
  { von: 'München', nach: 'Wien',     km: 355, auto: 260, zug: 275 },
  { von: 'München', nach: 'Zürich',   km: 240, auto: 205, zug: 240 },
  { von: 'Köln', nach: 'Amsterdam',   km: 200, auto: 175, zug: 190 },
  { von: 'Köln', nach: 'Brüssel',     km: 175, auto: 145, zug: 130 },
  { von: 'Köln', nach: 'Paris',       km: 405, auto: 300, zug: 245 },
  { von: 'Berlin', nach: 'Warschau',  km: 520, auto: 350, zug: 380 },
  { von: 'Berlin', nach: 'Prag',      km: 280, auto: 220, zug: 275 },
  { von: 'Hamburg', nach: 'Kopenhagen', km: 290, auto: 275, zug: 315 },
  { von: 'Leipzig', nach: 'Erfurt',   km: 93,  auto: 80,  zug: 70 }
];
