/**
 * „Federgarn" — Szenarien, Rollen, Wendungen.
 *
 * Nur Stoff, keine Mechanik. Ein Szenario besteht aus einem Ort, zwei Rollen
 * und einem Anfang; alles Weitere schreibt ihr selbst.
 *
 * Ein Szenario:
 *   id, titel, kicker   Kachel und Überschrift
 *   ton                 'warm' | 'love' | 'calm' — färbt die Karte
 *   anfang(c)           die Startszene; `c` kennt beide Namen
 *   rollen[2]           { name, satz, kostuem: { hat: [], acc: [] } }
 *   spicy               nur mit eingeschaltetem Schalter
 *   braucht             { acc: 'catsuit' } — ohne dieses Stück gar nicht erst
 *
 * Zu den Kostümen: Jede Rolle nennt Kleidungsstücke, die zu ihr passen. Wer
 * sein Huhn passend anzieht, bekommt pro Zug ein paar Funken extra — und bei
 * den wenigen Rollen mit `braucht` geht es ohne das Stück gar nicht los. Das
 * ist der Grund, warum der Laden überhaupt jemanden interessieren sollte:
 * Ein Hut, den nie jemand sieht, ist ein toter Knopf.
 */

/** Die zwei Rollen eines Szenarios sind immer `rollen[0]` und `rollen[1]`. */
export const SZENARIEN = [

  /* ── Klassisch, mit Widerhaken ─────────────────────── */
  {
    id: 'turm',
    titel: 'Der Turm',
    kicker: 'Rettung unerwünscht',
    ton: 'warm',
    rollen: [
      { name: 'Ritter', satz: 'Vier Wochen Ritt, ein verbeulter Helm, ein Plan.',
        kostuem: { hat: ['viking', 'crown', 'pirate'], acc: ['medal', 'suspenders'] } },
      { name: 'Prinzessin', satz: 'Der Turm ist bequem. Das Problem ist der Besuch.',
        kostuem: { hat: ['crown', 'veil', 'flower'], acc: ['necklace', 'lace'] } }
    ],
    anfang: (c) => `Der Turm ist höher als angekündigt, und das Fenster ganz oben steht
      offen. Unten im Gras liegt ein Drache und schläft — ziemlich klein für einen Drachen,
      ziemlich laut für seine Größe.

      ${c.a} steht seit einer Viertelstunde davor und ruft nach oben. ${c.b} hat bis eben
      so getan, als wäre niemand zu Hause.`
  },

  {
    id: 'raub',
    titel: 'Zwei Minuten Sechzehn',
    kicker: 'Museumsraub, Plan halb gar',
    ton: 'calm',
    rollen: [
      { name: 'Kopf', satz: 'Der Plan ist gut. Der Plan war immer gut.',
        kostuem: { hat: ['top', 'beret'], acc: ['glasses', 'tie', 'monocle'] } },
      { name: 'Hände', satz: 'Du hast noch nie einen Plan gebraucht.',
        kostuem: { hat: ['beanie', 'cap'], acc: ['catsuit', 'sunglasses'] } }
    ],
    anfang: (c) => `Zwei Minuten sechzehn zwischen zwei Wachrunden. Danach ist die Halle
      wieder voller Kameras, und ihr steht in einem Raum, in dem ihr nicht sein solltet,
      neben einer Vitrine, die ihr nicht öffnen könnt.

      ${c.a} hat den Plan. ${c.b} hat das Brecheisen. Die Uhr läuft seit vier Sekunden.`
  },

  {
    id: 'raumschiff',
    titel: 'Der lange Weg zurück',
    kicker: 'Havarie, zwei Leute, ein Schiff',
    ton: 'calm',
    rollen: [
      { name: 'Kommando', satz: 'Du triffst die Entscheidungen. Auch die schlechten.',
        kostuem: { hat: ['cap', 'crown'], acc: ['medal', 'headphones'] } },
      { name: 'Maschinenraum', satz: 'Du weißt, was wirklich kaputt ist.',
        kostuem: { hat: ['beanie', 'bucket'], acc: ['apron', 'suspenders', 'stetho'] } }
    ],
    anfang: (c) => `Etwas hat das Schiff getroffen, und das Wort „etwas" ist der
      unangenehmste Teil des Satzes. Die Lichter sind orange, die Luft riecht nach heißem
      Metall, und der Bordcomputer wiederholt seit acht Minuten dieselbe Zahl.

      ${c.a} steht auf der Brücke. ${c.b} steht knietief in dem, was mal die Kühlung war.`
  },

  {
    id: 'verhoer',
    titel: 'Zimmer 4',
    kicker: 'Ein Tisch, zwei Stühle, eine Lüge',
    ton: 'calm',
    rollen: [
      { name: 'Ermittlung', satz: 'Du weißt mehr, als du zugibst. Wie alle hier.',
        kostuem: { hat: ['top', 'cap'], acc: ['tie', 'glasses', 'cuffs'] } },
      { name: 'Verdacht', satz: 'Du warst es nicht. Wahrscheinlich.',
        kostuem: { hat: ['beret', 'bucket'], acc: ['cuffs', 'scarf', 'choker'] } }
    ],
    anfang: (c) => `Neonlicht, ein Tisch mit einer Delle, zwei Becher Kaffee, von denen
      einer schon kalt ist. Draußen wartet jemand, dem die Zeit ausgeht.

      ${c.a} legt eine Mappe auf den Tisch und macht sie nicht auf. ${c.b} sieht die Mappe
      an und sagt nichts. Noch nicht.`
  },

  /* ── Alltag, schief ────────────────────────────────── */
  {
    id: 'aufzug',
    titel: 'Zwischen zwei Stockwerken',
    kicker: 'Stecken geblieben, ohne Empfang',
    ton: 'love',
    rollen: [
      { name: 'Nachbar von oben', satz: 'Ihr grüßt euch seit zwei Jahren. Mehr nicht.',
        kostuem: { hat: ['cap', 'beanie'], acc: ['headphones', 'tie', 'robe'] } },
      { name: 'Nachbarin von unten', satz: 'Du weißt, wann er duscht. Er weiß es nicht.',
        kostuem: { hat: ['bow', 'flower'], acc: ['robe', 'lace', 'necklace'] } }
    ],
    anfang: (c) => `Der Aufzug macht ein Geräusch, das Aufzüge nicht machen sollten, und
      bleibt stehen. Die Anzeige zeigt eine Zahl zwischen zwei Zahlen. Kein Empfang, kein
      Notruf, dafür sehr viel Licht und sehr wenig Quadratmeter.

      ${c.a} drückt zum dritten Mal den Knopf. ${c.b} lehnt an der Wand und wartet ab, wie
      lange das noch weitergeht.`
  },

  {
    id: 'baeckerei',
    titel: 'Fünf Uhr zehn',
    kicker: 'Jeden Morgen dieselbe Bestellung',
    ton: 'love',
    rollen: [
      { name: 'Hinter der Theke', satz: 'Du kennst die Bestellung. Nicht den Namen.',
        kostuem: { hat: ['chef', 'bucket', 'beanie'], acc: ['apron', 'suspenders'] } },
      { name: 'Vor der Theke', satz: 'Du hast noch nie etwas anderes bestellt.',
        kostuem: { hat: ['beanie', 'cap'], acc: ['scarf', 'glasses'] } }
    ],
    anfang: (c) => `Fünf Uhr zehn, draußen ist es schwarz, drinnen riecht es nach warmem
      Blech. Der erste Mensch des Tages steht in der Tür und bringt Kälte mit.

      ${c.a} hat die Tüte schon in der Hand, bevor jemand etwas sagt. ${c.b} bleibt heute
      stehen, statt zu zahlen und zu gehen.`
  },

  {
    id: 'kochshow',
    titel: 'Noch zwölf Minuten',
    kicker: 'Zwei Herdplatten, eine Kamera',
    ton: 'warm',
    rollen: [
      { name: 'Titelverteidigung', satz: 'Du hast das schon dreimal gewonnen.',
        kostuem: { hat: ['chef', 'top'], acc: ['apron', 'medal'] } },
      { name: 'Herausforderung', satz: 'Du kochst besser. Sagt deine Mutter.',
        kostuem: { hat: ['chef', 'beanie', 'bow'], acc: ['apron', 'heartSpecs'] } }
    ],
    anfang: (c) => `Zwölf Minuten, eine Geheimzutat unter einer Glocke, und eine Jury, die
      aussieht, als hätte sie heute schon zu viel gegessen. Das Studio ist zu heiß, die
      Kamera zu nah.

      ${c.a} hebt die Glocke. Darunter liegt etwas, mit dem niemand gerechnet hat.
      ${c.b} lacht — einmal, kurz, und dann nicht mehr.`
  },

  {
    id: 'geister',
    titel: 'Belegt',
    kicker: 'Zwei Geister, ein Haus',
    ton: 'warm',
    rollen: [
      { name: 'Alteingesessen', satz: 'Du spukst hier seit hundertvierzig Jahren.',
        kostuem: { hat: ['veil', 'top'], acc: ['monocle', 'boa'] } },
      { name: 'Neu zugezogen', satz: 'Du bist erst seit Dienstag tot und schon genervt.',
        kostuem: { hat: ['cap', 'party'], acc: ['headphones', 'sunglasses'] } }
    ],
    anfang: (c) => `Das Haus ist leer, seit die letzte Familie ausgezogen ist, und leer
      heißt in diesem Fall: nur zwei. Das reicht für Streit.

      ${c.a} klappert seit hundertvierzig Jahren im Ostflügel und hält das für Tradition.
      ${c.b} hat gestern eine Steckdose zum Funken gebracht und hält das für Fortschritt.`
  },

  /* ── Fern und nah ──────────────────────────────────── */
  {
    id: 'funk',
    titel: 'Zwölf Lichtminuten',
    kicker: 'Bodenstation und Sonde',
    ton: 'love',
    rollen: [
      { name: 'Bodenstation', satz: 'Du hörst alles zwölf Minuten zu spät.',
        kostuem: { hat: ['cap'], acc: ['headphones', 'glasses', 'medal'] } },
      { name: 'Da oben', satz: 'Du redest in eine Kiste und hoffst, dass sie zuhört.',
        kostuem: { hat: ['bucket', 'halo'], acc: ['wings', 'scarf'] } }
    ],
    anfang: (c) => `Zwischen euch liegen zwölf Lichtminuten. Was ${c.b} jetzt sagt, hört
      ${c.a} in zwölf Minuten, und die Antwort braucht nochmal zwölf. Ein Gespräch, bei dem
      man jeden Satz allein lässt, bis er ankommt.

      Heute ist irgendwas anders am Funkverkehr. Es fängt damit an, dass ${c.b} eine Frage
      stellt, die nicht im Protokoll steht.`
  },

  {
    id: 'zeit',
    titel: 'Dienstag, zweimal',
    kicker: 'Du triffst dich selbst',
    ton: 'warm',
    rollen: [
      { name: 'Heute', satz: 'Du bist noch nicht so weit. Sagt die andere Person.',
        kostuem: { hat: ['beanie', 'cap'], acc: ['glasses', 'scarf'] } },
      { name: 'In zehn Jahren', satz: 'Du weißt, was passiert. Deshalb bist du hier.',
        kostuem: { hat: ['top', 'beret'], acc: ['monocle', 'medal', 'robe'] } }
    ],
    anfang: (c) => `Im Café an der Ecke sitzt jemand, der aussieht wie ${c.a}, nur mit
      besseren Schuhen und schlechteren Nachrichten.

      „Setz dich", sagt ${c.b}. „Wir haben ungefähr zwanzig Minuten, bis das hier auffällt,
      und ich muss dir eine Sache sagen, die du nicht glauben wirst."`
  },

  /* ── Spicy ─────────────────────────────────────────── */
  {
    id: 'hofstaat',
    titel: 'Nachtdienst',
    kicker: 'Königin und Leibwache',
    ton: 'love',
    spicy: true,
    rollen: [
      { name: 'Krone', satz: 'Du befiehlst gern. Heute ist es anstrengend.',
        kostuem: { hat: ['crown', 'crownDark'], acc: ['necklace', 'boa', 'lace'] } },
      { name: 'Wache', satz: 'Du stehst seit sechs Stunden vor derselben Tür.',
        kostuem: { hat: ['viking', 'pirate'], acc: ['medal', 'suspenders', 'choker'] } }
    ],
    anfang: (c) => `Der Palast schläft. Vor der Kammertür brennt eine Kerze, und dahinter
      ist seit einer Stunde niemand mehr müde.

      ${c.a} hat dreimal nach Wasser geklingelt, das niemand trinken wollte. ${c.b} hat
      dreimal Wasser gebracht und beim dritten Mal die Tür nicht ganz zugemacht.`
  },

  {
    id: 'domina',
    titel: 'Die Regel',
    kicker: 'Eine sagt an, eine hört zu',
    ton: 'love',
    spicy: true,
    braucht: { acc: 'catsuit', wer: 0 },
    rollen: [
      { name: 'Ansage', satz: 'Du hast eine Regel aufgestellt. Nur eine.',
        kostuem: { hat: ['ears', 'crownDark'], acc: ['catsuit', 'choker'] } },
      { name: 'Zuhören', satz: 'Du hast zugestimmt. Vor zwei Stunden klang das leichter.',
        kostuem: { hat: ['bunny', 'bow'], acc: ['choker', 'lace'] } }
    ],
    anfang: (c) => `Die Regel steht auf einem Zettel auf dem Tisch, in einer Handschrift,
      die keinen Zweifel zulässt. Vier Worte. Mehr braucht es angeblich nicht.

      ${c.a} sitzt und wartet, ob die Regel hält. ${c.b} steht daneben und hat sie bis
      jetzt eingehalten. Bis jetzt.`
  },

  {
    id: 'vampir',
    titel: 'Blutgruppe egal',
    kicker: 'Sehr höflich, sehr hungrig',
    ton: 'love',
    spicy: true,
    rollen: [
      { name: 'Seit 400 Jahren', satz: 'Du bittest immer erst. Das ist deine einzige Regel.',
        kostuem: { hat: ['crownDark', 'top'], acc: ['choker', 'boa', 'catsuit'] } },
      { name: 'Freiwillig', satz: 'Du hast die Anzeige selbst beantwortet.',
        kostuem: { hat: ['beanie', 'flower'], acc: ['scarf', 'lace', 'necklace'] } }
    ],
    anfang: (c) => `Die Wohnung ist erstaunlich normal: Bücherregal, Sofa, eine Zimmerpflanze,
      die es nicht verdient hat, hier zu stehen. Nur die Vorhänge sind zu dick, und im Flur
      hängt kein Spiegel.

      ${c.a} schenkt Tee ein, den niemand trinken wird. ${c.b} sitzt auf dem Sofa und hat
      den Kragen schon aufgemacht, bevor jemand darum gebeten hat.`
  },

  {
    id: 'kabine',
    titel: 'Größe passt',
    kicker: 'Umkleide, viel zu klein',
    ton: 'love',
    spicy: true,
    rollen: [
      { name: 'Drinnen', satz: 'Du wolltest nur schnell was anprobieren.',
        kostuem: { hat: ['bow', 'ears'], acc: ['lace', 'catsuit', 'choker'] } },
      { name: 'Vor dem Vorhang', satz: 'Du solltest eigentlich nur die Tasche halten.',
        kostuem: { hat: ['cap', 'beret'], acc: ['sunglasses', 'tie'] } }
    ],
    anfang: (c) => `Der Vorhang ist zwanzig Zentimeter zu schmal. Der Spiegel steht so, dass
      man von draußen mehr sieht, als der Laden vermutlich beabsichtigt hat, und aus den
      Boxen läuft irgendein Lied von vor zehn Jahren.

      ${c.a} hat drei Sachen mit reingenommen und keine davon passt. ${c.b} steht draußen und
      hält eine Tasche, die immer schwerer wird.`
  },

  /* ── Neu im Schrank, neu im Regal ───────────────────── */
  {
    id: 'sprechstunde',
    titel: 'Bitte einmal tief',
    kicker: 'Sprechstunde, letzter Termin',
    ton: 'love',
    spicy: true,
    braucht: { acc: 'stetho', wer: 0 },
    rollen: [
      { name: 'Die Praxis', satz: 'Du hast heute 31 Leute gesehen. Der 32. ist anders.',
        kostuem: { hat: ['chef', 'beanie'], acc: ['stetho', 'glasses'] } },
      { name: 'Der Termin', satz: 'Dir fehlt nichts. Du bist trotzdem hier.',
        kostuem: { hat: ['bow', 'flower'], acc: ['robe', 'lace', 'necklace'] } }
    ],
    anfang: (c) => `Halb sieben, das Wartezimmer ist leer, draußen macht jemand die Jalousien
      runter. Auf der Liege liegt Papier, das bei jeder Bewegung zu laut ist.

      ${c.a} liest eine Akte, in der nichts steht. ${c.b} sitzt auf der Liege und hat den
      Grund für den Termin bisher dreimal umformuliert.`
  },

  {
    id: 'flucht',
    titel: 'Aneinander',
    kicker: 'Eine Kette, zwei Meinungen',
    ton: 'warm',
    spicy: true,
    braucht: { acc: 'cuffs', wer: 1 },
    rollen: [
      { name: 'Dienstlich', satz: 'Du machst nur deinen Job. Seit heute Morgen jedenfalls.',
        kostuem: { hat: ['cap', 'top'], acc: ['medal', 'tie', 'sunglasses'] } },
      { name: 'Unschuldig', satz: 'Du sagst das jetzt zum vierten Mal, und es stimmt sogar.',
        kostuem: { hat: ['beanie', 'ears'], acc: ['cuffs', 'choker', 'catsuit'] } }
    ],
    anfang: (c) => `Der Transporter liegt im Graben, der Fahrer ist weg, und der Schlüssel für
      die Handschellen war in seiner Jacke. Zwanzig Kilometer bis zur nächsten Straße, ein
      Regen, der nicht aufhören will, und achtzig Zentimeter Kette dazwischen.

      ${c.a} will zurück zur Straße. ${c.b} will in die andere Richtung. Gehen müssen beide
      gleichzeitig.`
  },

  {
    id: 'trauung',
    titel: 'Ja, aber',
    kicker: 'Standesamt, Zimmer 12',
    ton: 'warm',
    rollen: [
      { name: 'Die Trauzeugin', satz: 'Du hast die Ringe. Du hast auch eine Meinung.',
        kostuem: { hat: ['top', 'veil', 'flower'], acc: ['boa', 'necklace', 'tie'] } },
      { name: 'Fast verheiratet', satz: 'Du bist dir sicher. Zu ungefähr siebenundachtzig Prozent.',
        kostuem: { hat: ['veil', 'crown', 'bow'], acc: ['lace', 'necklace', 'medal'] } }
    ],
    anfang: (c) => `Zimmer 12 riecht nach Bohnerwachs und Blumen aus dem Supermarkt. Vierzehn
      Gäste, ein Standesbeamter mit Termindruck und ein Kassettenrekorder, der die falsche
      Seite spielt.

      ${c.a} steht vorn und hält eine kleine Schachtel fest. ${c.b} steht daneben und hat seit
      dem Aufstehen dreimal die Schuhe gewechselt und einmal die Meinung.`
  }
];

