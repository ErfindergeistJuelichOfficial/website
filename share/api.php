<?php

declare(strict_types=1);

define('EG_SHARE_BASE_URL', 'https://share.erfindergeist.org');

/** Map file extension to MIME type. */
function eg_mime(string $ext): string
{
  static $map = [
    'pdf'   => 'application/pdf',
    'docx'  => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
 * @return array<string,mixed>
 */
function eg_file_entry(string $name, string $rel_path, string $abs_path): array
{
  $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
  return [
    '@type'          => 'MediaObject',
    'name'           => $name,
    'path'           => $rel_path,
    'contentUrl'     => EG_SHARE_BASE_URL . '/' . $rel_path,
    'encodingFormat' => eg_mime($ext),
    'contentSize'    => (int) filesize($abs_path),
  ];
}

/**
 * Flat (non-recursive) scan of a single directory.
 *
 * @param string[] $allowed_ext  Only include these extensions; empty = all files.
 * @return array<array<string,mixed>>
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
  usort($files, static fn (array $a, array $b): int => strnatcasecmp($a['name'], $b['name']));
  return $files;
}

/**
 * Recursive scan of a directory tree (e.g. js/ with lib/ and components/).
 *
 * @param string[] $allowed_ext  Only include these extensions; empty = all files.
 * @return array<array<string,mixed>>
 */
function eg_scan_recursive(string $base, string $rel, array $allowed_ext = []): array
{
  $abs = "$base/$rel";
  if (!is_dir($abs)) {
    return [];
  }
  $files = [];
  try {
    $it = new RecursiveIteratorIterator(
      new RecursiveDirectoryIterator($abs, RecursiveDirectoryIterator::SKIP_DOTS)
    );
    foreach ($it as $file) {
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
  } catch (\UnexpectedValueException $e) {
    // unreadable subdirectory - skip silently
  }
  usort($files, static fn (array $a, array $b): int => strnatcasecmp($a['name'], $b['name']));
  return $files;
}

/**
 * Scan config/ and return files list plus parsed JSON content of each file.
 *
 * @return array{files: array<array<string,mixed>>, content: array<string,mixed>}
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
  usort($files, static fn (array $a, array $b): int => strnatcasecmp($a['name'], $b['name']));
  ksort($content);
  return ['files' => $files, 'content' => $content];
}

/**
 * Scan presentations/ and return one item per subfolder (with optional PDF part).
 *
 * @return array{items: array<array<string,mixed>>}
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
    $dh = opendir($dir);
    if ($dh !== false) {
      while (false !== ($pf = readdir($dh))) {
        if (!is_file("$dir/$pf")) {
          continue;
        }
        if (strtolower(pathinfo($pf, PATHINFO_EXTENSION)) !== 'pdf') {
          continue;
        }
        $item['hasPart'][] = eg_file_entry($pf, "presentations/$entry/$pf", "$dir/$pf");
      }
      closedir($dh);
    }
    $items[] = $item;
  }
  closedir($handle);
  usort($items, static fn (array $a, array $b): int => strnatcasecmp($a['name'], $b['name']));
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
      'downloads'     => ['files' => eg_scan_flat($root, 'downloads', ['pdf', 'docx', 'md', 'yml', 'yaml', 'svg', 'png', 'jpg', 'jpeg'])],
      'config'        => eg_config_data($root),
      'presentations' => eg_presentations_data($root),
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
