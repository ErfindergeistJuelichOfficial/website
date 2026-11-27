#!/usr/bin/env python3
"""
Gallery processor.

Reads the album list from /configs/galerie.json (Public/Configs).
For each album, reads the originals from /source/<path> (Mitglieder/Galerie),
writes WebP thumbnails and normalized images to /output/<path> (Public/Galerie)
and stores the slim image list back into galerie.json (once per phase, only on change).

Processing is split into 4 sequential phases per album to minimise peak RAM:
  Phase 1 (Basics)     - hash, orient, normalise, save _n.webp  (no AI models)
  Phase 2 (Captions)   - load vision model, generate captions, unload
  Phase 3 (Blur)       - for each blur model: load, blur all images, unload
  Phase 4 (Thumbnails) - open _n.webp, make thumbnail, save _t.webp  (no AI models)

Usage (via Podman Compose from the gui/ folder):
    podman compose run --rm process

Environment variables (from .env):
    SOURCE_DIR          - Nextcloud root; compose mounts Mitglieder/Galerie as /source (read-only),
                          Public/Galerie as /output and Public/Configs as /configs
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
GALERIE_JSON = Path('/configs') / 'galerie.json'

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


def sha256_short(path: Path) -> str:
    """Return the first 8 hex chars of the SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()[:8]


def hash_of(name: str) -> str:
    """Source hash encoded in a normalised file name: YYYYMMDD_HHMMSS_<hash8>_n.webp."""
    parts = name.split('_')
    return parts[2] if len(parts) >= 4 else ''


def thumb_of(name: str) -> str:
    """Thumbnail file name for a normalised file name."""
    return name.replace('_n.webp', '_t.webp')


# ── galerie.json ──────────────────────────────────────────────────────────────

def load_galerie() -> dict:
    """Read galerie.json; exits when missing or invalid."""
    try:
        with open(GALERIE_JSON, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError) as exc:
        print(f'Error: cannot read {GALERIE_JSON}: {exc}', file=sys.stderr)
        sys.exit(1)
    if not isinstance(data.get('hasPart'), list):
        print(f'Error: {GALERIE_JSON} has no hasPart list.', file=sys.stderr)
        sys.exit(1)
    return data


def write_galerie(data: dict) -> None:
    """Write galerie.json atomically (compact) so the Nextcloud client never syncs a half file."""
    tmp = GALERIE_JSON.with_name(GALERIE_JSON.name + '.tmp')
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')
    os.replace(tmp, GALERIE_JSON)


def slim_parts(parts: list) -> list:
    """Stored image entries: name, caption (optional), blurred."""
    result = []
    for p in parts:
        entry = {'name': p['name']}
        if p.get('caption'):
            entry['caption'] = p['caption']
        entry['blurred'] = bool(p.get('blurred'))
        result.append(entry)
    return result


def save_album(album_rel: str, parts: list, preview_thumb: Optional[str]) -> None:
    """
    Update the generated fields of one album in galerie.json.
    Re-reads the file first so concurrent GUI edits of other fields survive;
    writes only when something actually changed (avoids needless Nextcloud versions).
    """
    data = load_galerie()
    album = next((a for a in data['hasPart'] if a.get('path') == album_rel), None)
    if album is None:
        print(f'  Warning: album "{album_rel}" was removed from galerie.json meanwhile, not saved.', file=sys.stderr)
        return
    new_fields: dict = {'imageCount': len(parts), 'hasPart': slim_parts(parts)}
    thumb = preview_thumb or (thumb_of(parts[0]['name']) if parts else None)
    if thumb:
        new_fields['previewThumbnail'] = thumb
    old_fields = {k: album.get(k) for k in ('imageCount', 'hasPart', 'previewThumbnail') if k in album}
    if old_fields == new_fields:
        return
    album.pop('previewThumbnail', None)
    album.update(new_fields)
    write_galerie(data)


# ── Phase 1: Basics ───────────────────────────────────────────────────────────

