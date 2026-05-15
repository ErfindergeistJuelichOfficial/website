# share/ - Lokales Testen

## Voraussetzungen

[Podman Desktop](https://podman.io/) installiert und der Podman-Daemon läuft.

## Starten

```powershell
cd share
podman compose up
```

Danach im Browser öffnen: **<http://localhost:8080>**

Testdateien für den Downloads-Tab einfach in `share/downloads/` legen.
Unterordner werden automatisch als Hierarchie (Bereich/Thema/Gruppe) erkannt.
Mock-Dateien (`mock-*`) sind bereits enthalten und werden nicht deployed.

## Stoppen

```powershell
podman compose down
```

---

## API

### Produktion

```text
GET https://share.erfindergeist.org/api/v1/assets
```

### Lokale Entwicklung

```text
GET http://localhost:8080/api/v1/assets
```

Die API gibt ein JSON-LD-Dokument (`application/ld+json`) mit dem vollständigen
Asset-Katalog zurück - inklusive Dateiliste aller Verzeichnisse (`css`, `fonts`,
`img`, `js`, `qr`, `downloads`, `presentations`) und dem **geparsten Inhalt** jeder
Datei in `config/`.

Die Route ist über eine echte Verzeichnisstruktur (`api/v1/assets/index.php`)
implementiert - **kein `mod_rewrite` erforderlich**. Apache folgt dem Standard-
Directory-Index und leitet `api/v1/assets` per 301 auf `api/v1/assets/` weiter.

Beispiel-Aufruf mit curl:

```bash
curl https://share.erfindergeist.org/api/v1/assets | jq '.assets.config.content'
```

Lokal:

```bash
curl http://localhost:8080/api/v1/assets | jq '.assets.downloads.files[].name'
```

### Downloads-Metadaten (`_meta.json`)

Jeder Unterordner in `downloads/` kann eine optionale `_meta.json` enthalten.
Sie beschreibt den Ordner und einzelne Dateien (Beschreibung, Wiki-Link, Raw-Link).
Pflichtfelder: `@context`, `@type` (`DataCatalog`), `@id`.

Beispiel:

```json
{
  "@context": "https://schema.org",
  "@type": "DataCatalog",
  "@id": "https://share.erfindergeist.org/downloads/marketing/Flyer",
  "name": "Flyer",
  "description": "Veranstaltungsflyer",
  "hasPart": [
    {
      "@type": "MediaObject",
      "name": "flyer-sommer-2025.pdf",
      "description": "Sommerveranstaltung 2025",
      "wiki-url": "https://wiki.erfindergeist.org/Flyer",
      "raw-url": "https://raw.erfindergeist.org/flyer-sommer-2025.pdf"
    }
  ]
}
```

- `wiki-url`: optional, zeigt einen **Wiki**-Button in der Tabelle
- `raw-url`: optional, zeigt einen **Raw**-Button in der Tabelle

Validierungsfehler werden im Downloads-Tab als Alert angezeigt.

---

## Deep-Links

Die Seite unterstützt Links, die direkt einen bestimmten Tab, eine Suche oder einen Filter öffnen. Der Zustand wird per `history.replaceState` in die URL geschrieben - kein Seitenneuladen.

### Tab öffnen

| Tab | URL |
| --- | --- |
| Downloads (Standard) | `https://share.erfindergeist.org/` |
| Präsentationen | `https://share.erfindergeist.org/#presentations` |
| Logos | `https://share.erfindergeist.org/#logos` |
| QR Codes | `https://share.erfindergeist.org/#qr` |
| Configs | `https://share.erfindergeist.org/#configs` |
| APIs | `https://share.erfindergeist.org/#apis` |

### Suche und Filter vorbelegen

```text
# Suche nach "bierdeckel"
https://share.erfindergeist.org/?q=bierdeckel

# Nur Bereich "marketing" anzeigen
https://share.erfindergeist.org/?bereich=marketing

# Bereich + Thema kombiniert
https://share.erfindergeist.org/?bereich=marketing&thema=Bierdeckel

# Suche + Filter + Tab explizit
https://share.erfindergeist.org/?q=flyer&bereich=marketing#downloads
```

Lokal (ersetze Host):

```text
http://localhost:8080/?bereich=marketing&thema=Bierdeckel
```

---

## Hinweis

`compose.yaml`, `README.md` und `CLAUDE.md` werden vom Deploy-Workflow **nicht**
auf den Server hochgeladen (via `exclude` in der Workflow-Konfiguration).
Gleiches gilt für `downloads/mock-*`.
