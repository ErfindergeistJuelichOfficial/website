<?php

declare(strict_types=1);

define('EG_SHARE_BASE_URL', 'https://share.erfindergeist.org');

require_once __DIR__ . '/variables.php';

/** Map file extension to MIME type. */
function eg_mime(string $ext): string
{
  static $map = [
    'pdf'   => 'application/pdf',
    'docx'  => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx'  => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'pptx'  => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'odt'   => 'application/vnd.oasis.opendocument.text',
    'ods'   => 'application/vnd.oasis.opendocument.spreadsheet',
    'odp'   => 'application/vnd.oasis.opendocument.presentation',
    'odg'   => 'application/vnd.oasis.opendocument.graphics',
    'md'    => 'text/markdown',
    'yml'   => 'application/yaml',
    'yaml'  => 'application/yaml',
    'json'  => 'application/json',
    'svg'   => 'image/svg+xml',
    'png'   => 'image/png',
    'jpg'   => 'image/jpeg',
    'jpeg'  => 'image/jpeg',
    'gif'   => 'image/gif',
    'webp'  => 'image/webp',
    'css'   => 'text/css',
    'js'    => 'application/javascript',
    'ttf'   => 'font/ttf',
    'otf'   => 'font/otf',
    'woff'  => 'font/woff',
    'woff2' => 'font/woff2',
    'eot'   => 'application/vnd.ms-fontobject',
  ];
  return $map[$ext] ?? 'application/octet-stream';
}

/**
 * Build a Schema.org MediaObject entry for a single file.
 *
 * @param string[] $linkIds
 * @param string[] $tags
 * @return array<string,mixed>
 */
function eg_file_entry(string $name, string $rel_path, string $abs_path, string $description = '', array $linkIds = [], array $tags = []): array
{
  $ext   = strtolower(pathinfo($name, PATHINFO_EXTENSION));
  $entry = [
    '@type'          => 'MediaObject',
    'name'           => $name,
    'path'           => $rel_path,
    'contentUrl'     => EG_SHARE_BASE_URL . '/' . $rel_path,
    'encodingFormat' => eg_mime($ext),
    'contentSize'    => (int) filesize($abs_path),
  ];
  if ($description !== '') {
    $entry['description'] = $description;
  }
  $entry['link_ids'] = $linkIds;
  $entry['tags']     = $tags;
  return $entry;
}

/**
 * Flat (non-recursive) scan of a single directory.
 *
 * @param string[] $allowed_ext  Only include these extensions; empty = all files.
 * @return array<array<string,mixed>>
 * @SuppressWarnings(PHPMD.CyclomaticComplexity)
 */
function eg_scan_flat(string $base, string $rel, array $allowed_ext = []): array
{
  $abs    = "$base/$rel";
  $handle = is_dir($abs) ? opendir($abs) : false;
  if ($handle === false) {
    return [];
  }
  $files = [];
  while (false !== ($name = readdir($handle))) {
    if ($name === '.' || $name === '..') {
      continue;
    }
    $full = "$abs/$name";
    if (!is_file($full) || str_starts_with($name, '.')) {
      continue;
    }
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    if ($allowed_ext !== [] && !in_array($ext, $allowed_ext, true)) {
      continue;
    }
    $files[] = eg_file_entry($name, "$rel/$name", $full);
  }
  closedir($handle);
  usort($files, static fn (array $left, array $right): int => strnatcasecmp($left['name'], $right['name']));
  return $files;
}

/**
 * Recursive scan of a directory tree (e.g. js/ with lib/ and components/).
 *
 * @param string[] $allowed_ext  Only include these extensions; empty = all files.
 * @return array<array<string,mixed>>
 * @SuppressWarnings(PHPMD.MissingImport)
 */
function eg_scan_recursive(string $base, string $rel, array $allowed_ext = []): array
{
  $abs = "$base/$rel";
  if (!is_dir($abs)) {
    return [];
  }
  $files = [];
  try {
    $dir  = new RecursiveDirectoryIterator($abs, RecursiveDirectoryIterator::SKIP_DOTS);
    $iter = new RecursiveIteratorIterator($dir);
    foreach ($iter as $file) {
      if (!$file->isFile()) {
        continue;
      }
      $name = $file->getFilename();
      if (str_starts_with($name, '.')) {
        continue;
      }
      $ext = strtolower($file->getExtension());
      if ($allowed_ext !== [] && !in_array($ext, $allowed_ext, true)) {
        continue;
      }
      $absFile = str_replace('\\', '/', $file->getPathname());
      $absBase = str_replace('\\', '/', $abs);
      $subRel  = $rel . '/' . substr($absFile, strlen($absBase) + 1);
      $files[] = eg_file_entry($name, $subRel, $file->getPathname());
    }
  } catch (UnexpectedValueException $e) {
    // unreadable subdirectory - skip silently
  }
  usort($files, static fn (array $left, array $right): int => strnatcasecmp($left['name'], $right['name']));
  return $files;
}

