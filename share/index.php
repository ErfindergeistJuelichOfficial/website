<!DOCTYPE html>
<html lang="de" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <title>Share — Erfindergeist Jülich e.V.</title>
  <link rel="stylesheet" href="https://share.erfindergeist.org/css/bootstrap.min.css">
  <link rel="stylesheet" href="assets/css/share.css?v=<?= filemtime('assets/css/share.css') ?>">
  <link rel="stylesheet" href="assets/css/tab-presentations.css?v=<?= filemtime('assets/css/tab-presentations.css') ?>">
  <link rel="stylesheet" href="assets/css/section-sponsoring.css?v=<?= filemtime('assets/css/section-sponsoring.css') ?>">
  <script>(function(){var t=localStorage.getItem('eg-theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();</script>
</head>
<body>

<!-- ── Navbar ── -->
<nav class="eg-nav py-3 sticky-top">
  <div class="container d-flex align-items-center gap-3">
    <?php if (file_exists('img/logo.svg')) : ?>
      <a href="https://erfindergeist.org" target="_blank" rel="noopener noreferrer">
        <img src="img/logo.svg" alt="Erfindergeist Jülich" class="eg-nav-logo">
      </a>
    <?php else : ?>
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
    /* ── Downloads: Dateien im Root ── */
    $entries = [];
    $allowed_extensions = ['pdf', 'docx', 'md', 'yml', 'yaml', 'svg', 'png', 'jpg', 'jpeg'];
    $icon_map = [
      'pdf'  => 'file-text',  'docx' => 'file-type-2',
      'md'   => 'book-open',  'yml'  => 'file-code',
      'yaml' => 'file-code',  'svg'  => 'image',
      'png'  => 'image',      'jpg'  => 'image',
      'jpeg' => 'image',
    ];
    $class_map = [
      'pdf'  => 'pdf',   'docx' => 'docx',
      'md'   => 'md',    'yml'  => 'code',
      'yaml' => 'code',  'svg'  => 'img',
      'png'  => 'img',   'jpg'  => 'img',
      'jpeg' => 'img',
    ];
    if ($handle = opendir('.')) {
      while (false !== ($entry = readdir($handle))) {
        $ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
        if ($entry !== '.' && $entry !== '..' && in_array($ext, $allowed_extensions)) {
          $entries[] = $entry;
        }
      }
      closedir($handle);
    }
    natcasesort($entries);

    /* ── Logos: img/ ── */
    $img_entries    = [];
    $img_extensions = ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'];
    if (is_dir('img') && ($imgHandle = opendir('img'))) {
      while (false !== ($imgEntry = readdir($imgHandle))) {
        $ext = strtolower(pathinfo($imgEntry, PATHINFO_EXTENSION));
        if ($imgEntry !== '.' && $imgEntry !== '..' && in_array($ext, $img_extensions)) {
          $img_entries[] = $imgEntry;
        }
      }
      closedir($imgHandle);
    }
    natcasesort($img_entries);

    /* ── QR Codes: qr/ ── */
    $qr_entries = [];
    if (is_dir('qr') && ($qrHandle = opendir('qr'))) {
      while (false !== ($qrEntry = readdir($qrHandle))) {
        $ext = strtolower(pathinfo($qrEntry, PATHINFO_EXTENSION));
        if ($qrEntry !== '.' && $qrEntry !== '..' && in_array($ext, $img_extensions)) {
          $qr_entries[] = $qrEntry;
        }
      }
      closedir($qrHandle);
    }
    natcasesort($qr_entries);

    /* ── Configs: config/ ── */
    $config_entries = [];
    if (is_dir('config') && ($cfgHandle = opendir('config'))) {
      while (false !== ($cfgEntry = readdir($cfgHandle))) {
        $ext = strtolower(pathinfo($cfgEntry, PATHINFO_EXTENSION));
        if ($cfgEntry !== '.' && $cfgEntry !== '..' && $ext === 'json') {
          $config_entries[] = $cfgEntry;
        }
      }
      closedir($cfgHandle);
    }
    natcasesort($config_entries);

    /* ── Präsentationen: presentations/ ── */
    $pres_entries = [];
    if (is_dir('presentations') && ($presHandle = opendir('presentations'))) {
      while (false !== ($presEntry = readdir($presHandle))) {
        if ($presEntry !== '.' && $presEntry !== '..' && is_dir('presentations/' . $presEntry)) {
          $pdfFile = null;
          if ($pdh = opendir('presentations/' . $presEntry)) {
            while (false !== ($pf = readdir($pdh))) {
              if (is_file('presentations/' . $presEntry . DIRECTORY_SEPARATOR . $pf) && preg_match('/\.pdf$/i', $pf)) {
                $pdfFile = $pf;
                break;
              }
            }
            closedir($pdh);
          }
          $pres_entries[$presEntry] = $pdfFile;
        }
      }
      closedir($presHandle);
    }
    uksort($pres_entries, 'strnatcasecmp');
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
      <a class="nav-link" id="tab-presentations-trigger" data-bs-toggle="tab"
         href="#tab-presentations" role="tab" aria-controls="tab-presentations" aria-selected="false">
        Präsentationen
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
    <?php include __DIR__ . '/assets/templates/tab-downloads.php'; ?>
    <?php include __DIR__ . '/assets/templates/tab-presentations.php'; ?>
    <?php include __DIR__ . '/assets/templates/tab-logos.php'; ?>
    <?php include __DIR__ . '/assets/templates/tab-qr.php'; ?>
    <?php include __DIR__ . '/assets/templates/tab-configs.php'; ?>
  </div>

  <!-- ── Sponsoring ── -->
  <section class="sponsor-section p-4 mt-5" aria-labelledby="sponsor-title">
    <div class="d-flex align-items-center gap-2 mb-2">
      <i data-lucide="heart" style="width:24px;height:24px;color:var(--color-secondary)" aria-hidden="true"></i>
      <h2 id="sponsor-title" class="h5 mb-0">Unterstütze uns!</h2>
    </div>
    <p class="text-muted mb-4" style="max-width:560px">
      Der Erfindergeist Jülich e.V. ist ein gemeinnütziger Verein und auf Spenden und Förderungen angewiesen.
      Jeder Beitrag hilft uns, unsere Werkstatt offen zu halten und Projekte für alle anzubieten.
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

<eg-footer></eg-footer>

<script src="https://share.erfindergeist.org/js/lib/bootstrap.bundle.min.js"></script>
<script src="https://share.erfindergeist.org/js/lib/lucide.min.js"></script>
<script src="assets/js/share.js?v=<?= filemtime('assets/js/share.js') ?>"></script>
<script src="https://share.erfindergeist.org/js/components/eg-footer.js"></script>

</body>
</html>
