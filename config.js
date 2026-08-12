/**
 * Knuddl — Konfiguration
 * ──────────────────────
 * Diese Datei liegt bewusst *neben* dem Code und nicht im Build:
 * Du kannst sie direkt auf GitHub bearbeiten, ohne irgendetwas neu zu bauen.
 *
 * Alles hier ist optional. Ohne jede Änderung läuft die App im Solo-Modus
 * (mit einem simulierten Partner) plus dem Brieftauben-Modus (Codes per
 * WhatsApp hin- und herschicken) — beides funktioniert auf GitHub Pages
 * ohne jeden Server.
 *
 * Für echtes Live-Spielen trägst du unten eine Firebase-Realtime-Database-URL
 * ein. Warum Firebase RTDB? Weil man sie ohne SDK und ohne Backend allein mit
 * fetch() und EventSource ansprechen kann — genau das, was eine statische
 * Seite darf. Anleitung steht im README.
 */
export const CONFIG = {
  /** z. B. 'https://knuddl-xyz-default-rtdb.europe-west1.firebasedatabase.app' */
  cloudUrl: '',

  /**
   * Optionaler gemeinsamer Namensraum. Nur relevant, wenn ihr euch eine
   * Datenbank mit anderen teilt. Leer lassen ist völlig okay.
   */
  cloudNamespace: 'knuddl',

  /** Sekunden bis der Partner als „offline" gilt. */
  presenceTimeout: 75,

  /** Standardname für das eigene Chicken. */
  defaultPetName: 'Knuddl'
};

export default CONFIG;
