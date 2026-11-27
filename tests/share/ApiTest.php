<?php

declare(strict_types=1);

namespace Erfindergeist\Tests\Share;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for share/api.php: galerie.json, downloads.json and the config section.
 * Every test works on its own temp "share root" (config/, downloads/).
 */
final class ApiTest extends TestCase
{
  private string $root;

  protected function setUp(): void
  {
    $this->root = sys_get_temp_dir() . '/eg-api-test-' . bin2hex(random_bytes(6));
    mkdir($this->root . '/config', 0777, true);
    mkdir($this->root . '/downloads', 0777, true);
  }

  protected function tearDown(): void
  {
    $this->removeDir($this->root);
  }

  // --- helpers -------------------------------------------------------------

  private function removeDir(string $dir): void
  {
    foreach (scandir($dir) ?: [] as $entry) {
      if ($entry === '.' || $entry === '..') {
        continue;
      }
      $path = "$dir/$entry";
      is_dir($path) ? $this->removeDir($path) : unlink($path);
    }
    rmdir($dir);
  }

  /** @param array<mixed>|string $data */
  private function writeConfig(string $name, array|string $data): void
  {
    $json = is_string($data) ? $data : json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    file_put_contents("$this->root/config/$name", $json);
  }

  private function writeDownload(string $relPath, string $content = 'x'): void
  {
    $path = "$this->root/downloads/$relPath";
    if (!is_dir(dirname($path))) {
      mkdir(dirname($path), 0777, true);
    }
    file_put_contents($path, $content);
  }

  /** @return array<string,mixed> */
  private function catalog(array $hasPart): array
  {
    return ['@context' => 'https://schema.org', '@type' => 'DataCatalog', '@id' => 'x', 'hasPart' => $hasPart];
  }

  // --- galerie.json --------------------------------------------------------

  public function testGallerySummaryMapsFields(): void
  {
    $summary = eg_gallery_summary([
      'path'              => 'Verein/Fest',
      'title'             => 'Sommerfest',
      'description'       => 'Mit Grill',
      'chronicle_id'      => 'urn:uuid:1',
      'imageCount'        => 2,
      'previewThumbnail'  => '20250101_000000_aaaaaaaa_t.webp',
      'consent_collected' => true,
      'hasPart'           => [['name' => '20250101_000000_aaaaaaaa_n.webp']],
    ]);

    $this->assertSame([
      '@type'       => 'ImageGallery',
      '@id'         => 'https://share.erfindergeist.org/galerie/Verein/Fest',
      'path'        => 'Verein/Fest',
      'name'        => 'Sommerfest',
      'imageCount'  => 2,
      'description' => 'Mit Grill',
      'chronicleId' => 'urn:uuid:1',
      'preview'     => 'Verein/Fest/20250101_000000_aaaaaaaa_t.webp',
    ], $summary);
  }

  public function testGallerySummaryOmitsEmptyOptionalFields(): void
  {
    $summary = eg_gallery_summary(['path' => 'A', 'title' => 'A', 'description' => '', 'chronicle_id' => '']);

    $this->assertSame(['@type', '@id', 'path', 'name', 'imageCount'], array_keys((array) $summary));
    $this->assertSame(0, $summary['imageCount'] ?? null);
  }

  public function testGallerySummaryEncodesPathSegmentsInId(): void
  {
    $summary = eg_gallery_summary(['path' => 'Freunde/Ömmesönz-ReUse-Laden in Jülich', 'title' => 'Ö']);

    $this->assertSame(
        'https://share.erfindergeist.org/galerie/Freunde/%C3%96mmes%C3%B6nz-ReUse-Laden%20in%20J%C3%BClich',
        $summary['@id'] ?? null
    );
    $this->assertSame('Freunde/Ömmesönz-ReUse-Laden in Jülich', $summary['path'] ?? null);
  }

  public function testGallerySummaryRejectsAlbumsWithoutPathOrTitle(): void
  {
    $this->assertNull(eg_gallery_summary(['path' => 'A']));
    $this->assertNull(eg_gallery_summary(['title' => 'A']));
    $this->assertNull(eg_gallery_summary(['path' => 'A', 'title' => ['kein', 'string']]));
  }

