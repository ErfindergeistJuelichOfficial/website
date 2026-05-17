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
    BLUR_MODEL        - comma-separated list of face-detection models applied sequentially
    DEVICE            - AI inference device: cpu|cuda
"""

import hashlib
import json
import os
import sys
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

THUMB_WIDTH  = int(os.getenv('THUMBNAIL_WIDTH', '400'))
NORM_MAX     = int(os.getenv('NORMALIZED_MAX',  '1920'))
QUALITY_T    = int(os.getenv('QUALITY_THUMB',   '80'))
QUALITY_N    = int(os.getenv('QUALITY_NORM',    '85'))
VISION_MODEL     = os.getenv('VISION_MODEL', 'disabled').lower()
BLUR_MODELS      = [m.strip() for m in os.getenv('BLUR_MODEL', 'haar').lower().split(',') if m.strip()]
DEVICE           = os.getenv('DEVICE', 'cpu').lower()
YUNET_MODEL_PATH = Path('/usr/local/share/yunet.onnx')

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}

# ── Vision AI (lazy-loaded) ───────────────────────────────────────────────────

_vision_model    = None
_vision_proc     = None
_blur_instances: dict = {}  # model_name -> (model, proc)


def _install_flash_attn_stub() -> None:
    """Inject a no-op flash_attn stub so Florence-2 can import it.
    With attn_implementation='eager' the stub functions are never called."""
    import importlib.machinery
    import sys
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
        if VISION_MODEL == 'blip-base':
            from transformers import BlipForConditionalGeneration, BlipProcessor
            _vision_proc  = BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-base')
            _vision_model = BlipForConditionalGeneration.from_pretrained(
                'Salesforce/blip-image-captioning-base'
            ).to(DEVICE)

        elif VISION_MODEL == 'florence-2':
            _install_flash_attn_stub()
            from transformers import AutoModelForCausalLM, AutoProcessor
            _vision_proc  = AutoProcessor.from_pretrained('microsoft/Florence-2-base', trust_remote_code=True)
            _vision_model = AutoModelForCausalLM.from_pretrained(
                'microsoft/Florence-2-base', trust_remote_code=True, attn_implementation='eager'
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
            print(f'  ERROR: Unknown VISION_MODEL "{VISION_MODEL}", AI disabled.')
            return

        print(f'  Vision model loaded: {VISION_MODEL}')
    except ImportError as exc:
        print(f'  ERROR: AI dependencies not installed. Rebuild with INSTALL_AI=true. ({exc})')
    except Exception as exc:
        print(f'  ERROR: Failed to load vision model: {exc}')


def load_blur_models() -> None:
    """Load all configured face-detection models (skips haar - no loading needed)."""
    global _blur_instances
    for model_name in BLUR_MODELS:
        if model_name == 'haar' or model_name in _blur_instances:
            continue
        print(f'Loading blur model: {model_name} on {DEVICE} ...')
        try:
            if model_name == 'mediapipe':
                import mediapipe as mp
                _blur_instances[model_name] = (mp.solutions.face_detection, None)

            elif model_name == 'florence-2':
                if VISION_MODEL == 'florence-2' and _vision_model is not None:
                    _blur_instances[model_name] = (_vision_model, _vision_proc)
                    print('  Reusing vision model instance.')
                else:
                    _install_flash_attn_stub()
                    from transformers import AutoModelForCausalLM, AutoProcessor
                    proc  = AutoProcessor.from_pretrained('microsoft/Florence-2-base', trust_remote_code=True)
                    model = AutoModelForCausalLM.from_pretrained(
                        'microsoft/Florence-2-base', trust_remote_code=True, attn_implementation='eager'
                    ).to(DEVICE)
                    _blur_instances[model_name] = (model, proc)

            elif model_name == 'grounding-dino':
                from transformers import AutoModelForZeroShotObjectDetection, AutoProcessor
                proc  = AutoProcessor.from_pretrained('IDEA-Research/grounding-dino-tiny')
                model = AutoModelForZeroShotObjectDetection.from_pretrained(
                    'IDEA-Research/grounding-dino-tiny'
                ).to(DEVICE)
                _blur_instances[model_name] = (model, proc)

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

            elif model_name == 'yunet':
                import cv2
                if not YUNET_MODEL_PATH.is_file():
                    print('  yunet.onnx not found. Rebuild with INSTALL_AI=true.', file=sys.stderr)
                    continue
                model = cv2.FaceDetectorYN.create(
                    str(YUNET_MODEL_PATH), '', (0, 0),
                    score_threshold=0.9, nms_threshold=0.3, top_k=5000,
                )
                _blur_instances[model_name] = (model, None)

            else:
                print(f'  Unknown blur model "{model_name}", skipped.', file=sys.stderr)
                continue

            if model_name in _blur_instances:
                print(f'  Blur model loaded: {model_name}')

        except ImportError:
            print(f'  Blur AI dependencies not installed for {model_name}. Rebuild with INSTALL_AI=true.', file=sys.stderr)
        except Exception as exc:
            print(f'  Failed to load blur model {model_name}: {exc}', file=sys.stderr)


def generate_caption(img: Image.Image) -> Optional[str]:
    """Generate a text caption/tags for an image. Returns None if AI is disabled."""
    if VISION_MODEL == 'disabled':
        return None
    if _vision_model is None:
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
            raw = _vision_proc.batch_decode(out, skip_special_tokens=False)[0]
            parsed = _vision_proc.post_process_generation(
                raw, task='<CAPTION>', image_size=(rgb.width, rgb.height)
            )
            text = parsed.get('<CAPTION>', '').strip()
            return text if text else None

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
        print(f'  ERROR: caption generation failed: {exc}')

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


def _detect_faces_haar(img: Image.Image) -> list[tuple[int, int, int, int]]:
    """Haar cascade detection: frontal (default + alt2) and profile cascades with mirror pass."""
    try:
        import cv2
        import numpy as np

        arr  = np.array(img.convert('RGB'))
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        cv2.equalizeHist(gray, gray)
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
            if 'profile' in fname:
                detected_flip = cascade.detectMultiScale(
                    cv2.flip(gray, 1), scaleFactor=1.05, minNeighbors=3, minSize=(25, 25)
                )
                if hasattr(detected_flip, '__len__') and len(detected_flip) > 0:
                    for face in detected_flip:
                        x, y, w, h = int(face[0]), int(face[1]), int(face[2]), int(face[3])
                        boxes.append((width - x - w, y, w, h))
        return boxes

    except ImportError:
        print('  Warning: opencv not available, face detection skipped.', file=sys.stderr)
        return []
    except Exception as exc:
        print(f'  Warning: haar detection failed: {exc}', file=sys.stderr)
        return []


def _detect_faces_mediapipe(img: Image.Image, model: object, proc: object) -> list[tuple[int, int, int, int]]:
    """MediaPipe BlazeFace (long-range model, model_selection=1)."""
    try:
        import numpy as np

        arr    = np.array(img.convert('RGB'))
        iw, ih = img.width, img.height
        boxes: list = []
        with model.FaceDetection(model_selection=1, min_detection_confidence=0.5) as fd:  # type: ignore[attr-defined]
            results = fd.process(arr)
            if results.detections:
                for det in results.detections:
                    bb = det.location_data.relative_bounding_box
                    boxes.append((
                        max(0, int(bb.xmin * iw)),
                        max(0, int(bb.ymin * ih)),
                        int(bb.width  * iw),
                        int(bb.height * ih),
                    ))
        return boxes

    except Exception as exc:
        print(f'  Warning: mediapipe detection failed: {exc}', file=sys.stderr)
        return []


def _detect_faces_florence(img: Image.Image, model: object, proc: object) -> list[tuple[int, int, int, int]]:
    """Florence-2 open-vocabulary detection with text query 'human face'."""
    try:
        import torch

        rgb    = img.convert('RGB')
        inputs = proc(  # type: ignore[operator]
            text='<OPEN_VOCABULARY_DETECTION>human face',
            images=rgb,
            return_tensors='pt',
        ).to(DEVICE)
        with torch.no_grad():
            out = model.generate(**inputs, max_new_tokens=512)  # type: ignore[operator]
        raw    = proc.batch_decode(out, skip_special_tokens=False)[0]  # type: ignore[attr-defined]
        parsed = proc.post_process_generation(  # type: ignore[attr-defined]
            raw, task='<OPEN_VOCABULARY_DETECTION>', image_size=(img.width, img.height)
        )
        od     = parsed.get('<OPEN_VOCABULARY_DETECTION>', {})
        boxes: list = []
        for bbox in od.get('bboxes', []):
            x1, y1, x2, y2 = (int(v) for v in bbox)
            boxes.append((x1, y1, x2 - x1, y2 - y1))
        return boxes

    except Exception as exc:
        print(f'  Warning: florence-2 detection failed: {exc}', file=sys.stderr)
        return []


def _detect_faces_grounding_dino(img: Image.Image, model: object, proc: object) -> list[tuple[int, int, int, int]]:
    """Grounding DINO zero-shot detection with text query "a face."."""
    try:
        import torch

        rgb    = img.convert('RGB')
        inputs = proc(images=rgb, text='a face.', return_tensors='pt').to(DEVICE)  # type: ignore[operator]
        with torch.no_grad():
            outputs = model(**inputs)  # type: ignore[operator]
        results = proc.post_process_grounded_object_detection(  # type: ignore[attr-defined]
            outputs,
            inputs['input_ids'],
            box_threshold=0.35,
            text_threshold=0.25,
            target_sizes=[(img.height, img.width)],
        )[0]
        boxes: list = []
        for box in results['boxes']:
            x1, y1, x2, y2 = (int(v) for v in box.tolist())
            boxes.append((x1, y1, x2 - x1, y2 - y1))
        return boxes

    except Exception as exc:
        print(f'  Warning: grounding-dino detection failed: {exc}', file=sys.stderr)
        return []


def _detect_faces_owlvit(img: Image.Image, model: object, proc: object) -> list[tuple[int, int, int, int]]:
    """OWL-ViT zero-shot detection with text queries "a photo of a face"."""
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


def _detect_faces_mtcnn(img: Image.Image, model: object, proc: object) -> list[tuple[int, int, int, int]]:
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


def _detect_faces_yunet(img: Image.Image, model: object, proc: object) -> list[tuple[int, int, int, int]]:
    """YuNet OpenCV DNN face detector. Output columns: x, y, w, h, ...landmarks..., score."""
    try:
        import numpy as np

        arr    = np.array(img.convert('RGB'))
        h, w   = arr.shape[:2]
        model.setInputSize((w, h))  # type: ignore[attr-defined]
        _, faces = model.detect(arr)  # type: ignore[attr-defined]
        if faces is None:
            return []
        boxes: list = []
        for face in faces:
            x, y, fw, fh = int(face[0]), int(face[1]), int(face[2]), int(face[3])
            score = float(face[14])
            if score < 0.9:
                continue
            boxes.append((max(0, x), max(0, y), fw, fh))
        return boxes
    except Exception as exc:
        print(f'  Warning: yunet detection failed: {exc}', file=sys.stderr)
        return []


def _detect_faces_with(model_name: str, img: Image.Image) -> list[tuple[int, int, int, int]]:
    """Dispatch face detection for a single model. Returns [(x, y, w, h), ...]."""
    if model_name == 'haar':
        return _detect_faces_haar(img)
    instance = _blur_instances.get(model_name)
    if instance is None:
        return []
    model, proc = instance
    if model_name == 'mediapipe':
        return _detect_faces_mediapipe(img, model, proc)
    if model_name == 'florence-2':
        return _detect_faces_florence(img, model, proc)
    if model_name == 'grounding-dino':
        return _detect_faces_grounding_dino(img, model, proc)
    if model_name == 'owlvit':
        return _detect_faces_owlvit(img, model, proc)
    if model_name == 'mtcnn':
        return _detect_faces_mtcnn(img, model, proc)
    if model_name == 'yunet':
        return _detect_faces_yunet(img, model, proc)
    return []


def blur_faces(img: Image.Image) -> Image.Image:
    """Apply each configured blur model sequentially; each pass blurs the already-blurred image."""
    try:
        result = img.copy()
        for model_name in BLUR_MODELS:
            boxes = _detect_faces_with(model_name, result)
            if not boxes:
                continue
            for (x, y, w, h) in boxes:
                region = result.crop((x, y, x + w, y + h))
                radius = max(20, w // 4)
                result.paste(region.filter(ImageFilter.GaussianBlur(radius=radius)), (x, y))
        return result
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
    Process all images in source_album.
    Skips images that are already in existing_by_hash with output files present
    and whose blur state matches the current config.
    Returns a list of ImageObject dicts for _meta.json hasPart.
    """
    needs_blur  = not bool(config.get('consent_collected', False))
    always_blur = set(config.get('blur',    []))  # force blur regardless of consent_collected
    never_blur  = set(config.get('no_blur', []))  # skip blur regardless of consent_collected

    if VISION_MODEL != 'disabled':
        load_vision_model()
    might_blur = needs_blur or bool(always_blur)
    if might_blur and any(m != 'haar' for m in BLUR_MODELS):
        load_blur_models()

    image_files = sorted(
        p for p in source_album.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS
    )

    parts = []
    for src in image_files:
        hash8 = sha256_short(src)

        # Per-image blur decision: overrides from blur/no_blur take precedence
        img_needs_blur = needs_blur
        if src.name in always_blur:
            img_needs_blur = True
        if src.name in never_blur:
            img_needs_blur = False

        # Incremental: reuse existing output if files are still present and blur state matches
        if hash8 in existing_by_hash:
            ep = existing_by_hash[hash8]
            norm_ok  = (output_album / ep.get('name', '')).is_file()
            thumb_ok = (output_album / ep.get('thumbnail', '')).is_file() if ep.get('thumbnail') else True
            stored_blur   = ep.get('blurred')
            blur_mismatch = stored_blur is not None and stored_blur != img_needs_blur
            if norm_ok and thumb_ok and not blur_mismatch:
                # Caption: skip if already present, generate and persist immediately otherwise
                if VISION_MODEL != 'disabled' and ep.get('caption') is None:
                    try:
                        norm_img = Image.open(output_album / ep['name'])
                        caption  = generate_caption(norm_img)
                        if caption:
                            ep = dict(ep)
                            ep['caption'] = caption
                            print(f'  Caption ({ep["name"]}): {caption}')
                            if log is not None:
                                log.append(f'CAPTION        {album_rel}/{src.name}')
                            parts.append(ep)
                            write_album_meta(output_album, album_rel, config, parts)
                            if on_progress:
                                on_progress(parts)
                            continue
                        print(f'  Caption ({ep["name"]}): (none generated, will retry)', file=sys.stderr)
                    except Exception as exc:
                        print(f'  Warning: caption failed for {ep.get("name")}: {exc}', file=sys.stderr)
                parts.append(ep)
                continue
            if blur_mismatch:
                action = 'blurring' if img_needs_blur else 'unblurring'
                print(f'  {src.name} (consent changed, {action})')
                if log is not None:
                    log.append(f'IMAGE_REPROCESS {album_rel}/{src.name}  consent changed: {action}')
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
        base       = f'{dt_short}_{hash8}'
        thumb_name = f'{base}_t.webp'
        norm_name  = f'{base}_n.webp'

        norm_img = make_normalized(img, NORM_MAX)

        # Blur the normalized image first, then derive thumbnail from it
        if img_needs_blur:
            print('    blurring faces ...')
            norm_img = blur_faces(norm_img)

        thumb_img = make_thumbnail(norm_img, THUMB_WIDTH)

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
            'blurred':     img_needs_blur,
        }
        if caption:
            part['caption'] = caption
            if log is not None:
                log.append(f'CAPTION        {album_rel}/{src.name}')
        parts.append(part)
        # Always write after each new image: persists blurred state and any caption
        write_album_meta(output_album, album_rel, config, parts)
        if on_progress:
            on_progress(parts)

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
    if config.get('date'):
        meta['dateCreated'] = config['date']
    if config.get('description'):
        meta['description'] = config['description']
    if config.get('tags'):
        meta['keywords'] = config['tags']
    if config.get('wiki-url'):
        meta['wiki-url'] = config['wiki-url']
    if config.get('raw-url'):
        meta['raw-url'] = config['raw-url']

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
    if meta.get('dateCreated'):
        summary['dateCreated'] = meta['dateCreated']
    if meta.get('description'):
        summary['description'] = meta['description']
    if meta.get('keywords'):
        summary['keywords'] = meta['keywords']
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
            return part['thumbnail']
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
        print(f'  Date   : {config.get("date") or "-"}')
        print(f'  Privacy: {consent_label}')

        existing = load_existing_by_hash(output_album)
        if not (output_album / '_meta.json').is_file() and log is not None:
            log.append(f'ALBUM_NEW      {album_rel}')

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
        meta  = write_album_meta(output_album, album_rel, config, parts)

        preview_thumb = resolve_preview_thumbnail(config, source_album, parts)
        known_summaries[album_rel] = album_summary(meta, album_rel, parts, preview_thumb)
        write_index(output_root, list(known_summaries.values()))
        new_count = sum(1 for p in parts if p not in existing.values())
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


def main() -> None:
    if not SOURCE_DIR.is_dir():
        print(f'Error: /source is not mounted. Check SOURCE_DIR in .env.', file=sys.stderr)
        sys.exit(1)

    output_root = OUTPUT_DIR
    output_root.mkdir(parents=True, exist_ok=True)

    print(f'Source : {SOURCE_DIR}')
    print(f'Output : {output_root}')
    print(f'AI     : {VISION_MODEL} on {DEVICE}')
    print(f'Blur   : {", ".join(BLUR_MODELS)}')

    run_log: list[str] = []
    summaries = scan_and_process(SOURCE_DIR, output_root, log=run_log)

    print('\nReconciling output ...')
    reconcile_output(output_root, log=run_log)

    if run_log:
        LOG_DIR.mkdir(exist_ok=True)
        ts       = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_path = LOG_DIR / f'{ts}_process.txt'
        with open(log_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(run_log) + '\n')
        print(f'\nChange log: {log_path.name} ({len(run_log)} entr(ies))')

    print(f'\nFinished. {len(summaries)} known album(s).')


if __name__ == '__main__':
    main()
