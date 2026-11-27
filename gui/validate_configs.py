#!/usr/bin/env python3
"""
Validate the five config files before they are deployed (Python stdlib only).

Errors   = would break share/termine/eg-chronic -> exit 1, deploy-share.yml stops
           before anything is uploaded, the webspace keeps the last good state.
Warnings = dangling references (unknown tag, link or chronicle id) -> reported only.

Usage:
  python3 gui/validate_configs.py <config-dir> [--galerie-files <file> | --galerie-dir <dir>]
  podman compose run --rm validate          (from gui/, uses SOURCE_DIR from gui/.env)

--galerie-files: text file with one relative path per line (output of
`rclone lsf -R --files-only nc:Galerie`, used by deploy-share.yml).
--galerie-dir:   the gallery folder itself (Public/Galerie, used locally).
With either, every image in galerie.json must exist as _n.webp and _t.webp.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Optional

EXPECTED_TYPES = {
    'chronicle.json': 'ItemList',
    'links.json':     'ItemList',
    'tags.json':      'DefinedTermSet',
    'downloads.json': 'DataCatalog',
    'galerie.json':   'DataCatalog',
}
DATE_RE  = re.compile(r'^\d{4}-\d{2}-\d{2}$')
IMAGE_RE = re.compile(r'^\d{8}_\d{6}_[0-9a-f]{8}_n\.webp$')


class Report:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, msg: str) -> None:
        self.errors.append(msg)

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)


def _str_list(value: object) -> bool:
    return isinstance(value, list) and all(isinstance(v, str) for v in value)


def _nonempty_str(value: object) -> bool:
    return isinstance(value, str) and value.strip() != ''


def load_files(config_dir: Path, rep: Report) -> dict:
    """Read all files and check the JSON-LD root (@context, @type, @id)."""
    data = {}
    for name, expected in EXPECTED_TYPES.items():
        path = config_dir / name
        if not path.is_file() or path.stat().st_size == 0:
            rep.error(f'{name}: fehlt oder ist leer')
            continue
        try:
            with open(path, encoding='utf-8-sig') as f:
                doc = json.load(f)
        except (OSError, json.JSONDecodeError) as exc:
            rep.error(f'{name}: kein valides JSON ({exc})')
            continue
        if not isinstance(doc, dict):
            rep.error(f'{name}: Wurzel muss ein Objekt sein')
            continue
        if not doc.get('@context'):
            rep.error(f'{name}: @context fehlt')
        if doc.get('@type') != expected:
            rep.error(f'{name}: @type muss "{expected}" sein, ist {doc.get("@type")!r}')
        if not doc.get('@id'):
            rep.error(f'{name}: @id fehlt')
        data[name] = doc
    return data


def check_tags(doc: dict, rep: Report) -> set:
    keys = set()
    for group in ('location_tags', 'description_tags'):
        tags = doc.get(group)
        if not isinstance(tags, dict):
            rep.error(f'tags.json: {group} muss ein Objekt sein')
            continue
        for key, tag in tags.items():
            if not isinstance(tag, dict) or not _nonempty_str(tag.get('label')):
                rep.error(f'tags.json: {group}.{key} hat kein label')
            keys.add(key)
    return keys


def check_links(doc: dict, rep: Report) -> set:
    ids = set()
    items = doc.get('itemListElement')
    if not isinstance(items, list):
        rep.error('links.json: itemListElement muss eine Liste sein')
        return ids
    for idx, entry in enumerate(items):
        item = entry.get('item') if isinstance(entry, dict) else None
        if not isinstance(item, dict):
            rep.error(f'links.json: itemListElement[{idx}] hat kein item')
            continue
        lid = item.get('@id')
        label = f'links.json: {lid or f"itemListElement[{idx}]"}'
        if not _nonempty_str(lid):
            rep.error(f'{label}: @id fehlt')
        elif lid in ids:
            rep.error(f'{label}: @id doppelt')
        else:
            ids.add(lid)
        if not _nonempty_str(item.get('url')):
            rep.error(f'{label}: url fehlt')
        # Empty title is allowed: buttons fall back to the link type ("Wiki", "Raw")
        if not _nonempty_str(item.get('type')) and not _nonempty_str(item.get('title')):
            rep.error(f'{label}: weder title noch type - Button haette keine Beschriftung')
    return ids


def check_refs(label: str, entry: dict, tag_keys: Optional[set], link_ids: Optional[set], rep: Report) -> None:
    """Type check tags/link_ids lists; unknown references are warnings."""
    for field, known in (('tags', tag_keys), ('link_ids', link_ids)):
        if field not in entry:
            continue
        values = entry[field]
        if not _str_list(values):
            rep.error(f'{label}: {field} muss eine Liste von Strings sein')
            continue
        if known is not None:
            for value in values:
                if value not in known:
                    rep.warn(f'{label}: unbekannte {"Tag" if field == "tags" else "Link-ID"} {value!r}')


def check_chronicle(doc: dict, tag_keys: Optional[set], link_ids: Optional[set], rep: Report) -> set:
    ids = set()
    items = doc.get('itemListElement')
    if not isinstance(items, list):
        rep.error('chronicle.json: itemListElement muss eine Liste sein')
        return ids
    for idx, entry in enumerate(items):
        if not isinstance(entry, dict):
            rep.error(f'chronicle.json: itemListElement[{idx}] ist kein Objekt')
            continue
        eid = entry.get('@id')
        label = f'chronicle.json: {entry.get("title") or eid or f"itemListElement[{idx}]"}'
        if not _nonempty_str(eid):
            rep.error(f'{label}: @id fehlt')
        elif eid in ids:
            rep.error(f'{label}: @id doppelt ({eid})')
        else:
            ids.add(eid)
        if not _nonempty_str(entry.get('title')):
            rep.error(f'{label}: title fehlt')
        if not isinstance(entry.get('date'), str) or not DATE_RE.match(entry['date']):
            rep.error(f'{label}: date muss JJJJ-MM-TT sein, ist {entry.get("date")!r}')
        if 'collaborators' in entry and not _str_list(entry['collaborators']):
            rep.error(f'{label}: collaborators muss eine Liste von Strings sein')
        check_refs(label, entry, tag_keys, link_ids, rep)
    return ids


def check_downloads(doc: dict, tag_keys: Optional[set], link_ids: Optional[set], rep: Report) -> None:
    folders = doc.get('hasPart')
    if not isinstance(folders, list):
        rep.error('downloads.json: hasPart muss eine Liste sein')
        return
    paths = set()
    for idx, folder in enumerate(folders):
        if not isinstance(folder, dict) or not isinstance(folder.get('path'), str):
            rep.error(f'downloads.json: hasPart[{idx}] hat keinen path')
            continue
        path = folder['path']
        label = f'downloads.json [{path or "/"}]'
        if path in paths:
            rep.error(f'{label}: Ordner doppelt')
        paths.add(path)
        if '..' in path or path.startswith('/'):
            rep.error(f'{label}: ungueltiger Pfad')
        files = folder.get('hasPart', [])
        if not isinstance(files, list):
            rep.error(f'{label}: hasPart muss eine Liste sein')
            continue
        for fidx, part in enumerate(files):
            if not isinstance(part, dict) or not _nonempty_str(part.get('title')):
                rep.error(f'{label}: hasPart[{fidx}] hat keinen title')
                continue
            check_refs(f'{label} {part["title"]}', part, tag_keys, link_ids, rep)


def check_galerie(doc: dict, chronicle_ids: Optional[set], link_ids: Optional[set],
                  files: Optional[set], rep: Report) -> None:
    albums = doc.get('hasPart')
    if not isinstance(albums, list):
        rep.error('galerie.json: hasPart muss eine Liste sein')
        return
    paths = set()
    for idx, album in enumerate(albums):
        if not isinstance(album, dict) or not _nonempty_str(album.get('path')):
            rep.error(f'galerie.json: hasPart[{idx}] hat keinen path')
            continue
        path = album['path']
        label = f'galerie.json [{path}]'
        if path in paths:
            rep.error(f'{label}: Album doppelt')
        paths.add(path)
        if '..' in path or path.startswith('/'):
            rep.error(f'{label}: ungueltiger Pfad')
        if not _nonempty_str(album.get('title')):
            rep.error(f'{label}: title fehlt')
        if 'consent_collected' in album and not isinstance(album['consent_collected'], bool):
            rep.error(f'{label}: consent_collected muss true/false sein')
        for field in ('blur', 'no_blur'):
            if field in album and not _str_list(album[field]):
                rep.error(f'{label}: {field} muss eine Liste von Strings sein')
        check_refs(label, album, None, link_ids, rep)
        cid = album.get('chronicle_id')
        if cid and chronicle_ids is not None and cid not in chronicle_ids:
            rep.warn(f'{label}: unbekannte chronicle_id {cid!r}')
        check_album_images(label, album, files, rep)


def check_album_images(label: str, album: dict, files: Optional[set], rep: Report) -> None:
    images = album.get('hasPart', [])
    if not isinstance(images, list):
        rep.error(f'{label}: hasPart muss eine Liste sein')
        return
    names = []
    for iidx, img in enumerate(images):
        name = img.get('name') if isinstance(img, dict) else None
        if not isinstance(name, str) or not IMAGE_RE.match(name):
            rep.error(f'{label}: Bild {iidx} hat ungueltigen name {name!r}')
            continue
        if 'blurred' in img and not isinstance(img['blurred'], bool):
            rep.error(f'{label}: {name}: blurred muss true/false sein')
        names.append(name)
    if len(set(names)) != len(names):
        rep.warn(f'{label}: {len(names) - len(set(names))} Bild(er) doppelt (identische Originale?)')
    if album.get('imageCount', len(images)) != len(images):
        rep.error(f'{label}: imageCount {album.get("imageCount")} passt nicht zu {len(images)} Bildern')
    thumbs = {n.replace('_n.webp', '_t.webp') for n in names}
    preview = album.get('previewThumbnail')
    if preview and preview not in thumbs:
        rep.warn(f'{label}: previewThumbnail {preview!r} gehoert zu keinem Bild')
    if files is not None:
        missing = [f'{album["path"]}/{n}' for n in sorted(set(names) | thumbs) if f'{album["path"]}/{n}' not in files]
        if missing:
            rep.error(f'{label}: {len(missing)} Bilddatei(en) fehlen in Public/Galerie, z.B. {missing[0]}')


def list_galerie_dir(galerie_dir: Path) -> set:
    """Relative paths of all files below galerie_dir, same format as rclone lsf -R --files-only."""
    return {p.relative_to(galerie_dir).as_posix() for p in galerie_dir.rglob('*') if p.is_file()}


def validate(config_dir: Path, galerie_files: Optional[set] = None) -> Report:
    rep = Report()
    data = load_files(config_dir, rep)
    tag_keys = check_tags(data['tags.json'], rep) if 'tags.json' in data else None
    link_ids = check_links(data['links.json'], rep) if 'links.json' in data else None
    chronicle_ids = check_chronicle(data['chronicle.json'], tag_keys, link_ids, rep) \
        if 'chronicle.json' in data else None
    if 'downloads.json' in data:
        check_downloads(data['downloads.json'], tag_keys, link_ids, rep)
    if 'galerie.json' in data:
        check_galerie(data['galerie.json'], chronicle_ids, link_ids, galerie_files, rep)
    return rep


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('config_dir', type=Path)
    source = parser.add_mutually_exclusive_group()
    source.add_argument('--galerie-files', type=Path, help='file list of Public/Galerie (rclone lsf -R --files-only)')
    source.add_argument('--galerie-dir', type=Path, help='the Public/Galerie folder itself')
    args = parser.parse_args()

    files = None
    if args.galerie_files:
        files = {line.strip() for line in args.galerie_files.read_text(encoding='utf-8').splitlines() if line.strip()}
    elif args.galerie_dir:
        if not args.galerie_dir.is_dir():
            sys.exit(f'Galerie-Ordner nicht gefunden: {args.galerie_dir}')
        files = list_galerie_dir(args.galerie_dir)

    rep = validate(args.config_dir, files)
    # GitHub Actions annotations; plain text locally
    gha = os.environ.get('GITHUB_ACTIONS') == 'true'
    for msg in rep.warnings:
        print(f'::warning::{msg}' if gha else f'WARNUNG: {msg}')
    for msg in rep.errors:
        print(f'::error::{msg}' if gha else f'FEHLER:  {msg}')
    print(f'\n{len(rep.errors)} Fehler, {len(rep.warnings)} Warnung(en).')
    sys.exit(1 if rep.errors else 0)


if __name__ == '__main__':
    main()