  public function testGalleryDataWithoutFileIsEmpty(): void
  {
    $this->assertSame([], eg_gallery_data($this->root));
  }

  public function testGalleryDataWithInvalidJsonIsEmpty(): void
  {
    $this->writeConfig('galerie.json', '{kaputt');

    $this->assertSame([], eg_gallery_data($this->root));
  }

  public function testGalleryDataSkipsInvalidAlbumsAndDropsImageLists(): void
  {
    $this->writeConfig('galerie.json', $this->catalog([
      ['path' => 'A', 'title' => 'Album A', 'hasPart' => [['name' => '20250101_000000_aaaaaaaa_n.webp']]],
      ['path' => 'B'],
      'kein Objekt',
    ]) + ['name' => 'Galerie', 'description' => 'Fotos']);

    $data = eg_gallery_data($this->root);

    $this->assertSame('DataCatalog', $data['@type']);
    $this->assertSame('Galerie', $data['name']);
    $this->assertCount(1, $data['hasPart']);
    $this->assertSame('Album A', $data['hasPart'][0]['name']);
    $this->assertArrayNotHasKey('hasPart', $data['hasPart'][0]);
  }

  // --- downloads.json ------------------------------------------------------

  public function testDownloadsConfigMissingFileHasNoFolders(): void
  {
    $this->assertSame(['folders' => [], 'errors' => []], eg_read_downloads_config("$this->root/config/downloads.json"));
  }

  public function testDownloadsConfigInvalidJson(): void
  {
    $this->writeConfig('downloads.json', '[kaputt');

    $config = eg_read_downloads_config("$this->root/config/downloads.json");

    $this->assertSame(['config/downloads.json: Kein valides JSON'], $config['errors']);
  }

  public function testDownloadsConfigReportsJsonLdErrorsAndKeysFoldersByPath(): void
  {
    $this->writeConfig('downloads.json', ['hasPart' => [
      ['path' => '', 'name' => 'Root'],
      ['path' => 'Verein', 'name' => 'Verein'],
      ['name' => 'ohne path'],
    ]]);

    $config = eg_read_downloads_config("$this->root/config/downloads.json");

    $this->assertSame(['', 'Verein'], array_map('strval', array_keys($config['folders'])));
    $this->assertCount(3, $config['errors']);
    $this->assertStringContainsString('@context fehlt', $config['errors'][0]);
  }

  public function testLoadDownloadsMetaMapsScanPathToFolder(): void
  {
    $this->writeConfig('downloads.json', $this->catalog([
      ['path' => 'Verein', 'description' => 'Vereinsdokumente', 'hasPart' => [
        ['title' => 'satzung.pdf', 'description' => 'Satzung', 'link_ids' => ['urn:uuid:1'], 'tags' => ['verein']],
      ]],
    ]));

    $meta = eg_load_downloads_meta($this->root, 'downloads/Verein');

    $this->assertSame('Vereinsdokumente', $meta['description']);
    $this->assertSame(
        ['satzung.pdf' => ['description' => 'Satzung', 'link_ids' => ['urn:uuid:1'], 'tags' => ['verein']]],
        $meta['parts']
    );
    $this->assertSame([], $meta['errors']);
  }

  public function testLoadDownloadsMetaReportsFileErrorsOnlyAtRoot(): void
  {
    $this->writeConfig('downloads.json', ['hasPart' => [['path' => 'Verein']]]);

    $this->assertNotEmpty(eg_load_downloads_meta($this->root, 'downloads')['errors']);
    $this->assertSame([], eg_load_downloads_meta($this->root, 'downloads/Verein')['errors']);
  }

  public function testLoadDownloadsMetaUnknownFolderIsEmpty(): void
  {
    $this->writeConfig('downloads.json', $this->catalog([]));

    $this->assertSame(
        ['description' => '', 'parts' => [], 'errors' => []],
        eg_load_downloads_meta($this->root, 'downloads/Gibtsnicht')
    );
  }

