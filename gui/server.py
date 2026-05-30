"""
GUI config editor - local HTTP server.
Serves index.html + Monaco /vs/* + REST API for share/config/ and galerie albums.
"""
import http.server
import json
import os
import mimetypes
import datetime
import tempfile
from pathlib import Path
from urllib.parse import urlparse, parse_qs

CONFIG_DIR    = Path('/config')
ALBUMS_DIR    = Path('/albums')
DOWNLOADS_DIR = Path('/downloads')

ALLOWED_CONFIG = {'chronicle', 'links', 'tags'}
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.tif', '.tiff', '.bmp'}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def _read_json(path: Path) -> object:
    with open(path, encoding='utf-8-sig') as f:
        return json.load(f)


def _write_json(path: Path, obj: object) -> None:
    with tempfile.NamedTemporaryFile(
        'w', dir=path.parent, delete=False, suffix='.tmp', encoding='utf-8'
    ) as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        tmp = f.name
    os.replace(tmp, str(path))


def _append_log(log_path: Path, entry: dict) -> None:
    with open(log_path, 'a', encoding='utf-8') as f:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')


def _read_log_tail(log_path: Path, n: int = 100) -> list:
    if not log_path.is_file():
        return []
    with open(log_path, encoding='utf-8') as f:
        lines = f.readlines()
    result = []
    for line in reversed(lines[-n:]):
        line = line.strip()
        if line:
            try:
                result.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return result


def _albums_available() -> bool:
    return ALBUMS_DIR.is_dir() and not str(ALBUMS_DIR) == '/dev/null'


def _validate_image_path(rel: str, filename: str) -> Path | None:
    """Return image path if safe and is an image file, else None."""
    if not rel or '..' in rel or rel.startswith('/'):
        return None
    if not filename or '..' in filename or '/' in filename or '\\' in filename:
        return None
    img = ALBUMS_DIR / rel / filename
    if not img.is_file() or img.suffix.lower() not in IMAGE_EXTENSIONS:
        return None
    return img


def _validate_album_path(rel: str) -> Path | None:
    """Return _config.json path if safe, else None."""
    if not rel or '..' in rel or rel.startswith('/'):
        return None
    cfg = ALBUMS_DIR / rel / '_config.json'
    return cfg if cfg.is_file() else None


def _downloads_available() -> bool:
    return DOWNLOADS_DIR.is_dir() and str(DOWNLOADS_DIR) != '/dev/null'


def _validate_download_path(rel: str) -> Path | None:
    """Return download folder path if safe and existing, else None."""
    if not rel or '..' in rel or rel.startswith('/'):
        return None
    folder = DOWNLOADS_DIR / rel
    return folder if folder.is_dir() else None


# ---------------------------------------------------------------------------
# Chronicle log helpers
# ---------------------------------------------------------------------------

def _index_by_id(items: list) -> dict:
    return {e.get('@id'): e for e in items if e.get('@id')}


def _write_chronicle_log(old_obj: object, new_obj: object) -> None:
    log_path = CONFIG_DIR / 'chronicle.log'
    ts = _now_iso()
    old_items = _index_by_id(old_obj.get('itemListElement', []) if isinstance(old_obj, dict) else [])
    new_items = _index_by_id(new_obj.get('itemListElement', []) if isinstance(new_obj, dict) else [])
    all_ids = set(old_items) | set(new_items)
    for uid in all_ids:
        before = old_items.get(uid)
        after  = new_items.get(uid)
        if before == after:
            continue
        if before is None:
            action = 'create'
        elif after is None:
            action = 'delete'
        else:
            action = 'edit'
        _append_log(log_path, {'ts': ts, 'action': action, 'id': uid,
                                'before': before, 'after': after})


def _write_simple_log(name: str, old_obj: object, new_obj: object) -> None:
    log_path = CONFIG_DIR / f'{name}.log'
    _append_log(log_path, {'ts': _now_iso(), 'action': 'edit',
                            'before': old_obj, 'after': new_obj})


# ---------------------------------------------------------------------------
# Request handler
# ---------------------------------------------------------------------------

