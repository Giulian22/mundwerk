# Mundwerk

Trainer für englische Aussprache, gemacht für Deutsch-Muttersprachler.
Du sprichst ein Wort, die Spracherkennung schreibt mit. Drei Treffer am Stück (bei Sätzen zwei), und es sitzt. Ein Fehler löscht die Haken wieder.

**Zur App:** https://giulian22.github.io/mundwerk/

## Was wo liegt

| Datei | Inhalt |
| --- | --- |
| `index.html` | Startseite der App |
| `css/app.css` | Design (hell und dunkel) |
| `css/fonts.css`, `fonts/` | Schriften, liegen im Projekt |
| `js/data.js` | Alle Pakete, Wörter, Sätze, Lautschrift und Tipps |
| `js/core.js` | Vergleich mit dem Gesprochenen, Spielstand |
| `js/app.js` | Bildschirm, Mikrofon, Vorlesen |
| `test/` | Automatische Prüfung der Inhalte (`npm test`) |

## Mikrofon

- Chrome und Edge (Windows, Android, Mac) und Safari (iPhone, Mac): eigener Mikrofon-Knopf mit der eingebauten Spracherkennung des Browsers.
- iPhone: Die Spracherkennung läuft nur direkt in Safari, nicht als Homescreen-App. Die App erkennt das und schickt dich zu Safari.
- Notlösungen: Diktat über die Tastatur, Aufnehmen und selbst vergleichen, Mikrofon-Test.

## Datenschutz

Keine Werbung, kein Tracking, keine Schriften von fremden Servern. Dein Fortschritt bleibt im Browser.
Die Spracherkennung selbst läuft über den Browser (Chrome nutzt dafür Google, Safari nutzt Apple).

## Lizenzen

Schriften: Charis SIL und Atkinson Hyperlegible Next, beide unter der SIL Open Font License 1.1 (`fonts/OFL-*.txt`).
