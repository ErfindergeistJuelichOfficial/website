#!/usr/bin/env python3
"""
Gallery processor.

Scans /source (SOURCE_DIR) for album folders containing _config.json.
For each valid album, generates WebP thumbnails and normalized images,
writes per-album _meta.json, and a root _index.json to /output (share/galerie/).

Processing is split into 4 sequential phases per album to minimise peak RAM:
  Phase 1 (Basics)     - hash, orient, normalise, save _n.webp  (no AI models)
  Phase 2 (Captions)   - load vision model, generate captions, unload
  Phase 3 (Blur)       - for each blur model: load, blur all images, unload
  Phase 4 (Thumbnails) - open _n.webp, make thumbnail, save _t.webp  (no AI models)

Usage (via Podman Compose from the gui/ folder):
    podman compose run --rm process

Environment variables (from .env):
    SOURCE_DIR          - host path mounted as /source (read-only)
    THUMBNAIL_WIDTH     - thumbnail width in px (default: 400)
    NORMALIZED_MAX      - max dimension for normalized images in px (default: 1920)
    QUALITY_THUMB       - WebP quality for thumbnails (default: 80)
    QUALITY_NORM        - WebP quality for normalized images (default: 85)
    VISION_MODEL        - AI model for captions: disabled|florence-2
    CAPTION_BATCH_SIZE  - images loaded into RAM per caption chunk (default: 1).
                          Florence-2 still infers one image at a time (its batched
                          generation is broken), so this only bounds memory, not speed.
    BLUR_MODEL          - comma-separated face-detection models: haar|owlvit|mtcnn
    DEVICE              - AI inference device: cpu|cuda
"""

import gc
import hashlib
import json
import os
import resource
import shutil
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

import piexif
from PIL import Image, ImageFilter, ImageOps

# ── Config ────────────────────────────────────────────────────────────────────

SOURCE_DIR   = Path('/source')
OUTPUT_DIR   = Path('/output')
LOG_DIR      = OUTPUT_DIR / 'log'
BASE_URL     = 'http://localhost:8080/galerie'

THUMB_WIDTH        = int(os.getenv('THUMBNAIL_WIDTH',   '400'))
NORM_MAX           = int(os.getenv('NORMALIZED_MAX',    '1920'))
QUALITY_T          = int(os.getenv('QUALITY_THUMB',     '80'))
QUALITY_N          = int(os.getenv('QUALITY_NORM',      '85'))
VISION_MODEL       = os.getenv('VISION_MODEL', 'disabled').lower()
CAPTION_BATCH_SIZE = int(os.getenv('CAPTION_BATCH_SIZE', '1'))
BLUR_MODELS        = [m.strip() for m in os.getenv('BLUR_MODEL', 'haar').lower().split(',') if m.strip()]
DEVICE             = os.getenv('DEVICE', 'cpu').lower()

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}

# ── AI model state ────────────────────────────────────────────────────────────

_vision_model    = None
_vision_proc     = None
_blur_instances: dict = {}  # model_name -> (model, proc)

# ── Run-time metrics ──────────────────────────────────────────────────────────

_t_start: float = 0.0
_phase_times: dict[str, float] = {
    'Phase 1 (basics)':     0.0,
    'Phase 2 (captions)':   0.0,
    'Phase 3 (blur)':       0.0,
    'Phase 4 (thumbnails)': 0.0,
}


# ── Vision AI ─────────────────────────────────────────────────────────────────

def _install_flash_attn_stub() -> None:
    """Inject a no-op flash_attn stub so Florence-2 can import it.
    With attn_implementation='eager' the stub functions are never called."""
    import importlib.machinery
    import types
    if 'flash_attn' in sys.modules:
        return
    stub = types.ModuleType('flash_attn')
    stub.__spec__ = importlib.machinery.ModuleSpec('flash_attn', loader=None)
    stub.__spec__.submodule_search_locations = []
    stub.flash_attn_func = None
    stub.flash_attn_varlen_func = None
    sys.modules['flash_attn'] = stub
    bert_pad = types.ModuleType('flash_attn.bert_padding')
    bert_pad.__spec__ = importlib.machinery.ModuleSpec('flash_attn.bert_padding', loader=None)
    bert_pad.index_first_axis = None
    bert_pad.pad_input = None
    bert_pad.unpad_input = None
    sys.modules['flash_attn.bert_padding'] = bert_pad


