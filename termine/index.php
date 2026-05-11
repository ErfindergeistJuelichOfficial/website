<!DOCTYPE html>
<html lang="de" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Technischer Aufbau der Termine des Erfindergeist Jülich e.V. — von NextCloud über WordPress bis zu PDF und Home Assistant.">
  <meta name="color-scheme" content="light dark">
  <title>Erfindergeist Jülich e.V. Termine</title>
  <link rel="stylesheet" href="https://share.erfindergeist.org/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://share.erfindergeist.org/css/aos.min.css">
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/sections/section-hero.css">
  <link rel="stylesheet" href="css/sections/section-termine.css">
  <link rel="stylesheet" href="css/sections/section-architektur.css">
  <link rel="stylesheet" href="css/sections/section-ics.css">
  <link rel="stylesheet" href="css/sections/section-plugin.css">
  <link rel="stylesheet" href="css/sections/section-downloads.css">
  <link rel="stylesheet" href="css/sections/section-homeassistant.css">
  <link rel="stylesheet" href="css/sections/section-sponsoring.css">
</head>
<body>

<!-- Skip to content -->
<a class="skip-link" href="#main-content" data-i18n="skip.link">Zum Hauptinhalt springen</a>

<!-- ═══════════════════ NAVBAR ═══════════════════ -->
<nav class="navbar navbar-expand-xl sticky-top" id="main-nav" aria-label="Hauptnavigation">
  <div class="container">

    <a class="navbar-brand" href="#uebersicht" aria-label="Erfindergeist Jülich — Startseite">
      <img src="https://share.erfindergeist.org/img/logo.svg" alt="Erfindergeist Jülich" class="navbar-logo">
    </a>

    <button class="navbar-toggler border-0" type="button"
            data-bs-toggle="collapse" data-bs-target="#navbarCollapse"
            aria-controls="navbarCollapse" aria-expanded="false" aria-label="Menü öffnen">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="navbarCollapse">
      <ul class="navbar-nav me-auto gap-1">
        <li class="nav-item"><a class="nav-link" href="#architektur"   data-i18n="nav.architecture">Technischer Aufbau</a></li>
        <li class="nav-item"><a class="nav-link" href="#termine"       data-i18n="nav.events">Termine</a></li>
        <li class="nav-item"><a class="nav-link" href="#downloads"     data-i18n="nav.downloads">PDF</a></li>
        <li class="nav-item"><a class="nav-link" href="#ics"           data-i18n="nav.ics">ICS Kalender</a></li>
        <li class="nav-item"><a class="nav-link" href="#plugin"        data-i18n="nav.plugin">WordPress Plugin</a></li>
        <li class="nav-item"><a class="nav-link" href="#homeassistant" data-i18n="nav.homeassistant">Home Assistant</a></li>
      </ul>
      <div class="d-flex align-items-center gap-2 mt-2 mt-lg-0">
        <a href="#sponsoring" class="btn-icon btn-icon-sponsor" aria-label="Unterstütze uns">
          <i data-lucide="heart"></i>
        </a>
        <button id="theme-toggle" class="btn-icon" aria-label="Dunkles Design aktivieren">
          <i data-lucide="moon"></i>
        </button>
        <div class="dropdown">
          <button class="btn-icon" id="lang-dropdown-btn"
                  data-bs-toggle="dropdown" aria-expanded="false"
                  aria-label="Sprache wählen">
            <i data-lucide="globe"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="lang-dropdown-btn">
            <li>
              <button class="dropdown-item lang-option" data-lang="de">
                🇩🇪 Deutsch
              </button>
            </li>
            <li>
              <button class="dropdown-item lang-option" data-lang="en">
                🇬🇧 English
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

  </div>
</nav>

<!-- ═══════════════════ MAIN ═══════════════════ -->
<main id="main-content">

  <?php include __DIR__ . '/templates/section-hero.php'; ?>
  <?php include __DIR__ . '/templates/section-architektur.php'; ?>
  <?php include __DIR__ . '/templates/section-termine.php'; ?>
  <?php include __DIR__ . '/templates/section-downloads.php'; ?>
  <?php include __DIR__ . '/templates/section-ics.php'; ?>
  <?php include __DIR__ . '/templates/section-plugin.php'; ?>
  <?php include __DIR__ . '/templates/section-homeassistant.php'; ?>
  <?php include __DIR__ . '/templates/section-sponsoring.php'; ?>

</main>

<!-- ═══════════════════ FOOTER ═══════════════════ -->
<footer class="eg-footer py-4" role="contentinfo">
  <div class="container">
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
      <div class="d-flex align-items-center gap-3">
        <img src="https://share.erfindergeist.org/img/logo.svg" alt="Erfindergeist Jülich" class="footer-logo">
        <a href="https://erfindergeist.org" target="_blank" rel="noopener noreferrer"
           class="footer-link small" data-i18n="footer.text">Erfindergeist Jülich e.V.</a>
      </div>
      <div class="d-flex flex-column flex-sm-row flex-wrap gap-2 gap-sm-3">
        <a href="https://github.com/ErfindergeistJuelichOfficial/calendar-wp-plugin"
           data-link-title="GitHub – WordPress Plugin"
           target="_blank" rel="noopener noreferrer"
           class="footer-link"
           data-i18n="footer.plugin">WordPress Plugin</a>
        <a href="https://github.com/ErfindergeistJuelichOfficial/pdf-termine"
           data-link-title="GitHub – pdf-termine"
           target="_blank" rel="noopener noreferrer"
           class="footer-link"
           data-i18n="footer.pdf">PDF Generator</a>
        <a href="https://github.com/ErfindergeistJuelichOfficial"
           data-link-title="GitHub Organisation"
           target="_blank" rel="noopener noreferrer"
           class="footer-link"
           data-i18n="footer.source">Quelltext auf GitHub</a>
      </div>
    </div>
  </div>
