"""Unit tests for gui/server.py - real HTTP server on a free port against temp dirs."""
import http.client
import http.server
import json
import sys
import tempfile
import threading
import unittest
import urllib.error
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import server  # noqa: E402


class ServerTestCase(unittest.TestCase):

    @classmethod
    def setUpClass(cls) -> None:
        cls.httpd = http.server.ThreadingHTTPServer(('127.0.0.1', 0), server.Handler)
        cls.port = cls.httpd.server_address[1]
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        root = Path(self._tmp.name)
        self.configs = root / 'configs'
        self.source = root / 'source'
        self.downloads = root / 'downloads'
        for d in (self.configs, self.source, self.downloads):
            d.mkdir()
        patches = [
            mock.patch.object(server, 'CONFIG_DIR', self.configs),
            mock.patch.object(server, 'SOURCE_DIR', self.source),
            mock.patch.object(server, 'DOWNLOADS_DIR', self.downloads),
            mock.patch.object(server, 'GALERIE_JSON', self.configs / 'galerie.json'),
            mock.patch.object(server, 'DOWNLOADS_JSON', self.configs / 'downloads.json'),
            mock.patch.dict(server._job, {'status': 'idle'}),
        ]
        for p in patches:
            p.start()
            self.addCleanup(p.stop)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    # --- helpers ---------------------------------------------------------------

    def request(self, method: str, path: str, body: object = None, raw: bytes | None = None) -> tuple[int, object]:
        # http.client instead of urllib, so tests can mock urllib.request.urlopen (used by /api/publish)
        data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
        conn = http.client.HTTPConnection('127.0.0.1', self.port, timeout=10)
        try:
            conn.request(method, path, body=data, headers={'Content-Type': 'application/json'})
            resp = conn.getresponse()
            return resp.status, json.loads(resp.read() or b'null')
        finally:
            conn.close()

    def get(self, path: str) -> tuple[int, object]:
        return self.request('GET', path)

    def post(self, path: str, body: object = None, raw: bytes | None = None) -> tuple[int, object]:
        return self.request('POST', path, body if body is not None else {}, raw)

    def write_config(self, name: str, data: object) -> None:
        (self.configs / name).write_text(json.dumps(data), encoding='utf-8')

    def read_config(self, name: str) -> dict:
        return json.loads((self.configs / name).read_text(encoding='utf-8'))


class ConfigFilesTest(ServerTestCase):

    def test_all_returns_empty_objects_for_missing_files(self) -> None:
        self.assertEqual(self.get('/api/all'), (200, {'chronicle': {}, 'links': {}, 'tags': {}}))

    def test_save_and_read_back(self) -> None:
        status, _ = self.post('/api/save/tags', {'location_tags': {'awo': {'label': 'Werkstatt'}}})
        self.assertEqual(status, 200)
        self.assertEqual(self.read_config('tags.json'), {'location_tags': {'awo': {'label': 'Werkstatt'}}})
        self.assertEqual(self.get('/api/all')[1]['tags']['location_tags']['awo']['label'], 'Werkstatt')

    def test_save_invalid_json_is_rejected(self) -> None:
        status, body = self.post('/api/save/links', raw=b'{kaputt')
        self.assertEqual(status, 400)
        self.assertIn('Invalid JSON', body['error'])
        self.assertFalse((self.configs / 'links.json').exists())

    def test_save_unknown_file_is_404(self) -> None:
        self.assertEqual(self.post('/api/save/galerie', {})[0], 404)

    def test_removed_log_and_undo_endpoints(self) -> None:
        self.assertEqual(self.get('/api/log/chronicle')[0], 404)
        self.assertEqual(self.post('/api/undo', {})[0], 404)

    def test_write_json_leaves_no_tmp_files(self) -> None:
        self.post('/api/save/chronicle', {'itemListElement': []})
        self.assertEqual([p.name for p in self.configs.iterdir()], ['chronicle.json'])


