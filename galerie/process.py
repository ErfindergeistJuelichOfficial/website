#!/usr/bin/env python3
"""
Gallery processor.

Scans /source (SOURCE_DIR) for album folders containing _config.json.
For each valid album, generates WebP thumbnails and normalized images,
writes per-album _meta.json, and a root _index.json to /output (share/galerie/).

Usage (via Podman Compose from the galerie/ folder):
    podman compose run --rm process

Environment variables (from .env):
    SOURCE_DIR        - host path mounted as /source (read-only)
    THUMBNAIL_WIDTH   - thumbnail width in px (default: 400)
    NORMALIZED_MAX    - max dimension for normalized images in px (default: 1920)
    QUALITY_THUMB     - WebP quality for thumbnails (default: 80)
    QUALITY_NORM      - WebP quality for normalized images (default: 85)
    VISION_MODEL      - AI model for captions: disabled|clip-b32|blip-base|florence-2|moondream2
    DEVICE            - AI inference device: cpu|cuda
"""

import hashlib
import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import piexif
from PIL import Image, ImageFilter, ImageOps

# ── Config ────────────────────────────────────────────────────────────────────

SOURCE_DIR   = Path('/source')
OUTPUT_DIR   = Path('/output')
BASE_URL     = 'http://localhost:8080/galerie'

THUMB_WIDTH  = int(os.getenv('THUMBNAIL_WIDTH', '400'))
NORM_MAX     = int(os.getenv('NORMALIZED_MAX',  '1920'))
QUALITY_T    = int(os.getenv('QUALITY_THUMB',   '80'))
QUALITY_N    = int(os.getenv('QUALITY_NORM',    '85'))
VISION_MODEL = os.getenv('VISION_MODEL', 'disabled').lower()
DEVICE       = os.getenv('DEVICE', 'cpu').lower()

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}

# ── Vision AI (lazy-loaded) ───────────────────────────────────────────────────

_vision_model = None
_vision_proc  = None


def load_vision_model() -> None:
    """Load the configured vision model once."""
    global _vision_model, _vision_proc
    if VISION_MODEL == 'disabled' or _vision_model is not None:
        return

    print(f'Loading vision model: {VISION_MODEL} on {DEVICE} ...')
    try:
        if VISION_MODEL == 'blip-base':
            from transformers import BlipForConditionalGeneration, BlipProcessor
            _vision_proc  = BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-base')
            _vision_model = BlipForConditionalGeneration.from_pretrained(
                'Salesforce/blip-image-captioning-base'
            ).to(DEVICE)

        elif VISION_MODEL == 'florence-2':
            from transformers import AutoModelForCausalLM, AutoProcessor
            _vision_proc  = AutoProcessor.from_pretrained('microsoft/Florence-2-base', trust_remote_code=True)
            _vision_model = AutoModelForCausalLM.from_pretrained(
                'microsoft/Florence-2-base', trust_remote_code=True
            ).to(DEVICE)

        elif VISION_MODEL == 'clip-b32':
            from transformers import CLIPModel, CLIPProcessor
            _vision_proc  = CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')
            _vision_model = CLIPModel.from_pretrained('openai/clip-vit-base-patch32').to(DEVICE)

        elif VISION_MODEL == 'moondream2':
            from transformers import AutoModelForCausalLM, AutoTokenizer
            _vision_proc  = AutoTokenizer.from_pretrained(
                'vikhyatk/moondream2', revision='2024-07-23', trust_remote_code=True
            )
            _vision_model = AutoModelForCausalLM.from_pretrained(
                'vikhyatk/moondream2', revision='2024-07-23', trust_remote_code=True
            ).to(DEVICE)

        else:
            print(f'  Unknown VISION_MODEL "{VISION_MODEL}", disabling AI.', file=sys.stderr)

    except ImportError:
        print('  AI dependencies not installed. Set INSTALL_AI=true and rebuild.', file=sys.stderr)
    except Exception as exc:
        print(f'  Failed to load vision model: {exc}', file=sys.stderr)