def load_vision_model() -> None:
    """Load the configured vision model once."""
    global _vision_model, _vision_proc
    if VISION_MODEL == 'disabled' or _vision_model is not None:
        return

    print(f'Loading vision model: {VISION_MODEL} on {DEVICE} ...')
    try:
        if VISION_MODEL == 'florence-2':
            _install_flash_attn_stub()
            from transformers import AutoModelForCausalLM, AutoProcessor
            _vision_proc  = AutoProcessor.from_pretrained('microsoft/Florence-2-base', trust_remote_code=True)
            _vision_model = AutoModelForCausalLM.from_pretrained(
                'microsoft/Florence-2-base', trust_remote_code=True, attn_implementation='eager'
            ).to(DEVICE)
        else:
            print(f'  ERROR: Unknown VISION_MODEL "{VISION_MODEL}", AI disabled.')
            return
        print(f'  Vision model loaded: {VISION_MODEL}')
    except ImportError as exc:
        print(f'  ERROR: AI dependencies not installed. Rebuild with INSTALL_AI=true. ({exc})')
    except Exception as exc:
        print(f'  ERROR: Failed to load vision model: {exc}')


def unload_vision_model() -> None:
    """Release the vision model from RAM and run the garbage collector."""
    global _vision_model, _vision_proc
    if _vision_model is None:
        return
    print('Unloading vision model ...')
    _vision_model = None
    _vision_proc  = None
    gc.collect()
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except ImportError:
        pass


def _generate_captions_batch(imgs: list) -> list:
    """
    Generate captions for a list of PIL images in one model call.
    Returns a list of str|None with the same length as imgs.
    """
    if VISION_MODEL == 'disabled' or _vision_model is None:
        return [None] * len(imgs)
    try:
        import torch
        rgbs = [img.convert('RGB') for img in imgs]
        if VISION_MODEL == 'florence-2':
            # Florence-2's remote modeling code mishandles the attention mask for
            # batches > 1 (it stays at text length instead of expanding to cover the
            # merged image+text sequence), so caption each image in its own call.
            results: list = []
            for rgb in rgbs:
                inputs = _vision_proc(
                    text='<CAPTION>',
                    images=rgb,
                    return_tensors='pt',
                ).to(DEVICE)
                with torch.no_grad():
                    out = _vision_model.generate(**inputs, max_new_tokens=64)
                raw    = _vision_proc.batch_decode(out, skip_special_tokens=False)[0]
                parsed = _vision_proc.post_process_generation(
                    raw, task='<CAPTION>', image_size=(rgb.width, rgb.height)
                )
                text = parsed.get('<CAPTION>', '').strip()
                results.append(text if text else None)
            return results
    except Exception as exc:
        print(f'  ERROR: caption generation failed: {exc}')
    return [None] * len(imgs)


def generate_caption(img: Image.Image) -> Optional[str]:
    """Generate a text caption for a single image. Returns None if AI is disabled."""
    return _generate_captions_batch([img])[0]


# ── Blur AI ───────────────────────────────────────────────────────────────────

def load_blur_model(model_name: str) -> None:
    """Load a single face-detection model into _blur_instances."""
    global _blur_instances
    if model_name in _blur_instances:
        return
    print(f'Loading blur model: {model_name} ...')
    try:
        if model_name == 'haar':
            import cv2
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            cascade = cv2.CascadeClassifier(cascade_path)
            if cascade.empty():
                print(f'  Warning: haar cascade not found at {cascade_path}.', file=sys.stderr)
                return
            _blur_instances[model_name] = (cascade, None)

        elif model_name == 'owlvit':
            from transformers import AutoModelForZeroShotObjectDetection, AutoProcessor
            proc  = AutoProcessor.from_pretrained('google/owlvit-base-patch32')
            model = AutoModelForZeroShotObjectDetection.from_pretrained(
                'google/owlvit-base-patch32'
            ).to(DEVICE)
            _blur_instances[model_name] = (model, proc)

        elif model_name == 'mtcnn':
            from facenet_pytorch import MTCNN as FaceMTCNN
            model = FaceMTCNN(
                keep_all=True, device=DEVICE, post_process=False,
                min_face_size=20, thresholds=[0.6, 0.7, 0.7],
            )
            _blur_instances[model_name] = (model, None)

        else:
            print(f'  Unknown blur model "{model_name}", skipped.', file=sys.stderr)
            return

        if model_name in _blur_instances:
            print(f'  Blur model loaded: {model_name}')

    except ImportError:
        print(f'  Blur AI dependencies not installed for {model_name}. Rebuild with INSTALL_AI=true.', file=sys.stderr)
    except Exception as exc:
        print(f'  Failed to load blur model {model_name}: {exc}', file=sys.stderr)


def load_blur_models() -> None:
    """Load all configured face-detection models."""
    for model_name in BLUR_MODELS:
        load_blur_model(model_name)


def unload_blur_model(model_name: str) -> None:
    """Release a single face-detection model from RAM and run the garbage collector."""
    if model_name not in _blur_instances:
        return
    print(f'Unloading blur model: {model_name} ...')
    del _blur_instances[model_name]
    gc.collect()
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except ImportError:
        pass


