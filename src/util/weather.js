/**
 * Wetter am Ort des anderen.
 *
 * Quelle ist Open-Meteo: kein Schlüssel, kein Konto, CORS erlaubt. Damit
 * funktioniert es auch von einer statischen Seite auf GitHub Pages aus,
 * ohne dass irgendwo ein Server oder ein Geheimnis liegen müsste.
 *
 * Zum Ort: gespeichert wird nur, was ihr selbst ausgesucht habt, und das
 * auf zwei Nachkommastellen gerundet — etwa ein Kilometer genau. Das reicht
 * fürs Wetter und verrät keine Adresse. Der Ort reist im verschlüsselten
 * Profil mit, die Datenbank sieht ihn also nicht.
 */

const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const API = 'https://api.open-meteo.com/v1/forecast';

/** Zwei Nachkommastellen: genau genug fürs Wetter, ungenau genug fürs Zuhause. */
export const coarse = (n) => Math.round(Number(n) * 100) / 100;

/* ── WMO-Codes ──────────────────────────────────────────
   Die offizielle Tabelle hat 28 Einträge; hier sind sie zu den
   Lagen zusammengefasst, für die es ein eigenes Bild gibt. */
const CODES = [
  { c: [0], icon: 'wSun', night: 'wMoon', label: 'klar', line: 'Sonne pur' },
  { c: [1], icon: 'wSun', night: 'wMoon', label: 'überwiegend klar', line: 'fast wolkenlos' },
  { c: [2], icon: 'wPartly', night: 'wPartlyNight', label: 'teils bewölkt', line: 'Sonne mit Wolken' },
  { c: [3], icon: 'wCloud', label: 'bedeckt', line: 'grau in grau' },
  { c: [45, 48], icon: 'wFog', label: 'Nebel', line: 'alles neblig' },
  { c: [51, 53, 55, 56, 57], icon: 'wDrizzle', label: 'Nieselregen', line: 'es nieselt' },
  { c: [61, 63], icon: 'wRain', label: 'Regen', line: 'es regnet' },
  { c: [65], icon: 'wRain', label: 'starker Regen', line: 'Landregen' },
  { c: [66, 67], icon: 'wSleet', label: 'gefrierender Regen', line: 'glatt draußen' },
  { c: [71, 73, 75, 77], icon: 'wSnow', label: 'Schnee', line: 'es schneit' },
  { c: [80, 81, 82], icon: 'wShower', label: 'Schauer', line: 'Schauer ziehen durch' },
  { c: [85, 86], icon: 'wSnow', label: 'Schneeschauer', line: 'Schneeschauer' },
  { c: [95, 96, 99], icon: 'wThunder', label: 'Gewitter', line: 'es gewittert' }
];

/** @returns {{icon:string,label:string,line:string}} */
export function describe(code, isDay = true) {
  const hit = CODES.find((e) => e.c.includes(Number(code)));
  if (!hit) return { icon: isDay ? 'wCloud' : 'wMoon', label: 'Wetter', line: 'irgendwas dazwischen' };
  return {
    icon: !isDay && hit.night ? hit.night : hit.icon,
    label: hit.label,
    line: hit.line
  };
}

/** Ein Satz, der zum Wetter passt — für die Karte und die Banner. */
export function weatherLine(w, name) {
  if (!w) return '';
  const d = describe(w.code, w.isDay);
  const t = Math.round(w.temp);
  if (w.code >= 95) return `Bei ${name} gewittert es — ${t}°`;
  if (w.code >= 71 && w.code <= 77) return `Bei ${name} schneit es — ${t}°`;
  if (w.code >= 51 && w.code <= 82) return `Bei ${name} ${d.line} — ${t}°`;
  if (t <= 0) return `Bei ${name} sind es ${t}° — frostig`;
  if (t >= 28) return `Bei ${name} sind es ${t}° — heiß`;
  if (!w.isDay) return `Bei ${name} ist Nacht, ${t}°`;
  return `Bei ${name}: ${d.label}, ${t}°`;
}