def generate_caption(img: Image.Image) -> Optional[str]:
    """Generate a text caption/tags for an image. Returns None if AI is disabled."""
    if VISION_MODEL == 'disabled' or _vision_model is None:
        return None

    try:
        import torch

        rgb = img.convert('RGB')

        if VISION_MODEL == 'blip-base':
            inputs = _vision_proc(rgb, return_tensors='pt').to(DEVICE)
            with torch.no_grad():
                out = _vision_model.generate(**inputs, max_new_tokens=64)
            return _vision_proc.decode(out[0], skip_special_tokens=True)

        if VISION_MODEL == 'florence-2':
            inputs = _vision_proc(text='<CAPTION>', images=rgb, return_tensors='pt').to(DEVICE)
            with torch.no_grad():
                out = _vision_model.generate(**inputs, max_new_tokens=64)
            result = _vision_proc.batch_decode(out, skip_special_tokens=True)
            return result[0].strip() if result else None

        if VISION_MODEL == 'clip-b32':
            labels = [
                'people', 'outdoor', 'indoor', 'food', 'technology', 'nature',
                'presentation', 'workshop', 'group photo', 'maker', 'electronics',
                'children', 'adults', 'celebration', 'work', 'demonstration',
            ]
            inputs = _vision_proc(
                text=labels, images=rgb, return_tensors='pt', padding=True
            ).to(DEVICE)
            with torch.no_grad():
                logits = _vision_model(**inputs).logits_per_image[0]
            probs = logits.softmax(dim=0).tolist()
            top = sorted(zip(labels, probs), key=lambda x: x[1], reverse=True)[:3]
            return ', '.join(label for label, prob in top if prob > 0.1) or None

        if VISION_MODEL == 'moondream2':
            enc = _vision_model.encode_image(rgb)
            return _vision_model.answer_question(
                enc, 'Describe what you see in this image.', _vision_proc
            )

    except Exception as exc:
        print(f'  Warning: caption generation failed: {exc}', file=sys.stderr)

    return None


# ── Image utilities ───────────────────────────────────────────────────────────

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


