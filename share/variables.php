<?php

declare(strict_types=1);

/** Allowed file extensions for the downloads tab. */
const EG_DOWNLOAD_EXT = [
  'pdf', 'docx', 'xlsx', 'pptx',
  'odt', 'ods', 'odp', 'odg',
  'md', 'yml', 'yaml',
  'svg', 'png', 'jpg', 'jpeg',
];

/** Lucide icon name per file extension (used in download templates). */
const EG_ICON_MAP = [
  'pdf'  => 'file-text',      'docx' => 'file-type-2',
  'xlsx' => 'file-spreadsheet', 'pptx' => 'presentation',
  'odt'  => 'file-type-2',    'ods'  => 'file-spreadsheet',
  'odp'  => 'presentation',   'odg'  => 'image',
  'md'   => 'book-open',      'yml'  => 'file-code',
  'yaml' => 'file-code',      'svg'  => 'image',
  'png'  => 'image',          'jpg'  => 'image',
  'jpeg' => 'image',
];

/** CSS modifier class per file extension (drives .file-badge coloring). */
const EG_CLASS_MAP = [
  'pdf'  => 'pdf',   'docx' => 'docx',
  'xlsx' => 'xlsx',  'pptx' => 'pptx',
  'odt'  => 'odt',   'ods'  => 'ods',
  'odp'  => 'odp',   'odg'  => 'odg',
  'md'   => 'md',    'yml'  => 'code',
  'yaml' => 'code',  'svg'  => 'img',
  'png'  => 'img',   'jpg'  => 'img',
  'jpeg' => 'img',
];
