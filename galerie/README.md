# Gallery Module

Processes local photo collections into WebP thumbnails and normalized images,
writes JSON-LD metadata, and uploads everything to share.erfindergeist.org.

## Prerequisites

- Podman (or Docker) with Compose plugin
- A `.env` file in this folder (copy from `.env.example`)

## Setup

```powershell
# Copy the example env file and fill in your values
Copy-Item .env.example .env
# Edit .env: set SOURCE_DIR, FTP_USER, FTP_PASS
```

## Quick Start

```powershell
# From the galerie/ folder

# 1. Build the container (once, or after requirements.txt / Dockerfile changes)
podman compose build

# 2. Download current server state (WebP + JSON) into share/galerie/
#    Do this first so process.py can pick up where the server left off.
podman compose run --rm download

# 3. Process images - generates WebP + JSON, skips already-processed images
podman compose run --rm process

# 4. Upload everything to the server via FTP
podman compose run --rm upload
```

`share/galerie/_index.json` and `_meta.json` files are gitignored - they are generated
by `process` or fetched via `download` and deployed directly via `upload`.

## Folder Structure

SOURCE_DIR can be as flat or as deep as needed. Only folders with a `_config.json`
are processed as albums. All other folders act as organizational grouping only.

```text
SOURCE_DIR/
  2024/                        <- organizational folder, no _config.json needed
    sommerfest/
      _config.json             <- makes this an album
      IMG_001.jpg
      IMG_002.jpg
    hackathon/
      _config.json
      DSC_0042.jpg
  2025/
    maker-faire/
      _config.json
      photo.jpg
  geraete/                     <- non-event album, no date needed
    _config.json
    laser-cutter.jpg
    3d-drucker.jpg
```

Folders without `_config.json` (like `2024/` above) are automatically treated as
navigation folders in the gallery tab. They show up as folder cards with a count
of albums inside.

## Album Setup

Add a `_config.json` to any folder you want to publish as an album.

**Event album** (with date):

```json
{
  "title": "Sommerfest 2024",
  "description": "Optional description shown on the album card.",
  "date": "2024-07-15",
  "consent_collected": true,
  "tags": ["sommerfest", "community"]
}
```

**Equipment / non-event album** (date optional):

```json
{
  "title": "Werkzeuge und Geraete",
  "description": "Fotos unserer Maschinen und Werkzeuge in der Werkstatt.",
  "consent_collected": true,
  "tags": ["werkstatt", "geraete"]
}
```

**Minimum config** (only title required):

```json
{
  "title": "Diverses"
}
```

Only `title` is required. Folders without a valid `_config.json` are skipped.

| Field | Required | Description |
| --- | --- | --- |
| `title` | YES | Album card title |
| `date` | no | ISO date `YYYY-MM-DD` - shown on the card |
| `description` | no | Longer text shown below the title |
| `consent_collected` | no | Default: `false` - faces are blurred when false or missing |
| `preview` | no | Source filename to use as album card preview image |
| `blur` | no | Source filenames to always blur (overrides `consent_collected: true`) |
| `no_blur` | no | Source filenames to never blur (overrides `consent_collected: false`) |
| `tags` | no | String array, used as JSON-LD keywords |
| `wiki-url` | no | URL to a wiki page - shown as **Wiki** button in the lightbox |
| `raw-url` | no | URL to raw/source file - shown as **Raw** button in the lightbox |

**`consent_collected`**: When `false` or not set, faces in output images will be
automatically blurred using OpenCV face detection. Set to `true` when privacy
consent forms were collected from all participants.

**`preview`**: Set the album card preview image using the source filename.
Without this field the first image (sorted by date/time) is used.

```json
{
  "title": "Sommerfest 2024",
  "date": "2024-07-15",
  "consent_collected": true,
  "preview": "DSC_0042.jpg"
}
```

If the file does not exist in the source folder or has not been processed yet,
the preview falls back to the first processed image automatically.

**Per-image overrides** (`blur` / `no_blur`): Use these arrays to override the
album-level `consent_collected` for individual source files by their filename.

```json
{
  "title": "Sommerfest 2024",
  "date": "2024-07-15",
  "consent_collected": true,
  "blur":    ["IMG_007.jpg", "DSC_0042.jpg"],
  "no_blur": ["logo_banner.jpg"]
}
```

| Field | Effect |
| --- | --- |
| `blur` | Always blur these filenames - even when `consent_collected: true` |
| `no_blur` | Never blur these filenames - even when `consent_collected: false` |

