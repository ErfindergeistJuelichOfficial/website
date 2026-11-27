# Datenmodell - Erfindergeist Jülich

Alle JSON-Daten (Chronik, Links, Tags, Downloads, Galerie, API) mit **Speicherort**:
Wo liegt das Original, wer pflegt es, und wie kommt es auf den Server?

## Speicherort-Legende

| Kürzel | Ort | Bedeutung |
| --- | --- | --- |
| 🟢 **GitHub** | Repository `website` | Code (PHP, JS, CSS, Templates). Kein Inhalt mehr. |
| 🔵 **Cloud** | Nextcloud `Public/` (öffentliche Freigabe, nur lesbar) | **Quelle der Wahrheit** für alle Configs (`Public/Configs`) und die verpixelten Galerie-Bilder (`Public/Galerie`). Versioniert durch die Nextcloud. |
| 🟠 **Privat** | Nextcloud `Mitglieder/Galerie` | Originalfotos, nur für Mitglieder. Verlassen nie die Nextcloud. |
| 🔴 **Server** | Webspace `share.erfindergeist.org` | Deploy-Ziel und **einzige Quelle zur Laufzeit**: Share, termine, eg-chronic und WordPress lesen nur von hier, nie aus der Cloud. Wird von `deploy-share.yml` aus GitHub + Cloud befüllt, nie von Hand. |
| 🟣 **Extern** | WordPress `erfindergeist.org` | Termine. Wird nur gelesen. |

Lokale Pfade: `SOURCE_DIR` (in `gui/.env`) ist die Nextcloud-Wurzel, z.B. `/home/lars/erfindergeist`.

---

## Übersicht

```mermaid
flowchart LR
    subgraph PRIVAT["🟠 Privat - Nextcloud Mitglieder/"]
        SRC["Mitglieder/Galerie/&lt;album&gt;/*.jpg"]
    end

    subgraph CLOUD["🔵 Cloud - Nextcloud Public/ (Freigabe, nur lesbar)"]
        direction TB
        CFG["Public/Configs/<br/>chronicle · links · tags<br/>downloads · galerie .json"]
        WEBP["Public/Galerie/&lt;album&gt;/<br/>*_n.webp · *_t.webp"]
    end

    subgraph LOKAL["Rechner (Lars, Marketing …)"]
        GUI(["gui/ Config-Editor :8082"])
        PROC(["gui/process.py"])
    end

    subgraph GITHUB["🟢 GitHub"]
        CODE["share/ Code"]
        GHA(["deploy-share.yml<br/>Push · manuell · nachts · GUI-Button"])
    end

    subgraph SERVER["🔴 Server - share.erfindergeist.org"]
        direction TB
        SCFG["config/*.json"]
        SGAL["galerie/&lt;album&gt;/*.webp"]
        API(["api/v1/assets"])
        PAGE(["index.php"])
    end

    subgraph EXTERN["🟣 Extern"]
        WP["WordPress wp-json/erfindergeist/v2"]
    end

    GUI -- bearbeitet --> CFG
    GUI -- startet --> PROC
    GUI -. Veröffentlichen .-> GHA
    SRC --> PROC
    PROC -- Bildliste --> CFG
    PROC -- WebP --> WEBP

    CODE --> GHA
    CFG -- rclone copy --> GHA
    GHA -- FTP-Deploy --> SCFG
    WEBP -- rclone sync --> SGAL

    SCFG --> API & PAGE
    SGAL --> PAGE
    SCFG -- tags.json --> TERM(["termine/"])
    SCFG -- chronicle · links --> COMP(["eg-chronic"])
    SCFG -- tags.json --> WPP(["WordPress-Plugin"])
    WP --> TERM

    classDef gh fill:#d4edda,stroke:#28a745,color:#000
    classDef cl fill:#d6e9f8,stroke:#1f6fb2,color:#000
    classDef pr fill:#fde8cc,stroke:#e08a1e,color:#000
    classDef sv fill:#f8d7da,stroke:#c0392b,color:#000
    classDef ex fill:#eadcf5,stroke:#7b3fa8,color:#000
    class CODE,GHA gh
    class CFG,WEBP cl
    class SRC pr
    class SCFG,SGAL,API,PAGE sv
    class WP ex
```

