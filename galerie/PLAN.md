# Plan: Gallery Module

## Context

Local image collections (events, workshops) need to be resized, converted to WebP,
and published on share.erfindergeist.org under a new Gallery tab.
Originals are never modified. Processed files are uploaded via FTP.

## Decisions Made

| Topic | Decision | Reason |
|---|---|---|
| Container | Podman Compose | Consistent with rest of project |
| Language | Python | Best library support for image processing |
| Image format | WebP | Good compression, modern browser support |
| AI captions | Optional, CPU-capable models | Marketing team may not have GPU |
| Face blur | OpenCV Haar cascade | Lightweight, no external API |
| HEIC support | Not included | Adds heavy dependency (`pillow-heif`) |
| Output path | Directly to `share/galerie/` | No intermediate copy step |
| Folder depth | Arbitrary (recursive rglob) | User requirement |
| Incremental | Hash-based (SHA256 short) | Skip already-processed images |
| FTP sync | Size comparison | Faster than full re-upload |
| Gallery tab position | 2nd (after Downloads) | User requirement |

## Folder Structure

```
galerie/                       <- processing scripts (not deployed)
  Dockerfile
  compose.yml
  .env.example
  requirements.txt
  process.py                   <- main: scan + generate WebP + write JSON
  upload.py                    <- FTP incremental upload
  CLAUDE.md
  README.md
  PLAN.md                      <- this file

share/galerie/                 <- output (deployed to server)
  _index.json                  <- root JSON-LD: all album summaries
  .gitignore                   <- excludes *.webp (image files)
  <album-path>/
    _config.json               <- copy of user config
    _meta.json                 <- auto-generated JSON-LD (full image list)
    <YYYYMMDD_HHMMSS>_<hash8>_t.webp   <- thumbnail
    <YYYYMMDD_HHMMSS>_<hash8>_n.webp   <- normalized

share/assets/templates/
  tab-galerie.php              <- Gallery tab (PHP + JS)
```

## `_config.json` Format (user-created, never auto-modified)

```json
{
  "title": "Sommerfest 2024",
  "description": "Optional longer description shown in the album card.",
  "date": "2024-07-15",
  "consent_collected": true,
  "tags": ["sommerfest", "community", "2024"]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | YES | Album card title |
| `date` | string | no | ISO date (YYYY-MM-DD) - shown on card; omit for non-event albums |
| `description` | string | no | Shown below title on card |
| `consent_collected` | boolean | no | Default: `false` - faces WILL be blurred when false or missing |
| `tags` | string[] | no | Used as JSON-LD keywords |

**A folder is only processed when `title` is present.**
Folders without `_config.json` are treated as organizational grouping (navigation folders).

## `_meta.json` Format (auto-generated per album)

```json
{
  "@context": "https://schema.org",
  "@type": "ImageGallery",
  "@id": "https://share.erfindergeist.org/galerie/2024/sommerfest",
  "name": "Sommerfest 2024",
  "description": "Optional description.",
  "dateCreated": "2024-07-15",
  "keywords": ["sommerfest", "community"],
  "hasPart": [
    {
      "@type": "ImageObject",
      "name": "20240715_130500_abc12345_n.webp",
      "thumbnail": "20240715_130500_abc12345_t.webp",
      "sourceHash": "abc12345",
      "dateCreated": "2024-07-15T13:05:00",
      "exif": {
        "camera": "iPhone 15",
        "focalLength": "26mm",
        "exposureTime": "1/60s",
        "iso": 100
      },
      "caption": "A group of people at a summer event outdoors"
    }
  ]
}
```

- `sourceHash` is the first 8 hex chars of the SHA-256 of the original file.
  Used for incremental processing: if hash is known and output files exist, skip.
- `caption` is only present when a VISION_MODEL is configured.
- `exif` fields are extracted from JPEG/TIFF EXIF data; empty object for other formats.

## `_index.json` Format (root, auto-generated)

```json
{
  "@context": "https://schema.org",
  "@type": "DataCatalog",
  "@id": "https://share.erfindergeist.org/galerie",
  "name": "Galerie - Erfindergeist Julich e.V.",
  "hasPart": [
    {
      "@type": "ImageGallery",
      "@id": "https://share.erfindergeist.org/galerie/2024/sommerfest",
      "path": "2024/sommerfest",
      "name": "Sommerfest 2024",
      "dateCreated": "2024-07-15",
      "imageCount": 42,
      "description": "...",
      "keywords": ["sommerfest"],
      "preview": "2024/sommerfest/20240715_130500_abc12345_t.webp"
    }
  ]
}
```

The `_index.json` contains album metadata only (no full image lists).
Full image lists are in each album's `_meta.json`, fetched on demand by the UI.

## Deployment Flow

```
[Local machine]
  1. Create _config.json in SOURCE_DIR folders
  2. podman compose -f galerie/compose.yml run --rm process
     -> generates WebP files + JSON in share/galerie/
  3. git add share/galerie/**/*.json && git commit && git push
     -> CI (deploy-share.yml) deploys JSON + PHP to server via FTPS
  4. podman compose -f galerie/compose.yml run --rm upload
     -> uploads WebP image files to server via FTPS (images are gitignored)
```

Steps 3 and 4 can be done in either order.

## Vision AI Models (optional)

Enable by setting `INSTALL_AI=true` in `.env` and rebuilding the container.

| `VISION_MODEL=` | Download | Output type | Speed (CPU) |
|---|---|---|---|
| `disabled` | 0 MB | none | instant |
| `clip-b32` | ~300 MB | keyword tags | ~0.5s/img |
| `blip-base` | ~440 MB | natural language | ~2-5s/img |
| `florence-2` | ~450 MB | detailed captions | ~3-8s/img |
| `moondream2` | ~1.8 GB | best quality | ~10-30s/img |

CPU performance depends on the machine. GPU (`DEVICE=cuda`) is 5-10x faster.

## Critical Files

| File | Type | Notes |
|---|---|---|
| `galerie/process.py` | Python | Image processor + JSON writer |
| `galerie/upload.py` | Python | FTP incremental uploader |
| `share/galerie/_index.json` | JSON-LD | Root catalog (git-tracked) |
| `share/galerie/<album>/_meta.json` | JSON-LD | Per-album metadata (git-tracked) |
| `share/assets/templates/tab-galerie.php` | PHP | Gallery tab template |
| `share/assets/js/share.js` | JS | Gallery navigation + lightbox |
| `share/assets/css/share.css` | CSS | Gallery card + lightbox styles |
| `share/api.php` | PHP | `eg_gallery_data()` added |
| `.github/workflows/deploy-share.yml` | YAML | Deploys share/ to server |
