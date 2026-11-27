"""Unit tests for gui/validate_configs.py."""
import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import validate_configs as vc  # noqa: E402

IMG = '20250921_185948_28518357_n.webp'
THUMB = '20250921_185948_28518357_t.webp'
CHRON_ID = 'urn:uuid:chron-1'
LINK_ID = 'urn:uuid:link-1'

VALID = {
    'chronicle.json': {
        '@context': 'https://schema.org', '@type': 'ItemList', '@id': 'x',
        'itemListElement': [{'@type': 'Event', '@id': CHRON_ID, 'title': 'Repair Café', 'date': '2025-09-21',
                             'tags': ['repaircafe'], 'link_ids': [LINK_ID], 'collaborators': ['Stadt']}],
    },
    'links.json': {
        '@context': 'https://schema.org', '@type': 'ItemList', '@id': 'x',
        'itemListElement': [{'@type': 'ListItem', 'item': {'@id': LINK_ID, 'title': 'Blog', 'url': 'https://x'}}],
    },
    'tags.json': {
        '@context': 'https://schema.org', '@type': 'DefinedTermSet', '@id': 'x',
        'location_tags': {'awo': {'label': 'Werkstatt'}},
        'description_tags': {'repaircafe': {'label': 'Repair Café'}},
    },
    'downloads.json': {
        '@context': 'https://schema.org', '@type': 'DataCatalog', '@id': 'x',
        'hasPart': [{'path': 'Verein', 'hasPart': [{'title': 'satzung.pdf', 'tags': ['awo'], 'link_ids': [LINK_ID]}]}],
    },
    'galerie.json': {
        '@context': 'https://schema.org', '@type': 'DataCatalog', '@id': 'x',
        'hasPart': [{'path': 'Verein/Fest', 'title': 'Fest', 'consent_collected': True, 'chronicle_id': CHRON_ID,
                     'imageCount': 1, 'previewThumbnail': THUMB, 'hasPart': [{'name': IMG, 'blurred': False}]}],
    },
}


