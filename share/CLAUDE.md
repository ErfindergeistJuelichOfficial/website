# CLAUDE.md — share/

## Zweck

Der `share/`-Ordner hat zwei Aufgaben:

1. **Asset-Host**: Alle geteilten Bibliotheken (Bootstrap, GSAP, Lucide, AOS, Typed.js, Rough Notation, Caveat-Font, Logo) liegen hier und werden von `https://share.erfindergeist.org/` ausgeliefert.
2. **Download-Seite**: `index.php` listet Dateien im Verzeichnis als übersichtliche Download-Liste.

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
├── index.php               # Download-Seite
├── compose.yaml            # Podman Compose (nur lokal)
├── README.md               # Testanleitung (nur lokal)
├── CLAUDE.md               # Diese Datei (nur lokal)
├── css/
│   ├── bootstrap.min.css   # Bootstrap 5.3
│   └── aos.min.css         # AOS Scroll-Reveal
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
│   ├── Caveat-Regular.ttf  # Handschrift-Font für h1–h3
│   └── Caveat-Bold.ttf
└── img/
    └── logo.svg            # Vereinslogo (Navbar + Hero)
```

---

## CI / Design

- Primary: `#159989` · Secondary: `#F9B338`
- `img/logo.svg` — wird in der Navbar angezeigt, Textfallback wenn nicht vorhanden
- Bootstrap 5.3 + Lucide Icons (beide aus `share/`)

---

## Lokales Testen

Mit Podman Compose aus dem `share/`-Ordner:

```powershell
podman compose up
```

Dann <http://localhost:8080> öffnen.

> Hinweis: Lokal werden keine externen Domains aufgelöst. `index.php` funktioniert vollständig, aber `termine/` würde die Assets von share.erfindergeist.org benötigen (nach dem Deploy).

---

## Nicht auf Server deployen

`compose.yaml`, `README.md`, `CLAUDE.md` → via `exclude` im Workflow ausgeschlossen.

---

## Sponsoring-Links

- Fördermitglied: <https://erfindergeist.org/mitglied-werden/>
- Konto: <http://konto.erfindergeist.org/>
- PayPal: <http://paypal.erfindergeist.org/>
- Linktree: <https://linktree.erfindergeist.org/>
