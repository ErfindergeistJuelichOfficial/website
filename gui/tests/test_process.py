"""Unit tests for gui/process.py (run: podman compose run --rm test)."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from PIL import Image  # noqa: E402

import process  # noqa: E402


def make_jpg(path: Path, color: tuple = (200, 30, 30), size: tuple = (64, 48)) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.new('RGB', size, color).save(path, 'JPEG')
    return path


class TempDirsTestCase(unittest.TestCase):
    """Points SOURCE_DIR, OUTPUT_DIR and GALERIE_JSON of process.py at a temp dir."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        self.source = root / 'source'
        self.output = root / 'output'
        self.configs = root / 'configs'
        for d in (self.source, self.output, self.configs):
            d.mkdir()
        self.galerie_json = self.configs / 'galerie.json'
        patches = [
            mock.patch.object(process, 'SOURCE_DIR', self.source),
            mock.patch.object(process, 'OUTPUT_DIR', self.output),
            mock.patch.object(process, 'GALERIE_JSON', self.galerie_json),
            mock.patch.object(process, 'VISION_MODEL', 'disabled'),
        ]
        for p in patches:
            p.start()
            self.addCleanup(p.stop)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def write_galerie(self, albums: list) -> None:
        self.galerie_json.write_text(json.dumps({'@type': 'DataCatalog', 'hasPart': albums}), encoding='utf-8')

    def read_galerie(self) -> dict:
        return json.loads(self.galerie_json.read_text(encoding='utf-8'))

    def album(self, path: str) -> dict:
        return next(a for a in self.read_galerie()['hasPart'] if a['path'] == path)


class NameHelpersTest(unittest.TestCase):

    def test_hash_of_extracts_source_hash(self) -> None:
        self.assertEqual(process.hash_of('20250921_185948_28518357_n.webp'), '28518357')

    def test_hash_of_invalid_name(self) -> None:
        self.assertEqual(process.hash_of('foo_n.webp'), '')

    def test_thumb_of(self) -> None:
        self.assertEqual(process.thumb_of('20250921_185948_28518357_n.webp'), '20250921_185948_28518357_t.webp')

    def test_slim_parts_keeps_only_name_caption_blurred(self) -> None:
        parts = [
            {'name': 'a_n.webp', 'caption': 'Hallo', 'blurred': True, 'exif': {'iso': 100}},
            {'name': 'b_n.webp', 'caption': '', 'blurred': False},
        ]
        self.assertEqual(process.slim_parts(parts), [
            {'name': 'a_n.webp', 'caption': 'Hallo', 'blurred': True},
            {'name': 'b_n.webp', 'blurred': False},
        ])

    def test_resolve_preview_thumbnail(self) -> None:
        parts = [{'name': '20250101_000000_aaaaaaaa_n.webp'}, {'name': '20250101_000000_bbbbbbbb_n.webp'}]
        self.assertEqual(process.resolve_preview_thumbnail('bbbbbbbb', parts), '20250101_000000_bbbbbbbb_t.webp')
        self.assertIsNone(process.resolve_preview_thumbnail('cccccccc', parts))
        self.assertIsNone(process.resolve_preview_thumbnail(None, parts))