class AlbumsTest(ServerTestCase):

    GENERATED = {'imageCount': 1, 'previewThumbnail': 'x_t.webp', 'hasPart': [{'name': 'x_n.webp', 'blurred': True}]}

    def setUp(self) -> None:
        super().setUp()
        (self.source / 'Verein' / 'Fest').mkdir(parents=True)
        (self.source / 'Verein' / 'Neu').mkdir(parents=True)
        self.write_config('galerie.json', {'@type': 'DataCatalog', 'hasPart': [
            {'path': 'Verein/Fest', 'title': 'Fest', 'consent_collected': True, 'blur': ['a.jpg'], **self.GENERATED},
        ]})

    def test_albums_list(self) -> None:
        status, albums = self.get('/api/albums')
        self.assertEqual(status, 200)
        self.assertEqual(albums, [{'path': 'Verein/Fest', 'title': 'Fest', 'description': '',
                                   'chronicle_id': '', 'consent_collected': True}])

    def test_album_get_returns_config_fields_only(self) -> None:
        status, cfg = self.get('/api/album?path=Verein/Fest')
        self.assertEqual(status, 200)
        self.assertEqual(cfg, {'title': 'Fest', 'consent_collected': True, 'blur': ['a.jpg']})

    def test_album_get_unknown_is_404(self) -> None:
        self.assertEqual(self.get('/api/album?path=Verein/Nope')[0], 404)

    def test_album_post_replaces_config_and_keeps_generated(self) -> None:
        status, _ = self.post('/api/album?path=Verein/Fest', {'title': 'Sommerfest', 'description': 'Neu'})
        self.assertEqual(status, 200)
        album = self.read_config('galerie.json')['hasPart'][0]
        self.assertEqual(album['title'], 'Sommerfest')
        self.assertEqual(album['description'], 'Neu')
        self.assertNotIn('blur', album)  # omitted field is removed (form sends the full config)
        self.assertFalse(album['consent_collected'])
        for key, value in self.GENERATED.items():
            self.assertEqual(album[key], value)

    def test_album_post_ignores_unknown_fields(self) -> None:
        self.post('/api/album?path=Verein/Fest', {'title': 'Fest', 'tags': ['x'], 'hasPart': []})
        album = self.read_config('galerie.json')['hasPart'][0]
        self.assertNotIn('tags', album)
        self.assertEqual(album['hasPart'], self.GENERATED['hasPart'])

    def test_album_post_creates_new_album_for_existing_folder(self) -> None:
        status, _ = self.post('/api/album?path=Verein/Neu', {'title': 'Neu'})
        self.assertEqual(status, 200)
        new = self.read_config('galerie.json')['hasPart'][1]
        self.assertEqual(new, {'@type': 'ImageGallery', 'path': 'Verein/Neu', 'imageCount': 0, 'hasPart': [],
                               'title': 'Neu', 'consent_collected': False})

    def test_album_post_without_source_folder_is_404(self) -> None:
        self.assertEqual(self.post('/api/album?path=Verein/Gibtsnicht', {'title': 'X'})[0], 404)

    def test_album_post_requires_title(self) -> None:
        self.assertEqual(self.post('/api/album?path=Verein/Fest', {'description': 'ohne Titel'})[0], 400)

    def test_album_post_and_delete_blocked_while_job_runs(self) -> None:
        server._job['status'] = 'running'
        self.assertEqual(self.post('/api/album?path=Verein/Fest', {'title': 'X'})[0], 409)
        self.assertEqual(self.post('/api/album/delete?path=Verein/Fest')[0], 409)
        self.assertEqual(self.read_config('galerie.json')['hasPart'][0]['title'], 'Fest')

    def test_album_delete(self) -> None:
        self.assertEqual(self.post('/api/album/delete?path=Verein/Fest')[0], 200)
        self.assertEqual(self.read_config('galerie.json')['hasPart'], [])
        self.assertEqual(self.post('/api/album/delete?path=Verein/Fest')[0], 404)

    def test_album_dirs_lists_folders_without_album(self) -> None:
        self.assertEqual(self.get('/api/album/dirs'), (200, ['Verein', 'Verein/Neu']))

    def test_path_traversal_is_rejected(self) -> None:
        for path in ('../etc', '/etc', 'Verein/../..'):
            with self.subTest(path=path):
                self.assertEqual(self.post(f'/api/album?path={path}', {'title': 'X'})[0], 400)
                self.assertIn(self.get(f'/api/album/images?path={path}')[0], (400, 404))
        self.assertEqual(self.get('/api/album/image?path=Verein/Fest&file=../../x.jpg')[0], 404)


