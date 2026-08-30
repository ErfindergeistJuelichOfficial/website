#!/usr/bin/env python3
"""
FTPS sync for share/galerie/ - upload to or download from the server.

A local _ftp_sync.json tracks the last known remote state so upload can skip
unchanged files without querying the server per file (avoids one SIZE request
per file over 6000+ files).

Sync file format: { "relative/path": sync_key }
  - binary files: file size in bytes (int)
  - JSON files:   [size_after_url_rewriting, mtime] - mtime catches edits that
                  produce the same byte count

Usage (via Podman Compose from the gui/ folder):
    podman compose run --rm download   # fetch current server state first
    podman compose run --rm upload     # push local changes to server
"""

import argparse
import ftplib
import io
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

OUTPUT_DIR     = Path('/output')
SYNC_FILE      = OUTPUT_DIR / '_ftp_sync.json'
LOG_DIR        = OUTPUT_DIR / 'log'
FTP_HOST       = os.getenv('FTP_HOST', 'erfindergeist.org')
FTP_USER       = os.environ['FTP_USER']
FTP_PASS       = os.environ['FTP_PASS']
FTP_REMOTE     = os.getenv('FTP_REMOTE_DIR', '/galerie').rstrip('/')
LOCAL_BASE_URL = 'http://localhost:8080/galerie'
PROD_BASE_URL  = 'https://share.erfindergeist.org/galerie'


# ── Log file ──────────────────────────────────────────────────────────────────

def open_log(mode: str):
    LOG_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    return open(LOG_DIR / f'{ts}_{mode}.txt', 'w', encoding='utf-8')


# ── Sync file ─────────────────────────────────────────────────────────────────

