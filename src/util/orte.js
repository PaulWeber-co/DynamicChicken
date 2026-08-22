/**
 * Von Koordinaten zu einem Namen — ohne jemanden zu fragen.
 *
 * Wenn der Standort automatisch mitläuft, kommen vom Gerät nur zwei Zahlen.
 * „51.23, 6.78" hilft niemandem; „Düsseldorf" schon. Der übliche Weg dahin
 * heißt Reverse-Geocoding und bedeutet: bei jedem Ortswechsel die eigene
 * Position an einen fremden Dienst schicken. Genau das ist hier nicht
 * gewollt — es wäre die eine Stelle, an der die App verrät, wo jemand
 * gerade wirklich ist.
 *
 * Also steht die Antwort im Code: gut dreihundert Städte, dazu die
 * nächstgelegene gesucht. Über Deutschland liegt die Hälfte aller Punkte
 * keine dreißig Kilometer von einem Eintrag entfernt, neunundneunzig
 * Prozent unter fünfundsechzig; in Europa selten mehr als hundert. Das
 * reicht für „bei Kassel", und mehr soll es auch gar nicht sein.
 *
 * Das Ergebnis ist absichtlich ungenau. Wer wissen will, ob der andere zu
 * Hause oder bei der Arbeit ist, erfährt es hier nicht — und das ist kein
 * Mangel, sondern die Grenze, die dieselbe App auch beim Wetter zieht.
 */

