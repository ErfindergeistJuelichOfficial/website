# Datenmodell - Erfindergeist Jülich

Logisches relationales Modell der JSON-basierten Konfigurationsdaten, Galerie-Alben und der Share-API.

## ER-Diagramm

```mermaid
erDiagram
    CHRONICLE_ENTRY {
        string id PK
        string title
        string date
        string location
        string description
    }

    CHRONICLE_COLLABORATOR {
        int id PK
        string entry_id FK
        string name
    }

    TAG {
        string key PK
        string type
        string label
        string location
        string description
    }


    CHRONICLE_TAG {
        string entry_id FK
        string tag_key FK
    }

    CHRONICLE_ENTRY_LINK {
        string entry_id FK
        string link_id FK
    }

    LINK {
        string id PK
        string title
        string url
        string description
        string type
        string httpMethod
        string encodingType
    }

    ALBUM {
        string path PK
        string title
        string date
        string description
        string consent_collected
        string chronicle_id FK
        string preview
    }

    ALBUM_TAG {
        string album_path FK
        string tag_key FK
    }

    ALBUM_FILE_MASK {
        int id PK
        string album_path FK
        string filename
        string type
    }

    GALLERY_IMAGE {
        int id PK
        string album_path FK
        string filename
        string caption
        string thumb_url
        string image_url
    }

    DOWNLOAD_FOLDER {
        string path PK
        string name
        string description
    }

    DOWNLOAD_FILE {
        int id PK
        string folder_path FK
        string title
        string description
    }

    DOWNLOAD_FILE_LINK {
        string file_id FK
        string link_id FK
    }

    DOWNLOAD_FILE_TAG {
        string file_id FK
        string tag_key FK
    }

    CHRONICLE_ENTRY ||--o{ CHRONICLE_ENTRY_LINK : link_ids
    LINK ||--o{ CHRONICLE_ENTRY_LINK : references
    CHRONICLE_ENTRY ||--o{ CHRONICLE_COLLABORATOR : collaborators
    CHRONICLE_ENTRY ||--o{ CHRONICLE_TAG : tags
    TAG ||--o{ CHRONICLE_TAG : references
    ALBUM }o--o| CHRONICLE_ENTRY : chronicle_id
    ALBUM ||--o{ ALBUM_TAG : tags
    TAG ||--o{ ALBUM_TAG : references
    ALBUM ||--o{ ALBUM_FILE_MASK : masks
    ALBUM ||--o{ GALLERY_IMAGE : images
    DOWNLOAD_FOLDER ||--o{ DOWNLOAD_FILE : hasPart
    DOWNLOAD_FILE ||--o{ DOWNLOAD_FILE_LINK : link_ids
    LINK ||--o{ DOWNLOAD_FILE_LINK : references
    DOWNLOAD_FILE ||--o{ DOWNLOAD_FILE_TAG : tags
    TAG ||--o{ DOWNLOAD_FILE_TAG : references
```

---

## Speicherorte

| Entitat | Datei / Ort | Format |
|---|---|---|
| `CHRONICLE_ENTRY`, `CHRONICLE_COLLABORATOR`, `CHRONICLE_TAG`, `CHRONICLE_ENTRY_LINK` | `share/config/chronicle.json` | JSON-LD `ItemList > Event[]` |
| `TAG` | `share/config/tags.json` | JSON-LD `DefinedTermSet` |
| `LINK` | `share/config/links.json` | JSON-LD `ItemList > ListItem[]` |
| `ALBUM`, `ALBUM_TAG`, `ALBUM_FILE_MASK` | `<SOURCE_DIR>/<path>/_config.json` | JSON, pro Album eine Datei |
| `GALLERY_IMAGE` | `share/galerie/<path>/_meta.json` | JSON-LD `ImageGallery`, generiert |
| `DOWNLOAD_FOLDER`, `DOWNLOAD_FILE`, `DOWNLOAD_FILE_LINK`, `DOWNLOAD_FILE_TAG` | `share/downloads/<path>/_meta.json` | JSON-LD `DataCatalog`, pro Ordner eine Datei |

---

## Datenfluss

```
SOURCE_DIR/<album>/_config.json   share/config/chronicle.json
          |                                    |
          | chronicle_id (FK)                  |
          +------------------------------------+
                      |
               galerie/process.py
                      |
          share/galerie/<album>/_meta.json
          share/galerie/<album>/*_t.webp   (Thumbnails)
          share/galerie/<album>/*_n.webp   (Normalized)
                      |
          share/galerie/_index.json        (Album-Katalog)
                      |
          Share-API  GET /api/v1/assets
```

---

## API-Zugriff (Share)

`GET https://share.erfindergeist.org/api/v1/assets`

Liefert ein einzelnes JSON-LD-Dokument (`DataCatalog`) das u. a. enthalt:

| Abschnitt | Inhalt |
|---|---|
| `config` | Rohinhalt aller Dateien aus `share/config/` inkl. `chronicle.json`, `links.json`, `tags.json` |
| `presentations` | Metadaten der Prasentation-Unterordner |
| `downloads` | `MediaObject`-Eintrge aus `downloads/` inkl. `_meta.json`-Annotationen |

---

## GUI-API (lokaler Config-Editor, Port 8082)

| Methode | Pfad | Entitaten |
|---|---|---|
| `GET /api/all` | Alle drei Config-Dateien auf einmal | `CHRONICLE_ENTRY`, `TAG`, `LINK` |
| `POST /api/save/chronicle` | Chronik schreiben | `CHRONICLE_ENTRY` + Unter-Entitaten |
| `POST /api/save/links` | Links schreiben | `LINK` |
| `POST /api/save/tags` | Tags schreiben | `TAG` |
| `GET /api/log/*` | Anderverlauf (NDJSON) | - |
| `POST /api/undo` | Eintrag wiederherstellen | `CHRONICLE_ENTRY` |
| `GET /api/albums` | Album-Liste | `ALBUM` (Titel + Pfad) |
| `GET /api/album?path=` | Album-Config lesen | `ALBUM` + `ALBUM_TAG` + `ALBUM_FILE_MASK` |
| `POST /api/album?path=` | Album-Config schreiben | `ALBUM` + `ALBUM_TAG` + `ALBUM_FILE_MASK` |
| `GET /api/album/images?path=` | Bilddatei-Liste eines Albums | `GALLERY_IMAGE` (Dateinamen) |
| `GET /api/album/image?path=&file=` | Bilddatei ausliefern | `GALLERY_IMAGE` |