/** True if a directory entry should be skipped in the downloads scan. */
function eg_is_hidden_entry(string $name): bool
{
  return str_starts_with($name, '.') || $name === '_meta.json';
}

/** True if the file's extension is in the allowed list (or list is empty). */
function eg_ext_allowed(string $filename, array $allowed_ext): bool
{
  return $allowed_ext === [] || in_array(strtolower(pathinfo($filename, PATHINFO_EXTENSION)), $allowed_ext, true);
}

/**
 * Validate JSON-LD required fields and append errors.
 *
 * @param array<string,mixed> $data
 * @param string[] $errors
 * @return string[]
 */
function eg_validate_meta_jsonld(array $data, string $rel_dir, array $errors): array
{
  if (empty($data['@context'])) {
    $errors[] = "$rel_dir/_meta.json: @context fehlt";
  }
  if (($data['@type'] ?? '') !== 'DataCatalog') {
    $errors[] = "$rel_dir/_meta.json: @type muss 'DataCatalog' sein";
  }
  if (empty($data['@id'])) {
    $errors[] = "$rel_dir/_meta.json: @id fehlt";
  }
  return $errors;
}

/**
 * Parse hasPart items from _meta.json and append validation errors.
 *
 * @param array<mixed> $hasPart
 * @param string[] $errors
 * @return array{parts: array<string,array{description:string,link_ids:string[],tags:string[]}>, errors: string[]}
 */
function eg_parse_meta_parts(array $hasPart, string $rel_dir, array $errors): array
{
  $parts = [];
  foreach ($hasPart as $idx => $part) {
    if (!is_array($part) || !isset($part['title']) || !is_string($part['title'])) {
      $errors[] = "$rel_dir/_meta.json: hasPart[$idx] hat kein 'title'-Feld";
      continue;
    }
    $parts[$part['title']] = [
      'description' => (isset($part['description']) && is_string($part['description'])) ? $part['description'] : '',
      'link_ids'    => array_values(array_filter((array) ($part['link_ids'] ?? []), 'is_string')),
      'tags'        => array_values(array_filter((array) ($part['tags']     ?? []), 'is_string')),
    ];
  }
  return ['parts' => $parts, 'errors' => $errors];
}

/**
 * Load and validate _meta.json from a downloads folder.
 *
 * @return array{description:string, parts:array<string,array{description:string,wikiUrl:string,rawUrl:string,cloudUrl:string,blogUrl:string}>, errors:string[]}
 */
function eg_load_downloads_meta(string $abs_dir, string $rel_dir): array
{
  $result = ['description' => '', 'parts' => [], 'errors' => []];
  $path   = "$abs_dir/_meta.json";
  if (!is_file($path)) {
    return $result;
  }
  $raw = file_get_contents($path);
  if ($raw === false) {
    $result['errors'][] = "$rel_dir/_meta.json: Datei nicht lesbar";
    return $result;
  }
  $data = json_decode($raw, true);
  if (!is_array($data)) {
    $result['errors'][] = "$rel_dir/_meta.json: Kein valides JSON";
    return $result;
  }
  $result['errors'] = eg_validate_meta_jsonld($data, $rel_dir, $result['errors']);
  if (isset($data['description']) && is_string($data['description'])) {
    $result['description'] = $data['description'];
  }
  if (isset($data['hasPart']) && is_array($data['hasPart'])) {
    $parsed           = eg_parse_meta_parts($data['hasPart'], $rel_dir, $result['errors']);
    $result['parts']  = $parsed['parts'];
    $result['errors'] = $parsed['errors'];
  }
  return $result;
}

/**
 * Read direct children of a downloads directory into file names and subdir names.
 *
 * @param string[] $allowed_ext
 * @return array{files: string[], subdirs: string[]}
 */