export const szenarioById = (id) => SZENARIEN.find((s) => s.id === id) || null;

/**
 * Wendungen — der Motor.
 *
 * Jeder Zug zieht eine. Sie muss vorkommen, egal wie unpassend sie ist —
 * genau daran entstehen die Sätze, auf die keiner von allein gekommen wäre.
 * Deshalb sind sie bewusst allgemein gehalten: Sie müssen im Turm genauso
 * funktionieren wie im Aufzug.
 */
export const WENDUNGEN = [
  'Das Licht geht aus.',
  'Jemand klopft. Dreimal, langsam.',
  'Deine Figur sagt versehentlich die Wahrheit.',
  'Ein Tier mischt sich ein.',
  'Etwas fällt herunter und geht kaputt.',
  'Deine Figur hat gelogen. Es fliegt jetzt auf.',
  'Es fängt an zu regnen. Drinnen.',
  'Jemand ruft an. Ausgerechnet jetzt.',
  'Deine Figur verliert etwas Wichtiges.',
  'Ein Geräusch, das da nicht hingehört.',
  'Deine Figur muss plötzlich lachen.',
  'Jemand Drittes taucht auf und geht nicht wieder.',
  'Die Zeit wird knapp — sehr knapp.',
  'Deine Figur trifft eine Entscheidung, die sie bereuen wird.',
  'Etwas, das du für sicher hieltest, ist es nicht.',
  'Deine Figur sagt einen Satz, den sie von jemand anderem hat.',
  'Ihr seid nicht allein. Wart ihr nie.',
  'Deine Figur bietet etwas an, das ihr nicht gehört.',
  'Ein alter Fehler kommt zurück.',
  'Deine Figur wird für jemand anderen gehalten.',
  'Es riecht nach etwas Verbranntem.',
  'Deine Figur hat genau eine Hand frei.',
  'Jemand hat mitgeschrieben.',
  'Der Boden ist plötzlich sehr rutschig.',
  'Deine Figur sagt drei Sätze und keinen davon zu Ende.',
  'Ein Versprechen wird gebrochen.',
  'Deine Figur findet etwas, das sie nicht suchen wollte.',
  'Etwas wird gestohlen — von wem, ist unklar.',
  'Deine Figur hat Hunger. Sehr unpassend.',
  'Ein Fenster steht auf, das vorher zu war.',
  'Deine Figur muss niesen.',
  'Jemand nennt deine Figur beim falschen Namen — und meint es ernst.',
  'Deine Figur bekommt einen Vorschlag, den sie nicht ablehnen kann.',
  'Das Wetter dreht.',
  'Deine Figur hat genau dreißig Sekunden.',
  'Ein Gegenstand aus dem ersten Absatz wird wichtig.',
  'Deine Figur erinnert sich falsch, und niemand korrigiert sie.',
  'Es wird sehr still.',
  'Deine Figur macht einen Fehler, den sie sofort merkt.',
  'Jemand weint. Vielleicht deine Figur.',
  'Zwei Dinge passieren gleichzeitig, und du kannst nur eins verhindern.',
  'Deine Figur zieht etwas aus, das sie besser angelassen hätte.',
  'Ein Angebot: Etwas gegen etwas anderes.',
  'Deine Figur hat sich das anders vorgestellt.',
  'Ein Gerät streikt.',
  'Jemand kennt euer Geheimnis.',
  'Deine Figur tut das Gegenteil von dem, was sie gesagt hat.',
  'Es gibt nur noch einen Platz.',
  'Etwas, das leise war, wird laut.',
  'Deine Figur bekommt recht — und das ist schlimmer.'
];

