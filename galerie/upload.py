#!/usr/bin/env python3
"""
FTP uploader for share/galerie/.

Incrementally uploads /output (share/galerie/) to the FTP server.
Files that already exist on the server with the same size are skipped.
Uses FTPS (FTP over TLS) for secure transfer.

Usage (via Podman Compose from the galerie/ folder):
    podman compose run --rm upload

Environment variables (from .env):
    FTP_HOST       - FTP server hostname (erfindergeist.org)
    FTP_USER       - FTP username
    FTP_PASS       - FTP password
    FTP_REMOTE_DIR - Remote target directory (default: /galerie)
"""

import ftplib
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


def remote_file_size(ftp: ftplib.FTP, remote_path: str) -> Optional[int]:
    """Return the size of a remote file in bytes, or None if it does not exist."""
    try:
        return ftp.size(remote_path)
    except ftplib.all_errors:
        return None


def ensure_remote_dirs(ftp: ftplib.FTP, remote_path: str) -> None:
    """Create all parent directories of remote_path if they do not exist."""
    parts = remote_path.lstrip('/').split('/')
    current = ''
    for part in parts[:-1]:  # exclude the filename
        current += '/' + part
        try:
            ftp.cwd(current)
        except ftplib.error_perm:
            try:
                ftp.mkd(current)
            except ftplib.error_perm:
                pass  # already exists (race condition)


def rewrite_json(local_path: Path) -> bytes:
    """Return JSON file content with localhost URLs rewritten to production."""
    content = local_path.read_text(encoding='utf-8')
    return content.replace(LOCAL_BASE_URL, PROD_BASE_URL).encode('utf-8')


def upload_file(ftp: ftplib.FTP, local_path: Path, remote_path: str, data: Optional[bytes] = None) -> None:
    """Upload a single file, creating remote parent directories as needed."""
    import io
    ensure_remote_dirs(ftp, remote_path)
    if data is not None:
        ftp.storbinary(f'STOR {remote_path}', io.BytesIO(data))
    else:
        with open(local_path, 'rb') as f:
            ftp.storbinary(f'STOR {remote_path}', f)


def main() -> None:
    if not OUTPUT_DIR.is_dir():
        print(f'Error: /output is not mounted. Check compose.yml volume mapping.', file=sys.stderr)
        sys.exit(1)

    print(f'Connecting to {FTP_HOST} (FTPS) ...')
    try:
        ftp = ftplib.FTP_TLS(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.prot_p()  # encrypt data channel
    except ftplib.all_errors as exc:
        print(f'FTP connection failed: {exc}', file=sys.stderr)
        sys.exit(1)

    # Enable binary mode and get server to accept SIZE command
    ftp.sendcmd('TYPE I')

    uploaded = 0
    skipped  = 0
    errors   = 0

    local_files = sorted(p for p in OUTPUT_DIR.rglob('*') if p.is_file())
    total = len(local_files)
    print(f'Found {total} local file(s) to check.')

    for local_file in local_files:
        rel = local_file.relative_to(OUTPUT_DIR)
        remote_path = FTP_REMOTE + '/' + str(rel).replace('\\', '/')

        json_data: Optional[bytes] = None
        if local_file.suffix == '.json':
            json_data  = rewrite_json(local_file)
            local_size = len(json_data)
        else:
            local_size = local_file.stat().st_size

        remote_size = remote_file_size(ftp, remote_path)

        if remote_size == local_size:
            skipped += 1
            continue

        print(f'  -> {rel}')
        try:
            upload_file(ftp, local_file, remote_path, json_data)
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


if __name__ == '__main__':
    main()
