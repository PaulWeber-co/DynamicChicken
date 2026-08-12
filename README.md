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
         ".read": true,
         ".write": true,
         "$section": {
           "$code": {
             ".validate": "$code.length <= 12"
           }
         }
       }
     }
   }
   ```

4. Die Datenbank-URL kopieren
   (`https://…-default-rtdb.europe-west1.firebasedatabase.app`).
5. In der App unter **Mehr → Cloud** einfügen — oder fest in
   [`config.js`](config.js) eintragen, dann müsst ihr es nie wieder tun.
6. Beide Geräte: derselbe Eintrag, dann Codes tauschen. Fertig.
