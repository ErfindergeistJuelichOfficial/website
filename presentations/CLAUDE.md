# CLAUDE.md — presentations/

## Zweck

Der `presentations/`-Ordner listet alle Präsentations-Unterordner als übersichtliche Seite.
Jeder Unterordner enthält eine eigenständige HTML-Präsentation (z.B. reveal.js).

Deployed unter: <https://presentations.erfindergeist.org/>

---

## Wichtigste Regel: Keine externen CDNs

**Alle Bibliotheken und Assets werden von `https://share.erfindergeist.org/` eingebunden.**
Niemals `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`, `unpkg.com` o.ä. verwenden.

---

## Ordnerstruktur

```text
presentations/
├── index.php        # Übersichtsseite (listet Unterordner)
├── compose.yaml     # Podman Compose (nur lokal, Port 8081)
├── CLAUDE.md        # Diese Datei (nur lokal)
└── <name>/          # Je eine Präsentation pro Unterordner
    ├── index.html
    └── *.pdf        # Optional: PDF-Version
```

---

## CI / Design

- Primary: `#159989` · Secondary: `#F9B338`
- Logo: `https://share.erfindergeist.org/img/logo.svg`
- Bootstrap 5.3 + Lucide Icons — beide von `https://share.erfindergeist.org/`

---

## Lokales Testen

Mit Podman Compose aus dem `presentations/`-Ordner:

```powershell
podman compose up
```

Dann <http://localhost:8081> öffnen.

> Hinweis: Lokal werden Assets von `share.erfindergeist.org` live geladen (Internet erforderlich).

---

## Nicht auf Server deployen

`compose.yaml`, `CLAUDE.md` → via `exclude` im Workflow ausgeschlossen.

---

## Sponsoring-Links

- Fördermitglied: <https://erfindergeist.org/mitglied-werden/>
- Konto: <http://konto.erfindergeist.org/>
- PayPal: <http://paypal.erfindergeist.org/>
- Linktree: <https://linktree.erfindergeist.org/>