def _detect_faces_haar(img: Image.Image, model: object, proc: object) -> list:
    """OpenCV Haar cascade frontal-face detection. No INSTALL_AI required."""
    try:
        import cv2
        import numpy as np
        gray  = cv2.cvtColor(np.array(img.convert('RGB')), cv2.COLOR_RGB2GRAY)
        boxes = model.detectMultiScale(  # type: ignore[attr-defined]
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
        )
        if not len(boxes):
            return []
        return [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in boxes]
    except Exception as exc:
        print(f'  Warning: haar detection failed: {exc}', file=sys.stderr)
        return []


def _detect_faces_owlvit(img: Image.Image, model: object, proc: object) -> list:
    """OWL-ViT zero-shot detection with text queries 'a photo of a face'."""
    try:
        import torch

        rgb    = img.convert('RGB')
        inputs = proc(  # type: ignore[operator]
            text=[['a photo of a face', 'a human face']],
            images=rgb,
            return_tensors='pt',
        ).to(DEVICE)
        with torch.no_grad():
            outputs = model(**inputs)  # type: ignore[operator]
        results = proc.post_process_object_detection(  # type: ignore[attr-defined]
            outputs,
            threshold=0.1,
            target_sizes=torch.tensor([img.size[::-1]]),
        )[0]
        boxes: list = []
        for box in results['boxes']:
            x1, y1, x2, y2 = (int(v) for v in box.tolist())
            boxes.append((x1, y1, x2 - x1, y2 - y1))
        return boxes

    except Exception as exc:
        print(f'  Warning: owlvit detection failed: {exc}', file=sys.stderr)
        return []


def _detect_faces_mtcnn(img: Image.Image, model: object, proc: object) -> list:
    """MTCNN face detection (facenet-pytorch). Accepts PIL Image directly."""
    try:
        boxes, probs = model.detect(img)  # type: ignore[attr-defined]
        if boxes is None:
            return []
        result: list = []
        for box, prob in zip(boxes, probs):
            if prob < 0.9:
                continue
            x1, y1, x2, y2 = (max(0, int(v)) for v in box)
            result.append((x1, y1, x2 - x1, y2 - y1))
        return result
    except Exception as exc:
        print(f'  Warning: mtcnn detection failed: {exc}', file=sys.stderr)
        return []


def _detect_faces_with(model_name: str, img: Image.Image) -> list:
    """Dispatch face detection for a single loaded model. Returns [(x, y, w, h), ...]."""
    instance = _blur_instances.get(model_name)
    if instance is None:
        return []
    model, proc = instance
    if model_name == 'haar':
        return _detect_faces_haar(img, model, proc)
    if model_name == 'owlvit':
        return _detect_faces_owlvit(img, model, proc)
    if model_name == 'mtcnn':
        return _detect_faces_mtcnn(img, model, proc)
    return []


