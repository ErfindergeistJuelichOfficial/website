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

---

## Hinweis

`compose.yaml`, `README.md` und `CLAUDE.md` werden vom Deploy-Workflow **nicht**
auf den Server hochgeladen (via `exclude` in der Workflow-Konfiguration).
Gleiches gilt für `downloads/mock-*`.
