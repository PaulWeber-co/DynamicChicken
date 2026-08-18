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
