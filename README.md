# Petersen Memories

Eine hochwertige, persönliche Hochzeits-Webseite für **Jessica & Leon Petersen**.
Gäste kommen per QR-Code auf die Seite, laden ihre schönsten Fotos und Videos
vom Hochzeitstag hoch und teilen sie in einer eleganten Galerie.

> „Willkommen bei unseren schönsten Momenten. Lade deine schönsten Fotos und
> Videos von unserem Hochzeitstag hoch und teile sie mit uns und unseren
> Gästen.“

---

## Inhalt

- [Funktionen](#funktionen)
- [Technik](#technik)
- [Projektstruktur](#projektstruktur)
- [Installation](#installation)
- [Konfiguration (.env)](#konfiguration-env)
- [Produktivbetrieb](#produktivbetrieb)
- [Admin-Bereich](#admin-bereich)
- [QR-Code](#qr-code)
- [Sicherheit](#sicherheit)

---

## Funktionen

- **Startseite** mit Begrüßung, Erklärung und klaren Handlungs-Buttons
- **Upload-Seite** mit Drag-and-Drop, Kamera-/Dateiauswahl vom Handy,
  Fortschrittsanzeige, Mehrfach-Upload und Erfolgsmeldung
- **Galerie** im Kachel-Layout mit Filter (Foto/Video), Suche nach Gastname,
  Herzen/Likes und Vorschau
- **Detailansicht** als Modal mit großem Bild/Video, Nachricht, Kommentaren,
  Like- und Download-Funktion sowie Tastatur-Navigation
- **Slideshow-Modus** für Beamer/Fernseher inkl. Vollbild und Auto-Wiedergabe
- **Admin-Bereich** (passwortgeschützt): Medien freigeben/ausblenden/löschen,
  Kommentare löschen, QR-Code anzeigen, ZIP-Export
- **Optionaler Gäste-Code** schützt die ganze Seite
- Romantische Lade- und Leerzustände, Datenschutz-Hinweis beim Upload,
  sichere Dateiprüfung (Magic Bytes), Mobile-First-Design
- **Filmisches Storytelling** auf der Startseite: Cinematic Intro,
  aufsteigende Herzen beim Scrollen, fünf Story-Kapitel, versteckte
  Überraschung, Three.js-Sternenhimmel, Zeitkapsel & emotionaler Abschluss
- **Video-Botschaften** unter `/botschaften` – mit Admin-Freigabe und
  zeitgesteuerten Überraschungsvideos
- **Zeitkapsel**: Briefe ans Zukunfts-Ich, versiegelt bis zum 1. Hochzeitstag
- **Live-Moment-Wall** unter `/wall` – Fullscreen-Slideshow für Beamer/TV,
  zeigt neue Uploads automatisch live

## Technik

- **Next.js 14** (App Router) · **TypeScript** · **Tailwind CSS**
- **Prisma** mit **SQLite** (für Produktion auf PostgreSQL/MySQL umstellbar)
- Dateispeicherung im Dateisystem, Auslieferung über geschützte API-Route
  mit HTTP-Range-Unterstützung (Video-Streaming)
- Signierte Cookie-Sitzungen (HMAC-SHA256), keine schweren Auth-Abhängigkeiten

## Projektstruktur

```
.
├── prisma/
│   └── schema.prisma          Datenbankmodell (Media, Like, Comment, …)
├── uploads/                   Hochgeladene Medien (nicht im Git)
├── src/
│   ├── middleware.ts          Besucher-ID, Admin-Schutz, Gäste-Code
│   ├── app/
│   │   ├── layout.tsx         Grundgerüst, Schriften, Header/Footer
│   │   ├── globals.css        Design-System (Tailwind)
│   │   ├── page.tsx           Startseite
│   │   ├── upload/            Upload-Seite
│   │   ├── galerie/           Galerie
│   │   ├── slideshow/         Slideshow-Modus
│   │   ├── willkommen/        Gäste-Code-Eingabe
│   │   ├── admin/             Admin-Bereich + Login
│   │   └── api/               Alle API-Routen (Upload, Medien, Auth, Admin …)
│   ├── components/            UI-Komponenten (Galerie, Upload, Modal …)
│   └── lib/                   DB, Auth, Validierung, Speicher, Helfer
├── .env.example               Beispiel-Konfiguration
└── package.json
```

## Installation

### Schnellinstallation (Ubuntu 24.04)

Das beiliegende Skript installiert **alle erforderlichen Komponenten**
(Node.js 20, Git, Abhängigkeiten), erstellt die `.env` inkl. sicherer
Schlüssel, richtet die Datenbank ein, erzeugt den Produktions-Build und
legt auf Wunsch einen `systemd`-Dienst für den Autostart an:

```bash
chmod +x install.sh
./install.sh            # interaktiv
./install.sh --yes      # ohne Rückfragen, mit Standardwerten
```

Das erzeugte Admin-Passwort wird am Ende angezeigt und steht in der `.env`.

### Manuelle Installation

Voraussetzung: **Node.js 20+** (empfohlen: aktuelle LTS-Version).

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Konfiguration anlegen
cp .env.example .env
#    danach .env öffnen und Werte anpassen (siehe unten)

# 3. Datenbank einrichten
npm run db:push

# 4. Entwicklungsserver starten
npm run dev
```

Die Seite ist anschließend unter <http://localhost:3000> erreichbar.

## Konfiguration (.env)

| Variable                   | Beschreibung                                                          |
| -------------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`             | Verbindungs-URL der Datenbank (Standard: SQLite-Datei)                |
| `SESSION_SECRET`           | Geheimer Schlüssel zum Signieren der Cookies (`openssl rand -hex 32`) |
| `ADMIN_PASSWORD`           | Passwort für den Admin-Bereich                                        |
| `GUEST_CODE`               | Optionaler Gäste-Code – leer = Seite frei zugänglich                  |
| `UPLOAD_DIR`               | Ordner für hochgeladene Medien (Standard: `./uploads`)                |
| `MAX_FILE_SIZE_MB`         | Maximale Dateigröße pro Datei in MB                                   |
| `REQUIRE_APPROVAL`         | `true` = Uploads müssen vom Admin freigegeben werden                  |
| `NEXT_PUBLIC_SITE_URL`        | Öffentliche Basis-URL (für den QR-Code)                            |
| `NEXT_PUBLIC_COUPLE_NAMES`    | Namen des Brautpaars                                               |
| `NEXT_PUBLIC_WEDDING_DATE`    | Hochzeitsdatum als Anzeigetext                                     |
| `NEXT_PUBLIC_WEDDING_DATE_ISO`| Hochzeitsdatum (JJJJ-MM-TT) für Countdowns                         |
| `NEXT_PUBLIC_WEDDING_LOCATION`| Ort der Hochzeit (optional)                                        |
| `NEXT_PUBLIC_MUSIC_URL`       | Pfad zum Hintergrund-Lied (Audiodatei in `public/` ablegen)        |
| `NEXT_PUBLIC_TIME_CAPSULE_UNLOCK`| Öffnungsdatum der Zeitkapsel (JJJJ-MM-TT)                       |

## Produktivbetrieb

```bash
npm run build      # erzeugt Prisma-Client + optimierten Build
npm run start      # startet den Produktionsserver
```

### Updates einspielen

Nach Code-Änderungen genügt das mitgelieferte Rebuild-Skript – es holt
die neuesten Änderungen, aktualisiert Abhängigkeiten und Datenbank,
erstellt einen frischen Build und startet den Dienst neu:

```bash
./rebuild.sh                 # Pull + Build + Neustart
./rebuild.sh --no-pull       # nur lokalen Stand neu bauen
./rebuild.sh --no-restart    # bauen, aber Dienst nicht neu starten
```

Empfehlungen für den Livebetrieb:

- `SESSION_SECRET` und `ADMIN_PASSWORD` auf sichere, lange Werte setzen
- `NEXT_PUBLIC_SITE_URL` auf die echte Domain bzw. Server-IP setzen
- Der Server bindet auf `0.0.0.0` und ist damit direkt über die Server-IP
  erreichbar (z. B. `http://178.105.143.126:3000`). Bei reinem HTTP-Betrieb
  ohne TLS funktionieren Login und Gäste-Code, da die Cookies das
  `Secure`-Flag automatisch nur bei HTTPS setzen.
- Ggf. den Port in der Firewall freigeben: `sudo ufw allow 3000/tcp`
- Den Ordner aus `UPLOAD_DIR` regelmäßig sichern – dort liegen alle Medien
- Hinter einem Reverse-Proxy (z. B. nginx) ggf. das Upload-Größenlimit erhöhen
- Für größere Hochzeiten kann in `prisma/schema.prisma` auf PostgreSQL
  umgestellt werden (`provider` ändern, danach `npm run db:push`)

## Admin-Bereich

Erreichbar unter **`/admin`**. Die Anmeldung erfolgt mit `ADMIN_PASSWORD`.

Möglichkeiten:

- Medien **freigeben** oder **ausblenden** und endgültig **löschen**
- **Kommentare** löschen
- **QR-Code** anzeigen und drucken
- alle Medien als **ZIP-Archiv** herunterladen

## QR-Code

Im Admin-Bereich unter „QR-Code & Export“ wird automatisch ein QR-Code
erzeugt, der auf die Upload-Seite verweist (`NEXT_PUBLIC_SITE_URL/upload`).
Einfach ausdrucken und auf die Tische stellen.

## Sicherheit

- **Dateiprüfung:** Hochgeladene Dateien werden anhand ihrer Signatur
  („Magic Bytes“) geprüft – nicht nur anhand der Endung. Fremde/manipulierte
  Formate werden abgelehnt. Erlaubt sind: JPG, PNG, GIF, WEBP, HEIC, MP4,
  MOV, WEBM.
- **Größenlimit** pro Datei über `MAX_FILE_SIZE_MB`.
- **Geschützte Auslieferung:** Medien liegen außerhalb von `/public` und
  werden nur über eine API-Route ausgeliefert; nicht freigegebene Medien
  sind ausschließlich für den Admin sichtbar.
- **Sitzungen** werden über HMAC-signierte Cookies abgesichert; das
  Admin-Cookie ist `httpOnly`.
- Freitexte (Name, Nachricht, Kommentar) werden serverseitig bereinigt und
  in der Länge begrenzt.
- Die Seite ist standardmäßig auf `noindex` gestellt (keine Suchmaschinen).

---

_Mit Liebe erstellt für die Hochzeit der Petersen's._