def blur_faces(img: Image.Image) -> Image.Image:
    """
    Detect faces with multiple OpenCV Haar cascades and apply Gaussian blur.
    Uses frontal (default + alt2) and profile cascades (left + right) for better coverage.
    Used when consent_collected is false or missing in _config.json.
    """
    try:
        import cv2
        import numpy as np

        arr  = np.array(img.convert('RGB'))
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        cv2.equalizeHist(gray, gray)  # improve contrast for low-light detection
        width = gray.shape[1]

        cascade_names = [
            'haarcascade_frontalface_default.xml',
            'haarcascade_frontalface_alt2.xml',
            'haarcascade_profileface.xml',
        ]

        boxes: list = []
        for fname in cascade_names:
            path = cv2.data.haarcascades + fname
            if not os.path.exists(path):
                continue
            cascade = cv2.CascadeClassifier(path)
            detected = cascade.detectMultiScale(
                gray, scaleFactor=1.05, minNeighbors=3, minSize=(25, 25)
            )
            if hasattr(detected, '__len__') and len(detected) > 0:
                for face in detected:
                    boxes.append((int(face[0]), int(face[1]), int(face[2]), int(face[3])))
            # Mirror pass: profile cascade catches opposite-facing profiles when flipped
            if 'profile' in fname:
                detected_flip = cascade.detectMultiScale(
                    cv2.flip(gray, 1), scaleFactor=1.05, minNeighbors=3, minSize=(25, 25)
                )
                if hasattr(detected_flip, '__len__') and len(detected_flip) > 0:
                    for face in detected_flip:
                        x, y, w, h = int(face[0]), int(face[1]), int(face[2]), int(face[3])
                        boxes.append((width - x - w, y, w, h))

        if not boxes:
            return img

        result = img.copy()
        for (x, y, w, h) in boxes:
            region = result.crop((x, y, x + w, y + h))
            radius = max(20, w // 4)
            result.paste(region.filter(ImageFilter.GaussianBlur(radius=radius)), (x, y))
        return result

    except ImportError:
        print('  Warning: opencv not available, face blur skipped.', file=sys.stderr)
        return img
    except Exception as exc:
        print(f'  Warning: face blur failed: {exc}', file=sys.stderr)
        return img


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
        with open(cfg_path, 'r', encoding='utf-8') as f:
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


# ── Album processing ──────────────────────────────────────────────────────────

def process_album(
    source_album: Path,
    output_album: Path,
    config: dict,
    existing_by_hash: dict,
) -> list:
    """
    Process all images in source_album.
    Skips images that are already in existing_by_hash with output files present.
    Returns a list of ImageObject dicts for _meta.json hasPart.
    """
    consent = bool(config.get('consent_collected', False))

    if VISION_MODEL != 'disabled':
        load_vision_model()

    image_files = sorted(
        p for p in source_album.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS
    )

    parts = []
    for src in image_files:
        hash8 = sha256_short(src)

        # Incremental: reuse existing output if files are still present
        if hash8 in existing_by_hash:
            ep = existing_by_hash[hash8]
            norm_ok  = (output_album / ep.get('name', '')).is_file()
            thumb_ok = (output_album / ep.get('thumbnail', '')).is_file() if ep.get('thumbnail') else True
            if norm_ok and thumb_ok:
                # Retroactively generate caption if AI is now enabled but caption is missing
                if VISION_MODEL != 'disabled' and not ep.get('caption'):
                    try:
                        norm_img = Image.open(output_album / ep['name'])
                        caption  = generate_caption(norm_img)
                        ep = dict(ep)
                        ep['caption'] = caption or ''
                        print(f'  Caption ({ep["name"]}): {ep["caption"] or "(empty)"}')
                    except Exception as exc:
                        print(f'  Warning: caption failed for {ep.get("name")}: {exc}', file=sys.stderr)
                parts.append(ep)
                continue

        print(f'  {src.name}')
        try:
            img = open_and_orient(src)
        except Exception as exc:
            print(f'  Warning: cannot open {src.name}: {exc}', file=sys.stderr)
            continue

        dt_short, dt_iso = file_datetime(src)
        base      = f'{dt_short}_{hash8}'
        thumb_name = f'{base}_t.webp'
        norm_name  = f'{base}_n.webp'

        thumb_img = make_thumbnail(img, THUMB_WIDTH)
        norm_img  = make_normalized(img, NORM_MAX)

        # Blur faces when no privacy consent was collected
        if not consent:
            print('    blurring faces ...')
            thumb_img = blur_faces(thumb_img)
            norm_img  = blur_faces(norm_img)

        caption = generate_caption(norm_img) if VISION_MODEL != 'disabled' else None
        if VISION_MODEL != 'disabled':
            print(f'    caption: {caption or "(empty)"}')

        output_album.mkdir(parents=True, exist_ok=True)
        thumb_img.convert('RGB').save(output_album / thumb_name, 'WEBP', quality=QUALITY_T)
        norm_img.convert('RGB').save(output_album / norm_name,  'WEBP', quality=QUALITY_N)

        part: dict = {
            '@type':       'ImageObject',
            'name':        norm_name,
            'thumbnail':   thumb_name,
            'sourceHash':  hash8,
            'dateCreated': dt_iso,
            'exif':        file_exif(src),
        }
        if VISION_MODEL != 'disabled':
            part['caption'] = caption or ''
        parts.append(part)

    return parts


def write_album_meta(output_album: Path, album_rel: str, config: dict, parts: list) -> dict:
    """Write _meta.json (JSON-LD ImageGallery) and return the dict."""
    meta: dict = {
        '@context':    'https://schema.org',
        '@type':       'ImageGallery',
        '@id':         f'{BASE_URL}/{album_rel}',
        'name':        config['title'],
        'dateCreated': config.get('date', ''),
        'hasPart':     parts,
    }
    if config.get('description'):
        meta['description'] = config['description']
    if config.get('tags'):
        meta['keywords'] = config['tags']

    output_album.mkdir(parents=True, exist_ok=True)
    with open(output_album / '_meta.json', 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    return meta


def album_summary(meta: dict, album_rel: str, parts: list) -> dict:
    """
    Compact album entry for the root _index.json.
    Contains metadata only - no full image hasPart (kept in per-album _meta.json).
    """
    summary: dict = {
        '@type':       'ImageGallery',
        '@id':         meta['@id'],
        'path':        album_rel,
        'name':        meta['name'],
        'dateCreated': meta.get('dateCreated', ''),
        'imageCount':  len(parts),
    }
    if meta.get('description'):
        summary['description'] = meta['description']
    if meta.get('keywords'):
        summary['keywords'] = meta['keywords']
    # First thumbnail as card preview image (path relative to /output root)
    if parts and parts[0].get('thumbnail'):
        summary['preview'] = album_rel + '/' + parts[0]['thumbnail']
    return summary


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


# ── Main ──────────────────────────────────────────────────────────────────────

def scan_and_process(source_root: Path, output_root: Path) -> list:
    """
    Recursively find all _config.json files, process valid albums,
    and return a list of album summaries for _index.json.
    """
    summaries = []

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
        print(f'  Date   : {config.get("date", "-")}')
        print(f'  Privacy: {consent_label}')

        existing = load_existing_by_hash(output_album)
        parts    = process_album(source_album, output_album, config, existing)
        meta     = write_album_meta(output_album, album_rel, config, parts)

        # Copy _config.json to output so PHP can optionally read it
        src_cfg = source_album / '_config.json'
        if src_cfg.is_file():
            shutil.copy2(src_cfg, output_album / '_config.json')

        summaries.append(album_summary(meta, album_rel, parts))
        new_count = sum(1 for p in parts if p not in existing.values())
        print(f'  Done   : {len(parts)} images ({new_count} new)')

    return summaries


def main() -> None:
    if not SOURCE_DIR.is_dir():
        print(f'Error: /source is not mounted. Check SOURCE_DIR in .env.', file=sys.stderr)
        sys.exit(1)

    output_root = OUTPUT_DIR
    output_root.mkdir(parents=True, exist_ok=True)

    print(f'Source : {SOURCE_DIR}')
    print(f'Output : {output_root}')
    print(f'AI     : {VISION_MODEL} on {DEVICE}')

    summaries = scan_and_process(SOURCE_DIR, output_root)
    write_index(output_root, summaries)

    print(f'\nFinished. {len(summaries)} album(s) processed.')


if __name__ == '__main__':
    main()