/** Nur mit eingeschaltetem Schalter. Deutlich direkter. */
export const WENDUNGEN_SPICY = [
  'Deine Figur kommt zu nah und geht nicht zurück.',
  'Ein Kleidungsstück ist im Weg.',
  'Deine Figur sagt, was sie will. Genau so.',
  'Berührung, die als Versehen anfängt und keins bleibt.',
  'Deine Figur wird rot und leugnet es.',
  'Jemand zählt bis drei.',
  'Deine Figur bittet um etwas. Zum ersten Mal.',
  'Der Abstand zwischen euch ist jetzt eine Entscheidung.',
  'Deine Figur macht einen Vorschlag, der nicht jugendfrei ist.',
  'Ein Blick, der zu lange dauert, und beide wissen es.',
  'Deine Figur verliert die Geduld — im guten Sinn.',
  'Etwas wird geflüstert, das man nicht schreiben würde.'
];

/**
 * Die Bewertung des vorigen Zugs.
 *
 * Es sind absichtlich fünf Stufen mit Namen statt Sternen: „Da wär mehr
 * gegangen" liest sich anders als zwei von fünf, und man traut sich eher,
 * ehrlich zu sein.
 */
export const FUNKEN = [
  { v: 1, label: 'Hm', sub: 'Da war der Faden kurz weg', icon: 'moodCalm' },
  { v: 2, label: 'Geht so', sub: 'Ich weiß, worauf du hinauswolltest', icon: 'moodSilly' },
  { v: 3, label: 'Gut', sub: 'Damit kann ich was anfangen', icon: 'statJoy' },
  { v: 4, label: 'Stark', sub: 'Das hat gesessen', icon: 'sparkle' },
  { v: 5, label: 'Volltreffer', sub: 'Genau das wollte ich lesen', icon: 'trophy' }
];