def _blur_img_with_model(img: Image.Image, model_name: str) -> Image.Image:
    """Detect faces with one model and apply Gaussian blur. Returns modified copy."""
    boxes = _detect_faces_with(model_name, img)
    if not boxes:
        return img
    result = img.copy()
    for (x, y, w, h) in boxes:
        region = result.crop((x, y, x + w, y + h))
        radius = max(20, w // 4)
        result.paste(region.filter(ImageFilter.GaussianBlur(radius=radius)), (x, y))
    return result


# ── Image utilities ───────────────────────────────────────────────────────────

def open_and_orient(path: Path) -> Image.Image:
    """Open an image and apply EXIF orientation correction."""
    return ImageOps.exif_transpose(Image.open(path))


def make_thumbnail(img: Image.Image, width: int) -> Image.Image:
    """Resize to given width, preserving aspect ratio."""
    if img.width <= width:
        return img.copy()
    height = int(img.height * width / img.width)
    return img.resize((width, height), Image.LANCZOS)


def make_normalized(img: Image.Image, max_dim: int) -> Image.Image:
    """Resize so the longest edge equals max_dim, preserving aspect ratio."""
    longest = max(img.width, img.height)
    if longest <= max_dim:
        return img.copy()
    ratio = max_dim / longest
    return img.resize((int(img.width * ratio), int(img.height * ratio)), Image.LANCZOS)


# ── EXIF & file utilities ─────────────────────────────────────────────────────

def file_datetime(path: Path) -> tuple[str, str]:
    """
    Return (YYYYMMDD_HHMMSS, ISO-8601) from EXIF DateTimeOriginal.
    Falls back to file mtime when EXIF is unavailable.
    """
    ext = path.suffix.lower()
    if ext in {'.jpg', '.jpeg', '.tiff', '.tif'}:
        try:
            exif_data = piexif.load(str(path))
            raw = exif_data.get('Exif', {}).get(piexif.ExifIFD.DateTimeOriginal)
            if raw:
                s = raw.decode('utf-8') if isinstance(raw, bytes) else str(raw)
                dt = datetime.strptime(s, '%Y:%m:%d %H:%M:%S')
                return dt.strftime('%Y%m%d_%H%M%S'), dt.isoformat()
        except Exception:
            pass
    mtime = datetime.fromtimestamp(path.stat().st_mtime)
    return mtime.strftime('%Y%m%d_%H%M%S'), mtime.isoformat()


def file_exif(path: Path) -> dict:
    """Extract useful EXIF fields: camera, focal length, exposure time, ISO."""
    result: dict = {}
    ext = path.suffix.lower()
    if ext not in {'.jpg', '.jpeg', '.tiff', '.tif'}:
        return result
    try:
        exif_data = piexif.load(str(path))
        ifd0 = exif_data.get('0th', {})
        exif = exif_data.get('Exif', {})

        model = ifd0.get(piexif.ImageIFD.Model)
        if model:
            result['camera'] = (
                model.decode('utf-8').strip('\x00') if isinstance(model, bytes) else str(model)
            )

        fl = exif.get(piexif.ExifIFD.FocalLength)
        if isinstance(fl, tuple) and len(fl) == 2 and fl[1]:
            result['focalLength'] = f'{fl[0] // fl[1]}mm'

        exp = exif.get(piexif.ExifIFD.ExposureTime)
        if isinstance(exp, tuple) and len(exp) == 2 and exp[1]:
            result['exposureTime'] = f'{exp[0]}/{exp[1]}s'

        iso = exif.get(piexif.ExifIFD.ISOSpeedRatings)
        if iso is not None:
            result['iso'] = int(iso) if isinstance(iso, int) else int(iso[0])
    except Exception:
        pass
    return result


def sha256_short(path: Path) -> str:
    """Return the first 8 hex chars of the SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()[:8]


# ── Config & metadata ─────────────────────────────────────────────────────────

def load_config(folder: Path) -> Optional[dict]:
    """
    Load and validate _config.json.
    Returns None if the file is missing, unreadable, or lacks required fields.
    Required fields: title (str).
    """
    cfg_path = folder / '_config.json'
    if not cfg_path.is_file():
        return None
    try:
        with open(cfg_path, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError):
        return None
    if not isinstance(data.get('title'), str):
        return None
    return data


def load_existing_by_hash(output_album: Path) -> dict:
    """
    Read the existing _meta.json and return a dict of {sourceHash: ImageObject}
    for incremental processing (skipping already-processed images).
    """
    meta_path = output_album / '_meta.json'
    if not meta_path.is_file():
        return {}
    try:
        with open(meta_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return {
            part['sourceHash']: part
            for part in data.get('hasPart', [])
            if isinstance(part, dict) and 'sourceHash' in part
        }
    except (json.JSONDecodeError, OSError, KeyError):
        return {}


# ── Phase 1: Basics ───────────────────────────────────────────────────────────

def _phase1_basics(
    source_album: Path,
    output_album: Path,
    config: dict,
    existing_by_hash: dict,
    album_rel: str,
    on_progress: Optional[callable],
    log: Optional[list],
) -> tuple[list, dict]:
    """
    For each source image: compute hash, skip if already normalised, else
    open/orient/normalise and save _n.webp. No AI models loaded.
    Returns (parts, needs_blur_flags) where needs_blur_flags maps sourceHash -> bool.
    """
    needs_blur_default = not bool(config.get('consent_collected', False))
    always_blur = set(config.get('blur',    []))
    never_blur  = set(config.get('no_blur', []))

    image_files = sorted(
        p for p in source_album.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS
    )

    parts: list = []
    needs_blur_flags: dict[str, bool] = {}

    for src in image_files:
        hash8 = sha256_short(src)

        img_needs_blur = needs_blur_default
        if src.name in always_blur:
            img_needs_blur = True
        if src.name in never_blur:
            img_needs_blur = False
        needs_blur_flags[hash8] = img_needs_blur

        if hash8 in existing_by_hash:
            ep         = existing_by_hash[hash8]
            norm_ok    = (output_album / ep.get('name', '')).is_file()
            # Regenerate from source when consent changed from blurred -> unblurred
            unblurring = ep.get('blurred') is True and not img_needs_blur
            if norm_ok and not unblurring:
                parts.append(ep)
                continue
            if unblurring:
                print(f'  {src.name} (consent changed, unblurring)')
                if log is not None:
                    log.append(f'IMAGE_REPROCESS {album_rel}/{src.name}  consent changed: unblurring')
            else:
                print(f'  {src.name} (file missing, reprocessing)')
                if log is not None:
                    log.append(f'IMAGE_REPROCESS {album_rel}/{src.name}  file missing')
        else:
            print(f'  {src.name}')
            if log is not None:
                log.append(f'IMAGE_NEW      {album_rel}/{src.name}')

        try:
            img = open_and_orient(src)
        except Exception as exc:
            print(f'  Warning: cannot open {src.name}: {exc}', file=sys.stderr)
            continue

        dt_short, dt_iso = file_datetime(src)
        norm_name = f'{dt_short}_{hash8}_n.webp'
        norm_img  = make_normalized(img, NORM_MAX)

        output_album.mkdir(parents=True, exist_ok=True)
        norm_img.convert('RGB').save(output_album / norm_name, 'WEBP', quality=QUALITY_N)

        part: dict = {
            '@type':       'ImageObject',
            'name':        norm_name,
            'sourceHash':  hash8,
            'dateCreated': dt_iso,
            'exif':        file_exif(src),
            'blurred':     False,
        }
        parts.append(part)
        write_album_meta(output_album, album_rel, config, parts)
        if on_progress:
            on_progress(parts)

    return parts, needs_blur_flags


# ── Phase 2: Captions ─────────────────────────────────────────────────────────

def _phase2_captions(
    output_album: Path,
    album_rel: str,
    config: dict,
    parts: list,
    on_progress: Optional[callable],
    log: Optional[list],
) -> None:
    """
    Generate AI captions for images that have none.
    Vision model is loaded once, all un-captioned images processed in chunks, then unloaded.
    CAPTION_BATCH_SIZE bounds how many images are held in RAM per chunk (CUDA only;
    CPU uses 1). Florence-2 infers one image per call regardless (batched generation
    is broken), so this does not parallelise inference.
    """
    if VISION_MODEL == 'disabled':
        return
    to_caption = [e for e in parts if e.get('caption') is None]
    if not to_caption:
        return

    load_vision_model()
    if _vision_model is None:
        return

    batch_size = CAPTION_BATCH_SIZE if DEVICE == 'cuda' else 1
    i = 0
    while i < len(to_caption):
        batch   = to_caption[i:i + batch_size]
        imgs    = []
        entries = []
        for entry in batch:
            try:
                imgs.append(Image.open(output_album / entry['name']))
                entries.append(entry)
            except Exception as exc:
                print(f'  Warning: cannot open {entry["name"]} for caption: {exc}', file=sys.stderr)

        if imgs:
            captions = _generate_captions_batch(imgs)
            for entry, caption in zip(entries, captions):
                if caption:
                    entry['caption'] = caption
                    print(f'  Caption ({entry["name"]}): {caption}')
                    if log is not None:
                        log.append(f'CAPTION        {album_rel}/{entry["name"]}')
                else:
                    print(f'  Caption ({entry["name"]}): (none generated, will retry)', file=sys.stderr)

        write_album_meta(output_album, album_rel, config, parts)
        if on_progress:
            on_progress(parts)
        i += batch_size

    unload_vision_model()


# ── Phase 3: Blur ─────────────────────────────────────────────────────────────

def _phase3_blur(
    output_album: Path,
    album_rel: str,
    config: dict,
    parts: list,
    needs_blur_flags: dict,
    on_progress: Optional[callable],
    log: Optional[list],
) -> None:
    """
    Apply face blur to images that need it, one model at a time.
    Each model is loaded, applied to all images needing blur, then unloaded before
    the next model loads. blurred=True is written to meta only after all models finish,
    so an interrupted run re-applies all models cleanly on restart (safe double-blur).
    """
    to_blur = [
        e for e in parts
        if needs_blur_flags.get(e['sourceHash'], False) and not e.get('blurred', False)
    ]
    if not to_blur:
        return

    for blur_model in BLUR_MODELS:
        load_blur_model(blur_model)
        if blur_model not in _blur_instances:
            continue

        print(f'  Blurring faces with {blur_model} ({len(to_blur)} image(s)) ...')
        for entry in to_blur:
            norm_path = output_album / entry['name']
            try:
                img         = Image.open(norm_path)
                blurred_img = _blur_img_with_model(img, blur_model)
                blurred_img.convert('RGB').save(norm_path, 'WEBP', quality=QUALITY_N)
            except Exception as exc:
                print(f'  Warning: blur failed for {entry["name"]} with {blur_model}: {exc}', file=sys.stderr)

        unload_blur_model(blur_model)

    # Mark blurred and drop cached thumbnail - Phase 4 regenerates from the now-blurred _n.webp
    for entry in to_blur:
        entry['blurred'] = True
        entry.pop('thumbnail', None)

    write_album_meta(output_album, album_rel, config, parts)
    if on_progress:
        on_progress(parts)


# ── Phase 4: Thumbnails ───────────────────────────────────────────────────────

def _phase4_thumbnails(
    output_album: Path,
    album_rel: str,
    config: dict,
    parts: list,
    on_progress: Optional[callable],
    log: Optional[list],
) -> None:
    """
    Generate thumbnails from _n.webp (already blurred if applicable). No AI models loaded.
    Entries without a thumbnail key (new or just blurred) are always processed.
    """
    for entry in parts:
        thumb_name = entry.get('thumbnail', '')
        if thumb_name and (output_album / thumb_name).is_file():
            continue

        norm_path = output_album / entry.get('name', '')
        if not norm_path.is_file():
            print(f'  Warning: normalised file missing, cannot generate thumbnail: {entry.get("name")}', file=sys.stderr)
            continue

        thumb_name = entry['name'].replace('_n.webp', '_t.webp')
        try:
            img       = Image.open(norm_path)
            thumb_img = make_thumbnail(img, THUMB_WIDTH)
            thumb_img.convert('RGB').save(output_album / thumb_name, 'WEBP', quality=QUALITY_T)
            entry['thumbnail'] = thumb_name
        except Exception as exc:
            print(f'  Warning: thumbnail generation failed for {entry.get("name")}: {exc}', file=sys.stderr)
            continue

        write_album_meta(output_album, album_rel, config, parts)
        if on_progress:
            on_progress(parts)


# ── Album processing ──────────────────────────────────────────────────────────

def process_album(
    source_album: Path,
    output_album: Path,
    config: dict,
    album_rel: str,
    existing_by_hash: dict,
    on_progress: Optional[callable] = None,
    log: Optional[list] = None,
) -> list:
    """
    Process all images in source_album through 4 sequential phases.
    Returns a list of ImageObject dicts for _meta.json hasPart.
    """
    t0 = time.perf_counter()
    parts, needs_blur_flags = _phase1_basics(
        source_album, output_album, config, existing_by_hash, album_rel, on_progress, log
    )
    _phase_times['Phase 1 (basics)'] += time.perf_counter() - t0

    gc.collect()

    t0 = time.perf_counter()
    _phase2_captions(output_album, album_rel, config, parts, on_progress, log)
    _phase_times['Phase 2 (captions)'] += time.perf_counter() - t0

    t0 = time.perf_counter()
    _phase3_blur(output_album, album_rel, config, parts, needs_blur_flags, on_progress, log)
    _phase_times['Phase 3 (blur)'] += time.perf_counter() - t0

    gc.collect()

    t0 = time.perf_counter()
    _phase4_thumbnails(output_album, album_rel, config, parts, on_progress, log)
    _phase_times['Phase 4 (thumbnails)'] += time.perf_counter() - t0

    return parts


def write_album_meta(output_album: Path, album_rel: str, config: dict, parts: list) -> dict:
    """Write _meta.json (JSON-LD ImageGallery) and return the dict."""
    meta: dict = {
        '@context': 'https://schema.org',
        '@type':    'ImageGallery',
        '@id':      f'{BASE_URL}/{album_rel}',
        'name':     config['title'],
        'hasPart':  parts,
    }
    if config.get('description'):
        meta['description'] = config['description']
    if config.get('chronicle_id'):
        meta['chronicleId'] = config['chronicle_id']

    output_album.mkdir(parents=True, exist_ok=True)
    with open(output_album / '_meta.json', 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    return meta


def album_summary(meta: dict, album_rel: str, parts: list, preview_thumb: Optional[str] = None) -> dict:
    """
    Compact album entry for the root _index.json.
    Contains metadata only - no full image hasPart (kept in per-album _meta.json).
    preview_thumb: resolved thumbnail filename override from config['preview']; falls back to parts[0].
    """
    summary: dict = {
        '@type':      'ImageGallery',
        '@id':        meta['@id'],
        'path':       album_rel,
        'name':       meta['name'],
        'imageCount': len(parts),
    }
    if meta.get('description'):
        summary['description'] = meta['description']
    if meta.get('chronicleId'):
        summary['chronicleId'] = meta['chronicleId']
    thumb = preview_thumb or (parts[0].get('thumbnail') if parts else None)
    if thumb:
        summary['preview'] = album_rel + '/' + thumb
    return summary


def resolve_preview_thumbnail(config: dict, source_album: Path, parts: list) -> Optional[str]:
    """
    Resolve config['preview'] (source filename) to the matching thumbnail filename in parts.
    Returns None if not configured, file not found, or image not yet processed.
    """
    preview_src = config.get('preview')
    if not preview_src:
        return None
    preview_path = source_album / preview_src
    if not preview_path.is_file():
        print(f'  Warning: preview "{preview_src}" not found in source folder.', file=sys.stderr)
        return None
    preview_hash = sha256_short(preview_path)
    for part in parts:
        if part.get('sourceHash') == preview_hash:
            return part.get('thumbnail')
    return None  # image not yet processed; falls back to parts[0]


def write_index(output_root: Path, summaries: list) -> None:
    """Write the root _index.json combining all album summaries."""
    index = {
        '@context':    'https://schema.org',
        '@type':       'DataCatalog',
        '@id':         BASE_URL,
        'name':        'Galerie - Erfindergeist Julich e.V.',
        'description': 'Foto-Galerie des Erfindergeist Julich e.V.',
        'hasPart':     summaries,
    }
    with open(output_root / '_index.json', 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    print(f'_index.json written ({len(summaries)} albums).')


# ── Config vs meta comparison ─────────────────────────────────────────────────

def detect_config_changes(config: dict, output_album: Path) -> list[str]:
    """
    Compare current config values against existing _meta.json album-level fields.
    Returns a list of human-readable change strings; empty when nothing changed or
    no _meta.json exists yet (new album).
    """
    meta_path = output_album / '_meta.json'
    if not meta_path.is_file():
        return []
    try:
        with open(meta_path, 'r', encoding='utf-8') as f:
            meta = json.load(f)
    except (json.JSONDecodeError, OSError):
        return []

    def norm(v: object) -> object:
        return None if v in (None, '', []) else v

    checks: list[tuple[str, object, object]] = [
        ('title',       meta.get('name'),             norm(config.get('title'))),
        ('description', norm(meta.get('description')), norm(config.get('description'))),
    ]
    return [f'{label}: {old!r} -> {new!r}' for label, old, new in checks if old != new]


# ── Main ──────────────────────────────────────────────────────────────────────

def scan_and_process(source_root: Path, output_root: Path, log: Optional[list] = None) -> list:
    """
    Recursively find all _config.json files, process valid albums,
    and return a list of all known album summaries for _index.json.

    Existing _index.json entries are preserved throughout the run so albums
    processed later in the same run stay visible in the index.
    """
    # Seed known_summaries from the existing index so no entries are lost
    known_summaries: dict[str, dict] = {}
    index_path = output_root / '_index.json'
    if index_path.is_file():
        try:
            with open(index_path, 'r', encoding='utf-8') as f:
                idx = json.load(f)
            for s in idx.get('hasPart', []):
                if 'path' in s:
                    known_summaries[s['path']] = s
        except (json.JSONDecodeError, OSError):
            pass

    for cfg_path in sorted(source_root.rglob('_config.json')):
        source_album = cfg_path.parent
        album_rel    = str(source_album.relative_to(source_root)).replace('\\', '/')
        output_album = output_root / album_rel

        config = load_config(source_album)
        if config is None:
            print(f'Skip (incomplete config): {album_rel}')
            continue

        consent_label = 'consent collected' if config.get('consent_collected') else 'NO consent - faces will be blurred'
        print(f'\nAlbum: {album_rel}')
        print(f'  Title  : {config["title"]}')
        print(f'  Privacy: {consent_label}')

        existing = load_existing_by_hash(output_album)
        if not (output_album / '_meta.json').is_file():
            if log is not None:
                log.append(f'ALBUM_NEW      {album_rel}')
        else:
            for change in detect_config_changes(config, output_album):
                print(f'  Config change: {change}')
                if log is not None:
                    log.append(f'META_CHANGE    {album_rel}  {change}')

        def _make_summary(parts: list, _rel: str = album_rel, _cfg: dict = config) -> dict:
            meta: dict = {
                '@id':  f'{BASE_URL}/{_rel}',
                'name': _cfg['title'],
            }
            if _cfg.get('date'):
                meta['dateCreated'] = _cfg['date']
            if _cfg.get('description'):
                meta['description'] = _cfg['description']
            if _cfg.get('tags'):
                meta['keywords'] = _cfg['tags']
            preview_thumb = resolve_preview_thumbnail(_cfg, source_album, parts)
            return album_summary(meta, _rel, parts, preview_thumb)

        def _on_progress(parts: list, _rel: str = album_rel) -> None:
            known_summaries[_rel] = _make_summary(parts)
            write_index(output_root, list(known_summaries.values()))

        # Write index before processing so the album is visible immediately
        _on_progress(list(existing.values()))

        parts = process_album(source_album, output_album, config, album_rel, existing, on_progress=_on_progress, log=log)
        cleanup_orphaned_images(output_album, parts, album_rel, log=log)
        meta  = write_album_meta(output_album, album_rel, config, parts)

        preview_thumb = resolve_preview_thumbnail(config, source_album, parts)
        known_summaries[album_rel] = album_summary(meta, album_rel, parts, preview_thumb)
        write_index(output_root, list(known_summaries.values()))
        new_count = sum(1 for p in parts if p.get('sourceHash') not in existing)
        print(f'  Done   : {len(parts)} images ({new_count} new)')

    return list(known_summaries.values())


def reconcile_output(output_root: Path, log: Optional[list] = None) -> None:
    """
    Cross-check _index.json and per-album _meta.json against actual files on disk.
    Removes stale album entries (no _meta.json) and missing image references.
    Rewrites affected files only when changes are found.
    """
    index_path = output_root / '_index.json'
    if not index_path.is_file():
        return

    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            idx = json.load(f)
    except (json.JSONDecodeError, OSError):
        print('  Reconcile: cannot read _index.json.', file=sys.stderr)
        return

    valid_summaries = []
    index_changed   = False

    for summary in idx.get('hasPart', []):
        album_rel    = summary.get('path', '')
        output_album = output_root / album_rel
        meta_path    = output_album / '_meta.json'

        if not meta_path.is_file():
            print(f'  Reconcile: dropping "{album_rel}" - no _meta.json on disk')
            if log is not None:
                log.append(f'STALE_ALBUM    {album_rel}')
            index_changed = True
            continue

        try:
            with open(meta_path, 'r', encoding='utf-8') as f:
                meta = json.load(f)
        except (json.JSONDecodeError, OSError):
            print(f'  Reconcile: cannot read _meta.json for "{album_rel}", keeping entry')
            valid_summaries.append(summary)
            continue

        parts       = meta.get('hasPart', [])
        valid_parts = [p for p in parts if (output_album / p.get('name', '')).is_file()]

        if len(valid_parts) != len(parts):
            removed = len(parts) - len(valid_parts)
            print(f'  Reconcile: {album_rel}: {removed} missing image(s) removed from _meta.json')
            if log is not None:
                stale = {p.get('name', '') for p in parts} - {p.get('name', '') for p in valid_parts}
                for name in sorted(stale):
                    log.append(f'STALE_IMAGE    {album_rel}/{name}')
            meta['hasPart'] = valid_parts
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)
            summary = dict(summary)
            summary['imageCount'] = len(valid_parts)
            index_changed = True

        valid_summaries.append(summary)

    if index_changed:
        write_index(output_root, valid_summaries)
        print(f'Reconcile: {len(valid_summaries)} valid album(s) after cleanup.')
    else:
        print(f'Reconcile: all {len(valid_summaries)} album(s) consistent.')


def cleanup_orphaned_images(output_album: Path, parts: list, album_rel: str, log: Optional[list] = None) -> None:
    """Delete WebP files in output_album that are not referenced by any part in parts."""
    referenced = set()
    for p in parts:
        if p.get('name'):      referenced.add(p['name'])
        if p.get('thumbnail'): referenced.add(p['thumbnail'])
    for webp in sorted(output_album.glob('*.webp')):
        if webp.name not in referenced:
            print(f'  Delete (source gone): {album_rel}/{webp.name}')
            webp.unlink()
            if log is not None:
                log.append(f'DELETE_IMAGE   {album_rel}/{webp.name}')


def cleanup_orphaned_albums(source_root: Path, output_root: Path, log: Optional[list] = None) -> None:
    """Delete output album directories whose source folder no longer exists."""
    print('\nCleaning up orphaned albums ...')
    removed = 0
    for meta_path in sorted(output_root.rglob('_meta.json')):
        album_dir = meta_path.parent
        rel       = str(album_dir.relative_to(output_root)).replace('\\', '/')
        if rel.startswith('log'):
            continue
        source_album = source_root / rel
        source_gone  = not source_album.is_dir()
        config_gone  = not source_gone and load_config(source_album) is None
        if source_gone or config_gone:
            if not album_dir.is_dir():
                continue  # already removed as part of a parent rmtree
            reason = 'source gone' if source_gone else 'config removed/invalid'
            print(f'  Delete ({reason}): {rel}/')
            shutil.rmtree(album_dir)
            if log is not None:
                log.append(f'DELETE_ALBUM   {rel}')
            removed += 1
    if removed:
        print(f'  Removed {removed} orphaned album(s).')
    else:
        print('  No orphaned albums found.')


def _fmt_time(seconds: float) -> str:
    """Format a duration as 'Xm Y.Zs'."""
    m = int(seconds // 60)
    s = seconds % 60
    return f'{m}m {s:.1f}s'


def main() -> None:
    global _t_start

    if not SOURCE_DIR.is_dir():
        print('Error: /source is not mounted. Check SOURCE_DIR in .env.', file=sys.stderr)
        sys.exit(1)

    output_root = OUTPUT_DIR
    output_root.mkdir(parents=True, exist_ok=True)

    print(f'Source : {SOURCE_DIR}')
    print(f'Output : {output_root}')
    print(f'AI     : {VISION_MODEL} on {DEVICE}')
    print(f'Blur   : {", ".join(BLUR_MODELS)}')

    _t_start = time.perf_counter()
    run_log: list[str] = []
    summaries = scan_and_process(SOURCE_DIR, output_root, log=run_log)

    cleanup_orphaned_albums(SOURCE_DIR, output_root, log=run_log)

    print('\nReconciling output ...')
    reconcile_output(output_root, log=run_log)

    if run_log:
        LOG_DIR.mkdir(exist_ok=True)
        ts       = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_path = LOG_DIR / f'{ts}_process.txt'
        with open(log_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(run_log) + '\n')
        print(f'\nChange log: {log_path.name} ({len(run_log)} entr(ies))')

    total   = time.perf_counter() - _t_start
    peak_kb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    peak_gb = peak_kb / 1024 / 1024
    print('\n=== Process Summary ===')
    print(f'Total time:  {_fmt_time(total)}')
    for label, elapsed in _phase_times.items():
        print(f'  {label:<26} {_fmt_time(elapsed)}')
    print(f'Peak RAM:    {peak_gb:.1f} GB')

    print(f'\nFinished. {len(summaries)} known album(s).')


if __name__ == '__main__':
    main()
