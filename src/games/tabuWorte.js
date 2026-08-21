/**
 * „Tabu" — die Karten.
 *
 * Eine Karte ist ein Begriff und fünf Wörter, die beim Erklären verboten
 * sind. Am Tisch muss jemand mitlesen und summen, wenn eins fällt; hier
 * macht das die App, und deshalb funktioniert das Spiel auch zeitversetzt:
 * Der eine schreibt seine Umschreibung, die Prüfung passiert sofort, und
 * der andere rät Stunden später unter denselben Bedingungen.
 *
 * Zur Auswahl der Tabuwörter: Es sind bewusst die fünf, die einem als
 * Erstes einfallen. Eine Karte, bei der die verbotenen Wörter obskur sind,
 * ist keine Aufgabe — sie ist nur eine Vokabel mit Dekoration.
 *
 * Drei Stapel:
 *   alltag  Ganz normale Begriffe. Ohne Schalter, für jeden Tag.
 *   frech   Anzüglich, aber niemand wird rot. Ohne Schalter.
 *   heiss   Eindeutig. Nur mit eingeschalteten freizügigen Inhalten.
 *
 * Format:  { w: 'Begriff', t: ['fünf', 'verbotene', 'Wörter', 'pro', 'Karte'] }
 */

export const WORTE = {
  alltag: [
    { w: 'Kuscheldecke', t: ['Sofa', 'warm', 'wickeln', 'Wolle', 'Winter'] },
    { w: 'Frühstück', t: ['morgens', 'Kaffee', 'Brötchen', 'Ei', 'essen'] },
    { w: 'Regenschirm', t: ['Regen', 'nass', 'spannen', 'Wetter', 'Stock'] },
    { w: 'Fernbedienung', t: ['Fernseher', 'Kanal', 'Knopf', 'schalten', 'Batterie'] },
    { w: 'Zahnbürste', t: ['Zähne', 'putzen', 'Bad', 'Zahnpasta', 'Mund'] },
    { w: 'Waschmaschine', t: ['Wäsche', 'waschen', 'Trommel', 'Schleudern', 'Keller'] },
    { w: 'Hängematte', t: ['liegen', 'schaukeln', 'Baum', 'Garten', 'Netz'] },
    { w: 'Wecker', t: ['morgens', 'klingeln', 'Bett', 'Zeit', 'schlafen'] },
    { w: 'Sonnenbrille', t: ['Sonne', 'Augen', 'Nase', 'dunkel', 'Sommer'] },
    { w: 'Kühlschrank', t: ['kalt', 'Küche', 'Milch', 'Tür', 'Essen'] },
    { w: 'Nachbar', t: ['nebenan', 'Wohnung', 'Haus', 'laut', 'wohnen'] },
    { w: 'Fahrradschloss', t: ['Fahrrad', 'schließen', 'Schlüssel', 'Dieb', 'Kette'] },
    { w: 'Kopfhörer', t: ['Musik', 'Ohren', 'hören', 'Kabel', 'laut'] },
    { w: 'Kaugummi', t: ['kauen', 'Mund', 'Minze', 'kleben', 'süß'] },
    { w: 'Staubsauger', t: ['saugen', 'Teppich', 'Dreck', 'Strom', 'laut'] },
    { w: 'Regenwurm', t: ['Erde', 'kriechen', 'Garten', 'Angeln', 'lang'] },
    { w: 'Geburtstag', t: ['Kuchen', 'Kerzen', 'feiern', 'Geschenk', 'Jahr'] },
    { w: 'Handtuch', t: ['trocknen', 'Bad', 'nass', 'Dusche', 'Strand'] },
    { w: 'Flughafen', t: ['fliegen', 'Flugzeug', 'Koffer', 'Urlaub', 'Ticket'] },
    { w: 'Zahnarzt', t: ['Zähne', 'Bohrer', 'Praxis', 'Termin', 'Schmerz'] },
    { w: 'Spülmaschine', t: ['Geschirr', 'spülen', 'Küche', 'Teller', 'Tabs'] },
    { w: 'Postbote', t: ['Brief', 'Paket', 'liefern', 'Post', 'gelb'] },
    { w: 'Rasenmäher', t: ['Gras', 'Garten', 'mähen', 'laut', 'Sonntag'] },
    { w: 'Schnarchen', t: ['schlafen', 'Nase', 'laut', 'Geräusch', 'nachts'] },
    { w: 'Umzug', t: ['Kartons', 'Wohnung', 'tragen', 'neu', 'Möbel'] },
    { w: 'Sonnenbrand', t: ['Sonne', 'rot', 'Haut', 'Strand', 'schmerzen'] },
    { w: 'Schluckauf', t: ['Zwerchfell', 'Geräusch', 'Wasser', 'erschrecken', 'hicks'] },
    { w: 'Warteschlange', t: ['Schlange', 'warten', 'Kasse', 'Reihe', 'lang'] },
    { w: 'Kaffeemaschine', t: ['Kaffee', 'Küche', 'Wasser', 'morgens', 'Bohnen'] },
    { w: 'Videoanruf', t: ['Handy', 'sehen', 'telefonieren', 'Kamera', 'Bildschirm'] },
    { w: 'Ladekabel', t: ['Handy', 'Strom', 'Akku', 'Stecker', 'laden'] },
    { w: 'Fahrkarte', t: ['Zug', 'Bahn', 'kaufen', 'Kontrolle', 'fahren'] },
    { w: 'Balkon', t: ['draußen', 'Wohnung', 'Geländer', 'Pflanzen', 'sitzen'] },
    { w: 'Nachtisch', t: ['Essen', 'süß', 'danach', 'Eis', 'Kuchen'] },
    { w: 'Schneeball', t: ['Schnee', 'werfen', 'Winter', 'kalt', 'rund'] },
    { w: 'Sofakissen', t: ['Sofa', 'weich', 'liegen', 'Bezug', 'werfen'] },
    { w: 'Führerschein', t: ['Auto', 'fahren', 'Prüfung', 'Ausweis', 'Fahrschule'] },
    { w: 'Kellner', t: ['Restaurant', 'bestellen', 'Essen', 'Tisch', 'Trinkgeld'] },
    { w: 'Zeitumstellung', t: ['Uhr', 'Stunde', 'Sommer', 'Winter', 'Kopfkino'] },
    { w: 'Lieblingslied', t: ['Musik', 'hören', 'Radio', 'singen', 'mögen'] },
    { w: 'Waschbecken', t: ['Bad', 'Wasser', 'Hände', 'Hahn', 'Abfluss'] },
    { w: 'Rolltreppe', t: ['Stufen', 'fahren', 'Kaufhaus', 'oben', 'stehen'] },
    { w: 'Sternenhimmel', t: ['Nacht', 'Sterne', 'oben', 'dunkel', 'schauen'] },
    { w: 'Lagerfeuer', t: ['Holz', 'brennen', 'draußen', 'warm', 'Rauch'] },
    { w: 'Hausschlüssel', t: ['Tür', 'schließen', 'Schloss', 'Bund', 'Wohnung'] },
    { w: 'Meeresrauschen', t: ['Wasser', 'Wellen', 'Strand', 'hören', 'Urlaub'] },
    { w: 'Regenbogen', t: ['Farben', 'Regen', 'Sonne', 'Himmel', 'Bogen'] },
    { w: 'Schaukelstuhl', t: ['sitzen', 'wippen', 'Holz', 'Oma', 'Veranda'] },
    { w: 'Küchenschürze', t: ['kochen', 'Küche', 'binden', 'Flecken', 'Stoff'] },
    { w: 'Adventskalender', t: ['Dezember', 'Türchen', 'Schokolade', 'Weihnachten', 'öffnen'] },
    { w: 'Handstand', t: ['Hände', 'Kopf', 'unten', 'Beine', 'Turnen'] },
    { w: 'Bettdecke', t: ['schlafen', 'Bett', 'warm', 'Bezug', 'Federn'] },
    { w: 'Marmelade', t: ['Brot', 'süß', 'Frucht', 'Glas', 'Frühstück'] },
    { w: 'Fotoalbum', t: ['Bilder', 'Erinnerung', 'blättern', 'kleben', 'früher'] },
    { w: 'Klingelton', t: ['Handy', 'Anruf', 'Geräusch', 'laut', 'stumm'] },
    { w: 'Wanderschuhe', t: ['Berge', 'laufen', 'Füße', 'Sohle', 'Wandern'] },
    { w: 'Nudelholz', t: ['Teig', 'rollen', 'Küche', 'Holz', 'backen'] },
    { w: 'Zugverspätung', t: ['Bahn', 'warten', 'Minuten', 'Ansage', 'Gleis'] },
    { w: 'Butterbrot', t: ['Brot', 'Butter', 'schmieren', 'Pause', 'essen'] },
    { w: 'Ohrwurm', t: ['Lied', 'Kopf', 'Musik', 'nervt', 'summen'] }
  ],

  frech: [
    { w: 'Knutschfleck', t: ['Hals', 'Kuss', 'saugen', 'blau', 'Schal'] },
    { w: 'Dessous', t: ['Unterwäsche', 'Spitze', 'Frau', 'tragen', 'sexy'] },
    { w: 'Striptease', t: ['ziehen', 'Kleidung', 'Musik', 'tanzen', 'langsam'] },
    { w: 'Flirten', t: ['flirten', 'Blick', 'Bar', 'reden', 'Interesse'] },
    { w: 'Zungenkuss', t: ['Zunge', 'Mund', 'küssen', 'feucht', 'Lippen'] },
    { w: 'Bikini', t: ['Strand', 'Schwimmen', 'zweiteilig', 'Sommer', 'Bade'] },
    { w: 'Massage', t: ['Rücken', 'Öl', 'Hände', 'kneten', 'entspannen'] },
    { w: 'Nacktbaden', t: ['ohne', 'Kleidung', 'See', 'schwimmen', 'FKK'] },
    { w: 'Verführen', t: ['locken', 'Blick', 'Bett', 'Absicht', 'flirten'] },
    { w: 'Liebesbrief', t: ['schreiben', 'Papier', 'Gefühle', 'Post', 'Herz'] },
    { w: 'Kerzenlicht', t: ['Kerze', 'dunkel', 'romantisch', 'Abendessen', 'Flamme'] },
    { w: 'Wangenkuss', t: ['Wange', 'Kuss', 'Begrüßung', 'kurz', 'Lippen'] },
    { w: 'Wäschekorb', t: ['Wäsche', 'Kleidung', 'schmutzig', 'tragen', 'Bad'] },
    { w: 'Turteltauben', t: ['verliebt', 'Paar', 'Vogel', 'süß', 'küssen'] },
    { w: 'Hochzeitsnacht', t: ['heiraten', 'Bett', 'erste', 'Ehe', 'Hotel'] },
    { w: 'Augenbinde', t: ['Augen', 'nichts sehen', 'Stoff', 'blind', 'überraschen'] },
    { w: 'Rendezvous', t: ['Date', 'treffen', 'Verabredung', 'Abend', 'Restaurant'] },
    { w: 'Schmetterlinge', t: ['Bauch', 'verliebt', 'Gefühl', 'kribbeln', 'Insekt'] },
    { w: 'Nachthemd', t: ['schlafen', 'Bett', 'tragen', 'lang', 'Stoff'] },
    { w: 'Sinnlichkeit', t: ['Sinne', 'Berührung', 'langsam', 'Haut', 'Gefühl'] },
    { w: 'Rotwerden', t: ['Gesicht', 'peinlich', 'Farbe', 'Wangen', 'schämen'] },
    { w: 'Techtelmechtel', t: ['Affäre', 'heimlich', 'Liebe', 'kurz', 'Beziehung'] },
    { w: 'Kuschelecke', t: ['Sofa', 'gemütlich', 'zusammen', 'Decke', 'Nähe'] },
    { w: 'Nackenkuss', t: ['Nacken', 'Hals', 'Kuss', 'hinten', 'Haare'] },
    { w: 'Hosenträger', t: ['Hose', 'Schulter', 'halten', 'Gürtel', 'Streifen'] },
    { w: 'Schäferstündchen', t: ['Mittag', 'Bett', 'kurz', 'zusammen', 'heimlich'] },
    { w: 'Doppelbett', t: ['schlafen', 'zwei', 'Matratze', 'groß', 'Zimmer'] },
    { w: 'Schaumbad', t: ['Wanne', 'Wasser', 'Schaum', 'baden', 'warm'] },
    { w: 'Reizwäsche', t: ['Unterwäsche', 'Spitze', 'durchsichtig', 'ziehen', 'sexy'] },
    { w: 'Kompliment', t: ['loben', 'schön', 'sagen', 'nett', 'freuen'] },
    { w: 'Anmachspruch', t: ['Bar', 'sprechen', 'Satz', 'flirten', 'peinlich'] },
    { w: 'Blickkontakt', t: ['Augen', 'schauen', 'halten', 'Blick', 'lange'] },
    { w: 'Hüftschwung', t: ['Hüfte', 'tanzen', 'bewegen', 'Rhythmus', 'schwingen'] },
    { w: 'Zärtlichkeit', t: ['sanft', 'streicheln', 'Liebe', 'Berührung', 'zart'] },
    { w: 'Halsband', t: ['Hals', 'Leder', 'Schnalle', 'eng', 'tragen'] },
    { w: 'Handschellen', t: ['Hände', 'Metall', 'Polizei', 'fesseln', 'Schlüssel'] },
    { w: 'Rollenspiel', t: ['Rolle', 'spielen', 'Verkleidung', 'verstellen', 'Fantasie'] },
    { w: 'Seidenschal', t: ['Hals', 'Stoff', 'glatt', 'binden', 'weich'] },
    { w: 'Morgenmuffel', t: ['morgens', 'schlecht gelaunt', 'Bett', 'Kaffee', 'grummeln'] },
    { w: 'Liebesbiss', t: ['beißen', 'Zähne', 'Haut', 'Spur', 'sanft'] }
  ],

  heiss: [
    { w: 'Vorspiel', t: ['davor', 'streicheln', 'küssen', 'Beginn', 'Sex'] },
    { w: 'Orgasmus', t: ['kommen', 'Höhepunkt', 'Sex', 'stöhnen', 'Ende'] },
    { w: 'Missionarsstellung', t: ['oben', 'unten', 'Stellung', 'Rücken', 'klassisch'] },
    { w: 'Reiterstellung', t: ['oben sitzen', 'Stellung', 'reiten', 'Pferd', 'bewegen'] },
    { w: 'Löffelchenstellung', t: ['Seite', 'hinten', 'Stellung', 'Besteck', 'liegen'] },
    { w: 'Doggystyle', t: ['hinten', 'Knie', 'Hund', 'Stellung', 'vierfüßig'] },
    { w: 'Neunundsechzig', t: ['Zahl', 'gleichzeitig', 'Mund', 'beide', 'umgekehrt'] },
    { w: 'Oralsex', t: ['Mund', 'Zunge', 'unten', 'lecken', 'Sex'] },
    { w: 'Handarbeit', t: ['Hand', 'Finger', 'reiben', 'selbst', 'Sex'] },
    { w: 'Selbstbefriedigung', t: ['allein', 'Hand', 'kommen', 'sich selbst', 'Fantasie'] },
    { w: 'Vibrator', t: ['Spielzeug', 'summen', 'Batterie', 'Sex', 'vibrieren'] },
    { w: 'Gleitgel', t: ['feucht', 'glitschig', 'Tube', 'Sex', 'gleiten'] },
    { w: 'Kondom', t: ['Gummi', 'ziehen', 'Verhütung', 'Packung', 'Sex'] },
    { w: 'Quickie', t: ['schnell', 'kurz', 'zwischendurch', 'Sex', 'eilig'] },
    { w: 'Fesselspiele', t: ['binden', 'Seil', 'Hände', 'festhalten', 'nicht bewegen'] },
    { w: 'Nackenbeißen', t: ['Nacken', 'Zähne', 'beißen', 'hinten', 'Hals'] },
    { w: 'Dirty Talk', t: ['reden', 'schmutzig', 'sagen', 'Worte', 'Sex'] },
    { w: 'Stöhnen', t: ['Geräusch', 'laut', 'Lust', 'Sex', 'Mund'] },
    { w: 'Duschsex', t: ['Dusche', 'Wasser', 'nass', 'stehen', 'Sex'] },
    { w: 'Morgensex', t: ['morgens', 'wach', 'Bett', 'früh', 'Sex'] },
    { w: 'Höhepunkt', t: ['kommen', 'Ende', 'Orgasmus', 'Lust', 'Gipfel'] },
    { w: 'Erregung', t: ['scharf', 'geil', 'Lust', 'flirten', 'feucht'] },
    { w: 'Ganzkörperöl', t: ['Öl', 'Haut', 'reiben', 'glänzen', 'Massage'] },
    { w: 'Augenbindenspiel', t: ['Augen', 'nichts sehen', 'Binde', 'überraschen', 'fühlen'] },
    { w: 'Spielzeugkiste', t: ['Spielzeug', 'Kiste', 'Sex', 'Sammlung', 'verstecken'] },
    { w: 'Rollentausch', t: ['tauschen', 'Rolle', 'wer bestimmt', 'oben', 'unten'] },
    { w: 'Nachspiel', t: ['danach', 'liegen', 'kuscheln', 'Sex', 'Ende'] },
    { w: 'Zungenspiel', t: ['Zunge', 'lecken', 'Mund', 'kreisen', 'feucht'] },
    { w: 'Wandsex', t: ['Wand', 'stehen', 'lehnen', 'heben', 'Sex'] },
    { w: 'Autositz', t: ['Auto', 'hinten', 'eng', 'Parkplatz', 'Sitz'] },
    { w: 'Nacktfoto', t: ['Bild', 'ohne Kleidung', 'Handy', 'schicken', 'Kamera'] },
    { w: 'Telefonsex', t: ['Telefon', 'reden', 'Stimme', 'allein', 'Sex'] },
    { w: 'Bettkante', t: ['Bett', 'Rand', 'sitzen', 'Matratze', 'Kante'] },
    { w: 'Küchentisch', t: ['Küche', 'Tisch', 'setzen', 'Holz', 'essen'] },
    { w: 'Fantasie', t: ['Kopfkino', 'Kopf', 'Traum', 'erfinden', 'Wunsch'] },
    { w: 'Sicherheitswort', t: ['Stopp', 'Schluss', 'Wort', 'vereinbaren', 'sicher'] },
    { w: 'Nachthemdchen', t: ['kurz', 'schlafen', 'Spitze', 'durchsichtig', 'tragen'] },
    { w: 'Klaps', t: ['Hintern', 'Hand', 'schlagen', 'Geräusch', 'rot'] },
    { w: 'Rückenkratzer', t: ['Nägel', 'Rücken', 'Spuren', 'kratzen', 'rot'] },
    { w: 'Ganzenacht', t: ['Nacht', 'durchmachen', 'nicht schlafen', 'lang', 'bis morgens'] }
  ]
};

