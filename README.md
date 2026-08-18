# Dynamic Chicken




---

`https://<dein-name>.github.io/DynamicChicken/`.


Deine Ereignisse werden zu einem kurzen
Text zusammengefaltet (deflate + base64url), den du per WhatsApp, iMessage oder
Zettel schickst. 

Jedes Ereignis trägt eine ID. Ein Code doppelt eingefügt macht nichts, ein
verlorener Code auch nicht — der nächste holt alles nach..

### firebase

Warum Firebase Realtime Database und nicht irgendein SDK? Weil sie sich als
reine REST-Schnittstelle ansprechen lässt **und** Änderungen als Server-Sent
Events ausliefert. Beides kann ein Browser von Haus aus — kein Bundle, kein
Build, kein npm. Die Seite bleibt statisch und synchronisiert trotzdem in
Echtzeit.

1. [console.firebase.google.com](https://console.firebase.google.com) → Projekt
   anlegen (Analytics kannst du abwählen).
2. **Build → Realtime Database → Datenbank erstellen.** Region: `europe-west1`.
   Starte im **Testmodus**.
3. Regeln unter **Rules** ersetzen:

   ```json
   {
     "rules": {
       "knuddl": {
         "ping": { ".read": true },
         "r": { "$room": { ".read": true, ".write": true } },
         "m": { "$code": { ".read": true, ".write": true } },
         "u": { "$code": { ".read": true, ".write": true } }
       }
     }
   }
   ```

   Was diese Regeln bewirken: Zugriff gibt es nur *innerhalb* eines Raums,
   nicht auf die Ebene darüber. Wer nur die Datenbank-URL kennt, kann damit
   weder die Räume auflisten noch die Datenbank leeren — beides ginge, wenn
   `.read`/`.write` direkt auf `knuddl` stünde. Um an einen Raum zu kommen,
   müsste man seine zwanzig Zeichen raten, und die hängen am Geheimnis.

   Keine Prüfung auf die Pfadform: Der Raumname ist aus eurem Geheimnis
   abgeleitet, seine Länge kann sich mit einer neuen Fassung ändern. Eine
   Regel wie `".validate": "$code.length <= 12"` würde dann jeden
   Schreibzugriff ablehnen — still, ohne Fehlermeldung in der App.

4. Die Datenbank-URL kopieren
   (`https://…-default-rtdb.europe-west1.firebasedatabase.app`).
5. In der App unter **Mehr → Cloud** einfügen — oder fest in
   [`config.js`](config.js) eintragen, dann müsst ihr es nie wieder tun.
6. Beide Geräte: derselbe Eintrag, dann **die vollständige Einladung**
   tauschen (`ABC123-K7F2M9QX4R8TWE7HJ2NP`), nicht nur den sechsstelligen
   Code. Fertig.

### Kann da jemand mitlesen?

Nein — die Datenbank bekommt nichts Lesbares zu sehen. Aus dem Geheimnis
hinter dem Bindestrich leiten beide Geräte per HKDF-SHA256 eine Raum-ID und
einen AES-GCM-256-Schlüssel ab. Das Geheimnis läuft nur über euren eigenen
Messenger und wird nie hochgeladen. In der Datenbank liegt danach an einer
unauffindbaren Stelle nur `{v, iv, ct}` — Namen, Stimmungen, Nest-Wünsche,
Bewertungen und Ort stecken alle im Chiffrat.

Tauscht ihr nur den nackten Code, verbindet das zwar auch, aber
unverschlüsselt. Die App sagt das dann deutlich.

**Was damit nicht geschützt ist** — der Vollständigkeit halber:

- **Die Einladung selbst.** Wer sie in die Finger bekommt (Screenshot,
  weitergeleitete Nachricht, offenes Handy), kann alles mitlesen. Sie ist
  der Schlüssel, nicht nur eine Adresse.
- **Metadaten.** Dass es einen Raum gibt, wie viele Datensätze darin liegen
  und wann geschrieben wurde, sieht jeder mit Datenbankzugriff. Der Inhalt
  bleibt Zufallsrauschen.
- **Eure Geräte.** Der Spielstand liegt im Klartext im Browser-Speicher.
  Wer euer entsperrtes Handy hat, liest alles.
- **Wer die Seite ausliefert.** GitHub Pages liefert das JavaScript aus, das
  verschlüsselt. Wer den Code austauschen könnte, könnte auch mitlesen —
  das gilt für jede Web-App und lässt sich nicht wegprogrammieren.
- **Verkehrsdaten.** Firebase sieht IP-Adressen und Zeitpunkte, Open-Meteo
  sieht die Koordinaten, für die Wetter geholt wird.

Wer auch das Schreiben absichern will: In Firebase **Authentication →
Anonymous** einschalten und in den Regeln `".read"`/`".write"` auf
`"auth != null"` setzen. Für die Vertraulichkeit der Inhalte ist es nicht
nötig, gegen Störer schon.

## Spiele

Elf Duelle, alle zeitversetzt spielbar — ihr müsst nie gleichzeitig online
sein. Die Runde kommt aus einem Seed, den beide Geräte allein aus dem
Paar-Code berechnen: gleiche Karten, gleiche Farben, gleicher Zaun, ohne
Server und ohne Schiedsrichter.

| Spiel | Was |
|---|---|
| **Körner-Jagd** | Knuddl steuern und fangen, was vom Himmel fällt |
| **Federflug** | Ein Finger, viele Zaunlücken |
| **Ei-Duell** | Fünf Symbole, fünf Runden, verdeckt gelegt |
| **Nest-Turm** | Zweig auf Zweig stapeln |
| **Kritzel-Telefon** | Du malst ein Wort, drüben wird geraten |
| **Top Fünf** | Kategorie vorgeben, fünf Antworten sortieren, Reihenfolge erraten |
| **Meme-Duell** | Du schreibst den Satz, der andere findet das Bild |
| **Farbfunk** | Ein einziges Wort zu einer Farbe — findet der andere sie? |
| **Federpoker** | Fünf Karten, einmal tauschen, beste Hand |
| **Gefühls-Duett** | Beide raten, wie es dem anderen geht |
| **Feder-Memory** | Acht Paare, identisches Blatt für beide |

Die Übersicht ist zweistufig: oben steht groß, was gerade auf dich wartet,
darunter liegen alle Spiele als Raster. Elf Duelle passen so auf gut einen
Bildschirm statt auf drei.

**Top Fünf** ist Top Ten in klein. Einer gibt eine Kategorie vor („Dinge, um
sich von der Titanic zu retten“), der andere schreibt fünf Antworten und
sortiert sie selbst von 1 bis 5. Zurück gehen die Antworten in gewürfelter
Reihenfolge — die Nummern sind verdeckt. Drei Punkte für jede Antwort auf
dem exakt richtigen Platz, einer für jedes Paar, das zueinander richtig
herum steht; 25 sind das Maximum. Beide bekommen dieselben Punkte, es geht
nicht ums Gewinnen.

**Meme-Duell:** Du schreibst eine Vorlage, dein Mensch sucht irgendwo ein
Bild dazu und lädt es hoch, du vergibst eine Note von 1 bis 5. **Danach ist
das Bild auf beiden Geräten weg** — im Verlauf bleiben nur Spruch und Note.
Das Bild wird vor dem Verschicken auf 720 Pixel Kantenlänge und rund hundert
Kilobyte gebracht, geht als flüchtiges Ereignis raus (landet also nie im
Brieftauben-Stapel) und fliegt als Erstes, falls der Browser-Speicher eng
wird. Bilder brauchen den Cloud-Modus; als Brieftauben-Code wären sie eine
Textwand, die durch keinen Messenger passt. Das Spiel sagt das offen, statt
still nichts zu tun.

**Federpoker ohne Schiedsrichter:** Feste Plätze im gemischten Stapel
trennen die Blätter — Karten 0–4 für den einen, 5–9 für den anderen, 10–19
zum Nachziehen. Keiner kann die Karten des anderen beeinflussen, und beide
rechnen unabhängig dasselbe Ergebnis aus. Übertragen wird nur, welche
Karten getauscht wurden.

**Hängt eine Runde?** Bei Top Fünf, Meme-Duell und Farbfunk wirft ein Knopf
im Spiel die Runde weg — auf beiden Geräten, mit sauber weitergereichtem
Zug. Ei-Duell gleicht beim Öffnen automatisch ab und holt verpasste Züge
nach; hilft das nicht, startet ein Knopf die Partie neu. Beim
Kritzel-Telefon ersetzt ein neues Bild eine liegen gebliebene Zeichnung.

## Anziehen

14 Hüte und 15 Accessoires, dazu 15 Gefiederfarben, 9 Bauchtöne, 8
Kammfarben in 6 Formen, 5 Augenpaare und ein Regler für die Leibesfülle.
Vom Fischerhut über Häschenohren bis Catsuit und Engelsflügeln — manches
kauft man, manches schaltet euer gemeinsames Bond-Level frei.

## Frage des Tages

Jeden Tag eine Frage, beide antworten, aufgedeckt wird gemeinsam. Unter
*Mehr* lässt sich ein zweiter, deutlich freizügigerer Katalog einschalten.
Er ist bewusst getrennt und wird auf der Karte auch als solcher
gekennzeichnet, damit nichts unerwartet auftaucht.
