/** Zeit, Zeitzonen und „vor 3 Minuten“. Wichtig, wenn ihr Stunden trennt. */

export const now = () => Date.now();
export const MIN = 60_000, HOUR = 3_600_000, DAY = 86_400_000;

/** Tagesschlüssel im lokalen Kalender, z. B. "2026-08-12". */
export function dayKey(ts = Date.now(), tz = null) {
  const d = new Date(ts);
  if (tz) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(d);
    } catch { /* ungültige Zeitzone → lokal */ }
  }
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function localTimeIn(tz, ts = Date.now()) {
  try {
    return new Intl.DateTimeFormat('de-DE', {
      timeZone: tz, hour: '2-digit', minute: '2-digit'
    }).format(new Date(ts));
  } catch {
    return new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
  }
}

/** Stunde 0–23 in einer Zeitzone — für „schläft wahrscheinlich“. */
export function hourIn(tz, ts = Date.now()) {
  try {
    return Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false })
      .format(new Date(ts)));
  } catch {
    return new Date(ts).getHours();
  }
}

/** Differenz in vollen Stunden zwischen zwei Zeitzonen. */
export function tzOffsetHours(tzA, tzB, ts = Date.now()) {
  const get = (tz) => {
    try {
      const s = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hour12: false, year: 'numeric', month: '2-digit',
        day: '2-digit', hour: '2-digit', minute: '2-digit'
      }).format(new Date(ts));
      return Date.parse(s.replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+)/, '$3-$1-$2T$4:$5:00Z'));
    } catch { return null; }
  };
  const a = get(tzA), b = get(tzB);
  if (a == null || b == null) return 0;
  return Math.round((b - a) / HOUR);
}

export function relTime(ts) {
  if (!ts) return '—';
  const d = Date.now() - ts;
  if (d < 45_000) return 'gerade eben';
  if (d < HOUR) return `vor ${Math.round(d / MIN)} Min.`;
  if (d < DAY) return `vor ${Math.round(d / HOUR)} Std.`;
  if (d < 2 * DAY) return 'gestern';
  if (d < 7 * DAY) return `vor ${Math.round(d / DAY)} Tagen`;
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short' }).format(new Date(ts));
}

export function clockTime(ts) {
  return new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
}

export const guessTz = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin'; }
  catch { return 'Europe/Berlin'; }
};

/** Tage zwischen zwei Tagesschlüsseln (YYYY-MM-DD). */
export function daysBetween(a, b) {
  const pa = Date.parse(a + 'T00:00:00Z'), pb = Date.parse(b + 'T00:00:00Z');
  if (Number.isNaN(pa) || Number.isNaN(pb)) return 99;
  return Math.round((pb - pa) / DAY);
}
