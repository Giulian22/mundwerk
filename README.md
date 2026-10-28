# Mundwerk

Trainer für englische Aussprache, gemacht für Deutsch-Muttersprachler.
Du sprichst ein Wort, die Spracherkennung schreibt mit. Drei Treffer am Stück (bei Sätzen zwei), und es sitzt. Ein Fehler löscht die Haken wieder.

**Zur App:** https://giulian22.github.io/mundwerk/

## Was wo liegt

| Datei | Inhalt |
| --- | --- |
| `index.html` | Startseite der App |
| `css/app.css` | Design „Dunkel“ mit Neon-Grün, hell auf Wunsch (Einstellungen, Aussehen) |
| `css/fonts.css`, `fonts/` | Schriften Space Grotesk, Inter und Charis SIL (Lautschrift), liegen im Projekt |
| `js/data.js` | Alle Pakete, Wörter, Sätze, Lautschrift und Tipps |
| `js/core.js` | Vergleich mit dem Gesprochenen, Spielstand, Tagesziel und Serie |
| `js/app.js` | Bildschirm, Mikrofon, Vorlesen, Offline und Updates |
| `js/fx.js` | Animationen, Übergänge, Konfetti, Töne und Vibration |
| `js/sync.js`, `js/firebase-config.js` | Synchronisierung zwischen Geräten über Firebase |
| `vendor/firebase.js` | Firebase-Bibliothek (App, Auth, Firestore Lite), gebaut mit `npm run build:firebase` |
| `firestore.rules` | Sicherheitsregeln: Nur du liest und schreibst deine Daten |
| `sw.js` | Service Worker: speichert alles für den Start ohne Internet |
| `manifest.webmanifest`, `icons/` | Damit Mundwerk wie eine App auf den Home-Bildschirm kann. Icon: Schallwelle in Mundform (`icons/icon.svg`) |
| `test/` | Automatische Prüfung (`npm test`) |
| `tools/version.mjs` | Neue Version in `sw.js` eintragen (`npm run stamp`) |

## Üben

- **Tagesziel und Serie:** Jeder Versuch zählt fürs Tagesziel (10, 20 oder 40 pro Tag, einstellbar). Schaffst du es mehrere Tage hintereinander, wächst die Serie (Flamme oben rechts). Ist heute noch offen, reißt die Serie erst, wenn ein ganzer Tag ausfällt.
- **Antippen:** Tipp auf das große Wort, um es zu hören. Bei Sätzen geht das mit jedem einzelnen Wort.
- **Wischen:** Auf der Karte nach links wischen = weiter, nach rechts = zurück.
- **Laptop:** Leertaste = Mikrofon, Pfeiltasten = blättern, A = anhören, L = langsam.
- **Töne und Vibration:** leise Klänge bei Treffern, auf Android auch eine kurze Vibration. In den Einstellungen abschaltbar. Am iPhone schweigen sie im Lautlos-Modus.
- **Animationen:** Steht im System „Bewegung reduzieren“, bleibt alles ruhig.

## Mikrofon

- Chrome und Edge (Windows, Android, Mac) und Safari (iPhone, Mac): eigener Mikrofon-Knopf mit der eingebauten Spracherkennung des Browsers.
- iPhone: Die Spracherkennung läuft nur direkt in Safari, nicht als Homescreen-App. Die App erkennt das und schickt dich zu Safari.
- Notlösungen: Diktat über die Tastatur, Aufnehmen und selbst vergleichen, Mikrofon-Test.

## Auf den Home-Bildschirm

- **iPhone (Safari):** Teilen (bei neueren iPhones erst auf „…“ tippen), dann „Zum Home-Bildschirm“. Schalte „Als Web-App öffnen“ **aus**, dann startet Mundwerk in Safari und das Mikrofon geht. Mit eingeschaltetem Schalter startet Mundwerk ohne Browserleiste, aber Apple gibt der App dort keine Spracherkennung (dann nur Diktat oder Selbst-Modus).
- **Android (Chrome):** Menü ⋮ oben rechts, dann „Zum Startbildschirm hinzufügen“ oder „App installieren“.
- **Windows (Chrome oder Edge):** Rechts in der Adressleiste auf „Installieren“ klicken.

## Offline und Updates

Ein Service Worker (`sw.js`) speichert App, Inhalte und Schriften. Mundwerk startet deshalb auch ohne Internet. Die Spracherkennung braucht meist trotzdem Internet: Offline wechselt die App von selbst auf Diktat (Handy) oder Selbst-Modus (Laptop).
Nach jeder Änderung an App-Dateien `npm run stamp` ausführen. Das schreibt eine neue Version in `sw.js`, und nur dann lädt der Browser das Update. `npm test` meldet, wenn das vergessen wurde.

## Synchronisierung

Nach der Anmeldung mit Google liegt der Fortschritt zusätzlich in einem privaten Firestore-Dokument (`users/{Nutzer-ID}`).
- Ohne Anmeldung oder offline läuft alles lokal weiter. Sobald wieder Internet da ist, wird zusammengeführt: pro Eintrag gewinnt der neueste Versuch (`merge` in `js/core.js`). Zurücksetzen gilt auf allen Geräten.
- Mit abgeglichen werden Fortschritt, Akzent, eigener Text, Tagesziel und die Versuche pro Tag (jedes Gerät zählt für sich, zusammen ergibt es die Summe). Prüfart, Vorsprechen, Aussehen und Töne bleiben pro Gerät.
- `js/firebase-config.js` enthält die Kennung des Firebase-Projekts. Das ist kein Geheimnis, jede Firebase-Web-App zeigt sie im Browser. Die Daten schützen `firestore.rules` und die Google-Anmeldung.
- Regeln testen: `npm run test:rules` (startet den Firebase-Emulator, braucht Java).

## Datenschutz

Keine Werbung, kein Tracking, keine Schriften von fremden Servern. Ohne Anmeldung bleibt dein Fortschritt im Browser, und Mundwerk spricht mit keinem Server außer GitHub Pages.
Die Spracherkennung selbst läuft über den Browser (Chrome nutzt dafür Google, Safari nutzt Apple). Erst wenn du dich anmeldest, lädt Firebase das Google-Anmeldefenster und speichert deinen Fortschritt bei Google (Firebase).

## Lizenzen

Schriften: Space Grotesk, Inter und Charis SIL, alle unter der SIL Open Font License 1.1 (`fonts/OFL-*.txt`).
Firebase JS SDK: Apache License 2.0 (Hinweise am Ende von `vendor/firebase.js`).