### Dateitabelle

| Datei | Speicherort | Format | Gepflegt von | Gelesen von |
| --- | --- | --- | --- | --- |
| `Public/Configs/chronicle.json` | 🔵 Cloud → 🔴 `config/` | JSON-LD `ItemList > Event[]` | GUI Chronik-Tab | API, Share-Galerie, `eg-chronic` |
| `Public/Configs/links.json` | 🔵 Cloud → 🔴 `config/` | JSON-LD `ItemList > ListItem[]` | GUI Links-Tab | API, Share, `eg-chronic`, Linktree |
| `Public/Configs/tags.json` | 🔵 Cloud → 🔴 `config/` | JSON-LD `DefinedTermSet` | GUI Tags-Tab | API, `termine/`, WordPress-Plugin |
| `Public/Configs/downloads.json` | 🔵 Cloud → 🔴 `config/` | JSON-LD `DataCatalog` (Ordner → Dateien) | GUI Downloads-Tab | API, Downloads-Tab |
| `Public/Configs/galerie.json` | 🔵 Cloud → 🔴 `config/` | JSON-LD `DataCatalog` (Alben → Bilder), kompakt, ca. 280 KB | GUI Alben-Tab + `process.py` | API (`gallery`), `share.js` |
| `Public/Galerie/<album>/*.webp` | 🔵 Cloud → 🔴 `galerie/` | WebP (verpixelt) | `process.py` | Galerie-Tab |
| `Mitglieder/Galerie/<album>/*.jpg` | 🟠 Privat | Original | Fotograf:innen | `process.py`, GUI-Bildauswahl |
| `share/downloads/**/*.pdf …` | 🔴 Server (nur wenige SVGs in GitHub) | Binär | manuell per FTP | API (`downloads`) |
| `share/presentations/<name>/…` | 🔴 Server | HTML / PDF | manuell per FTP | API (`presentations`) |
| `GET /api/v1/assets` | 🔴 Server, zur Laufzeit erzeugt | JSON-LD `DataCatalog` | `share/api.php` | Homepage, externe Clients |
| `wp-json/erfindergeist/v2/events` | 🟣 Extern | JSON | WordPress | `termine/` |

---

## ER-Diagramme

Aufgeteilt nach Datei. Primärschlüssel sind die Werte, über die andere Dateien referenzieren.

### 1. Chronik, Links, Tags

```mermaid
erDiagram
    CHRONICLE_ENTRY {
        string id PK "@id urn:uuid"
        string title
        string date
        string location
        string description
        bool consent_collected
        array collaborators "Namen"
    }
    TAG {
        string key PK "Schlüssel ohne #"
        string type "Place | DefinedTerm"
        string label
        string location "nur location_tags"
        string description "nur description_tags"
    }
    LINK {
        string id PK "@id urn:uuid"
        string title
        string url
        string description
        string type "website, wiki, blog, galerie ..."
        string httpMethod
        string encodingType
    }
    CHRONICLE_ENTRY }o--o{ TAG : "tags[]"
    CHRONICLE_ENTRY }o--o{ LINK : "link_ids[]"
```

### 2. Galerie (`galerie.json`)