/** Die Stapel, wie sie in der Auswahl stehen. */
export const STUFEN = [
  { id: 'alltag', label: 'Alltag', sub: 'Ganz normale Begriffe', icon: 'nudgeThink', spicy: false },
  { id: 'frech',  label: 'Frech',  sub: 'Anzüglich, aber harmlos', icon: 'statJoy',  spicy: false },
  { id: 'heiss',  label: 'Heiß',   sub: 'Nur mit freizügigen Inhalten', icon: 'flame', spicy: true }
];

export const TABUS = 5;             // verbotene Wörter pro Karte
export const VERSUCHE = 3;          // Rateversuche
export const MAX_TEXT = 220;        // Zeichen für die Umschreibung

/** Punkte nach Versuch — wer sofort trifft, bekommt am meisten. */
export const PUNKTE = [100, 60, 30];

/**
 * Text vergleichbar machen.
 *
 * Umlaute und ß werden aufgelöst, alles kleingeschrieben, und alles, was
 * kein Buchstabe ist, wird zu einem Leerzeichen. Damit fällt „Zähne!" und
 * „zaehne" auf dasselbe zusammen — und ein Erklärer kann sich nicht mit
 * Bindestrichen oder Sternchen um ein Tabuwort herummogeln.
 */
export function normal(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Der Wortstamm, auf den geprüft wird.
 *
 * Ganze Wörter zu vergleichen wäre zu lasch: „Zähnen", „zahnärztlich" und
 * „Zahnputzbecher" wären alle erlaubt, obwohl jeder sofort an „Zähne"
 * denkt. Also wird der Anfang verglichen — lang genug, dass „Ei" nicht
 * plötzlich „einfach" verbietet.
 */
export function stamm(wort) {
  const n = normal(wort).replace(/\s+/g, '');
  if (n.length <= 4) return n;
  return n.slice(0, Math.max(5, Math.round(n.length * 0.7)));
}

/**
 * Welche verbotenen Wörter stehen im Text?
 *
 * Der gesuchte Begriff zählt immer mit — ihn zu nennen wäre kein Tabubruch,
 * sondern gar kein Spiel. Zurück kommen die Originalwörter, damit man dem
 * Erklärer sagen kann, woran es lag.
 */
export function verstoesse(text, karte) {
  const t = normal(text).replace(/\s+/g, '');
  const zuPruefen = [karte.w, ...(karte.t || [])];
  return zuPruefen.filter((v) => {
    const st = stamm(v);
    return st.length >= 3 && t.includes(st);
  });
}

/** Hat der Tipp getroffen? Groß-/Kleinschreibung und Endungen sind egal. */
export function trifft(tipp, karte) {
  const a = normal(tipp).replace(/\s+/g, '');
  const b = normal(karte.w).replace(/\s+/g, '');
  if (!a) return false;
  if (a === b) return true;
  // Eine Endung daneben zählt noch — „Kuscheldecken" ist nicht falsch
  return (a.length >= 4 && b.startsWith(a) && b.length - a.length <= 2)
      || (b.length >= 4 && a.startsWith(b) && a.length - b.length <= 2);
}

export const stufeById = (id) => STUFEN.find((s) => s.id === id) || STUFEN[0];

/** Wie viele Karten hat ein Stapel? Für die Anzeige in der Auswahl. */
export const stapelGroesse = (id) => (WORTE[id] || []).length;
