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
| --- | --- | --- |
| `process` | `podman compose run --rm process` | Scan SOURCE_DIR, generate WebP, write JSON |
| `download` | `podman compose run --rm download` | FTPS download of server state into share/galerie/ |
| `upload` | `podman compose run --rm upload` | FTPS upload of share/galerie/ to server |

**Podman setup:** Standard Podman Desktop installation (Windows) with its bundled compose provider.
No additional tools (podman-compose, Docker Desktop, etc.) are installed or required.
Do not suggest installing extra software for container management.

Build the container once before first use:

```sh
podman compose build
```

With AI features (captions, AI-based blur):

```sh
podman compose build --build-arg INSTALL_AI=true
```

`INSTALL_AI` is a Docker build ARG, not a runtime env var. Setting it in `.env` alone is not
sufficient - it must be passed via `--build-arg` at build time (compose.yml reads it via
`${INSTALL_AI:-false}` from the shell environment, not from `env_file`).

Rebuild after changing `requirements.txt`, `Dockerfile`, or `INSTALL_AI`:

```sh
podman compose build --build-arg INSTALL_AI=true --no-cache
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
  "date": "YYYY-MM-DD, optional",
  "description": "string, optional",
  "consent_collected": true,
  "blur":    ["IMG_007.jpg"],
  "no_blur": ["logo.jpg"],
  "tags": ["string", "array", "optional"]
}
```

**`consent_collected`** defaults to `false` (safe default).
When `false` or missing, faces in ALL output images are blurred.
Set to `true` only when written privacy consent forms were actually collected from participants.

**`blur`** / **`no_blur`**: arrays of source filenames for per-image overrides.
`blur` forces blurring even when `consent_collected: true`.
`no_blur` skips blurring even when `consent_collected: false`.
`no_blur` takes precedence if a filename appears in both.
The `blurred` field per image in `_meta.json` stores the actual per-image decision.

A folder is silently skipped when `_config.json` is missing or lacks `title`.

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
      "blurred": false,
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
`process.py` skips an image if its hash is already in `_meta.json`,
both output files (`_t.webp`, `_n.webp`) exist, and the blur state matches
the current `consent_collected` setting.

Reprocessing is triggered by:

- New source image (hash not in `_meta.json`)
- Missing output file (e.g. after manual deletion)
- `consent_collected` changed in `_config.json` (detected via `blurred` field mismatch)
- Deleting `_meta.json` forces full reprocessing of that album

**Caption persistence:** When AI captions are generated, `_meta.json` is written
immediately after each image - both for retroactive captioning of existing images
and for newly processed ones. If `caption` is already present in an entry, that
image is skipped for caption generation. This means an interrupted run picks up
where it left off.

## File Naming

Output filename: `{YYYYMMDD_HHMMSS}_{hash8}_{suffix}.webp`

- Date/time from EXIF DateTimeOriginal (JPEG/TIFF), else file mtime
- `hash8`: first 8 hex chars of SHA-256 of the source file
- `_t` suffix: thumbnail
- `_n` suffix: normalized

Original filenames are never used in output.

## AI Vision Models (captions)

Only loaded when `VISION_MODEL != disabled`. Requires `INSTALL_AI=true` at build time.
Models are downloaded from HuggingFace Hub on first run (cached in the `hf-cache` volume).

The `DEVICE` env var controls inference: `cpu` (default) or `cuda`.
CPU is always available; CUDA requires an NVIDIA GPU with matching drivers.

## Face Detection Models (blur)

`BLUR_MODEL` accepts a comma-separated list of models applied sequentially
(each pass blurs the already-blurred image). All AI options require `INSTALL_AI=true`.

`_detect_faces_with(model_name, img)` is the dispatch function - each model implements
a private `_detect_faces_*(img, model, proc)` helper. `load_blur_models()` loads all
configured models at the start of an album that requires blurring.

| `BLUR_MODEL` | Method | CPU speed | HuggingFace / Docs |
| --- | --- | --- | --- |
| `haar` | OpenCV Haar cascades (default, always available) | ~50-200 ms | opencv bundled |
| `mediapipe` | Google BlazeFace deep-learning detector | ~5-20 ms | [mediapipe docs](https://mediapipe.readthedocs.io/en/latest/solutions/face_detection.html) |
| `mtcnn` | MTCNN (facenet-pytorch), gold standard for face detection | ~50-150 ms | [timesler/facenet-pytorch](https://github.com/timesler/facenet-pytorch) |
| `yunet` | YuNet OpenCV DNN, pre-trained ONNX, no extra pip package | ~10-30 ms | [opencv_zoo/face_detection_yunet](https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet) |
| `florence-2` | Florence-2 `<OPEN_VOCABULARY_DETECTION>human face`; shares model with `VISION_MODEL=florence-2` | ~3-8 s | [microsoft/Florence-2-base](https://huggingface.co/microsoft/Florence-2-base) |
| `grounding-dino` | Zero-shot detection, query `"a face."` | ~200-300 ms | [IDEA-Research/grounding-dino-tiny](https://huggingface.co/IDEA-Research/grounding-dino-tiny) |
| `owlvit` | OWL-ViT zero-shot via CLIP backbone | ~500 ms-1 s | [google/owlvit-base-patch32](https://huggingface.co/google/owlvit-base-patch32) |

Florence-2 note: if both `VISION_MODEL=florence-2` and `BLUR_MODEL=florence-2` are set,
`load_blur_models()` reuses the already-loaded vision model instance (no double RAM usage).

YuNet note: the ONNX model is baked into the container image at `/usr/local/share/yunet.onnx`
during build (`INSTALL_AI=true` required). No HuggingFace download at runtime.

## Adding a New Model

**Vision (caption):** Add `elif VISION_MODEL == 'your-model':` in `load_vision_model()` and `generate_caption()`.

**Blur (face detection):** Add a branch in `load_blur_models()` + a `_detect_faces_yourmodel(img, model, proc)`
function, then add the dispatch case in `_detect_faces_with()`. Document in `.env.example` and this table.

## Checklist Before Committing

- `share/galerie/_index.json` and `share/galerie/**/_meta.json` are committed (JSON only)
- WebP files are NOT committed (they are in `.gitignore`)
- No credentials in code or committed `.env` (only `.env.example` is tracked)