  public function testParseMetaPartsValidatesTitleAndFiltersNonStrings(): void
  {
    $parsed = eg_parse_meta_parts([
      ['title' => 'a.pdf', 'tags' => ['ok', 42, null], 'link_ids' => 'urn:uuid:1'],
      ['description' => 'ohne Titel'],
    ], 'config/downloads.json [Verein]', []);

    $this->assertSame(['description' => '', 'link_ids' => ['urn:uuid:1'], 'tags' => ['ok']], $parsed['parts']['a.pdf']);
    $this->assertSame(["config/downloads.json [Verein]: hasPart[1] hat kein 'title'-Feld"], $parsed['errors']);
  }

  public function testValidateMetaJsonLd(): void
  {
    $this->assertSame([], eg_validate_meta_jsonld($this->catalog([]), 'f', []));
    $this->assertSame(
        ['f: @context fehlt', "f: @type muss 'DataCatalog' sein", 'f: @id fehlt'],
        eg_validate_meta_jsonld(['@type' => 'ItemList'], 'f', [])
    );
  }

  public function testScanAndFlattenDownloadsAttachesMetadata(): void
  {
    $this->writeDownload('Marketing/Bierdeckel/vorne.svg', '<svg/>');
    $this->writeDownload('Marketing/Bierdeckel/_meta.json', '{}');
    $this->writeDownload('Verein/satzung.pdf');
    $this->writeDownload('Verein/notizen.exe');
    $this->writeDownload('readme.md');
    $this->writeConfig('downloads.json', $this->catalog([
      ['path' => 'Marketing/Bierdeckel', 'hasPart' => [['title' => 'vorne.svg', 'description' => 'Vorderseite']]],
    ]));

    $tree = eg_scan_downloads_node($this->root, 'downloads', ['svg', 'pdf', 'md']);
    $flat = eg_flatten_downloads($tree);

    $byName = array_column($flat['entries'], null, 'name');
    $this->assertSame(['readme.md', 'satzung.pdf', 'vorne.svg'], $this->sorted(array_keys($byName)));
    $this->assertSame('Vorderseite', $byName['vorne.svg']['description']);
    $this->assertSame('Marketing/Bierdeckel', $byName['vorne.svg']['folder']);
    $this->assertSame('downloads/Marketing/Bierdeckel/vorne.svg', $byName['vorne.svg']['path']);
    $this->assertSame('image/svg+xml', $byName['vorne.svg']['encodingFormat']);
    $this->assertSame('', $byName['readme.md']['folder']);
    $this->assertSame([], $flat['errors']);
  }

  public function testExtractFilterValues(): void
  {
    $filters = eg_extract_filter_values([
      ['folder' => 'Marketing/Bierdeckel'],
      ['folder' => 'Angebote/Repaircafe/hoch'],
      ['folder' => 'Angebote/Werkstatt'],
      ['folder' => ''],
    ]);

    $this->assertSame([
      'bereiche' => ['Angebote', 'Marketing'],
      'themen'   => ['Bierdeckel', 'Repaircafe', 'Werkstatt'],
      'gruppen'  => ['hoch'],
    ], $filters);
  }

  // --- config section ------------------------------------------------------

  public function testConfigDataListsAllFilesButOmitsLargeCatalogsFromContent(): void
  {
    foreach (['chronicle', 'links', 'tags', 'downloads', 'galerie'] as $name) {
      $this->writeConfig("$name.json", ['@type' => $name]);
    }
    file_put_contents("$this->root/config/.htaccess", 'Options -Indexes');
    $this->writeConfig('kaputt.json', '{');

    $data = eg_config_data($this->root);

    $this->assertSame(
        ['chronicle.json', 'downloads.json', 'galerie.json', 'kaputt.json', 'links.json', 'tags.json'],
        array_column($data['files'], 'name')
    );
    $this->assertSame(['chronicle', 'links', 'tags'], array_keys($data['content']));
    $this->assertSame(['@type' => 'links'], $data['content']['links']);
  }

  /**
   * @param string[] $values
   * @return string[]
   */
  private function sorted(array $values): array
  {
    sort($values);
    return $values;
  }
}