/* [Name, Breite, Länge, Land] */
const STAEDTE = [
  /* ── Deutschland ── */
  ['Berlin', 52.52, 13.40, 'DE'], ['Hamburg', 53.55, 9.99, 'DE'],
  ['München', 48.14, 11.58, 'DE'], ['Köln', 50.94, 6.96, 'DE'],
  ['Frankfurt am Main', 50.11, 8.68, 'DE'], ['Stuttgart', 48.78, 9.18, 'DE'],
  ['Düsseldorf', 51.23, 6.78, 'DE'], ['Leipzig', 51.34, 12.37, 'DE'],
  ['Dortmund', 51.51, 7.47, 'DE'], ['Essen', 51.46, 7.01, 'DE'],
  ['Bremen', 53.08, 8.81, 'DE'], ['Dresden', 51.05, 13.74, 'DE'],
  ['Hannover', 52.37, 9.73, 'DE'], ['Nürnberg', 49.45, 11.08, 'DE'],
  ['Duisburg', 51.43, 6.76, 'DE'], ['Bochum', 51.48, 7.22, 'DE'],
  ['Wuppertal', 51.26, 7.18, 'DE'], ['Bielefeld', 52.02, 8.53, 'DE'],
  ['Bonn', 50.73, 7.10, 'DE'], ['Münster', 51.96, 7.63, 'DE'],
  ['Mannheim', 49.49, 8.47, 'DE'], ['Karlsruhe', 49.01, 8.40, 'DE'],
  ['Augsburg', 48.37, 10.90, 'DE'], ['Wiesbaden', 50.08, 8.24, 'DE'],
  ['Mönchengladbach', 51.19, 6.44, 'DE'], ['Gelsenkirchen', 51.52, 7.09, 'DE'],
  ['Braunschweig', 52.27, 10.52, 'DE'], ['Kiel', 54.32, 10.14, 'DE'],
  ['Chemnitz', 50.83, 12.92, 'DE'], ['Aachen', 50.78, 6.08, 'DE'],
  ['Halle', 51.48, 11.97, 'DE'], ['Magdeburg', 52.13, 11.63, 'DE'],
  ['Freiburg', 47.99, 7.85, 'DE'], ['Krefeld', 51.33, 6.56, 'DE'],
  ['Lübeck', 53.87, 10.69, 'DE'], ['Oberhausen', 51.47, 6.85, 'DE'],
  ['Erfurt', 50.98, 11.03, 'DE'], ['Mainz', 50.00, 8.27, 'DE'],
  ['Rostock', 54.09, 12.14, 'DE'], ['Kassel', 51.31, 9.50, 'DE'],
  ['Hagen', 51.36, 7.47, 'DE'], ['Hamm', 51.68, 7.82, 'DE'],
  ['Saarbrücken', 49.24, 6.99, 'DE'], ['Potsdam', 52.40, 13.06, 'DE'],
  ['Ludwigshafen', 49.48, 8.44, 'DE'], ['Oldenburg', 53.14, 8.21, 'DE'],
  ['Leverkusen', 51.03, 7.00, 'DE'], ['Osnabrück', 52.28, 8.05, 'DE'],
  ['Solingen', 51.17, 7.08, 'DE'], ['Heidelberg', 49.40, 8.67, 'DE'],
  ['Neuss', 51.20, 6.69, 'DE'], ['Darmstadt', 49.87, 8.65, 'DE'],
  ['Paderborn', 51.72, 8.75, 'DE'], ['Regensburg', 49.02, 12.10, 'DE'],
  ['Ingolstadt', 48.77, 11.42, 'DE'], ['Würzburg', 49.79, 9.94, 'DE'],
  ['Wolfsburg', 52.42, 10.79, 'DE'], ['Ulm', 48.40, 9.99, 'DE'],
  ['Heilbronn', 49.14, 9.22, 'DE'], ['Pforzheim', 48.89, 8.70, 'DE'],
  ['Göttingen', 51.53, 9.94, 'DE'], ['Trier', 49.75, 6.64, 'DE'],
  ['Recklinghausen', 51.61, 7.20, 'DE'], ['Reutlingen', 48.49, 9.21, 'DE'],
  ['Bremerhaven', 53.55, 8.58, 'DE'], ['Koblenz', 50.36, 7.59, 'DE'],
  ['Jena', 50.93, 11.59, 'DE'], ['Erlangen', 49.60, 11.00, 'DE'],
  ['Siegen', 50.88, 8.02, 'DE'], ['Hildesheim', 52.15, 9.95, 'DE'],
  ['Salzgitter', 52.15, 10.33, 'DE'], ['Cottbus', 51.76, 14.33, 'DE'],
  ['Kaiserslautern', 49.44, 7.77, 'DE'], ['Gütersloh', 51.90, 8.38, 'DE'],
  ['Schwerin', 53.63, 11.41, 'DE'], ['Gera', 50.88, 12.08, 'DE'],
  ['Zwickau', 50.72, 12.50, 'DE'], ['Lüneburg', 53.25, 10.41, 'DE'],
  ['Marburg', 50.81, 8.77, 'DE'], ['Konstanz', 47.66, 9.18, 'DE'],
  ['Flensburg', 54.78, 9.44, 'DE'], ['Villingen-Schwenningen', 48.06, 8.46, 'DE'],
  ['Gießen', 50.58, 8.68, 'DE'], ['Dessau', 51.83, 12.24, 'DE'],
  ['Landshut', 48.54, 12.15, 'DE'], ['Bayreuth', 49.95, 11.58, 'DE'],
  ['Celle', 52.63, 10.08, 'DE'], ['Aschaffenburg', 49.98, 9.15, 'DE'],
  ['Fulda', 50.55, 9.68, 'DE'], ['Rosenheim', 47.86, 12.13, 'DE'],
  ['Bamberg', 49.89, 10.89, 'DE'], ['Kempten', 47.73, 10.31, 'DE'],
  ['Passau', 48.57, 13.46, 'DE'], ['Görlitz', 51.15, 14.99, 'DE'],
  ['Emden', 53.37, 7.21, 'DE'], ['Husum', 54.48, 9.05, 'DE'],
  ['Garmisch-Partenkirchen', 47.49, 11.10, 'DE'], ['Westerland', 54.91, 8.31, 'DE'],
  ['Norderney', 53.71, 7.16, 'DE'], ['Oberstdorf', 47.41, 10.28, 'DE'],
  ['Stralsund', 54.31, 13.09, 'DE'], ['Neubrandenburg', 53.56, 13.26, 'DE'],
  ['Frankfurt (Oder)', 52.35, 14.55, 'DE'], ['Plauen', 50.49, 12.14, 'DE'],
  ['Wilhelmshaven', 53.53, 8.11, 'DE'], ['Minden', 52.29, 8.92, 'DE'],
  ['Weimar', 50.98, 11.33, 'DE'], ['Coburg', 50.26, 10.96, 'DE'],
  ['Baden-Baden', 48.76, 8.24, 'DE'], ['Ravensburg', 47.78, 9.61, 'DE'],
  /* Und ein paar Kreisstädte, damit auch dünn besiedelte Gegenden
     einen Namen in Reichweite haben statt „80 km von …“. */
  ['Stendal', 52.60, 11.86, 'DE'], ['Prenzlau', 53.32, 13.86, 'DE'],
  ['Wittenberge', 52.99, 11.75, 'DE'], ['Bitburg', 49.97, 6.53, 'DE'],
  ['Deggendorf', 48.84, 12.96, 'DE'], ['Meschede', 51.35, 8.28, 'DE'],
  ['Waren', 53.52, 12.68, 'DE'], ['Nordhausen', 51.50, 10.79, 'DE'],
  ['Cuxhaven', 53.86, 8.69, 'DE'], ['Bad Kreuznach', 49.85, 7.87, 'DE'],
  ['Ansbach', 49.30, 10.58, 'DE'], ['Schwäbisch Hall', 49.11, 9.74, 'DE'],

  /* ── Österreich und Schweiz ── */
  ['Wien', 48.21, 16.37, 'AT'], ['Graz', 47.07, 15.44, 'AT'],
  ['Linz', 48.31, 14.29, 'AT'], ['Salzburg', 47.80, 13.04, 'AT'],
  ['Innsbruck', 47.27, 11.39, 'AT'], ['Klagenfurt', 46.62, 14.31, 'AT'],
  ['Bregenz', 47.50, 9.75, 'AT'], ['Villach', 46.61, 13.86, 'AT'],
  ['Zürich', 47.38, 8.54, 'CH'], ['Genf', 46.20, 6.14, 'CH'],
  ['Basel', 47.56, 7.59, 'CH'], ['Bern', 46.95, 7.45, 'CH'],
  ['Lausanne', 46.52, 6.63, 'CH'], ['Luzern', 47.05, 8.31, 'CH'],
  ['St. Gallen', 47.42, 9.37, 'CH'], ['Lugano', 46.00, 8.95, 'CH'],
  ['Chur', 46.85, 9.53, 'CH'], ['Sion', 46.23, 7.36, 'CH'],

  /* ── Europa ── */
  ['Amsterdam', 52.37, 4.90, 'NL'], ['Rotterdam', 51.92, 4.48, 'NL'],
  ['Den Haag', 52.08, 4.31, 'NL'], ['Utrecht', 52.09, 5.12, 'NL'],
  ['Groningen', 53.22, 6.57, 'NL'], ['Eindhoven', 51.44, 5.48, 'NL'],
  ['Maastricht', 50.85, 5.69, 'NL'],
  ['Brüssel', 50.85, 4.35, 'BE'], ['Antwerpen', 51.22, 4.40, 'BE'],
  ['Gent', 51.05, 3.72, 'BE'], ['Lüttich', 50.63, 5.57, 'BE'],
  ['Luxemburg', 49.61, 6.13, 'LU'],
  /* Direkt hinter der Grenze — wer dort steht, soll nicht „90 km von
     Freiburg“ lesen, sondern den Ort, der tatsächlich nebenan liegt. */
  ['Nancy', 48.69, 6.18, 'FR'], ['Metz', 49.12, 6.18, 'FR'],
  ['Mülhausen', 47.75, 7.34, 'FR'], ['Besançon', 47.24, 6.02, 'FR'],
  ['Reims', 49.26, 4.03, 'FR'], ['Colmar', 48.08, 7.36, 'FR'],
  ['Enschede', 52.22, 6.90, 'NL'], ['Arnheim', 51.98, 5.91, 'NL'],
  ['Zwolle', 52.51, 6.09, 'NL'], ['Leeuwarden', 53.20, 5.79, 'NL'],
  ['Pilsen', 49.75, 13.38, 'CZ'], ['Karlsbad', 50.23, 12.87, 'CZ'],
  ['Budweis', 48.97, 14.47, 'CZ'], ['Aussig', 50.66, 14.04, 'CZ'],
  ['Sonderburg', 54.91, 9.79, 'DK'], ['Kolding', 55.49, 9.47, 'DK'],
  ['Swinemünde', 53.91, 14.25, 'PL'], ['Kolberg', 54.18, 15.58, 'PL'],
  ['Paris', 48.86, 2.35, 'FR'], ['Lyon', 45.76, 4.84, 'FR'],
  ['Marseille', 43.30, 5.37, 'FR'], ['Toulouse', 43.60, 1.44, 'FR'],
  ['Nizza', 43.70, 7.27, 'FR'], ['Bordeaux', 44.84, -0.58, 'FR'],
  ['Straßburg', 48.57, 7.75, 'FR'], ['Lille', 50.63, 3.06, 'FR'],
  ['Nantes', 47.22, -1.55, 'FR'], ['Montpellier', 43.61, 3.88, 'FR'],
  ['Rennes', 48.12, -1.68, 'FR'], ['Dijon', 47.32, 5.04, 'FR'],
  ['Clermont-Ferrand', 45.78, 3.09, 'FR'], ['Brest', 48.39, -4.49, 'FR'],
  ['London', 51.51, -0.13, 'GB'], ['Manchester', 53.48, -2.24, 'GB'],
  ['Birmingham', 52.49, -1.89, 'GB'], ['Edinburgh', 55.95, -3.19, 'GB'],
  ['Glasgow', 55.86, -4.25, 'GB'], ['Liverpool', 53.41, -2.98, 'GB'],
  ['Bristol', 51.45, -2.59, 'GB'], ['Newcastle', 54.98, -1.61, 'GB'],
  ['Dublin', 53.35, -6.26, 'IE'], ['Belfast', 54.60, -5.93, 'GB'],
  ['Kopenhagen', 55.68, 12.57, 'DK'], ['Aarhus', 56.16, 10.20, 'DK'],
  ['Odense', 55.40, 10.39, 'DK'],
  ['Oslo', 59.91, 10.75, 'NO'], ['Bergen', 60.39, 5.32, 'NO'],
  ['Trondheim', 63.43, 10.40, 'NO'], ['Tromsø', 69.65, 18.96, 'NO'],
  ['Stockholm', 59.33, 18.07, 'SE'], ['Göteborg', 57.71, 11.97, 'SE'],
  ['Malmö', 55.60, 13.00, 'SE'], ['Umeå', 63.83, 20.26, 'SE'],
  ['Helsinki', 60.17, 24.94, 'FI'], ['Tampere', 61.50, 23.79, 'FI'],
  ['Reykjavík', 64.15, -21.94, 'IS'],
  ['Warschau', 52.23, 21.01, 'PL'], ['Krakau', 50.06, 19.94, 'PL'],
  ['Danzig', 54.35, 18.65, 'PL'], ['Breslau', 51.11, 17.04, 'PL'],
  ['Posen', 52.41, 16.93, 'PL'], ['Stettin', 53.43, 14.55, 'PL'],
  ['Prag', 50.08, 14.44, 'CZ'], ['Brünn', 49.20, 16.61, 'CZ'],
  ['Bratislava', 48.15, 17.11, 'SK'], ['Budapest', 47.50, 19.04, 'HU'],
  ['Ljubljana', 46.06, 14.51, 'SI'], ['Zagreb', 45.81, 15.98, 'HR'],
  ['Split', 43.51, 16.44, 'HR'], ['Belgrad', 44.79, 20.45, 'RS'],
  ['Sarajevo', 43.86, 18.41, 'BA'], ['Bukarest', 44.43, 26.10, 'RO'],
  ['Sofia', 42.70, 23.32, 'BG'], ['Athen', 37.98, 23.73, 'GR'],
  ['Thessaloniki', 40.64, 22.94, 'GR'], ['Tirana', 41.33, 19.82, 'AL'],
  ['Rom', 41.90, 12.50, 'IT'], ['Mailand', 45.46, 9.19, 'IT'],
  ['Neapel', 40.85, 14.27, 'IT'], ['Turin', 45.07, 7.69, 'IT'],
  ['Florenz', 43.77, 11.26, 'IT'], ['Venedig', 45.44, 12.32, 'IT'],
  ['Bologna', 44.49, 11.34, 'IT'], ['Palermo', 38.12, 13.36, 'IT'],
  ['Bari', 41.12, 16.87, 'IT'], ['Verona', 45.44, 10.99, 'IT'],
  ['Genua', 44.41, 8.93, 'IT'], ['Cagliari', 39.22, 9.12, 'IT'],
  ['Madrid', 40.42, -3.70, 'ES'], ['Barcelona', 41.39, 2.17, 'ES'],
  ['Valencia', 39.47, -0.38, 'ES'], ['Sevilla', 37.39, -5.98, 'ES'],
  ['Bilbao', 43.26, -2.93, 'ES'], ['Málaga', 36.72, -4.42, 'ES'],
  ['Palma', 39.57, 2.65, 'ES'], ['Las Palmas', 28.12, -15.44, 'ES'],
  ['Lissabon', 38.72, -9.14, 'PT'], ['Porto', 41.15, -8.61, 'PT'],
  ['Faro', 37.02, -7.93, 'PT'], ['Funchal', 32.65, -16.91, 'PT'],
  ['Kiew', 50.45, 30.52, 'UA'], ['Lwiw', 49.84, 24.03, 'UA'],
  ['Moskau', 55.76, 37.62, 'RU'], ['St. Petersburg', 59.93, 30.34, 'RU'],
  ['Minsk', 53.90, 27.57, 'BY'], ['Riga', 56.95, 24.11, 'LV'],
  ['Vilnius', 54.69, 25.28, 'LT'], ['Tallinn', 59.44, 24.75, 'EE'],
  ['Istanbul', 41.01, 28.98, 'TR'], ['Ankara', 39.93, 32.86, 'TR'],
  ['Antalya', 36.90, 30.71, 'TR'], ['Izmir', 38.42, 27.14, 'TR'],
  ['Valletta', 35.90, 14.51, 'MT'], ['Nikosia', 35.19, 33.38, 'CY'],

  /* ── Der Rest der Welt, grob ── */
  ['New York', 40.71, -74.01, 'US'], ['Los Angeles', 34.05, -118.24, 'US'],
  ['Chicago', 41.88, -87.63, 'US'], ['San Francisco', 37.77, -122.42, 'US'],
  ['Miami', 25.76, -80.19, 'US'], ['Houston', 29.76, -95.37, 'US'],
  ['Denver', 39.74, -104.99, 'US'], ['Seattle', 47.61, -122.33, 'US'],
  ['Boston', 42.36, -71.06, 'US'], ['Washington', 38.91, -77.04, 'US'],
  ['Toronto', 43.65, -79.38, 'CA'], ['Vancouver', 49.28, -123.12, 'CA'],
  ['Montreal', 45.50, -73.57, 'CA'], ['Mexiko-Stadt', 19.43, -99.13, 'MX'],
  ['Havanna', 23.11, -82.37, 'CU'],
  ['São Paulo', -23.55, -46.63, 'BR'], ['Rio de Janeiro', -22.91, -43.17, 'BR'],
  ['Buenos Aires', -34.60, -58.38, 'AR'], ['Lima', -12.05, -77.04, 'PE'],
  ['Bogotá', 4.71, -74.07, 'CO'], ['Santiago', -33.45, -70.67, 'CL'],
  ['Kairo', 30.04, 31.24, 'EG'], ['Casablanca', 33.57, -7.59, 'MA'],
  ['Marrakesch', 31.63, -7.99, 'MA'], ['Tunis', 36.81, 10.18, 'TN'],
  ['Lagos', 6.52, 3.38, 'NG'], ['Nairobi', -1.29, 36.82, 'KE'],
  ['Addis Abeba', 9.01, 38.76, 'ET'], ['Johannesburg', -26.20, 28.05, 'ZA'],
  ['Kapstadt', -33.92, 18.42, 'ZA'], ['Dakar', 14.72, -17.47, 'SN'],
  ['Dubai', 25.20, 55.27, 'AE'], ['Doha', 25.29, 51.53, 'QA'],
  ['Riad', 24.71, 46.68, 'SA'], ['Tel Aviv', 32.09, 34.78, 'IL'],
  ['Teheran', 35.69, 51.39, 'IR'], ['Tiflis', 41.72, 44.79, 'GE'],
  ['Delhi', 28.61, 77.21, 'IN'], ['Mumbai', 19.08, 72.88, 'IN'],
  ['Bengaluru', 12.97, 77.59, 'IN'], ['Colombo', 6.93, 79.86, 'LK'],
  ['Bangkok', 13.76, 100.50, 'TH'], ['Singapur', 1.35, 103.82, 'SG'],
  ['Jakarta', -6.21, 106.85, 'ID'], ['Manila', 14.60, 120.98, 'PH'],
  ['Ho-Chi-Minh-Stadt', 10.82, 106.63, 'VN'], ['Kuala Lumpur', 3.14, 101.69, 'MY'],
  ['Peking', 39.90, 116.41, 'CN'], ['Shanghai', 31.23, 121.47, 'CN'],
  ['Hongkong', 22.32, 114.17, 'CN'], ['Chengdu', 30.57, 104.07, 'CN'],
  ['Tokio', 35.68, 139.69, 'JP'], ['Osaka', 34.69, 135.50, 'JP'],
  ['Sapporo', 43.06, 141.35, 'JP'], ['Seoul', 37.57, 126.98, 'KR'],
  ['Taipeh', 25.03, 121.57, 'TW'], ['Ulaanbaatar', 47.89, 106.91, 'MN'],
  ['Almaty', 43.24, 76.89, 'KZ'], ['Taschkent', 41.30, 69.24, 'UZ'],
  ['Sydney', -33.87, 151.21, 'AU'], ['Melbourne', -37.81, 144.96, 'AU'],
  ['Brisbane', -27.47, 153.03, 'AU'], ['Perth', -31.95, 115.86, 'AU'],
  ['Adelaide', -34.93, 138.60, 'AU'], ['Auckland', -36.85, 174.76, 'NZ'],
  ['Wellington', -41.29, 174.78, 'NZ'], ['Honolulu', 21.31, -157.86, 'US'],
  ['Anchorage', 61.22, -149.90, 'US'], ['Nuuk', 64.18, -51.72, 'GL']
];