/** Ab fünf Funken darf man die Wendung ausschlagen. */
export const FREIE_HAND = 5;
/** Wie viele Funken das Kostüm pro Zug bringt. */
export const KOSTUEM_BONUS = 2;
/** Nach so vielen Zügen bietet das Spiel den Schluss an. */
export const ZUEGE_BIS_SCHLUSS = 12;

/**
 * Der Epilog richtet sich danach, wie gut ihr euch gegenseitig fandet.
 * Nicht danach, wer gewonnen hat — gewinnen kann man hier nicht.
 */
export function epilog(schnitt, zuege, spicy) {
  if (schnitt >= 4.2) {
    return {
      titel: 'Wie aus einem Guss',
      text: `${zuege} Züge, und keiner davon im Weg. Ihr habt euch die Bälle so zugespielt,
        als hättet ihr die Geschichte vorher abgesprochen — was ihr nicht habt, und genau
        das ist der Punkt.${spicy ? ' Den letzten Absatz schreibt ihr besser nicht auf.' : ''}`
    };
  }
  if (schnitt >= 3.2) {
    return {
      titel: 'Hat sich gefunden',
      text: `${zuege} Züge, zwei Anläufe, ein Ende. Zwischendurch wusste keiner von euch,
        wo das hinführt, und dann war es plötzlich gut. So gehen die meisten guten
        Geschichten.`
    };
  }
  if (schnitt >= 2.2) {
    return {
      titel: 'Ein bisschen wild',
      text: `${zuege} Züge und mindestens drei Richtungswechsel. Ob das eine Geschichte war
        oder zwei, darüber lässt sich streiten. Unterhaltsam war es allemal.`
    };
  }
  return {
    titel: 'Völlig entgleist',
    text: `${zuege} Züge, und am Ende hatte nichts mehr mit dem Anfang zu tun. Irgendwo
      unterwegs habt ihr die Handlung verloren und einfach weitergeschrieben. Ehrenwert.`
  };
}

