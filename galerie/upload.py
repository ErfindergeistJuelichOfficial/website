#!/usr/bin/env python3
"""
FTPS sync for share/galerie/ - upload to or download from the server.

Files are compared by size; JSON files are always transferred because
upload.py rewrites localhost <-> production URLs on the fly.

Usage (via Podman Compose from the galerie/ folder):
    podman compose run --rm download   # fetch current server state first
    podman compose run --rm upload     # push local changes to server

Or directly:
    python upload.py download
    python upload.py upload
"""

import argparse
import ftplib
import io
import os
import sys
from pathlib import Path
from typing import Optional

OUTPUT_DIR     = Path('/output')
FTP_HOST       = os.getenv('FTP_HOST', 'erfindergeist.org')
FTP_USER       = os.environ['FTP_USER']
FTP_PASS       = os.environ['FTP_PASS']
FTP_REMOTE     = os.getenv('FTP_REMOTE_DIR', '/galerie').rstrip('/')
LOCAL_BASE_URL = 'http://localhost:8080/galerie'
PROD_BASE_URL  = 'https://share.erfindergeist.org/galerie'


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


def remote_file_size(ftp: ftplib.FTP, remote_path: str) -> Optional[int]:
    try:
        return ftp.size(remote_path)
    except ftplib.all_errors:
        return None


def ensure_remote_dirs(ftp: ftplib.FTP, remote_path: str) -> None:
    """Create missing parent directories on the server."""
    parts = remote_path.lstrip('/').split('/')
    current = ''
    for part in parts[:-1]:
        current += '/' + part
        try:
            ftp.cwd(current)
        except ftplib.error_perm:
            try:
                ftp.mkd(current)
            except ftplib.error_perm:
                pass  # already exists (race condition)


def rewrite_for_upload(local_path: Path) -> bytes:
    """Return JSON content with localhost URLs replaced by production URLs."""
    content = local_path.read_text(encoding='utf-8')
    return content.replace(LOCAL_BASE_URL, PROD_BASE_URL).encode('utf-8')


def rewrite_for_download(data: bytes) -> bytes:
    """Return JSON content with production URLs replaced by localhost URLs."""
    return data.replace(PROD_BASE_URL.encode('utf-8'), LOCAL_BASE_URL.encode('utf-8'))


def list_remote_recursive(ftp: ftplib.FTP, remote_dir: str) -> list[tuple[str, int]]:
    """Return (remote_path, size) for every file under remote_dir via MLSD."""
    results: list[tuple[str, int]] = []

    def _walk(directory: str) -> None:
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


# ── Upload ────────────────────────────────────────────────────────────────────

def upload_main() -> None:
    if not OUTPUT_DIR.is_dir():
        print('Error: /output is not mounted. Check compose.yml volume mapping.', file=sys.stderr)
        sys.exit(1)

    ftp = connect()
    uploaded = skipped = errors = 0

    local_files = sorted(p for p in OUTPUT_DIR.rglob('*') if p.is_file())
    print(f'Found {len(local_files)} local file(s) to check.')

    for local_path in local_files:
        rel         = local_path.relative_to(OUTPUT_DIR)
        remote_path = FTP_REMOTE + '/' + str(rel).replace('\\', '/')

        if local_path.suffix == '.json':
            data       = rewrite_for_upload(local_path)
            local_size = len(data)
        else:
            data       = None
            local_size = local_path.stat().st_size

        if remote_file_size(ftp, remote_path) == local_size:
            skipped += 1
            continue

        print(f'  -> {rel}')
        try:
            ensure_remote_dirs(ftp, remote_path)
            payload = data if data is not None else local_path.read_bytes()
            ftp.storbinary(f'STOR {remote_path}', io.BytesIO(payload))
            uploaded += 1
        except ftplib.all_errors as exc:
            print(f'     Error: {exc}', file=sys.stderr)
            errors += 1

    try:
        ftp.quit()
    except ftplib.all_errors:
        pass

    print(f'\nDone. Uploaded: {uploaded}  Skipped: {skipped}  Errors: {errors}')
    if errors:
        sys.exit(1)


# ── Download ──────────────────────────────────────────────────────────────────

def download_main() -> None:
    if not OUTPUT_DIR.is_dir():
        print('Error: /output is not mounted. Check compose.yml volume mapping.', file=sys.stderr)
        sys.exit(1)

    ftp = connect()
    downloaded = skipped = errors = 0

    print(f'Listing {FTP_REMOTE} ...')
    remote_files = list_remote_recursive(ftp, FTP_REMOTE)
    print(f'Found {len(remote_files)} remote file(s).')

    for remote_path, remote_size in remote_files:
        rel        = remote_path[len(FTP_REMOTE):].lstrip('/')
        local_path = OUTPUT_DIR / rel
        is_json    = local_path.suffix == '.json'

        # Binary files: skip if local exists with same size
        if not is_json and local_path.is_file() and local_path.stat().st_size == remote_size:
            skipped += 1
            continue

        # JSON files: always download - prod/localhost URL rewrite changes size
        print(f'  <- {rel}')
        try:
            buf = io.BytesIO()
            ftp.retrbinary(f'RETR {remote_path}', buf.write)
            data = buf.getvalue()
            if is_json:
                data = rewrite_for_download(data)
            local_path.parent.mkdir(parents=True, exist_ok=True)
            local_path.write_bytes(data)
            downloaded += 1
        except ftplib.all_errors as exc:
            print(f'     Error: {exc}', file=sys.stderr)
            errors += 1

    try:
        ftp.quit()
    except ftplib.all_errors:
        pass

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