```mermaid
erDiagram
    ALBUM {
        string path PK "relativ zu Mitglieder/Galerie"
        string title "GUI"
        string description "GUI"
        bool consent_collected "GUI"
        string chronicle_id FK "GUI"
        array link_ids FK "GUI"
        string preview "GUI: Originaldatei"
        array blur "GUI: Originaldateien"
        array no_blur "GUI: Originaldateien"
        int imageCount "process.py"
        string previewThumbnail "process.py"
    }
    IMAGE {
        string name PK "YYYYMMDD_HHMMSS_hash8_n.webp"
        string caption "KI-Beschreibung, optional"
        bool blurred
    }
    CHRONICLE_ENTRY {
        string id PK
        string date "Datum des Albums"
    }
    LINK {
        string id PK
    }
    ALBUM ||--o{ IMAGE : "hasPart[]"
    ALBUM }o--o| CHRONICLE_ENTRY : chronicle_id
    ALBUM }o--o{ LINK : "link_ids[]"
```

Aus `IMAGE.name` abgeleitet, nicht gespeichert: `sourceHash` (3. Teil, Deep-Link `#gallery/<path>/<hash>`),
`dateCreated` (1. + 2. Teil), Thumbnail (`_n.webp` → `_t.webp`), URL (`galerie/<path>/<name>`).
Alben haben **keine Tags**. Datum und Tags kommen über `chronicle_id` aus der Chronik.

### 3. Downloads (`downloads.json`)

```mermaid
erDiagram
    DOWNLOAD_FOLDER {
        string path PK "relativ zu share/downloads, leer = Wurzel"
        string name
        string description
    }
    DOWNLOAD_FILE {
        string title PK "Dateiname im Ordner"
        string description
    }
    TAG {
        string key PK
    }
    LINK {
        string id PK
    }
    DOWNLOAD_FOLDER ||--o{ DOWNLOAD_FILE : "hasPart[]"
    DOWNLOAD_FILE }o--o{ TAG : "tags[]"
    DOWNLOAD_FILE }o--o{ LINK : "link_ids[]"
```

Die Dateien selbst liegen auf dem 🔴 Server. `api.php` ergänzt Größe, MIME-Typ und URL (`MediaObject`).

### 4. API und externe Daten

```mermaid
erDiagram
    ASSET_CATALOG {
        string id PK "api/v1/assets"
        string dateModified
    }
    MEDIA_OBJECT {
        string path PK
        string name
        string contentUrl
        string encodingFormat
        int contentSize
    }
    PRESENTATION {
        string name PK "presentations/name/"
        string url
    }
    GALLERY_SUMMARY {
        string path PK "aus galerie.json, ohne Bilder"
        string name
        int imageCount
        string preview
        string chronicleId
    }
    WP_EVENT {
        string id PK "WordPress"
        array tags FK "Tag-Schlüssel"
    }
    TAG {
        string key PK
    }
    ASSET_CATALOG ||--o{ MEDIA_OBJECT : "css, fonts, img, js, qr, downloads, config"
    ASSET_CATALOG ||--o{ PRESENTATION : presentations
    ASSET_CATALOG ||--o{ GALLERY_SUMMARY : gallery
    PRESENTATION ||--o{ MEDIA_OBJECT : hasPart
    WP_EVENT }o--o{ TAG : "termine/ löst Ort, Label, Beschreibung auf"
```

### Wo Tags genutzt werden

| Nutzer | Wie |
| --- | --- |
| `termine/js/main.js` (termine.erfindergeist.org) | lädt `config/tags.json`, löst Tags der WordPress-Termine zu Ort, Label und Beschreibung auf |
| WordPress-Plugin (nicht in diesem Repo) | liest `config/tags.json` |
| Chronik-Einträge `tags[]` | Filter in der GUI, Anzeige auf share |
| Download-Dateien `tags[]` | Filter im Downloads-Tab |

---

## Deploy-Ablauf

