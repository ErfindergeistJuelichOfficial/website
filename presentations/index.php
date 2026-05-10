<!DOCTYPE html>
<html lang="de" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <title>Präsentationen — Erfindergeist Jülich</title>
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

    /* ── List header ── */
    .list-header {
      font-size: .78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .04em;
      color: var(--color-text-muted);
      padding: .4rem .75rem;
      border-bottom: 1.5px solid var(--color-border);
      margin-bottom: .5rem;
    }

    /* ── Presentation item ── */
    .pres-item {
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: 8px;
      padding: .63rem .77rem;
      display: flex;
      align-items: center;
      gap: .6rem;
      transition: border-color .2s, box-shadow .2s;
    }
    .pres-item:hover {
      border-color: var(--color-primary);
      box-shadow: 0 3px 12px var(--color-shadow);
    }
    .pres-icon { width: 26px; height: 26px; flex-shrink: 0; color: var(--color-primary); }
    .pres-name { flex-grow: 1; font-weight: 500; font-size: .88rem; word-break: break-word; }
    .pres-actions { display: flex; gap: .4rem; flex-shrink: 0; }

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
    .sponsor-item-title { font-weight: 600; color: var(--color-text); display: block; }

    /* ── Alert overrides ── */
    .alert-info {
      --bs-alert-color:        var(--color-text);
      --bs-alert-bg:           var(--color-primary-light);
      --bs-alert-border-color: var(--color-primary);
      --bs-alert-link-color:   var(--color-primary-dark);
    }

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
  </style>
  <script>(function(){var t=localStorage.getItem('eg-theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();</script>
</head>
<body>

<!-- ── Navbar ── -->
<nav class="eg-nav py-3 sticky-top">
  <div class="container d-flex align-items-center gap-3">
    <a href="https://erfindergeist.org" target="_blank" rel="noopener noreferrer">
      <img src="https://share.erfindergeist.org/img/logo.svg" alt="Erfindergeist Jülich" class="eg-nav-logo">
    </a>
    <button class="btn-icon" id="theme-toggle" aria-label="Dark/Light Mode umschalten">
      <i data-lucide="sun"  class="icon-dark-only"  aria-hidden="true"></i>
      <i data-lucide="moon" class="icon-light-only" aria-hidden="true"></i>
    </button>
  </div>
</nav>

<!-- ── Main ── -->
<main class="container py-4 pb-5">

  <?php
    $entries = [];
    if ($handle = opendir('.')) {
      while (false !== ($entry = readdir($handle))) {
        if ($entry !== '.' && $entry !== '..' && is_dir($entry)) {
          $entries[] = $entry;
        }
      }
      closedir($handle);
    }
    natcasesort($entries);
  ?>

  <div class="list-header d-flex">
    <span class="flex-grow-1">Präsentation</span>
    <span>Aktionen</span>
  </div>

  <?php if (empty($entries)): ?>
    <div class="empty-state text-center py-5">
      <i data-lucide="folder-open" aria-hidden="true"></i>
      <p class="mt-3">Noch keine Präsentationen vorhanden.</p>
    </div>
  <?php else: ?>
    <div class="d-flex flex-column gap-2">
      <?php foreach ($entries as $entry):
        $safeLabel = htmlspecialchars($entry, ENT_QUOTES, 'UTF-8');
        $safeUrl   = rawurlencode($entry);

        $pdfFile = null;
        if ($dh = opendir($entry)) {
          while (false !== ($file = readdir($dh))) {
            if (is_file($entry . DIRECTORY_SEPARATOR . $file) && preg_match('/\.pdf$/i', $file)) {
              $pdfFile = $file;
              break;
            }
          }
          closedir($dh);
        }
      ?>
        <div class="pres-item">
          <i data-lucide="monitor" class="pres-icon" aria-hidden="true"></i>
          <span class="pres-name"><?= $safeLabel ?></span>
          <div class="pres-actions">
            <a href="<?= $safeUrl ?>/" class="btn btn-primary btn-sm">
              <i data-lucide="play" style="width:13px;height:13px" aria-hidden="true"></i>
              Anzeigen
            </a>
            <?php if ($pdfFile !== null): ?>
              <a href="<?= "$safeUrl/" . rawurlencode($pdfFile) ?>" target="_blank"
                 rel="noopener noreferrer" class="btn btn-outline-secondary btn-sm">
                <i data-lucide="file-text" style="width:13px;height:13px" aria-hidden="true"></i>
                PDF
              </a>
            <?php endif; ?>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>

  <!-- ── Source Code ── -->
  <div class="alert alert-info d-flex align-items-center gap-2 mt-3" role="alert" style="font-size:.85rem">
    <i data-lucide="git-branch" style="width:16px;height:16px;flex-shrink:0" aria-hidden="true"></i>
    <span>Quellcode der Präsentationen:
      <a href="https://github.com/ErfindergeistJuelichOfficial" target="_blank" rel="noopener noreferrer" class="alert-link">
        ErfindergeistJuelichOfficial
      </a>
    </span>
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

  document.getElementById('theme-toggle').addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('eg-theme', next);
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