class GalerieJsonTest(TempDirsTestCase):

    def test_load_galerie_exits_when_missing(self) -> None:
        with self.assertRaises(SystemExit):
            process.load_galerie()

    def test_load_galerie_exits_without_haspart(self) -> None:
        self.galerie_json.write_text('{"@type": "DataCatalog"}', encoding='utf-8')
        with self.assertRaises(SystemExit):
            process.load_galerie()

    def test_write_galerie_is_compact_and_leaves_no_tmp(self) -> None:
        process.write_galerie({'hasPart': [{'path': 'A', 'title': 'Ä'}]})
        text = self.galerie_json.read_text(encoding='utf-8')
        self.assertEqual(text, '{"hasPart":[{"path":"A","title":"Ä"}]}\n')
        self.assertEqual([p.name for p in self.configs.iterdir()], ['galerie.json'])

    def test_save_album_updates_generated_fields_only(self) -> None:
        self.write_galerie([{'path': 'A', 'title': 'Album A', 'consent_collected': True, 'blur': ['x.jpg']}])
        process.save_album('A', [{'name': '20250101_000000_aaaaaaaa_n.webp', 'blurred': False}], None)
        album = self.album('A')
        self.assertEqual(album['title'], 'Album A')
        self.assertEqual(album['blur'], ['x.jpg'])
        self.assertEqual(album['imageCount'], 1)
        self.assertEqual(album['previewThumbnail'], '20250101_000000_aaaaaaaa_t.webp')
        self.assertEqual(album['hasPart'], [{'name': '20250101_000000_aaaaaaaa_n.webp', 'blurred': False}])

    def test_save_album_skips_write_when_unchanged(self) -> None:
        self.write_galerie([{'path': 'A', 'title': 'A'}])
        parts = [{'name': '20250101_000000_aaaaaaaa_n.webp', 'blurred': False}]
        process.save_album('A', parts, None)
        with mock.patch.object(process, 'write_galerie') as write:
            process.save_album('A', parts, None)
        write.assert_not_called()

    def test_save_album_keeps_concurrent_edits_of_other_albums(self) -> None:
        self.write_galerie([{'path': 'A', 'title': 'A'}, {'path': 'B', 'title': 'B alt'}])
        # Simulate a GUI edit of album B while process.py works on A
        data = self.read_galerie()
        data['hasPart'][1]['title'] = 'B neu'
        self.galerie_json.write_text(json.dumps(data), encoding='utf-8')
        process.save_album('A', [{'name': '20250101_000000_aaaaaaaa_n.webp', 'blurred': False}], None)
        self.assertEqual(self.album('B')['title'], 'B neu')

    def test_save_album_removed_meanwhile_does_nothing(self) -> None:
        self.write_galerie([{'path': 'B', 'title': 'B'}])
        process.save_album('A', [], None)
        self.assertEqual([a['path'] for a in self.read_galerie()['hasPart']], ['B'])

    def test_save_album_without_images_has_no_preview(self) -> None:
        self.write_galerie([{'path': 'A', 'title': 'A', 'previewThumbnail': 'old_t.webp'}])
        process.save_album('A', [], None)
        album = self.album('A')
        self.assertNotIn('previewThumbnail', album)
        self.assertEqual(album['imageCount'], 0)


class ProcessAlbumTest(TempDirsTestCase):

    def test_new_album_creates_webp_and_saves_list(self) -> None:
        make_jpg(self.source / 'A' / 'one.jpg')
        make_jpg(self.source / 'A' / 'two.jpg', color=(10, 200, 10))
        self.write_galerie([{'path': 'A', 'title': 'A', 'consent_collected': True}])

        process.process_album(self.album('A'))

        album = self.album('A')
        self.assertEqual(album['imageCount'], 2)
        for img in album['hasPart']:
            self.assertRegex(img['name'], r'^\d{8}_\d{6}_[0-9a-f]{8}_n\.webp$')
            self.assertTrue((self.output / 'A' / img['name']).is_file())
            self.assertTrue((self.output / 'A' / process.thumb_of(img['name'])).is_file())
            self.assertFalse(img['blurred'])

    def test_second_run_skips_everything_and_does_not_write(self) -> None:
        make_jpg(self.source / 'A' / 'one.jpg')
        self.write_galerie([{'path': 'A', 'title': 'A', 'consent_collected': True}])
        process.process_album(self.album('A'))

        with mock.patch.object(process, 'make_normalized') as normalize, \
                mock.patch.object(process, 'write_galerie') as write:
            process.process_album(self.album('A'))
        normalize.assert_not_called()
        write.assert_not_called()

    def test_removed_source_image_is_dropped_and_files_deleted(self) -> None:
        make_jpg(self.source / 'A' / 'one.jpg')
        gone = make_jpg(self.source / 'A' / 'two.jpg', color=(10, 200, 10))
        self.write_galerie([{'path': 'A', 'title': 'A', 'consent_collected': True}])
        process.process_album(self.album('A'))
        self.assertEqual(len(list((self.output / 'A').glob('*.webp'))), 4)

        gone.unlink()
        process.process_album(self.album('A'))

        self.assertEqual(self.album('A')['imageCount'], 1)
        self.assertEqual(len(list((self.output / 'A').glob('*.webp'))), 2)

    def test_missing_webp_is_regenerated_and_caption_kept(self) -> None:
        make_jpg(self.source / 'A' / 'one.jpg')
        self.write_galerie([{'path': 'A', 'title': 'A', 'consent_collected': True}])
        process.process_album(self.album('A'))
        data = self.read_galerie()
        data['hasPart'][0]['hasPart'][0]['caption'] = 'Eine Werkbank'
        self.galerie_json.write_text(json.dumps(data), encoding='utf-8')
        name = data['hasPart'][0]['hasPart'][0]['name']
        (self.output / 'A' / name).unlink()

        process.process_album(self.album('A'))

        self.assertTrue((self.output / 'A' / name).is_file())
        self.assertEqual(self.album('A')['hasPart'][0]['caption'], 'Eine Werkbank')

    def test_no_consent_blurs_and_blur_lists_override(self) -> None:
        make_jpg(self.source / 'A' / 'people.jpg')
        make_jpg(self.source / 'A' / 'logo.jpg', color=(10, 10, 200))
        self.write_galerie([{'path': 'A', 'title': 'A', 'consent_collected': False, 'no_blur': ['logo.jpg']}])

        with mock.patch.object(process, 'BLUR_MODELS', ['fake']), \
                mock.patch.object(process, 'load_blur_model',
                                  side_effect=lambda m: process._blur_instances.__setitem__(m, (None, None))), \
                mock.patch.object(process, 'unload_blur_model',
                                  side_effect=lambda m: process._blur_instances.pop(m, None)), \
                mock.patch.object(process, '_blur_img_with_model', side_effect=lambda img, m: img) as blur:
            process.process_album(self.album('A'))

        self.assertEqual(blur.call_count, 1)
        blurred = {img['blurred'] for img in self.album('A')['hasPart']}
        self.assertEqual(blurred, {True, False})

    def test_consent_change_to_yes_unblurs_from_source(self) -> None:
        make_jpg(self.source / 'A' / 'people.jpg')
        self.write_galerie([{'path': 'A', 'title': 'A', 'consent_collected': True}])
        process.process_album(self.album('A'))
        data = self.read_galerie()
        data['hasPart'][0]['hasPart'][0]['blurred'] = True  # was blurred before consent was collected
        self.galerie_json.write_text(json.dumps(data), encoding='utf-8')

        with mock.patch.object(process, 'make_normalized', wraps=process.make_normalized) as normalize:
            process.process_album(self.album('A'))

        normalize.assert_called_once()
        self.assertFalse(self.album('A')['hasPart'][0]['blurred'])

    def test_identical_source_files_are_listed_once(self) -> None:
        original = make_jpg(self.source / 'A' / 'one.jpg')
        (self.source / 'A' / 'one-kopie.jpg').write_bytes(original.read_bytes())
        self.write_galerie([{'path': 'A', 'title': 'A', 'consent_collected': True}])
        process.process_album(self.album('A'))
        self.assertEqual(self.album('A')['imageCount'], 1)

    def test_preview_from_config(self) -> None:
        make_jpg(self.source / 'A' / 'one.jpg')
        make_jpg(self.source / 'A' / 'two.jpg', color=(10, 200, 10))
        self.write_galerie([{'path': 'A', 'title': 'A', 'consent_collected': True, 'preview': 'two.jpg'}])
        process.process_album(self.album('A'))
        two_hash = process.sha256_short(self.source / 'A' / 'two.jpg')
        self.assertIn(two_hash, self.album('A')['previewThumbnail'])


