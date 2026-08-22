/**
 * Der eigene Standort, automatisch.
 *
 * Das Gerät weiß, wo es ist; die App muss nur fragen und das Ergebnis
 * weitergeben. Interessant sind dabei nicht die Koordinaten, sondern die
 * drei Regeln drumherum:
 *
 *   Sparsam fragen. Ein Dauerabo auf GPS („watchPosition" mit hoher
 *   Genauigkeit) frisst Akku, und für „in welcher Stadt ist mein Mensch"
 *   ist es maßlos. Also: eine Abfrage beim Öffnen, eine beim Zurückkommen,
 *   sonst ein sehr ruhiger Takt — und immer mit `enableHighAccuracy: false`,
 *   damit das Funknetz reicht und der GPS-Chip aus bleibt.
 *
 *   Sparsam senden. Jede Bewegung weiterzugeben hieße im Brieftauben-Modus,
 *   den Code mit Positionen vollzuschreiben. Also erst, wenn es sich lohnt:
 *   mindestens `MIN_KM` weiter oder `MIN_MIN` Minuten her.
 *
 *   Sparsam speichern. Was der Partner bekommt, ist auf zwei
 *   Nachkommastellen gerundet — gut einen Kilometer genau. Das ist dieselbe
 *   Grenze, die auch der selbst gesetzte Ort hat, und sie ist Absicht: die
 *   Stadt ja, die Straße nicht.
 */

/** Ab dieser Verschiebung lohnt sich eine neue Nachricht. */
export const MIN_KM = 2;
/** … oder nach so vielen Minuten, auch wenn man sich kaum bewegt hat. */
export const MIN_MIN = 30;
/** Takt, solange die App offen im Vordergrund liegt. */
export const TAKT_MS = 10 * 60 * 1000;

export const verfuegbar = () => typeof navigator !== 'undefined' && 'geolocation' in navigator;

/**
 * Steht die Erlaubnis schon fest?
 * @returns {Promise<'granted'|'denied'|'prompt'|'unknown'>}
 */
export async function erlaubnis() {
  if (!verfuegbar()) return 'denied';
  try {
    const r = await navigator.permissions?.query({ name: 'geolocation' });
    return r?.state || 'unknown';
  } catch {
    // Safari kannte `permissions.query` für Geolocation lange nicht
    return 'unknown';
  }
}

/**
 * Einmal nachsehen, wo wir sind.
 *
 * @param {{genau?:boolean, alter?:number, warten?:number}} opts
 * @returns {Promise<{lat:number, lon:number, genauigkeit:number, at:number}>}
 */
export function position({ genau = false, alter = 5 * 60 * 1000, warten = 12000 } = {}) {
  return new Promise((ok, fehler) => {
    if (!verfuegbar()) { fehler(new Error('Kein Standort verfügbar')); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => ok({
        lat: p.coords.latitude,
        lon: p.coords.longitude,
        genauigkeit: Math.round(p.coords.accuracy || 0),
        at: p.timestamp || Date.now()
      }),
      (e) => fehler(e),
      { enableHighAccuracy: genau, maximumAge: alter, timeout: warten }
    );
  });
}

/** Luftlinie in Kilometern — klein gehalten, damit dieses Modul allein steht. */
export function abstandKm(a, b) {
  if (!a || !b) return Infinity;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Lohnt sich diese Meldung?
 *
 * @param {{lat,lon}|null} alt   der zuletzt gemeldete Ort
 * @param {{lat,lon}} neu        der frische
 * @param {number} seit          Zeitstempel der letzten Meldung
 */
export function lohntSich(alt, neu, seit, jetzt = Date.now()) {
  if (!alt) return true;
  if (abstandKm(alt, neu) >= MIN_KM) return true;
  return jetzt - (seit || 0) >= MIN_MIN * 60 * 1000;
}

/* ── Der laufende Betrieb ───────────────────────────────── */

let timer = 0;
let abmelden = null;
let laeuft = false;

/**
 * Standort im Auge behalten, solange die App offen ist.
 *
 * `onFix` bekommt jede frische Position — ob daraus eine Nachricht wird,
 * entscheidet der Aufrufer mit `lohntSich`. Fehler werden geschluckt: Wer
 * die Erlaubnis verweigert oder im Keller sitzt, soll keine Fehlermeldung
 * bekommen, sondern einfach den zuletzt bekannten Ort behalten.
 */
export function starte(onFix, onFehler) {
  stoppe();
  if (!verfuegbar()) return () => {};
  laeuft = true;

  const holen = async () => {
    if (!laeuft || document.visibilityState !== 'visible') return;
    try {
      onFix(await position());
    } catch (e) {
      onFehler?.(e);
    }
  };

  const beiRueckkehr = () => { if (document.visibilityState === 'visible') holen(); };
  document.addEventListener('visibilitychange', beiRueckkehr);
  timer = setInterval(holen, TAKT_MS);
  holen();

  abmelden = () => document.removeEventListener('visibilitychange', beiRueckkehr);
  return stoppe;
}

export function stoppe() {
  laeuft = false;
  if (timer) { clearInterval(timer); timer = 0; }
  if (abmelden) { abmelden(); abmelden = null; }
}

export const istAktiv = () => laeuft;