def _phase1_basics(source_album: Path, output_album: Path, config: dict, existing_by_hash: dict) -> tuple[list, dict]:
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
        if hash8 in needs_blur_flags:
            # Identical file content (copy under another name) -> same output file, list it once
            print(f'  {src.name} (duplicate of an image already in this album, skipped)')
            continue

        img_needs_blur = needs_blur_default
        if src.name in always_blur:
            img_needs_blur = True
        if src.name in never_blur:
            img_needs_blur = False
        needs_blur_flags[hash8] = img_needs_blur

        if hash8 in existing_by_hash:
            ep         = existing_by_hash[hash8]
            norm_ok    = (output_album / ep['name']).is_file()
            # Regenerate from source when consent changed from blurred -> unblurred
            unblurring = ep.get('blurred') is True and not img_needs_blur
            if norm_ok and not unblurring:
                parts.append(ep)
                continue
            reason = 'consent changed, unblurring' if unblurring else 'file missing, reprocessing'
            print(f'  {src.name} ({reason})')
        else:
            print(f'  {src.name}')

        try:
            img = open_and_orient(src)
        except Exception as exc:
            print(f'  Warning: cannot open {src.name}: {exc}', file=sys.stderr)
            continue

        dt_short, _ = file_datetime(src)
        norm_name = f'{dt_short}_{hash8}_n.webp'
        norm_img  = make_normalized(img, NORM_MAX)

        output_album.mkdir(parents=True, exist_ok=True)
        norm_img.convert('RGB').save(output_album / norm_name, 'WEBP', quality=QUALITY_N)
        # Old thumbnail (if any) belongs to the previous version of this image
        (output_album / thumb_of(norm_name)).unlink(missing_ok=True)

        part: dict = {'name': norm_name, 'blurred': False}
        if hash8 in existing_by_hash and existing_by_hash[hash8].get('caption'):
            part['caption'] = existing_by_hash[hash8]['caption']
        parts.append(part)

    return parts, needs_blur_flags


# ── Phase 2: Captions ─────────────────────────────────────────────────────────

def _phase2_captions(output_album: Path, parts: list) -> None:
    """
    Generate AI captions for images that have none.
    Vision model is loaded once, all un-captioned images processed in chunks, then unloaded.
    CAPTION_BATCH_SIZE bounds how many images are held in RAM per chunk (CUDA only;
    CPU uses 1). Florence-2 infers one image per call regardless (batched generation
    is broken), so this does not parallelise inference.
    """
    if VISION_MODEL == 'disabled':
        return
    to_caption = [e for e in parts if not e.get('caption')]
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
                else:
                    print(f'  Caption ({entry["name"]}): (none generated, will retry)', file=sys.stderr)
        i += batch_size

    unload_vision_model()


# ── Phase 3: Blur ─────────────────────────────────────────────────────────────