class CleanupTest(TempDirsTestCase):

    def test_orphaned_album_files_removed_but_nested_albums_kept(self) -> None:
        for rel in ('Werkstatt', 'Werkstatt/Bohren', 'Alt'):
            (self.output / rel).mkdir(parents=True)
            (self.output / rel / '20250101_000000_aaaaaaaa_n.webp').write_bytes(b'x')

        # "Werkstatt" is no longer an album, but its child "Werkstatt/Bohren" still is
        process.cleanup_orphaned_albums({'Werkstatt/Bohren'})

        self.assertTrue((self.output / 'Werkstatt' / 'Bohren' / '20250101_000000_aaaaaaaa_n.webp').is_file())
        self.assertEqual(list((self.output / 'Werkstatt').glob('*.webp')), [])
        self.assertFalse((self.output / 'Alt').exists())

    def test_cleanup_orphaned_images_keeps_referenced_files(self) -> None:
        album = self.output / 'A'
        album.mkdir()
        keep = '20250101_000000_aaaaaaaa_n.webp'
        for name in (keep, process.thumb_of(keep), 'stale_n.webp'):
            (album / name).write_bytes(b'x')
        process.cleanup_orphaned_images(album, [{'name': keep}], 'A')
        self.assertEqual(sorted(p.name for p in album.iterdir()), sorted([keep, process.thumb_of(keep)]))


class MainTest(TempDirsTestCase):

    def test_main_skips_albums_without_title_or_source(self) -> None:
        make_jpg(self.source / 'A' / 'one.jpg')
        self.write_galerie([
            {'path': 'A', 'title': 'A', 'consent_collected': True},
            {'path': 'NoTitle'},
            {'path': 'NoSource', 'title': 'Fehlt'},
        ])
        with mock.patch('sys.stdout'), mock.patch('sys.stderr'):
            process.main()
        self.assertEqual(self.album('A')['imageCount'], 1)
        self.assertNotIn('imageCount', self.album('NoSource'))


if __name__ == '__main__':
    unittest.main()