def load_sync() -> dict:
    if SYNC_FILE.is_file():
        try:
            with open(SYNC_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
    return {}


def save_sync(sync: dict) -> None:
    with open(SYNC_FILE, 'w', encoding='utf-8') as f:
        json.dump(sync, f, ensure_ascii=False, sort_keys=True)


# ── FTP helpers ───────────────────────────────────────────────────────────────

def connect() -> ftplib.FTP_TLS:
    print(f'Connecting to {FTP_HOST} (FTPS) ...')
    try:
        ftp = ftplib.FTP_TLS(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.prot_p()
        ftp.sendcmd('TYPE I')
        return ftp
    except ftplib.all_errors as exc:
        print(f'FTP connection failed: {exc}', file=sys.stderr)
        sys.exit(1)


BLOCKSIZE = 128 * 1024  # larger than ftplib's 8 KB default, fewer syscalls


def ensure_remote_dirs(ftp: ftplib.FTP, remote_path: str, verified: set) -> None:
    """Create missing parent directories on the server.
    `verified` caches already-checked dirs - without it every upload pays
    one CWD round trip per path segment."""
    parts = remote_path.lstrip('/').split('/')
    current = ''
    for part in parts[:-1]:
        current += '/' + part
        if current in verified:
            continue
        try:
            ftp.cwd(current)
        except ftplib.error_perm:
            try:
                ftp.mkd(current)
            except ftplib.error_perm:
                pass  # already exists (race condition)
        verified.add(current)


def list_remote_recursive(ftp: ftplib.FTP, remote_dir: str) -> list[tuple[str, int]]:
    """Return (remote_path, size) for every file under remote_dir via MLSD."""
    results: list[tuple[str, int]] = []

    def _walk(directory: str) -> None:
        print(f'  Listing {directory} ...')
        try:
            entries = list(ftp.mlsd(directory, facts=['type', 'size']))
        except ftplib.error_perm as exc:
            print(f'  Cannot list {directory}: {exc}', file=sys.stderr)
            return
        for name, facts in entries:
            if name in ('.', '..'):
                continue
            full = f'{directory}/{name}'
            if facts.get('type') == 'dir':
                _walk(full)
            else:
                results.append((full, int(facts.get('size', 0))))

    _walk(remote_dir)
    return results


# ── URL rewriting ─────────────────────────────────────────────────────────────

def rewrite_for_upload(local_path: Path) -> bytes:
    """Return JSON content with localhost URLs replaced by production URLs."""
    content = local_path.read_text(encoding='utf-8')
    return content.replace(LOCAL_BASE_URL, PROD_BASE_URL).encode('utf-8')


def rewrite_for_download(data: bytes) -> bytes:
    """Return JSON content with production URLs replaced by localhost URLs."""
    return data.replace(PROD_BASE_URL.encode('utf-8'), LOCAL_BASE_URL.encode('utf-8'))


# ── Upload ────────────────────────────────────────────────────────────────────

def upload_main() -> None:
    if not OUTPUT_DIR.is_dir():
        print('Error: /output is not mounted. Check compose.yaml volume mapping.', file=sys.stderr)
        sys.exit(1)

    sync = load_sync()
    uploaded = errors = 0

    local_files = sorted(
        p for p in OUTPUT_DIR.rglob('*')
        if p.is_file() and p != SYNC_FILE and 'log/' not in str(p.relative_to(OUTPUT_DIR)).replace('\\', '/')
    )

    # Determine the transfer list locally first, so progress can show [i/N]
    to_upload: list[tuple[Path, str, object, Optional[bytes]]] = []
    skipped = 0
    for local_path in local_files:
        rel = str(local_path.relative_to(OUTPUT_DIR)).replace('\\', '/')
        if local_path.suffix == '.json':
            data      = rewrite_for_upload(local_path)
            sync_key: object = [len(data), local_path.stat().st_mtime]
        else:
            data      = None
            sync_key  = local_path.stat().st_size
        if sync.get(rel) == sync_key:
            skipped += 1
        else:
            to_upload.append((local_path, rel, sync_key, data))

    print(f'Found {len(local_files)} local file(s): {len(to_upload)} to upload, {skipped} unchanged.')
    if not to_upload:
        print('\nDone. Uploaded: 0  Skipped: %d  Errors: 0' % skipped)
        return

    ftp = connect()
    log = open_log('upload')
    verified_dirs: set = set()

    for i, (local_path, rel, sync_key, data) in enumerate(to_upload, 1):
        remote_path = FTP_REMOTE + '/' + rel
        print(f'  -> [{i}/{len(to_upload)}] {rel}')
        try:
            ensure_remote_dirs(ftp, remote_path, verified_dirs)
            payload = data if data is not None else local_path.read_bytes()
            ftp.storbinary(f'STOR {remote_path}', io.BytesIO(payload), blocksize=BLOCKSIZE)
            sync[rel] = sync_key
            log.write(f'UPLOAD   {rel}\n')
            uploaded += 1
        except ftplib.all_errors as exc:
            print(f'     Error: {exc}', file=sys.stderr)
            log.write(f'ERROR    {rel}  {exc}\n')
            errors += 1

    try:
        ftp.quit()
    except ftplib.all_errors:
        pass

    log.close()
    save_sync(sync)
    print(f'\nDone. Uploaded: {uploaded}  Skipped: {skipped}  Errors: {errors}')
    if errors:
        sys.exit(1)


# ── Download ──────────────────────────────────────────────────────────────────

def download_main() -> None:
    if not OUTPUT_DIR.is_dir():
        print('Error: /output is not mounted. Check compose.yaml volume mapping.', file=sys.stderr)
        sys.exit(1)

    sync = load_sync()
    ftp  = connect()
    log  = open_log('download')
    downloaded = errors = 0

    print(f'Listing {FTP_REMOTE} ...')
    remote_files = list_remote_recursive(ftp, FTP_REMOTE)

    # Determine the transfer list first, so progress can show [i/N]
    to_download: list[tuple[str, str, int]] = []
    skipped = 0
    for remote_path, remote_size in remote_files:
        rel = remote_path[len(FTP_REMOTE):].lstrip('/')
        if rel.startswith('log/'):
            continue
        if sync.get(rel) == remote_size:
            skipped += 1
        else:
            to_download.append((remote_path, rel, remote_size))

    print(f'Found {len(remote_files)} remote file(s): {len(to_download)} to download, {skipped} unchanged.')

    for i, (remote_path, rel, remote_size) in enumerate(to_download, 1):
        local_path = OUTPUT_DIR / rel
        print(f'  <- [{i}/{len(to_download)}] {rel}')
        try:
            buf = io.BytesIO()
            ftp.retrbinary(f'RETR {remote_path}', buf.write, blocksize=BLOCKSIZE)
            data = buf.getvalue()
            if local_path.suffix == '.json':
                data = rewrite_for_download(data)
            local_path.parent.mkdir(parents=True, exist_ok=True)
            local_path.write_bytes(data)
            if local_path.suffix == '.json':
                sync[rel] = [remote_size, local_path.stat().st_mtime]
            else:
                sync[rel] = remote_size
            log.write(f'DOWNLOAD {rel}\n')
            downloaded += 1
        except ftplib.all_errors as exc:
            print(f'     Error: {exc}', file=sys.stderr)
            log.write(f'ERROR    {rel}  {exc}\n')
            errors += 1

    try:
        ftp.quit()
    except ftplib.all_errors:
        pass

    log.close()
    save_sync(sync)
    print(f'\nDone. Downloaded: {downloaded}  Skipped: {skipped}  Errors: {errors}')
    if errors:
        sys.exit(1)


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description='FTPS sync for share/galerie/')
    parser.add_argument('mode', choices=['upload', 'download'])
    args = parser.parse_args()
    if args.mode == 'upload':
        upload_main()
    else:
        download_main()


if __name__ == '__main__':
    main()