class DownloadsTest(ServerTestCase):

    def setUp(self) -> None:
        super().setUp()
        (self.downloads / 'Marketing' / 'Bierdeckel').mkdir(parents=True)
        (self.downloads / 'Marketing' / 'Bierdeckel' / 'vorne.svg').write_text('<svg/>', encoding='utf-8')
        (self.downloads / 'Marketing' / 'Bierdeckel' / '.hidden').write_text('', encoding='utf-8')
        self.write_config('downloads.json', {'@type': 'DataCatalog', 'hasPart': [
            {'@type': 'DataCatalog', 'path': '', 'name': 'Root', 'description': '', 'hasPart': []},
            {'@type': 'DataCatalog', 'path': 'Verein', 'name': 'Verein', 'description': 'Satzung',
             'hasPart': [{'@type': 'MediaObject', 'title': 'satzung.pdf', 'tags': ['verein']}]},
        ]})

    def test_folders_are_union_of_local_and_json(self) -> None:
        status, folders = self.get('/api/downloads')
        self.assertEqual(status, 200)
        self.assertEqual(folders, [
            {'path': 'Marketing', 'hasMeta': False},
            {'path': 'Marketing/Bierdeckel', 'hasMeta': False},
            {'path': 'Verein', 'hasMeta': True},
        ])

    def test_entries_flat_list(self) -> None:
        self.assertEqual(self.get('/api/download-entries'), (200, [
            {'name': 'satzung.pdf', 'folder': 'Verein', 'description': '', 'link_ids': [], 'tags': ['verein']},
        ]))

    def test_meta_get_for_folder_only_in_json(self) -> None:
        status, meta = self.get('/api/download-meta?path=Verein')
        self.assertEqual(status, 200)
        self.assertEqual(meta['description'], 'Satzung')
        self.assertEqual(meta['hasPart'][0]['title'], 'satzung.pdf')

    def test_meta_get_for_local_folder_without_entry(self) -> None:
        status, meta = self.get('/api/download-meta?path=Marketing/Bierdeckel')
        self.assertEqual(status, 200)
        self.assertEqual((meta['name'], meta['hasPart']), ('Bierdeckel', []))

    def test_meta_post_creates_entry_sorted(self) -> None:
        part = {'@type': 'MediaObject', 'title': 'vorne.svg', 'description': 'Vorderseite'}
        status, _ = self.post('/api/download-meta?path=Marketing/Bierdeckel',
                              {'name': 'Bierdeckel', 'description': 'Deckel', 'hasPart': [part]})
        self.assertEqual(status, 200)
        folders = self.read_config('downloads.json')['hasPart']
        self.assertEqual([f['path'] for f in folders], ['', 'Marketing/Bierdeckel', 'Verein'])
        self.assertEqual(folders[1]['hasPart'], [part])

    def test_meta_unknown_folder_is_404(self) -> None:
        self.assertEqual(self.get('/api/download-meta?path=Gibtsnicht')[0], 404)
        self.assertEqual(self.post('/api/download-meta?path=../x', {})[0], 404)

    def test_files_lists_visible_local_files(self) -> None:
        self.assertEqual(self.get('/api/download-files?path=Marketing/Bierdeckel'), (200, ['vorne.svg']))
        self.assertEqual(self.get('/api/download-files?path=Verein'), (200, []))


class PublishTest(ServerTestCase):

    def test_publish_without_token_is_503(self) -> None:
        with mock.patch.dict('os.environ', {'GITHUB_TOKEN': ''}):
            status, body = self.post('/api/publish')
        self.assertEqual(status, 503)
        self.assertIn('GITHUB_TOKEN', body['error'])

    def test_publish_dispatches_workflow(self) -> None:
        with mock.patch.dict('os.environ', {'GITHUB_TOKEN': 'secret'}), \
                mock.patch.object(server.urllib.request, 'urlopen') as urlopen:
            status, _ = self.post('/api/publish')
        self.assertEqual(status, 202)
        req = urlopen.call_args[0][0]
        self.assertEqual(req.full_url, server.GITHUB_DISPATCH_URL)
        self.assertEqual(req.get_header('Authorization'), 'Bearer secret')
        self.assertEqual(json.loads(req.data), {'ref': 'main'})

    def test_publish_github_error_is_502(self) -> None:
        error = urllib.error.HTTPError(server.GITHUB_DISPATCH_URL, 403, 'Forbidden', {}, None)
        with mock.patch.dict('os.environ', {'GITHUB_TOKEN': 'secret'}), \
                mock.patch.object(server.urllib.request, 'urlopen', side_effect=error):
            status, body = self.post('/api/publish')
        self.assertEqual(status, 502)
        self.assertIn('403', body['error'])


if __name__ == '__main__':
    unittest.main()
