# CLAUDE.md - galerie/

## Purpose

The `galerie/` folder contains the local image processing pipeline for the
Gallery tab on share.erfindergeist.org.

It is **not deployed** to any server. All output goes to `share/galerie/`.

## Stack

- Python 3.11 (container: `python:3.11-slim`)
- Pillow - image resizing, format conversion, EXIF orientation
- OpenCV (headless) - face detection for privacy blurring
- piexif - EXIF metadata extraction
- transformers + torch (optional) - AI image captioning
- Podman Compose - container orchestration

## Services

| Service | Command | Description |
|---|---|---|
| `process` | `podman compose run --rm process` | Scan SOURCE_DIR, generate WebP, write JSON |
| `upload` | `podman compose run --rm upload` | FTPS upload of share/galerie/ to server |

Build the container once before first use:
```
podman compose build
```

Rebuild after changing `requirements.txt` or `INSTALL_AI`:
```
podman compose build --no-cache
```

## Key Conventions

- All code, comments, docstrings, and variable names in **English**
- Python 3.11 type hints in function signatures
- No classes without reason - plain functions
- No external AI APIs - only bundled models running locally

## `_config.json` Schema

User-created file, one per album folder in SOURCE_DIR. Never auto-modified.

```json
{
  "title": "string, required",
  "date": "YYYY-MM-DD, required",
  "description": "string, optional",
  "consent_collected": true,
  "tags": ["string", "array", "optional"]
}
```

**`consent_collected`** defaults to `false` (safe default).
When `false` or missing, faces in ALL output images are blurred using
OpenCV Haar cascade detection. Set to `true` only when written privacy
consent forms were actually collected from participants.

A folder is silently skipped when `_config.json` is missing or lacks `title`/`date`.

## Output Files

### Per-album `_meta.json` (JSON-LD ImageGallery)

Written to `share/galerie/<album-path>/_meta.json` by `process.py`.
Contains the full image list. Loaded on demand by the Gallery tab JS when
a user opens an album.

```json
{
  "@context": "https://schema.org",
  "@type": "ImageGallery",
  "@id": "https://share.erfindergeist.org/galerie/<path>",
  "name": "...",
  "dateCreated": "YYYY-MM-DD",
  "hasPart": [
    {
      "@type": "ImageObject",
      "name": "<YYYYMMDD_HHMMSS>_<hash8>_n.webp",
      "thumbnail": "<YYYYMMDD_HHMMSS>_<hash8>_t.webp",
      "sourceHash": "<first 8 chars of SHA-256>",
      "dateCreated": "ISO-8601",
      "exif": { "camera": "...", "focalLength": "...", "exposureTime": "...", "iso": 0 },
      "caption": "AI-generated text (only if VISION_MODEL != disabled)"
    }
  ]
}
```

### Root `_index.json` (JSON-LD DataCatalog)

Written to `share/galerie/_index.json` by `process.py`.
Contains compact album summaries (no full image hasPart).
Loaded once by the Gallery tab on page load.

## Incremental Processing

Images are identified by `sourceHash` (first 8 hex chars of SHA-256).
`process.py` skips an image if its hash is already in `_meta.json` and
both output files (`_t.webp`, `_n.webp`) exist in the output directory.

Reprocessing is triggered by:
- New source image (hash not in `_meta.json`)
- Missing output file (e.g. after manual deletion)
- Deleting `_meta.json` forces full reprocessing of that album

## File Naming

Output filename: `{YYYYMMDD_HHMMSS}_{hash8}_{suffix}.webp`

- Date/time from EXIF DateTimeOriginal (JPEG/TIFF), else file mtime
- `hash8`: first 8 hex chars of SHA-256 of the source file
- `_t` suffix: thumbnail
- `_n` suffix: normalized

Original filenames are never used in output.

## AI Vision Models

Only loaded when `VISION_MODEL != disabled`. Requires `INSTALL_AI=true` at build time.
Models are downloaded from HuggingFace Hub on first run (cached in container layer).

The `DEVICE` env var controls inference: `cpu` (default) or `cuda`.
CPU is always available; CUDA requires an NVIDIA GPU with matching drivers.

## Adding a New Model

1. Add a `elif VISION_MODEL == 'your-model':` branch in `load_vision_model()` and `generate_caption()` in `process.py`
2. Document it in `.env.example`, `README.md` (model table), and this file
3. Note the download size and expected output quality

## Checklist Before Committing

- `share/galerie/_index.json` and `share/galerie/**/_meta.json` are committed (JSON only)
- WebP files are NOT committed (they are in `.gitignore`)
- No credentials in code or committed `.env` (only `.env.example` is tracked)