/**
 * Der simulierte Mensch im Solo-Modus.
 *
 * Er kann nicht schreiben, also tut er das, was schlechte Improvisation
 * immer tut: allgemein bleiben und die Wendung dick unterstreichen. Es ist
 * ein Platzhalter, kein Mitspieler — aber der Modus bleibt bedienbar.
 */
export const SOLO_ZUEGE = [
  'Ich brauche kurz. Was du gesagt hast, ändert einiges.',
  'Und dann tue ich genau das, womit du nicht gerechnet hast.',
  'Warte. Bevor wir weitermachen: hast du das gehört?',
  'Ich sage nichts. Ich sehe dich nur an, und das reicht.',
  'Das war ein Fehler. Deiner oder meiner, das klären wir später.',
  'Ich mache einen Schritt nach vorn und rede weiter, als wäre nichts.',
  'Gut. Dann eben so.',
  'Ich hätte das anders gemacht. Aber jetzt ist es zu spät dafür.',
  'Genau in dem Moment fällt mir ein, warum das keine gute Idee war.',
  'Ich lache. Es passt nicht, aber ich kann nichts dagegen tun.',
  'Ich greife nach dem, was am nächsten liegt, und hoffe das Beste.',
  'Das ist der Punkt, an dem ich ehrlich werde. Ein bisschen.'
];
