<!-- ── TECHNISCHER AUFBAU ──────────────────────── -->
<section id="architektur" class="section-arch py-5" aria-labelledby="arch-title">
  <div class="container">
    <div class="row">
      <div class="col-12 text-center mb-2" data-aos="fade-up">
        <h2 id="arch-title" class="section-title section-title-anim" data-i18n="arch.title">Technischer Aufbau</h2>
      </div>
    </div>

    <!-- One source, many consumers -->
    <div class="row mb-4" data-aos="fade-up" data-aos-delay="80">
      <div class="col-12 text-center mb-4">
        <h3 class="h5 fw-semibold mb-1" data-i18n="arch.onesource.title">Eine Quelle — viele Empfänger</h3>
        <p class="text-muted small mb-0" data-i18n="arch.onesource.text">Alle unsere Systeme nutzen dieselben Termine aus NextCloud — jedes bekommt die Daten in genau dem Format, das es braucht.</p>
      </div>
      <div class="col-12">
        <div class="arch-constellation" id="arch-constellation">

          <!-- SVG overlay for animated lines (desktop only) -->
          <svg class="arch-lines-svg" id="arch-lines-svg" aria-hidden="true"></svg>

          <!-- Source: WordPress Plugin -->
          <a href="#plugin" class="arch-source-btn" id="arch-source">
            <i data-lucide="plug" aria-hidden="true"></i>
            <span data-i18n="nav.plugin">WordPress Plugin</span>
          </a>

          <!-- Consumer chips -->
          <a href="#termine" class="onesource-chip arch-chip" id="arch-chip-0">
            <i data-lucide="book-open" aria-hidden="true"></i>
            <span data-i18n="arch.onesource.site">Diese Erklär-Seite</span>
          </a>
          <a href="https://erfindergeist.org/" target="_blank" rel="noopener noreferrer"
             class="onesource-chip arch-chip" id="arch-chip-1">
            <i data-lucide="globe" aria-hidden="true"></i>
            <span data-i18n="arch.onesource.homepage">Unsere Homepage</span>
          </a>
          <a href="#downloads" class="onesource-chip arch-chip" id="arch-chip-2">
            <i data-lucide="file-text" aria-hidden="true"></i>
            <span data-i18n="arch.onesource.pdf">PDF Erzeugung</span>
          </a>
          <a href="#ics" class="onesource-chip arch-chip" id="arch-chip-3">
            <i data-lucide="calendar-heart" aria-hidden="true"></i>
            <span data-i18n="arch.onesource.cal">Persönliche Kalender</span>
          </a>
          <a href="#homeassistant" class="onesource-chip arch-chip onesource-chip--muted" id="arch-chip-4">
            <i data-lucide="circle-help" aria-hidden="true"></i>
            <span data-i18n="arch.onesource.yours">Dein Projekt?</span>
          </a>

        </div>
      </div>
    </div>

    <!-- NextCloud explanation -->
    <div class="row mb-3">
      <div class="col-12" data-aos="fade-up" data-aos-delay="200">
        <div class="info-card">
          <div class="info-card-icon"><i data-lucide="cloud" aria-hidden="true"></i></div>
          <div>
            <strong data-i18n="arch.nextcloud.title">Was ist NextCloud?</strong>
            <p class="mb-0 mt-1 small" data-i18n="arch.nextcloud.text">NextCloud ist eine selbst gehostete Cloud-Plattform — wie Google Drive, nur auf unserem eigenen Server. Alle Termine werden dort gepflegt: neue anlegen, bestehende ändern, vergangene löschen. Volle Kontrolle über die eigenen Daten, ganz ohne externe Dienste.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Help hint -->
    <div class="row mt-4">
      <div class="col-12" data-aos="fade-up" data-aos-delay="350">
        <div class="analogy-box">
          <i data-lucide="handshake" aria-hidden="true"></i>
          <div>
            <p class="mb-2" data-i18n="arch.help.text">Wir unterstützen Privatpersonen und Vereine gerne bei technischen Lösungen — egal ob Website, Automatisierung oder eigene Softwareprojekte. Sprich uns einfach an!</p>
            <a href="https://erfindergeist.org/kontakt/"
               target="_blank" rel="noopener noreferrer"
               class="btn btn-outline-primary btn-sm"
               data-i18n="arch.help.contact">Kontakt aufnehmen</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