function eg_read_downloads_dir(string $abs_dir, array $allowed_ext): array
{
  $files   = [];
  $subdirs = [];
  $handle  = opendir($abs_dir);
  if ($handle === false) {
    return ['files' => $files, 'subdirs' => $subdirs];
  }
  while (false !== ($entry = readdir($handle))) {
    if ($entry === '.' || $entry === '..' || eg_is_hidden_entry($entry)) {
      continue;
    }
    $full = "$abs_dir/$entry";
    if (is_dir($full)) {
      $subdirs[] = $entry;
    } elseif (is_file($full) && eg_ext_allowed($entry, $allowed_ext)) {
      $files[] = $entry;
    }
  }
  closedir($handle);
  return ['files' => $files, 'subdirs' => $subdirs];
}

/**
 * Recursively scan a downloads directory and build a JSON-LD DataCatalog tree.
 *
 * @param string[] $allowed_ext
 * @return array<string,mixed>
 */
function eg_scan_downloads_node(string $base, string $rel, array $allowed_ext): array
{
  $abs  = "$base/$rel";
  $node = [
    '@type'       => 'DataCatalog',
    'name'        => basename($rel),
    'path'        => $rel,
    'description' => '',
    'files'       => [],
    'folders'     => [],
    'errors'      => [],
  ];
  if (!is_dir($abs)) {
    return $node;
  }
  $meta                = eg_load_downloads_meta($abs, $rel);
  $node['description'] = $meta['description'];
  $node['errors']      = $meta['errors'];

  $dir = eg_read_downloads_dir($abs, $allowed_ext);
  foreach ($dir['files'] as $filename) {
    $partMeta        = $meta['parts'][$filename] ?? ['description' => '', 'link_ids' => [], 'tags' => []];
    $node['files'][] = eg_file_entry($filename, "$rel/$filename", "$abs/$filename", $partMeta['description'], $partMeta['link_ids'], $partMeta['tags']);
  }
  usort($node['files'], static fn (array $left, array $right): int => strnatcasecmp($left['name'], $right['name']));
  sort($dir['subdirs']);
  foreach ($dir['subdirs'] as $sub) {
    $node['folders'][] = eg_scan_downloads_node($base, "$rel/$sub", $allowed_ext);
  }
  return $node;
}

/**
 * Flatten a DataCatalog downloads tree into a list of file entries and collect errors.
 *
 * @param array<string,mixed> $node
 * @return array{entries: array<array{name:string,path:string,folder:string,description:string,link_ids:string[],tags:string[],encodingFormat:string}>, errors: string[]}
 */
function eg_flatten_downloads(array $node, string $folderRel = ''): array
{
  $entries = [];
  $errors  = array_values((array) ($node['errors'] ?? []));

  foreach ((array) ($node['files'] ?? []) as $file) {
    if (!is_array($file)) {
      continue;
    }
    $entries[] = [
      'name'           => (string) ($file['name']           ?? ''),
      'path'           => (string) ($file['path']           ?? ''),
      'folder'         => $folderRel,
      'description'    => (string) ($file['description']    ?? ''),
      'link_ids'       => array_values((array) ($file['link_ids'] ?? [])),
      'tags'           => array_values((array) ($file['tags']     ?? [])),
      'encodingFormat' => (string) ($file['encodingFormat'] ?? ''),
    ];
  }

  foreach ((array) ($node['folders'] ?? []) as $sub) {
    if (!is_array($sub)) {
      continue;
    }
    $subName = (string) ($sub['name'] ?? '');
    $subRel  = $folderRel !== '' ? "$folderRel/$subName" : $subName;
    $child   = eg_flatten_downloads($sub, $subRel);
    $entries = array_merge($entries, $child['entries']);
    $errors  = array_merge($errors, $child['errors']);
  }

  return ['entries' => $entries, 'errors' => $errors];
}

/**
 * Extract sorted unique Bereich/Thema/Gruppe values from a flat entries list.
 *
 * @param array<array{folder:string}> $entries
 * @return array{bereiche:string[],themen:string[],gruppen:string[]}
 */
function eg_extract_filter_values(array $entries): array
{
  $bereiche = [];
  $themen   = [];
  $gruppen  = [];
  foreach ($entries as $e) {
    if ($e['folder'] === '') {
      continue;
    }
    $parts = explode('/', $e['folder']);
    if (($parts[0] ?? '') !== '') {
      $bereiche[] = $parts[0];
    }
    if (($parts[1] ?? '') !== '') {
      $themen[] = $parts[1];
    }
    if (($parts[2] ?? '') !== '') {
      $gruppen[] = $parts[2];
    }
  }
  foreach ([&$bereiche, &$themen, &$gruppen] as &$arr) {
    $arr = array_values(array_unique($arr));
    sort($arr);
  }
  unset($arr);
  return ['bereiche' => $bereiche, 'themen' => $themen, 'gruppen' => $gruppen];
}

