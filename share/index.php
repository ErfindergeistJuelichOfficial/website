<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
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

    /* ── Sponsoring ── */
    .sponsor-section {
      background: linear-gradient(160deg, var(--color-secondary-light) 0%, var(--color-bg) 100%);
      border: 1.5px solid var(--color-border);
      border-radius: 16px;
    }
    .sponsor-section h2 { color: var(--color-text); }
    .sponsor-item { display: flex; align-items: flex-start; gap: .75rem; }
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
  </style>
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
  </div>
</nav>

<!-- ── Main ── -->
<main class="container py-4 pb-5">

  <h1 class="page-title mb-3">Downloads</h1>

  <input type="search" id="file-search" class="form-control mb-3"
         placeholder="Dateien suchen…" aria-label="Dateien suchen">

  <?php
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

    if (empty($entries)):
  ?>
    <div class="empty-state text-center py-5">
      <i data-lucide="folder-open" aria-hidden="true"></i>
      <p class="mt-3">Noch keine Dateien vorhanden.</p>
    </div>
  <?php else: ?>
    <div class="d-flex flex-column gap-2">
      <?php foreach ($entries as $entry):
        $ext        = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
        $safeLabel  = htmlspecialchars($entry, ENT_QUOTES, 'UTF-8');
        $safeUrl    = rawurlencode($entry);
        $iconName   = $icon_map[$ext]  ?? 'file';
        $extClass   = $class_map[$ext] ?? 'default';
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
        <div class="sponsor-item">
          <i data-lucide="user-plus" class="sponsor-item-icon" aria-hidden="true"></i>
          <div>
            <a href="https://erfindergeist.org/mitglied-werden/" target="_blank" rel="noopener noreferrer" class="sponsor-item-title">Fördermitglied werden</a>
            <span class="small text-muted">Regelmäßige Unterstützung</span>
          </div>
        </div>
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
        <div class="sponsor-item">
          <i data-lucide="landmark" class="sponsor-item-icon" aria-hidden="true"></i>
          <div>
            <a href="http://konto.erfindergeist.org/" target="_blank" rel="noopener noreferrer" class="sponsor-item-title">Überweisung</a>
            <span class="small text-muted">Auf unser Vereinskonto</span>
          </div>
        </div>
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="sponsor-item">
          <i data-lucide="credit-card" class="sponsor-item-icon" aria-hidden="true"></i>
          <div>
            <a href="http://paypal.erfindergeist.org/" target="_blank" rel="noopener noreferrer" class="sponsor-item-title">PayPal</a>
            <span class="small text-muted">Online spenden</span>
          </div>
        </div>
      </div>
    </div>

    <a href="https://linktree.erfindergeist.org/" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
      Alle Wege zur Unterstützung
    </a>
  </section>

</main>

<script src="https://share.erfindergeist.org/js/lib/bootstrap.bundle.min.js"></script>
<script src="https://share.erfindergeist.org/js/lib/lucide.min.js"></script>
<script>
  if (window.lucide) lucide.createIcons();

  document.getElementById('file-search').addEventListener('input', function () {
    var q = this.value.toLowerCase();
    document.querySelectorAll('.file-item').forEach(function (item) {
      var name = item.querySelector('.file-name').textContent.toLowerCase();
      item.style.display = name.includes(q) ? '' : 'none';
    });
  });
</script>
</body>
</html>