Both fields accept an array of source filenames (the original file names in SOURCE_DIR, not the generated WebP names). `no_blur` takes precedence over `blur` if a filename appears in both. Reprocessing is triggered automatically when the per-image decision changes.

## Development vs. Production

`process.py` always writes `http://localhost:8080/galerie` as the `@id` base in
JSON-LD files. The `upload.py` script rewrites those URLs to
`https://share.erfindergeist.org/galerie` in-memory before uploading - no manual
switching needed.

The share site runs locally via Podman Compose from the `share/` folder:

```powershell
# from share/
podman compose up
# -> http://localhost:8080
```

Workflow for local testing:

1. `podman compose run --rm download` - fetch current server state into `share/galerie/`
2. `podman compose run --rm process` - process new images on top of the downloaded state
3. Open `http://localhost:8080` - the Gallery tab shows all albums
4. Commit the JSON files and run `podman compose run --rm upload` to deploy

## Incremental Processing

`process.py` is safe to run multiple times. Images are identified by their SHA-256
content hash. An image is only reprocessed if:

- it has never been processed before, or
- the output files are missing from `share/galerie/`

## Vision AI (optional)

Automatically generates captions or keyword tags for each photo.
Captions are stored in `_meta.json` as `caption` on each image and used as `alt` text in the gallery.

1. Set `VISION_MODEL=blip-base` (or another model) in `.env`
2. Set `INSTALL_AI=true` in `.env`
3. Rebuild the container: `podman compose build --no-cache`
4. Run: `podman compose run --rm process`

The model weights are downloaded from HuggingFace on first run (~300 MB - 1.8 GB depending on model)
and cached in the Podman volume `hf-cache`. Subsequent runs and rebuilds reuse the cache - no re-download needed.
Inference runs entirely locally on your machine (no API, no internet required after the first download).

Available models:

| `VISION_MODEL` | Size | Output |
| --- | --- | --- |
| `disabled` | 0 MB | No captions (default) |
| `clip-b32` | ~300 MB | Keyword tags |
| `blip-base` | ~440 MB | Natural language captions |
| `florence-2` | ~450 MB | Detailed captions |
| `moondream2` | ~1.8 GB | Best quality captions |

Use `DEVICE=cuda` if you have a compatible NVIDIA GPU (5-10x faster than CPU).

## Output Structure

```text
share/galerie/
  _index.json                          <- root catalog (all albums)
  <album-path>/
    _meta.json                         <- JSON-LD with all image metadata
    <YYYYMMDD_HHMMSS>_<hash8>_t.webp  <- thumbnail (~400px wide)
    <YYYYMMDD_HHMMSS>_<hash8>_n.webp  <- normalized (~1920px max)
```

Image filenames use the photo's creation date/time and a content hash.
The original filename is not used. Originals are never modified.

## FTP Sync (Upload & Download)

`upload.py` handles both directions using FTPS (FTP over TLS).

| Command | Direction | Description |
| --- | --- | --- |
| `podman compose run --rm download` | server -> local | Fetch current server state into `share/galerie/` |
| `podman compose run --rm upload` | local -> server | Push local changes to the server |

**Download** fetches all files from `FTP_REMOTE_DIR` that are missing or differ in size locally.
Use it before `process` to avoid reprocessing images that are already on the server.

**Upload** sends all local files in `share/galerie/` that are missing or differ in size on the server.

Both commands skip files where local and remote sizes already match (binary files).
JSON files are always transferred because upload.py rewrites `localhost` <-> production URLs on the fly (the size difference would otherwise cause unnecessary re-uploads).

The FTP host is always `erfindergeist.org` - the server handles DNS routing.

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `SOURCE_DIR` | (required) | Host path to image collection |
| `THUMBNAIL_WIDTH` | `400` | Thumbnail width in pixels |
| `NORMALIZED_MAX` | `1920` | Max dimension for normalized images |
| `QUALITY_THUMB` | `80` | WebP quality for thumbnails |
| `QUALITY_NORM` | `85` | WebP quality for normalized images |
| `VISION_MODEL` | `disabled` | AI model for captions (see above) |
| `INSTALL_AI` | `false` | Install AI deps in Docker build |
| `DEVICE` | `cpu` | AI device: `cpu` or `cuda` |
| `FTP_HOST` | `erfindergeist.org` | FTP server hostname |
| `FTP_USER` | (required) | FTP username |
| `FTP_PASS` | (required) | FTP password |
| `FTP_REMOTE_DIR` | `/galerie` | Remote target directory |