/**
 * Build a name => {htmls, pdfs} map from presentations items.
 *
 * @param array<array<string,mixed>> $items
 * @return array<string,array{htmls:string[],pdfs:string[]}>
 */
function eg_build_pres_entries(array $items): array
{
  $result = [];
  foreach ($items as $item) {
    $htmls = [];
    $pdfs  = [];
    foreach ((array) ($item['hasPart'] ?? []) as $part) {
      if (!is_array($part)) {
        continue;
      }
      $name = (string) ($part['name'] ?? '');
      $ext  = strtolower(pathinfo($name, PATHINFO_EXTENSION));
      if ($ext === 'html') {
        $htmls[] = $name;
      } elseif ($ext === 'pdf') {
        $pdfs[] = $name;
      }
    }
    sort($htmls);
    sort($pdfs);
    $result[(string) ($item['name'] ?? '')] = ['htmls' => $htmls, 'pdfs' => $pdfs];
  }
  return $result;
}

/**
 * Load share/galerie/_index.json as a decoded array.
 * Returns an empty array when the file is missing or invalid.
 *
 * @return array<string,mixed>
 */
function eg_gallery_data(string $root): array
{
  $path = "$root/galerie/_index.json";
  if (!is_file($path)) {
    return [];
  }
  $raw = file_get_contents($path);
  if ($raw === false) {
    return [];
  }
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

/**
 * Build all view data needed by index.php in a single call.
 *
 * @return array{
 *   entries:        array<array{name:string,path:string,folder:string,description:string,link_ids:string[],tags:string[],encodingFormat:string}>,
 *   dl_errors:      string[],
 *   bereiche:       string[],
 *   themen:         string[],
 *   gruppen:        string[],
 *   img_entries:    string[],
 *   qr_entries:     string[],
 *   config_entries: string[],
 *   pres_entries:   array<string,array{htmls:string[],pdfs:string[]}>,
 *   gallery_data:   array<string,mixed>,
 *   chronicle_data: array<string,mixed>,
 *   links_data:     array<string,mixed>,
 * }
 */
function eg_page_data(): array
{
  $api       = eg_assets_data();
  $downloads = eg_flatten_downloads($api['assets']['downloads']);
  $filters   = eg_extract_filter_values($downloads['entries']);

  return [
    'entries'        => $downloads['entries'],
    'dl_errors'      => $downloads['errors'],
    'bereiche'       => $filters['bereiche'],
    'themen'         => $filters['themen'],
    'gruppen'        => $filters['gruppen'],
    'img_entries'    => array_column($api['assets']['img']['files'], 'name'),
    'qr_entries'     => array_column($api['assets']['qr']['files'], 'name'),
    'config_entries' => array_column($api['assets']['config']['files'], 'name'),
    'pres_entries'   => eg_build_pres_entries($api['assets']['presentations']['items']),
    'gallery_data'   => eg_gallery_data(__DIR__),
    'chronicle_data' => $api['assets']['config']['content']['chronicle'] ?? [],
    'links_data'     => $api['assets']['config']['content']['links'] ?? [],
  ];
}

/**
 * Scan config/ and return files list plus parsed JSON content of each file.
 *
 * @return array{files: array<array<string,mixed>>, content: array<string,mixed>}
 * @SuppressWarnings(PHPMD.CyclomaticComplexity)
 */
function eg_config_data(string $root): array
{
  $abs    = "$root/config";
  $handle = is_dir($abs) ? opendir($abs) : false;
  if ($handle === false) {
    return ['files' => [], 'content' => []];
  }
  $files   = [];
  $content = [];
  while (false !== ($name = readdir($handle))) {
    if ($name === '.' || $name === '..') {
      continue;
    }
    $full = "$abs/$name";
    if (!is_file($full) || strtolower(pathinfo($name, PATHINFO_EXTENSION)) !== 'json') {
      continue;
    }
    $files[] = eg_file_entry($name, "config/$name", $full);
    $raw     = file_get_contents($full);
    if ($raw === false) {
      continue;
    }
    $parsed = json_decode($raw, true);
    if ($parsed === null) {
      continue;
    }
    $content[pathinfo($name, PATHINFO_FILENAME)] = $parsed;
  }
  closedir($handle);
  usort($files, static fn (array $left, array $right): int => strnatcasecmp($left['name'], $right['name']));
  ksort($content);
  return ['files' => $files, 'content' => $content];
}

/**
 * Scan presentations/ and return one item per subfolder (with optional PDF part).
 *
 * @return array{items: array<array<string,mixed>>}
 * @SuppressWarnings(PHPMD.CyclomaticComplexity)
 */
function eg_presentations_data(string $root): array
{
  $abs    = "$root/presentations";
  $handle = is_dir($abs) ? opendir($abs) : false;
  if ($handle === false) {
    return ['items' => []];
  }
  $items = [];
  while (false !== ($entry = readdir($handle))) {
    if ($entry === '.' || $entry === '..') {
      continue;
    }
    $dir = "$abs/$entry";
    if (!is_dir($dir)) {
      continue;
    }
    $item = [
      '@type'   => 'PresentationDigitalDocument',
      'name'    => $entry,
      'url'     => EG_SHARE_BASE_URL . '/presentations/' . rawurlencode($entry) . '/',
      'hasPart' => [],
    ];
    $dirHandle = opendir($dir);
    if ($dirHandle !== false) {
      while (false !== ($presFile = readdir($dirHandle))) {
        if (!is_file("$dir/$presFile")) {
          continue;
        }
        $ext = strtolower(pathinfo($presFile, PATHINFO_EXTENSION));
        if ($ext !== 'pdf' && $ext !== 'html') {
          continue;
        }
        $item['hasPart'][] = eg_file_entry($presFile, "presentations/$entry/$presFile", "$dir/$presFile");
      }
      closedir($dirHandle);
    }
    $items[] = $item;
  }
  closedir($handle);
  usort($items, static fn (array $left, array $right): int => strnatcasecmp($left['name'], $right['name']));
  return ['items' => $items];
}

/**
 * Build the complete JSON-LD asset catalog.
 *
 * @return array<string,mixed>
 */
function eg_assets_data(): array
{
  $root = __DIR__;
  return [
    '@context'    => 'https://schema.org',
    '@type'       => 'DataCatalog',
    '@id'         => EG_SHARE_BASE_URL . '/api/v1/assets',
    'name'        => 'Erfindergeist Jülich - Asset Catalog',
    'description' => 'Zentrale Asset-Bibliothek des Erfindergeist Jülich e.V. '
      . 'mit Logos, Schriften, QR-Codes, JavaScript-Bibliotheken und Konfigurationsdaten.',
    'publisher'   => [
      '@type' => 'Organization',
      'name'  => 'Erfindergeist Jülich e.V.',
      'url'   => 'https://erfindergeist.org',
    ],
    'license'      => 'https://creativecommons.org/licenses/by/4.0/',
    'dateModified' => gmdate('Y-m-d\TH:i:s\Z'),
    'version'      => '1',
    'assets'       => [
      'css'           => ['files' => eg_scan_flat($root, 'css', ['css'])],
      'fonts'         => ['files' => eg_scan_flat($root, 'fonts', ['ttf', 'otf', 'woff', 'woff2', 'eot'])],
      'img'           => ['files' => eg_scan_flat($root, 'img', ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'])],
      'js'            => ['files' => eg_scan_recursive($root, 'js', ['js'])],
      'qr'            => ['files' => eg_scan_flat($root, 'qr', ['svg', 'png', 'jpg', 'jpeg'])],
      'downloads'     => eg_scan_downloads_node($root, 'downloads', EG_DOWNLOAD_EXT),
      'config'        => eg_config_data($root),
      'presentations' => eg_presentations_data($root),
      'gallery'       => eg_gallery_data($root),
    ],
  ];
}

/** Send a JSON error response. */
function eg_api_error(int $code, string $message): void
{
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo '{"error":"' . $message . '"}';
}

/** HTTP request handler - only runs when api.php is the entry point. */
function eg_handle_request(): void
{
  $method = (string)($_SERVER['REQUEST_METHOD'] ?? 'GET');

  if ($method === 'OPTIONS') {
    http_response_code(204);
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Max-Age: 86400');
    return;
  }

  if ($method !== 'GET') {
    eg_api_error(405, 'Method Not Allowed');
    return;
  }

  header('Content-Type: application/ld+json; charset=utf-8');
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, OPTIONS');
  header('Cache-Control: public, max-age=300');

  try {
    $flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT | JSON_INVALID_UTF8_SUBSTITUTE;
    $json  = json_encode(eg_assets_data(), $flags);
    if ($json === false) {
      eg_api_error(500, 'Encoding failed: ' . json_last_error_msg());
      return;
    }
    echo $json;
  } catch (\Throwable $e) {
    eg_api_error(500, $e->getMessage());
  }
}

if (!defined('EG_API_INCLUDED')) {
  eg_handle_request();
}
