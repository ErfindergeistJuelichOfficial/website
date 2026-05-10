<!DOCTYPE html>
<html lang="de" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <title>Downloads — Erfindergeist Jülich</title>
  <link rel="stylesheet" href="https://share.erfindergeist.org/css/bootstrap.min.css">
  <style>
    :root {
      --color-primary:        #159989;
      --color-primary-dark:   #107c6f;
      --color-primary-light:  #e6f5f3;
      --color-secondary:      #F9B338;
      --color-secondary-light:#fef6e4;
      --color-bg:             #f6fbfa;
      --color-surface:        #ffffff;
      --color-text:           #1a2e2c;
      --color-text-muted:     #5a7a76;
      --color-border:         #d0e8e4;
      --color-shadow:         rgba(21,153,137,.12);
      --bs-primary:           #159989;
      --bs-primary-rgb:       21,153,137;
      --bs-secondary:         #F9B338;
      --bs-secondary-rgb:     249,179,56;
      --bs-link-color:        #159989;
      --bs-link-hover-color:  #107c6f;
    }

    [data-theme="dark"] {
      --color-bg:              #0f1a19;
      --color-surface:         #1a2e2c;
      --color-text:            #e8f5f3;
      --color-text-muted:      #7fb8b2;
      --color-border:          #2a4a46;
      --color-shadow:          rgba(0,0,0,.35);
      --color-primary-light:   #0d3530;
      --color-secondary-light: #2a1f08;
      /* Bootstrap variable overrides */
      --bs-body-bg:            #0f1a19;
      --bs-body-color:         #e8f5f3;
      --bs-secondary-color:    #7fb8b2;
      --bs-tertiary-bg:        #1a2e2c;
      --bs-border-color:       #2a4a46;
      color-scheme: dark;
    }
    [data-theme="dark"] body { background: var(--color-bg); color: var(--color-text); }
    [data-theme="dark"] .text-muted { color: var(--color-text-muted) !important; }
    [data-theme="dark"] .small.text-muted { color: var(--color-text-muted) !important; }
    [data-theme="dark"] .form-control {
      background: var(--color-surface);
      color: var(--color-text);
      border-color: var(--color-border);
    }
    [data-theme="dark"] .form-control::placeholder { color: var(--color-text-muted); }
    [data-theme="dark"] .form-control:focus {
      background: var(--color-surface);
      color: var(--color-text);
    }
    [data-theme="dark"] .nav-tabs { border-color: var(--color-border); }
    [data-theme="dark"] .nav-tabs .nav-link { color: var(--color-text-muted); }
    [data-theme="dark"] .nav-tabs .nav-link.active {
      color: var(--color-primary);
      background: var(--color-bg);
      border-color: var(--color-border) var(--color-border) var(--color-bg);
    }
    [data-theme="dark"] .nav-tabs .nav-link:hover { color: var(--color-primary); }

    body {
      background: var(--color-bg);
      color: var(--color-text);
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
    }

    /* ── Navbar ── */
    .eg-nav {
      background: var(--color-surface);
      border-bottom: 2px solid var(--color-border);
      box-shadow: 0 2px 12px var(--color-shadow);
    }
    .eg-nav-logo { height: 44px; width: auto; max-width: 100%; }
    .eg-nav-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-primary);
      text-decoration: none;
    }
    .eg-nav-name:hover { color: var(--color-primary-dark); }

    /* ── Page title ── */
    .page-title {
      font-size: clamp(1.6rem, 4vw, 2.2rem);
      font-weight: 700;
      color: var(--color-text);
    }

    /* ── Search ── */
    #file-search {
      border: 1.5px solid var(--color-border);
      border-radius: 10px;
      background: var(--color-surface);
      color: var(--color-text);
      font-size: .9rem;
    }
    #file-search:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(21,153,137,.15);
      outline: none;
    }

    /* ── File list item ── */
    .file-item {
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: 8px;
      padding: .63rem .77rem;
      display: flex;
      align-items: center;
      gap: .6rem;
      text-decoration: none;
      color: var(--color-text);
      transition: border-color .2s, box-shadow .2s, transform .15s;
    }
    .file-item:hover {
      border-color: var(--color-primary);
      box-shadow: 0 3px 12px var(--color-shadow);
      color: var(--color-text);
      transform: translateY(-1px);
    }
    .file-icon          { width: 26px; height: 26px; flex-shrink: 0; }
    .file-icon.pdf      { color: #e53935; }
    .file-icon.docx     { color: #1565c0; }
    .file-icon.img      { color: #6a1b9a; }
    .file-icon.code     { color: #2e7d32; }
    .file-icon.md       { color: #37474f; }
    .file-icon.default  { color: var(--color-primary); }
    .file-name          { flex-grow: 1; font-weight: 500; word-break: break-word; }
    .file-badge {
      font-size: .72rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: .2rem .55rem;
      border-radius: 6px;
      flex-shrink: 0;
    }
    .file-badge.pdf     { background: #ffebee; color: #e53935; }
    .file-badge.docx    { background: #e3f2fd; color: #1565c0; }
    .file-badge.img     { background: #f3e5f5; color: #6a1b9a; }
    .file-badge.code    { background: #e8f5e9; color: #2e7d32; }
    .file-badge.md      { background: #eceff1; color: #37474f; }
    .file-badge.default { background: var(--color-primary-light); color: var(--color-primary); }
    .file-name    { font-size: .88rem; }
    .file-dl-icon { width: 14px; height: 14px; color: var(--color-text-muted); flex-shrink: 0; }

    /* ── Empty state ── */
    .empty-state { color: var(--color-text-muted); }
    .empty-state svg { width: 48px; height: 48px; opacity: .4; }

    /* ── Nav tabs ── */
    .nav-tabs { border-color: var(--color-border); }
    .nav-tabs .nav-link {
      color: var(--color-text-muted);
      border-color: transparent;
      font-weight: 500;
    }
    .nav-tabs .nav-link:hover {
      color: var(--color-primary);
      border-color: var(--color-border) var(--color-border) transparent;
    }
    .nav-tabs .nav-link.active {
      color: var(--color-primary);
      border-color: var(--color-border) var(--color-border) var(--color-bg);
      background: var(--color-bg);
      font-weight: 600;
    }

    /* ── Logo cards ── */
    .logo-card {
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: 10px;
      overflow: hidden;
      color: var(--color-text);
      transition: border-color .2s, box-shadow .2s;
      display: flex;
      flex-direction: column;
    }
    .logo-card:hover {
      border-color: var(--color-primary);
      box-shadow: 0 3px 12px var(--color-shadow);
    }
    .logo-card-preview {
      background: repeating-conic-gradient(#d8d8d8 0% 25%, #f8f8f8 0% 50%) 0 0 / 16px 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 120px;
      padding: .75rem;
      flex-shrink: 0;
    }
    .logo-card-preview img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .logo-card-name {
      padding: .45rem .75rem;
      font-size: .8rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }
    .logo-card-actions {
      display: flex;
      gap: .35rem;
      padding: .5rem .6rem;
      justify-content: flex-end;
    }
    .logo-card-actions .btn {
      width: 32px;
      height: 32px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .logo-card-actions .btn svg { width: 15px; height: 15px; }
    .logo-card-actions .file-badge { align-self: center; }

    /* ── Sponsoring ── */
    .sponsor-section {
      background: linear-gradient(160deg, var(--color-secondary-light) 0%, var(--color-bg) 100%);
      border: 1.5px solid var(--color-border);
      border-radius: 16px;
    }
    .sponsor-section h2 { color: var(--color-text); }
    .sponsor-item {
      display: flex;
      align-items: flex-start;
      gap: .75rem;
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: 12px;
      padding: .9rem 1rem;
      height: 100%;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
      transition: box-shadow .2s, border-color .2s;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }
    a.sponsor-item:hover {
      box-shadow: 0 4px 14px rgba(0,0,0,.12);
      border-color: var(--color-secondary);
    }
    .sponsor-item-icon { width: 26px; height: 26px; color: var(--color-secondary); flex-shrink: 0; margin-top: .1rem; }
    .sponsor-item-title {
      font-weight: 600;
      color: var(--color-text);
      text-decoration: none;
      display: block;
    }
    a.sponsor-item-title:hover { color: var(--color-primary); text-decoration: underline; }

    /* ── Bootstrap btn overrides ── */
    .btn-primary   { background: var(--color-primary); border-color: var(--color-primary); }
    .btn-primary:hover { background: var(--color-primary-dark); border-color: var(--color-primary-dark); }
    .btn-secondary { background: var(--color-secondary); border-color: var(--color-secondary); color: #1a2e2c; }
    .btn-secondary:hover { background: #e8a020; border-color: #e8a020; color: #1a2e2c; }

    /* ── Scroll-to-top ── */
    #scroll-top {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: var(--color-primary);
      border: 2px solid #fff;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px var(--color-shadow);
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transition: opacity .25s, background .2s, transform .2s;
      z-index: 1100;
    }
    #scroll-top.visible { opacity: 1; pointer-events: auto; }
    #scroll-top:hover { background: var(--color-primary-dark); transform: scale(1.1); }
    #scroll-top svg { width: 22px; height: 22px; }

    /* ── Theme toggle ── */
    .btn-icon {
      background: none;
      border: 1.5px solid var(--color-border);
      border-radius: 8px;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-muted);
      cursor: pointer;
      transition: background .2s, color .2s, border-color .2s;
      flex-shrink: 0;
      margin-left: auto;
      padding: 0;
    }
    .btn-icon:hover { background: var(--color-primary-light); color: var(--color-primary); border-color: var(--color-primary); }
    .btn-icon svg { width: 18px; height: 18px; }
    .icon-dark-only  { display: none; }
    .icon-light-only { display: block; }
    [data-theme="dark"] .icon-dark-only  { display: block; }
    [data-theme="dark"] .icon-light-only { display: none; }

    /* ── Dark mode: checkerboard ── */
    [data-theme="dark"] .logo-card-preview {
      background: repeating-conic-gradient(#1e3330 0% 25%, #162825 0% 50%) 0 0 / 16px 16px;
    }
  </style>
  <script>(function(){var t=localStorage.getItem('eg-theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();</script>
</head>
<body>

<!-- ── Navbar ── -->
<nav class="eg-nav py-3 sticky-top">
  <div class="container d-flex align-items-center gap-3">
    <?php if (file_exists('img/logo.svg')): ?>
      <a href="https://erfindergeist.org" target="_blank" rel="noopener noreferrer">
        <img src="img/logo.svg" alt="Erfindergeist Jülich" class="eg-nav-logo">
      </a>
    <?php else: ?>
      <a href="https://erfindergeist.org" target="_blank" rel="noopener noreferrer" class="eg-nav-name">
        Erfindergeist Jülich
      </a>
    <?php endif; ?>
    <button class="btn-icon" id="theme-toggle" aria-label="Dark/Light Mode umschalten">
      <i data-lucide="sun"  class="icon-dark-only"  aria-hidden="true"></i>
      <i data-lucide="moon" class="icon-light-only" aria-hidden="true"></i>
    </button>
  </div>
</nav>

<!-- ── Main ── -->
<main class="container py-4 pb-5">

  <?php
    /* ── Downloads: root files ── */
    $entries = [];
    $allowed_extensions = ['pdf', 'docx', 'md', 'yml', 'yaml', 'svg', 'png', 'jpg', 'jpeg'];
    $icon_map = [
      'pdf'  => 'file-text',
      'docx' => 'file-type-2',
      'md'   => 'book-open',
      'yml'  => 'file-code',
      'yaml' => 'file-code',
      'svg'  => 'image',
      'png'  => 'image',
      'jpg'  => 'image',
      'jpeg' => 'image',
    ];
    $class_map = [
      'pdf'  => 'pdf',
      'docx' => 'docx',
      'md'   => 'md',
      'yml'  => 'code',
      'yaml' => 'code',
      'svg'  => 'img',
      'png'  => 'img',
      'jpg'  => 'img',
      'jpeg' => 'img',
    ];
    if ($handle = opendir('.')) {
      while (false !== ($entry = readdir($handle))) {
        if ($entry !== '.' && $entry !== '..') {
          $ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
          if (in_array($ext, $allowed_extensions)) {
            $entries[] = $entry;
          }
        }
      }
      closedir($handle);
    }
    natcasesort($entries);

    /* ── Logos: img/ folder ── */
    $img_entries = [];
    $img_extensions = ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'];
    if (is_dir('img') && ($imgHandle = opendir('img'))) {
      while (false !== ($imgEntry = readdir($imgHandle))) {
        if ($imgEntry !== '.' && $imgEntry !== '..') {
          $ext = strtolower(pathinfo($imgEntry, PATHINFO_EXTENSION));
          if (in_array($ext, $img_extensions)) {
            $img_entries[] = $imgEntry;
          }
        }
      }
      closedir($imgHandle);
    }
    natcasesort($img_entries);

    /* ── QR Codes: qr/ folder ── */
    $qr_entries = [];
    if (is_dir('qr') && ($qrHandle = opendir('qr'))) {
      while (false !== ($qrEntry = readdir($qrHandle))) {
        if ($qrEntry !== '.' && $qrEntry !== '..') {
          $ext = strtolower(pathinfo($qrEntry, PATHINFO_EXTENSION));
          if (in_array($ext, $img_extensions)) {
            $qr_entries[] = $qrEntry;
          }
        }
      }
      closedir($qrHandle);
    }
    natcasesort($qr_entries);

    /* ── Configs: config/ folder ── */
    $config_entries = [];
    if (is_dir('config') && ($cfgHandle = opendir('config'))) {
      while (false !== ($cfgEntry = readdir($cfgHandle))) {
        if ($cfgEntry !== '.' && $cfgEntry !== '..') {
          $ext = strtolower(pathinfo($cfgEntry, PATHINFO_EXTENSION));
          if ($ext === 'json') {
            $config_entries[] = $cfgEntry;
          }
        }
      }
      closedir($cfgHandle);
    }
    natcasesort($config_entries);
  ?>

  <!-- ── Tabs ── -->
  <ul class="nav nav-tabs mb-3" id="main-tabs" role="tablist">
    <li class="nav-item" role="presentation">
      <a class="nav-link active" id="tab-downloads-trigger" data-bs-toggle="tab"
         href="#tab-downloads" role="tab" aria-controls="tab-downloads" aria-selected="true">
        Downloads
      </a>
    </li>
    <li class="nav-item" role="presentation">
      <a class="nav-link" id="tab-logos-trigger" data-bs-toggle="tab"
         href="#tab-logos" role="tab" aria-controls="tab-logos" aria-selected="false">
        Logos
      </a>
    </li>
    <li class="nav-item" role="presentation">
      <a class="nav-link" id="tab-qr-trigger" data-bs-toggle="tab"
         href="#tab-qr" role="tab" aria-controls="tab-qr" aria-selected="false">
        QR Codes
      </a>
    </li>
    <li class="nav-item" role="presentation">
      <a class="nav-link" id="tab-configs-trigger" data-bs-toggle="tab"
         href="#tab-configs" role="tab" aria-controls="tab-configs" aria-selected="false">
        Configs
      </a>
    </li>
  </ul>

  <div class="tab-content">

    <!-- Tab: Downloads -->
    <div class="tab-pane fade show active" id="tab-downloads" role="tabpanel" aria-labelledby="tab-downloads-trigger">
      <input type="search" id="file-search" class="form-control mb-3"
             placeholder="Dateien suchen…" aria-label="Dateien suchen">
      <?php if (empty($entries)): ?>
        <div class="empty-state text-center py-5">
          <i data-lucide="folder-open" aria-hidden="true"></i>
          <p class="mt-3">Noch keine Dateien vorhanden.</p>
        </div>
      <?php else: ?>
        <div class="d-flex flex-column gap-2">
          <?php foreach ($entries as $entry):
            $ext       = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
            $safeLabel = htmlspecialchars($entry, ENT_QUOTES, 'UTF-8');
            $safeUrl   = rawurlencode($entry);
            $iconName  = $icon_map[$ext]  ?? 'file';
            $extClass  = $class_map[$ext] ?? 'default';
          ?>
            <a href="<?= $safeUrl ?>" target="_blank" rel="noopener noreferrer" class="file-item">
              <i data-lucide="<?= $iconName ?>" class="file-icon <?= $extClass ?>" aria-hidden="true"></i>
              <span class="file-name"><?= $safeLabel ?></span>
              <span class="file-badge <?= $extClass ?>"><?= strtoupper($ext) ?></span>
              <i data-lucide="download" class="file-dl-icon" aria-hidden="true"></i>
            </a>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>

    <!-- Tab: Logos -->
    <div class="tab-pane fade" id="tab-logos" role="tabpanel" aria-labelledby="tab-logos-trigger">
      <?php if (empty($img_entries)): ?>
        <div class="empty-state text-center py-5">
          <i data-lucide="image" aria-hidden="true"></i>
          <p class="mt-3">Keine Logos gefunden.</p>
        </div>
      <?php else: ?>
        <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
          <?php foreach ($img_entries as $imgEntry):
            $safeLabel = htmlspecialchars($imgEntry, ENT_QUOTES, 'UTF-8');
            $safeUrl   = 'img/' . rawurlencode($imgEntry);
            $ext       = strtolower(pathinfo($imgEntry, PATHINFO_EXTENSION));
          ?>
            <div class="col">
              <div class="logo-card">
                <div class="logo-card-preview">
                  <img src="<?= $safeUrl ?>" alt="<?= $safeLabel ?>" loading="lazy">
                </div>
                <div class="logo-card-name" title="<?= $safeLabel ?>"><?= $safeLabel ?></div>
                <div class="logo-card-actions">
                  <span class="file-badge img me-auto"><?= strtoupper($ext) ?></span>
                  <a href="<?= $safeUrl ?>" target="_blank" rel="noopener noreferrer"
                     class="btn btn-outline-secondary btn-sm" title="Anzeigen" aria-label="Anzeigen">
                    <i data-lucide="eye" aria-hidden="true"></i>
                  </a>
                  <a href="<?= $safeUrl ?>" download="<?= $safeLabel ?>"
                     class="btn btn-primary btn-sm" title="Download" aria-label="Download">
                    <i data-lucide="download" aria-hidden="true"></i>
                  </a>
                  <button type="button"
                          class="btn btn-outline-secondary btn-sm btn-copy"
                          data-url="https://share.erfindergeist.org/<?= $safeUrl ?>"
                          aria-label="URL kopieren" title="URL kopieren">
                    <i data-lucide="clipboard" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>

    <!-- Tab: QR Codes -->
    <div class="tab-pane fade" id="tab-qr" role="tabpanel" aria-labelledby="tab-qr-trigger">
      <?php if (empty($qr_entries)): ?>
        <div class="empty-state text-center py-5">
          <i data-lucide="qr-code" aria-hidden="true"></i>
          <p class="mt-3">Keine QR Codes gefunden.</p>
        </div>
      <?php else: ?>
        <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
          <?php foreach ($qr_entries as $qrEntry):
            $safeLabel = htmlspecialchars($qrEntry, ENT_QUOTES, 'UTF-8');
            $safeUrl   = 'qr/' . rawurlencode($qrEntry);
            $ext       = strtolower(pathinfo($qrEntry, PATHINFO_EXTENSION));
          ?>
            <div class="col">
              <div class="logo-card">
                <div class="logo-card-preview">
                  <img src="<?= $safeUrl ?>" alt="<?= $safeLabel ?>" loading="lazy">
                </div>
                <div class="logo-card-name" title="<?= $safeLabel ?>"><?= $safeLabel ?></div>
                <div class="logo-card-actions">
                  <span class="file-badge img me-auto"><?= strtoupper($ext) ?></span>
                  <a href="<?= $safeUrl ?>" target="_blank" rel="noopener noreferrer"
                     class="btn btn-outline-secondary btn-sm" title="Anzeigen" aria-label="Anzeigen">
                    <i data-lucide="eye" aria-hidden="true"></i>
                  </a>
                  <a href="<?= $safeUrl ?>" download="<?= $safeLabel ?>"
                     class="btn btn-primary btn-sm" title="Download" aria-label="Download">
                    <i data-lucide="download" aria-hidden="true"></i>
                  </a>
                  <button type="button"
                          class="btn btn-outline-secondary btn-sm btn-copy"
                          data-url="https://share.erfindergeist.org/<?= $safeUrl ?>"
                          aria-label="URL kopieren" title="URL kopieren">
                    <i data-lucide="clipboard" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>

    <!-- Tab: Configs -->
    <div class="tab-pane fade" id="tab-configs" role="tabpanel" aria-labelledby="tab-configs-trigger">
      <?php if (empty($config_entries)): ?>
        <div class="empty-state text-center py-5">
          <i data-lucide="file-code" aria-hidden="true"></i>
          <p class="mt-3">Keine Konfigurationsdateien gefunden.</p>
        </div>
      <?php else: ?>
        <div class="d-flex flex-column gap-2">
          <?php foreach ($config_entries as $cfgEntry):
            $safeLabel = htmlspecialchars($cfgEntry, ENT_QUOTES, 'UTF-8');
            $safeUrl   = 'config/' . rawurlencode($cfgEntry);
          ?>
            <a href="<?= $safeUrl ?>" target="_blank" rel="noopener noreferrer" class="file-item">
              <i data-lucide="file-code" class="file-icon code" aria-hidden="true"></i>
              <span class="file-name"><?= $safeLabel ?></span>
              <span class="file-badge code">JSON</span>
              <i data-lucide="external-link" class="file-dl-icon" aria-hidden="true"></i>
            </a>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>

  </div>

  <!-- ── Sponsoring ── -->
  <section class="sponsor-section p-4 mt-5" aria-labelledby="sponsor-title">
    <div class="d-flex align-items-center gap-2 mb-2">
      <i data-lucide="heart" style="width:24px;height:24px;color:var(--color-secondary)" aria-hidden="true"></i>
      <h2 id="sponsor-title" class="h5 mb-0">Unterstütze uns!</h2>
    </div>
    <p class="text-muted mb-4" style="max-width:560px">
      Der Erfindergeist Jülich e.V. ist ein gemeinnütziger Verein und auf Spenden und Förderungen angewiesen. Jeder Beitrag hilft uns, unsere Werkstatt offen zu halten und Projekte für alle anzubieten.
    </p>

    <div class="row g-3 mb-4">
      <div class="col-12 col-sm-6 col-lg-3">
        <a href="https://erfindergeist.org/mitglied-werden/" target="_blank" rel="noopener noreferrer" class="sponsor-item">
          <i data-lucide="user-plus" class="sponsor-item-icon" aria-hidden="true"></i>
          <div>
            <span class="sponsor-item-title">Fördermitglied werden</span>
            <span class="small text-muted d-block">Regelmäßige Unterstützung</span>
          </div>
        </a>
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="sponsor-item">
          <i data-lucide="heart-handshake" class="sponsor-item-icon" aria-hidden="true"></i>
          <div>
            <span class="sponsor-item-title">Spendendose</span>
            <span class="small text-muted d-block">In unserer Werkstatt vor Ort</span>
          </div>
        </div>
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <a href="http://konto.erfindergeist.org/" target="_blank" rel="noopener noreferrer" class="sponsor-item">
          <i data-lucide="landmark" class="sponsor-item-icon" aria-hidden="true"></i>
          <div>
            <span class="sponsor-item-title">Überweisung</span>
            <span class="small text-muted d-block">Auf unser Vereinskonto</span>
          </div>
        </a>
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <a href="http://paypal.erfindergeist.org/" target="_blank" rel="noopener noreferrer" class="sponsor-item">
          <i data-lucide="credit-card" class="sponsor-item-icon" aria-hidden="true"></i>
          <div>
            <span class="sponsor-item-title">PayPal</span>
            <span class="small text-muted d-block">Online spenden</span>
          </div>
        </a>
      </div>
    </div>

    <div class="d-grid d-sm-block">
      <a href="https://linktree.erfindergeist.org/" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
        Alle Wege zur Unterstützung
      </a>
    </div>
  </section>

</main>

<button id="scroll-top" aria-label="Nach oben scrollen">
  <i data-lucide="arrow-up" aria-hidden="true"></i>
</button>

<script src="https://share.erfindergeist.org/js/lib/bootstrap.bundle.min.js"></script>
<script src="https://share.erfindergeist.org/js/lib/lucide.min.js"></script>
<script>
  if (window.lucide) lucide.createIcons();

  /* theme toggle */
  document.getElementById('theme-toggle').addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('eg-theme', next);
  });

  /* activate tab based on anchor */
  var anchorTabMap = { '#logos': 'tab-logos-trigger', '#qr': 'tab-qr-trigger', '#configs': 'tab-configs-trigger' };
  var trigger = anchorTabMap[window.location.hash];
  if (trigger) {
    var el = document.getElementById(trigger);
    if (el) bootstrap.Tab.getOrCreateInstance(el).show();
  }

  document.getElementById('file-search').addEventListener('input', function () {
    var q = this.value.toLowerCase();
    document.querySelectorAll('.file-item').forEach(function (item) {
      var name = item.querySelector('.file-name').textContent.toLowerCase();
      item.style.display = name.includes(q) ? '' : 'none';
    });
  });

  document.querySelectorAll('.btn-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = btn.dataset.url;
      navigator.clipboard.writeText(url).then(function () {
        var icon = btn.querySelector('i[data-lucide]');
        icon.setAttribute('data-lucide', 'clipboard-check');
        lucide.createIcons({ nodes: [icon] });
        setTimeout(function () {
          icon.setAttribute('data-lucide', 'clipboard');
          lucide.createIcons({ nodes: [icon] });
        }, 2000);
      });
    });
  });

  var scrollBtn = document.getElementById('scroll-top');
  window.addEventListener('scroll', function () {
    scrollBtn.classList.toggle('visible', window.scrollY > 300);
  });
  scrollBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
</script>
</body>
</html>