def _phase3_blur(output_album: Path, parts: list, needs_blur_flags: dict) -> None:
    """
    Apply face blur to images that need it, one model at a time.
    Each model is loaded, applied to all images needing blur, then unloaded before
    the next model loads. blurred=True is saved only after all models finish,
    so an interrupted run re-applies all models cleanly on restart (safe double-blur).
    """
    to_blur = [
        e for e in parts
        if needs_blur_flags.get(hash_of(e['name']), False) and not e.get('blurred', False)
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

    # Mark blurred and drop the old thumbnail - Phase 4 regenerates it from the now-blurred _n.webp
    for entry in to_blur:
        entry['blurred'] = True
        (output_album / thumb_of(entry['name'])).unlink(missing_ok=True)


# ── Phase 4: Thumbnails ───────────────────────────────────────────────────────

def _phase4_thumbnails(output_album: Path, parts: list) -> None:
    """Generate missing thumbnails from _n.webp (already blurred if applicable). No AI models loaded."""
    for entry in parts:
        thumb_path = output_album / thumb_of(entry['name'])
        if thumb_path.is_file():
            continue

        norm_path = output_album / entry['name']
        if not norm_path.is_file():
            print(f'  Warning: normalised file missing, cannot generate thumbnail: {entry["name"]}', file=sys.stderr)
            continue

        try:
            img       = Image.open(norm_path)
            thumb_img = make_thumbnail(img, THUMB_WIDTH)
            thumb_img.convert('RGB').save(thumb_path, 'WEBP', quality=QUALITY_T)
        except Exception as exc:
            print(f'  Warning: thumbnail generation failed for {entry["name"]}: {exc}', file=sys.stderr)


# ── Album processing ──────────────────────────────────────────────────────────

def preview_hash(config: dict, source_album: Path) -> Optional[str]:
    """Source hash of config['preview'] (source filename); None if not configured or not found."""
    preview_src = config.get('preview')
    if not preview_src:
        return None
    preview_path = source_album / preview_src
    if not preview_path.is_file():
        print(f'  Warning: preview "{preview_src}" not found in source folder.', file=sys.stderr)
        return None
    return sha256_short(preview_path)


def resolve_preview_thumbnail(wanted_hash: Optional[str], parts: list) -> Optional[str]:
    """Thumbnail filename of the preview image; None when not set or not yet processed (falls back to parts[0])."""
    for part in parts:
        if wanted_hash and hash_of(part['name']) == wanted_hash:
            return thumb_of(part['name'])
    return None


def process_album(album: dict) -> list:
    """
    Process all images of one album through 4 sequential phases.
    galerie.json is saved after each phase, so an interrupted run keeps finished work.
    Returns the list of image entries.
    """
    album_rel    = album['path']
    source_album = SOURCE_DIR / album_rel
    output_album = OUTPUT_DIR / album_rel

    existing = {
        hash_of(p['name']): dict(p)
        for p in album.get('hasPart', [])
        if isinstance(p, dict) and p.get('name') and hash_of(p['name'])
    }

    wanted_preview = preview_hash(album, source_album)

    def _save(parts: list) -> None:
        save_album(album_rel, parts, resolve_preview_thumbnail(wanted_preview, parts))

    t0 = time.perf_counter()
    parts, needs_blur_flags = _phase1_basics(source_album, output_album, album, existing)
    _phase_times['Phase 1 (basics)'] += time.perf_counter() - t0
    _save(parts)

    gc.collect()

    t0 = time.perf_counter()
    _phase2_captions(output_album, parts)
    _phase_times['Phase 2 (captions)'] += time.perf_counter() - t0
    _save(parts)

    t0 = time.perf_counter()
    _phase3_blur(output_album, parts, needs_blur_flags)
    _phase_times['Phase 3 (blur)'] += time.perf_counter() - t0
    _save(parts)

    gc.collect()

    t0 = time.perf_counter()
    _phase4_thumbnails(output_album, parts)
    _phase_times['Phase 4 (thumbnails)'] += time.perf_counter() - t0

    cleanup_orphaned_images(output_album, parts, album_rel)
    new_count = sum(1 for p in parts if hash_of(p['name']) not in existing)
    print(f'  Done   : {len(parts)} images ({new_count} new)')
    return parts


def cleanup_orphaned_images(output_album: Path, parts: list, album_rel: str) -> None:
    """Delete WebP files in output_album that are not referenced by any part in parts."""
    referenced = set()
    for p in parts:
        referenced.add(p['name'])
        referenced.add(thumb_of(p['name']))
    for webp in sorted(output_album.glob('*.webp')):
        if webp.name not in referenced:
            print(f'  Delete (source gone): {album_rel}/{webp.name}')
            webp.unlink()


def cleanup_orphaned_albums(album_paths: set) -> None:
    """
    Delete WebP files in output folders that belong to no album in galerie.json.
    Albums can be nested (Angebote/Werkstatt and Angebote/Werkstatt/Bohren), so only
    the files of the orphaned folder itself are removed, never a whole subtree.
    """
    print('\nCleaning up orphaned albums ...')
    removed = 0
    for folder in sorted({p.parent for p in OUTPUT_DIR.rglob('*.webp')}):
        rel = folder.relative_to(OUTPUT_DIR).as_posix()
        if rel in album_paths:
            continue
        print(f'  Delete (not in galerie.json): {rel}/*.webp')
        for webp in folder.glob('*.webp'):
            webp.unlink()
        removed += 1
    # Remove now-empty folders, deepest first
    for folder in sorted((d for d in OUTPUT_DIR.rglob('*') if d.is_dir()), key=lambda d: len(d.parts), reverse=True):
        if not any(folder.iterdir()):
            folder.rmdir()
    print(f'  Removed {removed} orphaned album folder(s).' if removed else '  No orphaned albums found.')


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
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f'Source : {SOURCE_DIR}')
    print(f'Output : {OUTPUT_DIR}')
    print(f'Config : {GALERIE_JSON}')
    print(f'AI     : {VISION_MODEL} on {DEVICE}')
    print(f'Blur   : {", ".join(BLUR_MODELS)}')

    _t_start = time.perf_counter()
    albums = [a for a in load_galerie()['hasPart'] if isinstance(a, dict) and a.get('path')]
    processed = 0

    for album in albums:
        album_rel = album['path']
        if not isinstance(album.get('title'), str):
            print(f'Skip (no title): {album_rel}')
            continue
        if not (SOURCE_DIR / album_rel).is_dir():
            print(f'Skip (source folder missing): {album_rel}', file=sys.stderr)
            continue
        consent_label = 'consent collected' if album.get('consent_collected') else 'NO consent - faces will be blurred'
        print(f'\nAlbum: {album_rel}')
        print(f'  Title  : {album["title"]}')
        print(f'  Privacy: {consent_label}')
        process_album(album)
        processed += 1

    cleanup_orphaned_albums({a['path'] for a in albums})

    total   = time.perf_counter() - _t_start
    peak_kb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    peak_gb = peak_kb / 1024 / 1024
    print('\n=== Process Summary ===')
    print(f'Total time:  {_fmt_time(total)}')
    for label, elapsed in _phase_times.items():
        print(f'  {label:<26} {_fmt_time(elapsed)}')
    print(f'Peak RAM:    {peak_gb:.1f} GB')

    print(f'\nFinished. {processed} of {len(albums)} album(s) processed.')


if __name__ == '__main__':
    main()
