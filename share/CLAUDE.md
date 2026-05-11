# CLAUDE.md — share/

## Zweck

Der `share/`-Ordner hat zwei Aufgaben:

1. **Asset-Host**: Alle geteilten Bibliotheken (Bootstrap, GSAP, Lucide, AOS, Typed.js, Rough Notation, Caveat-Font, Logo) liegen hier und werden von `https://share.erfindergeist.org/` ausgeliefert.
2. **Download-Seite**: `index.php` listet Tabs für Downloads, Präsentationen, Logos, QR-Codes und Configs.

Deployed unter: <https://share.erfindergeist.org/>

---

## Wichtigste Regel: Keine externen CDNs

**Alle externen Bibliotheken müssen im `share/`-Ordner liegen und über `https://share.erfindergeist.org/` eingebunden werden.**
Niemals `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`, `unpkg.com` o.ä. verwenden.

Neue Bibliothek hinzufügen:

1. Datei herunterladen und in den passenden Unterordner in `share/` ablegen
2. In HTML/PHP auf `https://share.erfindergeist.org/js/lib/datei.min.js` verweisen

---

## Ordnerstruktur

```text
share/
├── index.php                        # Einstiegspunkt: lädt Daten, bindet Templates ein
├── compose.yaml                     # Podman Compose (nur lokal)
├── README.md                        # Testanleitung (nur lokal)
├── CLAUDE.md                        # Diese Datei (nur lokal)
├── assets/
│   ├── css/
│   │   ├── share.css               # Globale Styles (Vars, Navbar, Tabs, File-Items, Logo-Cards …)
│   │   ├── tab-presentations.css   # Nur für den Präsentationen-Tab (.pres-*, .alert-info)
│   │   └── section-sponsoring.css  # Nur für die Sponsoring-Section (.sponsor-*)
│   ├── js/
│   │   └── share.js                # Alle Custom-Scripts der Seite
│   └── templates/
│       ├── tab-downloads.php       # Tab: Downloads (Dateien im Root)
│       ├── tab-presentations.php   # Tab: Präsentationen (presentations/)
│       ├── tab-logos.php           # Tab: Logos (img/)
│       ├── tab-qr.php              # Tab: QR Codes (qr/)
│       └── tab-configs.php         # Tab: Configs (config/)
├── css/
│   ├── bootstrap.min.css           # Bootstrap 5.3
│   └── aos.min.css                 # AOS Scroll-Reveal
├── js/lib/
│   ├── jquery.min.js
│   ├── bootstrap.bundle.min.js
│   ├── gsap.min.js
│   ├── ScrollTrigger.min.js
│   ├── aos.min.js
│   ├── typed.min.js
│   ├── lucide.min.js
│   └── rough-notation.min.js
├── fonts/
│   ├── Caveat-Regular.ttf          # Handschrift-Font für h1–h3
│   └── Caveat-Bold.ttf
├── img/
│   └── logo.svg                    # Vereinslogo (Navbar + Hero)
├── qr/                             # QR-Code-Dateien
├── config/                         # JSON-Konfigurationsdateien
└── presentations/                  # Präsentations-Unterordner (je ein Ordner pro Präsentation)
    └── <name>/
        ├── index.html
        └── *.pdf                   # Optional: PDF-Version
```

---

## Tab-Reihenfolge

1. Downloads — Dateien direkt im Root (PDF, DOCX, SVG …)
2. Präsentationen — Unterordner in `presentations/`, verlinkt via `presentations/<name>/`
3. Logos — Bilddateien aus `img/`
4. QR Codes — Bilddateien aus `qr/`
5. Configs — JSON-Dateien aus `config/`

Anchor-Links aktivieren den passenden Tab direkt:
`#presentations`, `#logos`, `#qr`, `#configs`

---

## Tab-Templates bearbeiten

Jeder Tab ist eine eigenständige PHP-Datei in `assets/templates/`.
Die Templates teilen den Variablen-Scope mit `index.php` (PHP `include`).
Verfügbare Variablen je Template:

| Template                  | Variablen                              |
|---------------------------|----------------------------------------|
| `tab-downloads.php`       | `$entries`, `$icon_map`, `$class_map`  |
| `tab-presentations.php`   | `$pres_entries` (assoc: name → pdf)    |
| `tab-logos.php`           | `$img_entries`                         |
| `tab-qr.php`              | `$qr_entries`                          |
| `tab-configs.php`         | `$config_entries`                      |

---

## CI / Design

- Primary: `#159989` · Secondary: `#F9B338`
- Bootstrap 5.3 + Lucide Icons (beide aus `share/`)
- Custom-Styles in `assets/css/share.css`, Custom-Scripts in `assets/js/share.js`

---

## Präsentationen (umgezogen)

`presentations.erfindergeist.org` leitet per 301 auf `share.erfindergeist.org/#presentations` weiter.
Die Präsentations-Unterordner liegen auf dem Server in `share/presentations/`.

---

## Lokales Testen

Mit Podman Compose aus dem `share/`-Ordner:

```powershell
podman compose up
```

Dann <http://localhost:8080> öffnen.

> Hinweis: Lokal werden keine externen Domains aufgelöst. `index.php` funktioniert vollständig, aber Assets von `share.erfindergeist.org` (Bootstrap, Lucide …) benötigen eine Internetverbindung.

---

## Pflichtprüfungen

**Neue Dateien:** Immer prüfen, ob die neue Datei in `deploy-share.yml` unter `exclude` aufgenommen werden muss (z.B. lokale Hilfsdateien, Mocks, Doku, `.gitkeep`).

**HTML-Änderungen in Templates:** Wenn Elemente in `assets/templates/` entfernt oder umgebaut werden, immer prüfen:

- Gibt es CSS-Klassen in `assets/css/share.css`, die jetzt tot sind? → sofort entfernen.

## Nicht auf Server deployen

`compose.yaml`, `README.md`, `CLAUDE.md` → via `exclude` im Workflow ausgeschlossen.

---

## Sponsoring-Links

- Fördermitglied: <https://erfindergeist.org/mitglied-werden/>
- Konto: <http://konto.erfindergeist.org/>
- PayPal: <http://paypal.erfindergeist.org/>
- Linktree: <https://linktree.erfindergeist.org/>