</footer>

<!-- ═══════════════════ TOAST ═══════════════════ -->
<div id="ics-toast" role="status" aria-live="polite" aria-atomic="true">
  <i data-lucide="clipboard-check" aria-hidden="true"></i>
  <span data-i18n="ics.toast.text">ICS-Link in Zwischenablage kopiert!</span>
</div>

<!-- ═══════════════════ FIXED WIDGETS ═══════════════════ -->

<!-- Accessibility Toolbar (bottom-left) -->
<div id="a11y-toolbar" role="complementary">
  <button id="a11y-btn"
          class="a11y-toggle-btn"
          aria-expanded="false"
          aria-controls="a11y-panel"
          data-i18n="a11y.btn.label"
          data-i18n-attr="aria-label"
          aria-label="Barrierefreiheits-Optionen">
    <i data-lucide="accessibility" aria-hidden="true"></i>
  </button>
  <div id="a11y-panel" class="a11y-panel" hidden role="dialog" aria-modal="true" aria-labelledby="a11y-panel-title">
    <h2 class="a11y-panel-title" id="a11y-panel-title" data-i18n="a11y.title">Barrierefreiheit</h2>

    <div class="a11y-group">
      <span class="a11y-group-label" id="a11y-font-label" data-i18n="a11y.font.label">Schriftgröße</span>
      <div class="a11y-btn-group" role="group" aria-labelledby="a11y-font-label">
        <button class="a11y-font-btn" data-scale="0.85" aria-label="Schrift verkleinern">A−</button>
        <button class="a11y-font-btn active" data-scale="1" aria-label="Standard Schriftgröße">A</button>
        <button class="a11y-font-btn" data-scale="1.2" aria-label="Schrift vergrößern">A+</button>
      </div>
    </div>

    <div class="a11y-group">
      <span class="a11y-group-label" id="a11y-contrast-label" data-i18n="a11y.contrast.label">Kontrast</span>
      <div class="a11y-btn-group" role="group" aria-labelledby="a11y-contrast-label">
        <button class="a11y-contrast-btn active" data-contrast="normal" data-i18n="a11y.contrast.normal">Normal</button>
        <button class="a11y-contrast-btn" data-contrast="high" data-i18n="a11y.contrast.high">Hoch</button>
      </div>
    </div>

    <div class="a11y-group">
      <span class="a11y-group-label" id="a11y-motion-label" data-i18n="a11y.motion.label">Animationen</span>
      <div class="a11y-btn-group" role="group" aria-labelledby="a11y-motion-label">
        <button class="a11y-motion-btn active" data-motion="on" data-i18n="a11y.motion.on">An</button>
        <button class="a11y-motion-btn" data-motion="off" data-i18n="a11y.motion.off">Aus</button>
      </div>
    </div>

  </div>
</div>

<!-- Scroll-to-top (bottom-right) -->
<button id="scroll-top"
        class="scroll-top-btn"
        style="opacity:0;pointer-events:none"
        data-i18n="scrolltop.label"
        data-i18n-attr="aria-label"
        aria-label="Nach oben scrollen">
  <i data-lucide="arrow-up" aria-hidden="true"></i>
</button>

<!-- ═══════════════════ SCRIPTS ═══════════════════ -->
<script src="https://share.erfindergeist.org/js/lib/jquery.min.js"></script>
<script src="https://share.erfindergeist.org/js/lib/bootstrap.bundle.min.js"></script>
<script src="https://share.erfindergeist.org/js/lib/gsap.min.js"></script>
<script src="https://share.erfindergeist.org/js/lib/ScrollTrigger.min.js"></script>
<script src="https://share.erfindergeist.org/js/lib/aos.min.js"></script>
<script src="https://share.erfindergeist.org/js/lib/typed.min.js"></script>
<script src="https://share.erfindergeist.org/js/lib/lucide.min.js"></script>
<script src="https://share.erfindergeist.org/js/lib/rough-notation.min.js"></script>
<script src="js/i18n.js"></script>
<script src="js/theme.js"></script>
<script src="js/accessibility.js"></script>
<script src="js/animations.js"></script>
<script src="js/main.js"></script>
<script>
  fetch('https://share.erfindergeist.org/config/links.json')
    .then(function(r) { return r.json(); })
    .then(function(links) {
      var map = {};
      links.forEach(function(l) { map[l.title] = l.url; });
      document.querySelectorAll('[data-link-title]').forEach(function(el) {
        var url = map[el.dataset.linkTitle];
        if (url) el.href = url;
      });
    })
    .catch(function() {});
</script>

</body>
</html>