/** Was zieht man an? Kleiner Vorschlag statt nackter Zahl. */
export function advice(w) {
  if (!w) return '';
  const t = w.temp;
  if (w.code >= 95) return 'Lieber drinnen bleiben.';
  if (w.code >= 61 && w.code <= 82) return 'Regenjacke wäre klug.';
  if (w.code >= 71 && w.code <= 86) return 'Dicke Socken, bitte.';
  if (t <= 2) return 'Mütze auf.';
  if (t <= 10) return 'Jacke nicht vergessen.';
  if (t >= 27) return 'Viel trinken.';
  if (t >= 20 && w.isDay) return 'Perfekt für draußen.';
  return 'Angenehm da drüben.';
}

/* ── Netz ───────────────────────────────────────────────
   Beides mit kurzem Timeout: lieber keine Karte als eine hängende App. */

async function getJson(url, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * Ortssuche.
 * @returns {Promise<Array<{name,region,country,lat,lon,tz}>>}
 */
export async function geocode(query) {
  const q = String(query || '').trim();
  if (q.length < 2) return [];
  const url = `${GEO}?name=${encodeURIComponent(q)}&count=6&language=de&format=json`;
  const data = await getJson(url);
  return (data.results || []).map((r) => ({
    name: r.name,
    region: r.admin1 || '',
    country: r.country || '',
    lat: coarse(r.latitude),
    lon: coarse(r.longitude),
    tz: r.timezone || ''
  }));
}

const cache = new Map();
const TTL = 15 * 60 * 1000;

/**
 * Aktuelles Wetter plus Tagesausblick.
 * @returns {Promise<{temp,feels,code,isDay,wind,max,min,sunrise,sunset,at}|null>}
 */
export async function forecast(lat, lon, { fresh = false } = {}) {
  if (lat == null || lon == null) return null;
  const key = `${coarse(lat)},${coarse(lon)}`;
  const hit = cache.get(key);
  if (!fresh && hit && Date.now() - hit.at < TTL) return hit;

  const url = `${API}?latitude=${coarse(lat)}&longitude=${coarse(lon)}`
    + '&current=temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset'
    + '&timezone=auto&forecast_days=1';

  try {
    const d = await getJson(url);
    const c = d.current || {};
    const day = d.daily || {};
    const out = {
      temp: c.temperature_2m,
      feels: c.apparent_temperature,
      code: c.weather_code,
      isDay: c.is_day !== 0,
      wind: c.wind_speed_10m,
      max: day.temperature_2m_max?.[0],
      min: day.temperature_2m_min?.[0],
      sunrise: day.sunrise?.[0] || '',
      sunset: day.sunset?.[0] || '',
      at: Date.now()
    };
    if (out.temp == null) return hit || null;
    cache.set(key, out);
    return out;
  } catch {
    // Offline oder Dienst weg: lieber der alte Stand als gar keiner
    return hit || null;
  }
}

/** Nur die Uhrzeit aus „2024-05-04T05:31“. */
export const clockOf = (iso) => (typeof iso === 'string' && iso.length >= 16 ? iso.slice(11, 16) : '');

/* ── Entfernung ─────────────────────────────────────────── */

/**
 * Luftlinie zwischen zwei Orten in Kilometern (Haversine).
 *
 * Beide Positionen sind auf zwei Nachkommastellen gerundet, die Zahl ist
 * also auf ein bis zwei Kilometer genau — für „wie weit weg ist mein
 * Mensch“ mehr als ausreichend.
 */
export function distanceKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Lesbar gerundet: unter 10 km mit einer Nachkommastelle, sonst ganz. */
export function formatKm(km) {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km).toLocaleString('de-DE')} km`;
}

/** Ein Satz zur Entfernung — die nackte Zahl allein ist etwas kalt. */
export function distanceLine(km) {
  if (km == null) return '';
  if (km < 1) return 'Ihr seid quasi im selben Raum.';
  if (km < 30) return 'Das ist eine Fahrradtour.';
  if (km < 120) return 'Eine gute Stunde mit dem Zug.';
  if (km < 400) return 'Ein Wochenende reicht dafür locker.';
  if (km < 1000) return 'Ein halber Reisetag.';
  if (km < 3000) return 'Einmal fliegen.';
  return 'Ein anderer Kontinent, aber dasselbe Nest.';
}
