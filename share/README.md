# share/index.php — Lokales Testen

## Voraussetzungen

[Podman Desktop](https://podman.io/) installiert und der Podman-Daemon läuft.

## Starten

```powershell
cd share
podman compose up
```

Danach im Browser öffnen: **http://localhost:8080**

Die Seite zeigt alle `*.pdf`- und `*.docx`-Dateien aus dem `share/`-Ordner als Download-Liste an. Zum Testen einfach ein paar Testdateien in den Ordner legen.

## Stoppen

```powershell
podman compose down
```

## Hinweis

`compose.yaml`, `README.md` und `CLAUDE.md` werden vom Deploy-Workflow **nicht** auf den Server hochgeladen (via `exclude` in der Workflow-Konfiguration).