export const ANZAHL_ORTE = STAEDTE.length;

const rad = (d) => (d * Math.PI) / 180;

/** Luftlinie in Kilometern — dieselbe Formel wie in weather.js, nur lokal. */
function km(aLat, aLon, bLat, bLon) {
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Die nächstgelegene bekannte Stadt.
 * @returns {{name:string, land:string, km:number}|null}
 */
export function naechsterOrt(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  let best = null;
  for (const [name, sLat, sLon, land] of STAEDTE) {
    const d = km(lat, lon, sLat, sLon);
    if (!best || d < best.km) best = { name, land, km: d };
  }
  return best;
}

/**
 * Der Name, der auf dem Bildschirm steht.
 *
 * Drei Stufen, weil drei verschiedene Dinge gemeint sind: in der Stadt,
 * im Umland, oder irgendwo dazwischen. Die dritte Form nennt die Zahl,
 * damit niemand „Kassel" liest und an Kassel denkt, wenn es achtzig
 * Kilometer weiter ist.
 */
export function ortName(lat, lon) {
  const o = naechsterOrt(lat, lon);
  if (!o) return '';
  if (o.km < 12) return o.name;
  if (o.km < 45) return `bei ${o.name}`;
  return `${Math.round(o.km)} km von ${o.name}`;
}

/** Ein fertiger Ort, wie ihn der Rest der App erwartet. */
export function ortFuer(lat, lon) {
  const o = naechsterOrt(lat, lon);
  return {
    name: ortName(lat, lon),
    region: o && o.km >= 12 ? o.name : '',
    country: o ? o.land : '',
    lat,
    lon
  };
}