class Handler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):  # suppress default access log noise
        pass

    def _send(self, code: int, body: bytes, content_type: str = 'application/json') -> None:
        self.send_response(code)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json(self, code: int, obj: object) -> None:
        self._send(code, json.dumps(obj, ensure_ascii=False).encode())

    def _error(self, code: int, msg: str) -> None:
        self._json(code, {'error': msg})

    def _read_body(self) -> bytes:
        length = int(self.headers.get('Content-Length', 0))
        return self.rfile.read(length)

    # --- Static files -------------------------------------------------------

    def _serve_file(self, path: Path) -> None:
        if not path.is_file():
            self._error(404, 'Not found')
            return
        mime, _ = mimetypes.guess_type(str(path))
        data = path.read_bytes()
        self._send(200, data, mime or 'application/octet-stream')

    # --- Routing ------------------------------------------------------------

    def do_GET(self):
        parsed = urlparse(self.path)
        p = parsed.path
        qs = parse_qs(parsed.query)

        if p == '/':
            self._serve_file(Path('/app/index.html'))
        elif p in ('/style.css', '/app.js'):
            self._serve_file(Path('/app') / p[1:])
        elif p == '/api/all':
            self._api_all()
        elif p == '/api/log/chronicle':
            self._api_log('chronicle')
        elif p == '/api/log/links':
            self._api_log('links')
        elif p == '/api/log/tags':
            self._api_log('tags')
        elif p == '/api/albums':
            self._api_albums()
        elif p == '/api/album/dirs':
            self._api_album_dirs()
        elif p == '/api/album/images':
            self._api_album_images(qs)
        elif p == '/api/album/image':
            self._api_album_image(qs)
        elif p == '/api/album':
            self._api_album_get(qs)
        elif p == '/api/downloads':
            self._api_downloads()
        elif p == '/api/download-entries':
            self._api_download_entries()
        elif p == '/api/download-meta':
            self._api_download_meta_get(qs)
        elif p == '/api/download-files':
            self._api_download_files(qs)
        else:
            self._error(404, 'Not found')

    def do_POST(self):
        parsed = urlparse(self.path)
        p = parsed.path
        qs = parse_qs(parsed.query)

        if p == '/api/save/chronicle':
            self._api_save('chronicle')
        elif p == '/api/save/links':
            self._api_save('links')
        elif p == '/api/save/tags':
            self._api_save('tags')
        elif p == '/api/undo':
            self._api_undo()
        elif p == '/api/album':
            self._api_album_post(qs)
        elif p == '/api/album/delete':
            self._api_album_delete(qs)
        elif p == '/api/download-meta':
            self._api_download_meta_post(qs)
        else:
            self._error(404, 'Not found')

    # --- API handlers -------------------------------------------------------

    def _api_all(self) -> None:
        result = {}
        for name in ('chronicle', 'links', 'tags'):
            path = CONFIG_DIR / f'{name}.json'
            result[name] = _read_json(path) if path.is_file() else {}
        self._json(200, result)

    def _api_log(self, name: str) -> None:
        if name not in ALLOWED_CONFIG:
            self._error(400, 'Unknown file')
            return
        entries = _read_log_tail(CONFIG_DIR / f'{name}.log')
        self._json(200, entries)

    def _api_save(self, name: str) -> None:
        if name not in ALLOWED_CONFIG:
            self._error(400, 'Unknown file')
            return
        body = self._read_body()
        try:
            new_obj = json.loads(body)
        except json.JSONDecodeError as exc:
            self._error(400, f'Invalid JSON: {exc}')
            return
        path = CONFIG_DIR / f'{name}.json'
        old_obj = _read_json(path) if path.is_file() else {}
        if name == 'chronicle':
            _write_chronicle_log(old_obj, new_obj)
        else:
            _write_simple_log(name, old_obj, new_obj)
        _write_json(path, new_obj)
        self._json(200, {'ok': True})

    def _api_undo(self) -> None:
        body = self._read_body()
        try:
            req = json.loads(body)
        except json.JSONDecodeError as exc:
            self._error(400, f'Invalid JSON: {exc}')
            return
        file_name = req.get('file')
        if file_name not in ALLOWED_CONFIG:
            self._error(400, 'Unknown file')
            return
        before = req.get('before')
        uid    = req.get('id')
        path   = CONFIG_DIR / f'{file_name}.json'
        current = _read_json(path) if path.is_file() else {}

        if file_name == 'chronicle':
            items = current.get('itemListElement', [])
            if before is None:
                # undo create: remove entry
                items = [e for e in items if e.get('@id') != uid]
            else:
                idx = next((i for i, e in enumerate(items) if e.get('@id') == uid), None)
                if idx is not None:
                    items[idx] = before
                else:
                    items.insert(0, before)
            current['itemListElement'] = items
            _append_log(CONFIG_DIR / 'chronicle.log',
                        {'ts': _now_iso(), 'action': 'undo', 'id': uid,
                         'before': req.get('after'), 'after': before})
        else:
            _write_simple_log(file_name, current, before)
            current = before

        _write_json(path, current)
        self._json(200, {'ok': True, 'data': current})

    def _api_album_dirs(self) -> None:
        if not _albums_available():
            self._json(200, [])
            return
        existing: set[str] = set()
        for cfg_path in ALBUMS_DIR.rglob('_config.json'):
            rel = str(cfg_path.parent.relative_to(ALBUMS_DIR)).replace('\\', '/')
            existing.add(rel)
        dirs = []
        for d in sorted(ALBUMS_DIR.rglob('*')):
            if not d.is_dir():
                continue
            rel = str(d.relative_to(ALBUMS_DIR)).replace('\\', '/')
            if rel and rel != '.' and rel not in existing:
                dirs.append(rel)
        self._json(200, dirs)

    def _api_albums(self) -> None:
        if not _albums_available():
            self._json(200, [])
            return
        albums = []
        for cfg_path in sorted(ALBUMS_DIR.rglob('_config.json')):
            rel = str(cfg_path.parent.relative_to(ALBUMS_DIR)).replace('\\', '/')
            try:
                cfg = _read_json(cfg_path)
                albums.append({
                    'path': rel,
                    'title': cfg.get('title', rel),
                    'description': cfg.get('description', ''),
                    'chronicle_id': cfg.get('chronicle_id', ''),
                    'consent_collected': bool(cfg.get('consent_collected', False)),
                })
            except (json.JSONDecodeError, OSError):
                albums.append({'path': rel, 'title': rel, 'description': '', 'chronicle_id': '', 'consent_collected': False})
        self._json(200, albums)

    def _api_album_images(self, qs: dict) -> None:
        rel = (qs.get('path') or [''])[0]
        if not rel or '..' in rel or rel.startswith('/'):
            self._error(400, 'Invalid path')
            return
        album_dir = ALBUMS_DIR / rel
        if not album_dir.is_dir():
            self._error(404, 'Album not found')
            return
        files = sorted(
            f.name for f in album_dir.iterdir()
            if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
        )
        self._json(200, files)

    def _api_album_image(self, qs: dict) -> None:
        rel      = (qs.get('path') or [''])[0]
        filename = (qs.get('file') or [''])[0]
        img_path = _validate_image_path(rel, filename)
        if img_path is None:
            self._error(404, 'Image not found')
            return
        self._serve_file(img_path)

    def _api_album_get(self, qs: dict) -> None:
        rel = (qs.get('path') or [''])[0]
        cfg_path = _validate_album_path(rel)
        if cfg_path is None:
            self._error(404, f'Album not found: {rel!r}')
            return
        try:
            self._json(200, _read_json(cfg_path))
        except (json.JSONDecodeError, OSError) as exc:
            self._error(500, f'Cannot read config: {exc}')

    def _api_downloads(self) -> None:
        if not _downloads_available():
            self._json(200, [])
            return
        folders = []
        for entry in sorted(DOWNLOADS_DIR.rglob('*')):
            if entry.is_dir():
                rel = str(entry.relative_to(DOWNLOADS_DIR)).replace('\\', '/')
                folders.append({'path': rel, 'hasMeta': (entry / '_meta.json').is_file()})
        self._json(200, folders)

    def _api_download_entries(self) -> None:
        """Flat list of all entries from _meta.json hasPart across all folders.
        Files without a hasPart entry are appended afterwards (no metadata)."""
        if not _downloads_available():
            self._json(200, [])
            return
        entries = []
        for folder_path in sorted(DOWNLOADS_DIR.rglob('*')):
            if not folder_path.is_dir():
                continue
            rel_folder = str(folder_path.relative_to(DOWNLOADS_DIR)).replace('\\', '/')
            meta_parts: dict = {}
            meta_path = folder_path / '_meta.json'
            if meta_path.is_file():
                try:
                    meta = _read_json(meta_path)
                    for part in (meta.get('hasPart') or []):
                        title = part.get('title', '')
                        if title:
                            meta_parts[title] = part
                            entries.append({
                                'name': title,
                                'folder': rel_folder,
                                'description': part.get('description', ''),
                                'link_ids': part.get('link_ids') or [],
                                'tags': part.get('tags') or [],
                            })
                except (json.JSONDecodeError, OSError):
                    pass
        self._json(200, entries)

    def _api_download_meta_get(self, qs: dict) -> None:
        rel = (qs.get('path') or [''])[0]
        folder = _validate_download_path(rel)
        if folder is None:
            self._error(404, f'Download folder not found: {rel!r}')
            return
        meta_path = folder / '_meta.json'
        if meta_path.is_file():
            try:
                self._json(200, _read_json(meta_path))
            except (json.JSONDecodeError, OSError) as exc:
                self._error(500, f'Cannot read _meta.json: {exc}')
        else:
            self._json(200, {
                '@context': 'https://schema.org',
                '@type': 'DataCatalog',
                '@id': f'https://share.erfindergeist.org/downloads/{rel}',
                'name': rel.split('/')[-1],
                'description': '',
                'hasPart': [],
            })

    def _api_download_meta_post(self, qs: dict) -> None:
        rel = (qs.get('path') or [''])[0]
        if not rel or '..' in rel or rel.startswith('/'):
            self._error(400, 'Invalid path')
            return
        folder = DOWNLOADS_DIR / rel
        if not folder.is_dir():
            self._error(404, f'Download folder not found: {rel!r}')
            return
        body = self._read_body()
        try:
            new_meta = json.loads(body)
        except json.JSONDecodeError as exc:
            self._error(400, f'Invalid JSON: {exc}')
            return
        meta_path = folder / '_meta.json'
        old_meta = _read_json(meta_path) if meta_path.is_file() else {}
        _write_simple_log('downloads', old_meta, new_meta)
        _write_json(meta_path, new_meta)
        self._json(200, {'ok': True})

    def _api_download_files(self, qs: dict) -> None:
        rel = (qs.get('path') or [''])[0]
        folder = _validate_download_path(rel)
        if folder is None:
            self._error(404, f'Download folder not found: {rel!r}')
            return
        files = sorted(
            f.name for f in folder.iterdir()
            if f.is_file() and not f.name.startswith('_') and not f.name.startswith('.')
        )
        self._json(200, files)

    def _api_album_post(self, qs: dict) -> None:
        rel = (qs.get('path') or [''])[0]
        if not rel or '..' in rel or rel.startswith('/'):
            self._error(400, 'Invalid path')
            return
        album_dir = ALBUMS_DIR / rel
        body = self._read_body()
        try:
            new_cfg = json.loads(body)
        except json.JSONDecodeError as exc:
            self._error(400, f'Invalid JSON: {exc}')
            return
        cfg_path = album_dir / '_config.json'
        old_cfg = _read_json(cfg_path) if cfg_path.is_file() else {}
        _append_log(ALBUMS_DIR / 'album.log',
                    {'ts': _now_iso(), 'action': 'edit', 'path': rel,
                     'before': old_cfg, 'after': new_cfg})
        _write_json(cfg_path, new_cfg)
        self._json(200, {'ok': True})

    def _api_album_delete(self, qs: dict) -> None:
        rel = (qs.get('path') or [''])[0]
        if not rel or '..' in rel or rel.startswith('/'):
            self._error(400, 'Invalid path')
            return
        cfg_path = ALBUMS_DIR / rel / '_config.json'
        if not cfg_path.is_file():
            self._error(404, 'Config not found')
            return
        old_cfg = _read_json(cfg_path)
        _append_log(ALBUMS_DIR / 'album.log',
                    {'ts': _now_iso(), 'action': 'delete', 'path': rel, 'before': old_cfg})
        cfg_path.unlink()
        self._json(200, {'ok': True})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8082))
    server = http.server.HTTPServer(('0.0.0.0', port), Handler)
    print(f'GUI server running on http://localhost:{port}')
    server.serve_forever()
