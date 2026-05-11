<!-- ── TERMINE ─────────────────────────────────── -->
<section id="termine" class="section-events py-5" aria-labelledby="events-title">
  <div class="container">

    <div class="col-12 text-center mb-4" data-aos="fade-up">
      <h2 id="events-title" class="section-title section-title-anim" data-i18n="events.title">Kommende Termine</h2>
      <p class="lead" data-i18n="events.subtitle">Die nächsten Veranstaltungen auf einen Blick</p>
    </div>

    <div class="row g-4">
      <div class="col-12 col-xl-6">

        <!-- Source hint -->
        <p class="events-source-hint text-center small text-muted mb-3" data-aos="fade-up" data-aos-delay="80">
          <span data-i18n="events.source.pre">Was du hier siehst, kommt live vom</span>
          <a href="#plugin" class="events-source-badge">
            <i data-lucide="plug" aria-hidden="true"></i>
            <span data-i18n="nav.plugin">WordPress Plugin</span>
          </a>
          <code>/events</code>
          <span data-i18n="events.source.post">Endpunkt — direkt aus der Datenbank, ohne Zwischenspeicherung.</span>
        </p>

        <!-- Loading -->
        <div id="events-loading" class="text-center py-4 text-muted">
          <i data-lucide="loader-circle" class="events-loading-icon" aria-hidden="true"></i>
          <p class="mt-2 small mb-0" data-i18n="events.loading">Termine werden geladen…</p>
        </div>

        <!-- Error -->
        <div id="events-error" class="d-none">
          <div class="analogy-box">
            <i data-lucide="wifi-off" aria-hidden="true"></i>
            <p class="mb-0" data-i18n="events.error">Termine konnten nicht geladen werden.</p>
          </div>
        </div>

        <!-- Empty -->
        <div id="events-empty" class="text-center py-4 d-none text-muted">
          <i data-lucide="calendar-x" class="events-empty-icon" aria-hidden="true"></i>
          <p class="mt-2 mb-0" data-i18n="events.empty">Aktuell keine kommenden Termine gefunden.</p>
        </div>

        <!-- List -->
        <div id="events-list" class="d-flex flex-column gap-2" role="list" aria-live="polite"></div>

        <!-- Website hint -->
        <div class="analogy-box mt-4" data-aos="fade-up" data-aos-delay="200">
          <i data-lucide="globe" aria-hidden="true"></i>
          <div>
            <p class="mb-2" data-i18n="events.website.hint">Alle Termine findest du auch auf unserer Website:</p>
            <a href="https://erfindergeist.org/veranstaltungen/"
               target="_blank" rel="noopener noreferrer"
               class="btn btn-outline-primary btn-sm"
               data-i18n="events.website.link">
              erfindergeist.org/veranstaltungen
            </a>
          </div>
        </div>

      </div>

      <!-- JSON Editor -->
      <div class="col-12 col-xl-6 d-none" id="events-json-panel">
        <div class="events-json-wrap">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="events-json-title" data-i18n="events.json.label">Live JSON</span>
            <button id="events-json-reset" class="btn btn-outline-secondary btn-sm" data-i18n="events.json.reset">Zurücksetzen</button>
          </div>
          <textarea id="events-json-editor" class="events-json-editor" spellcheck="false" autocomplete="off" aria-label="JSON Editor"></textarea>
          <div id="events-json-error" class="events-json-error d-none"></div>
        </div>
      </div>

    </div>

  </div>
</section>