```mermaid
sequenceDiagram
    participant P as 🟠 Mitglieder/Galerie
    participant G as gui/ + process.py
    participant C as 🔵 Public/ (Nextcloud)
    participant A as 🟢 GitHub Actions
    participant S as 🔴 Server

    G->>C: Configs bearbeiten (chronicle, links, tags, downloads, galerie)
    P->>G: Originale lesen
    G->>C: WebP nach Public/Galerie, Bildliste in galerie.json
    Note over C: Nextcloud-Client synct, versioniert
    G-->>A: Veröffentlichen (oder Push, manuell, nachts 02:00 UTC)
    A->>C: rclone copy Configs + Dateiliste Galerie
    Note over A: validate_configs.py - bei Fehler Abbruch,<br/>Server behält letzten guten Stand
    A->>S: FTP-Deploy share/ + config/*.json
    A->>C: rclone sync Galerie (nur Änderungen)
    A->>S: neue/geänderte WebP hoch, verwaiste löschen (max-delete)
```

---

## API-Zugriff (Share)

`GET https://share.erfindergeist.org/api/v1/assets` - wird bei jedem Aufruf aus dem Dateisystem des Servers erzeugt.

| Abschnitt | Quelle | Ursprung |
| --- | --- | --- |
| `assets.css`, `fonts`, `img`, `js`, `qr` | Dateiscan | 🟢 GitHub |
| `assets.config.files` | alle `config/*.json` | 🔵 Cloud |
| `assets.config.content` | Inhalt von `chronicle`, `links`, `tags` | 🔵 Cloud |
| `assets.downloads` | Dateiscan + `downloads.json` | Dateien 🔴 Server, Metadaten 🔵 Cloud |
| `assets.presentations` | Unterordner von `presentations/` | 🔴 Server |
| `assets.gallery` | Album-Zusammenfassungen aus `galerie.json` | 🔵 Cloud |

Die vollständigen Bildlisten lädt die Share-Seite einmalig aus `config/galerie.json`.

---

## GUI-API (lokaler Config-Editor, Port 8082)

| Methode | Pfad | Entitäten | Schreibt nach |
| --- | --- | --- | --- |
| `GET /api/all` | Chronik, Links, Tags | `CHRONICLE_ENTRY`, `TAG`, `LINK` | - |
| `POST /api/save/chronicle` | Chronik schreiben | `CHRONICLE_ENTRY` | 🔵 `chronicle.json` |
| `POST /api/save/links` | Links schreiben | `LINK` | 🔵 `links.json` |
| `POST /api/save/tags` | Tags schreiben | `TAG` | 🔵 `tags.json` |
| `GET /api/albums` | Album-Liste | `ALBUM` | - |
| `GET /api/album/dirs` | Ordner in `Mitglieder/Galerie` ohne Album | - | - |
| `GET /api/album?path=` | Config-Felder eines Albums | `ALBUM` | - |
| `POST /api/album?path=` | Album anlegen/ändern (409 während Bildverarbeitung) | `ALBUM` | 🔵 `galerie.json` |
| `POST /api/album/delete?path=` | Album entfernen (409 während Bildverarbeitung) | `ALBUM` | 🔵 `galerie.json` |
| `GET /api/album/images?path=` | Originaldateien eines Albums | - | - |
| `GET /api/album/image?path=&file=` | Original / Vorschau ausliefern | - | - |
| `GET /api/downloads` | Ordnerliste | `DOWNLOAD_FOLDER` | - |
| `GET /api/download-entries` | alle Datei-Einträge | `DOWNLOAD_FILE` | - |
| `GET/POST /api/download-meta?path=` | Ordner-Eintrag lesen/schreiben | `DOWNLOAD_FOLDER`, `DOWNLOAD_FILE` | 🔵 `downloads.json` |
| `GET /api/download-files?path=` | lokal vorhandene Dateien | - | - |
| `POST /api/galerie/run`, `/cancel`, `GET /status`, `/stream` | `process.py` steuern | `ALBUM`, `IMAGE` | 🔵 `Public/Galerie`, `galerie.json` |
| `POST /api/publish` | startet `deploy-share.yml` (GitHub-API, `GITHUB_TOKEN`) | - | - |