class ValidateTest(unittest.TestCase):

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self._tmp.name)
        self.data = copy.deepcopy(VALID)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def run_validate(self, files: set | None = None) -> vc.Report:
        for name, doc in self.data.items():
            if doc is not None:
                (self.dir / name).write_text(json.dumps(doc), encoding='utf-8')
        return vc.validate(self.dir, files)

    def assert_error(self, rep: vc.Report, fragment: str) -> None:
        self.assertTrue(any(fragment in e for e in rep.errors), f'{fragment!r} not in {rep.errors}')

    def assert_warning(self, rep: vc.Report, fragment: str) -> None:
        self.assertEqual(rep.errors, [])
        self.assertTrue(any(fragment in w for w in rep.warnings), f'{fragment!r} not in {rep.warnings}')

    # --- valid --------------------------------------------------------------

    def test_valid_data_has_no_findings(self) -> None:
        rep = self.run_validate({f'Verein/Fest/{IMG}', f'Verein/Fest/{THUMB}'})
        self.assertEqual((rep.errors, rep.warnings), ([], []))

    # --- errors: would break the site -> deploy stops -------------------------

    def test_missing_file(self) -> None:
        self.data['tags.json'] = None
        self.assert_error(self.run_validate(), 'tags.json: fehlt')

    def test_invalid_json(self) -> None:
        self.run_validate()
        (self.dir / 'links.json').write_text('{kaputt', encoding='utf-8')
        self.assert_error(vc.validate(self.dir), 'links.json: kein valides JSON')

    def test_wrong_root_type(self) -> None:
        self.data['galerie.json']['@type'] = 'ImageGallery'
        self.assert_error(self.run_validate(), 'galerie.json: @type muss "DataCatalog" sein')

    def test_missing_context_and_id(self) -> None:
        del self.data['chronicle.json']['@context']
        del self.data['chronicle.json']['@id']
        rep = self.run_validate()
        self.assert_error(rep, '@context fehlt')
        self.assert_error(rep, '@id fehlt')

    def test_chronicle_bad_date(self) -> None:
        self.data['chronicle.json']['itemListElement'][0]['date'] = '21.09.2025'
        self.assert_error(self.run_validate(), 'date muss JJJJ-MM-TT sein')

    def test_chronicle_duplicate_id(self) -> None:
        items = self.data['chronicle.json']['itemListElement']
        items.append(dict(items[0], title='Kopie'))
        self.assert_error(self.run_validate(), '@id doppelt')

    def test_link_without_url(self) -> None:
        self.data['links.json']['itemListElement'][0]['item']['url'] = ''
        self.assert_error(self.run_validate(), 'url fehlt')

    def test_tag_without_label(self) -> None:
        self.data['tags.json']['location_tags']['awo'] = {}
        self.assert_error(self.run_validate(), 'location_tags.awo hat kein label')

    def test_tags_must_be_string_list(self) -> None:
        self.data['downloads.json']['hasPart'][0]['hasPart'][0]['tags'] = 'awo'
        self.assert_error(self.run_validate(), 'tags muss eine Liste von Strings sein')

    def test_download_without_title(self) -> None:
        self.data['downloads.json']['hasPart'][0]['hasPart'].append({'description': 'ohne Titel'})
        self.assert_error(self.run_validate(), 'hasPart[1] hat keinen title')

    def test_album_path_traversal(self) -> None:
        self.data['galerie.json']['hasPart'][0]['path'] = '../geheim'
        self.assert_error(self.run_validate(), 'ungueltiger Pfad')

    def test_album_without_title(self) -> None:
        del self.data['galerie.json']['hasPart'][0]['title']
        self.assert_error(self.run_validate(), 'title fehlt')

    def test_bad_image_name(self) -> None:
        self.data['galerie.json']['hasPart'][0]['hasPart'][0]['name'] = 'foto.jpg'
        self.assert_error(self.run_validate(), 'ungueltigen name')

    def test_image_count_mismatch(self) -> None:
        self.data['galerie.json']['hasPart'][0]['imageCount'] = 5
        self.assert_error(self.run_validate(), 'imageCount 5 passt nicht zu 1')

    def test_consent_must_be_bool(self) -> None:
        self.data['galerie.json']['hasPart'][0]['consent_collected'] = 'ja'
        self.assert_error(self.run_validate(), 'consent_collected muss true/false sein')

    def test_list_galerie_dir_matches_rclone_format(self) -> None:
        gal = self.dir / 'Galerie'
        (gal / 'Verein' / 'Fest').mkdir(parents=True)
        for name in (IMG, THUMB):
            (gal / 'Verein' / 'Fest' / name).write_bytes(b'x')
        files = vc.list_galerie_dir(gal)
        self.assertEqual(files, {f'Verein/Fest/{IMG}', f'Verein/Fest/{THUMB}'})
        rep = self.run_validate(files)
        self.assertEqual((rep.errors, rep.warnings), ([], []))

    def test_missing_webp_in_cloud(self) -> None:
        self.assert_error(self.run_validate({f'Verein/Fest/{IMG}'}), '1 Bilddatei(en) fehlen')

    # --- warnings: dangling references -> deploy continues -------------------

    def test_unknown_tag_is_warning(self) -> None:
        self.data['chronicle.json']['itemListElement'][0]['tags'] = ['meilenstein']
        self.assert_warning(self.run_validate(), "unbekannte Tag 'meilenstein'")

    def test_unknown_link_id_is_warning(self) -> None:
        self.data['downloads.json']['hasPart'][0]['hasPart'][0]['link_ids'] = ['urn:uuid:weg']
        self.assert_warning(self.run_validate(), "unbekannte Link-ID 'urn:uuid:weg'")

    def test_unknown_chronicle_id_is_warning(self) -> None:
        self.data['galerie.json']['hasPart'][0]['chronicle_id'] = 'urn:uuid:weg'
        self.assert_warning(self.run_validate(), "unbekannte chronicle_id 'urn:uuid:weg'")

    def test_link_without_title_but_with_type_is_fine(self) -> None:
        item = self.data['links.json']['itemListElement'][0]['item']
        item['title'], item['type'] = '', 'wiki'
        rep = self.run_validate()
        self.assertEqual((rep.errors, rep.warnings), ([], []))

    def test_link_without_title_and_type_is_error(self) -> None:
        self.data['links.json']['itemListElement'][0]['item']['title'] = ''
        self.assert_error(self.run_validate(), 'weder title noch type')

    def test_duplicate_images_is_warning(self) -> None:
        album = self.data['galerie.json']['hasPart'][0]
        album['hasPart'].append({'name': IMG, 'blurred': False})
        album['imageCount'] = 2
        self.assert_warning(self.run_validate(), '1 Bild(er) doppelt')

    def test_preview_not_in_album_is_warning(self) -> None:
        self.data['galerie.json']['hasPart'][0]['previewThumbnail'] = 'weg_t.webp'
        self.assert_warning(self.run_validate(), "previewThumbnail 'weg_t.webp'")


if __name__ == '__main__':
    unittest.main()
