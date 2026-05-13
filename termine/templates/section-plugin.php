<!-- ── WORDPRESS PLUGIN ────────────────────────── -->
<section id="plugin" class="section-plugin py-5" aria-labelledby="plugin-title">
  <div class="container">
    <div class="col-12 text-center mb-4" data-aos="fade-up">
      <h2 id="plugin-title" class="section-title section-title-anim" data-i18n="plugin.title">Das WordPress Plugin</h2>
      <p class="lead" data-i18n="plugin.subtitle">Die Brücke zwischen Cloud und Website</p>
      <p class="text-muted" data-i18n="plugin.description" data-i18n-html>
        Das selbst entwickelte WordPress-Plugin holt die Termine aus der NextCloud, speichert sie zwischen und stellt sie als API bereit.
      </p>
      <a href="https://github.com/ErfindergeistJuelichOfficial/calendar-wp-plugin"
         target="_blank" rel="noopener noreferrer"
         class="btn btn-outline-primary mt-1"
         data-i18n="plugin.github.label">
        Plugin auf GitHub ansehen
      </a>
    </div>

    <!-- Open for all -->
    <div class="row mb-3">
      <div class="col-12" data-aos="fade-up" data-aos-delay="100">
        <div class="info-card">
          <div class="info-card-icon"><i data-lucide="unlock" aria-hidden="true"></i></div>
          <div>
            <strong data-i18n="plugin.open.label">Offen für alle</strong>
            <p class="mb-0 mt-1 small" data-i18n="plugin.open.desc">
              Alle Endpunkte sind öffentlich erreichbar und ohne Anmeldung nutzbar. Du darfst sie gerne für dein eigenes privates Projekt verwenden — ob Smart-Home, App oder Website.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Caching info -->
    <div class="row mb-4">
      <div class="col-12" data-aos="fade-up" data-aos-delay="100">
        <div class="info-card">
          <div class="info-card-icon"><i data-lucide="database" aria-hidden="true"></i></div>
          <div>
            <strong data-i18n="plugin.caching.label">Warum Caching?</strong>
            <p class="mb-0 mt-1 small" data-i18n="plugin.caching.desc">
              Statt bei jeder Anfrage die NextCloud zu befragen, speichert das Plugin die Daten kurz zwischen. Das ist schneller und schont den Server.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Endpoints -->
    <h3 class="text-center h5 mb-4" data-i18n="plugin.endpoints.title" data-aos="fade-up">Diese Endpunkte stehen zur Verfügung:</h3>
    <div class="row g-4">
      <div class="col-md-4" data-aos="fade-up" data-aos-delay="100">
        <a href="https://erfindergeist.org/wp-json/erfindergeist/v2/ics"
           target="_blank" rel="noopener noreferrer"
           class="endpoint-card"
           aria-label="ICS Endpunkt öffnen">
          <div class="endpoint-icon" aria-hidden="true">📅</div>
          <div class="endpoint-method">GET</div>
          <div class="endpoint-path">/ics</div>
          <div class="endpoint-desc" data-i18n="nav.ics">ICS Kalender</div>
          <i data-lucide="external-link" class="endpoint-ext" aria-hidden="true"></i>
        </a>
      </div>
      <div class="col-md-4" data-aos="fade-up" data-aos-delay="200">
        <div class="endpoint-card">
          <a href="https://erfindergeist.org/wp-json/erfindergeist/v2/events"
             target="_blank" rel="noopener noreferrer"
             class="endpoint-ext"
             aria-label="Events JSON Endpunkt öffnen">
            <i data-lucide="external-link" aria-hidden="true"></i>
          </a>
          <div class="endpoint-icon" aria-hidden="true">📋</div>
          <div class="endpoint-method">GET</div>
          <div class="endpoint-path">/events</div>
          <div class="endpoint-desc" data-i18n="plugin.endpoint.events.desc">Alle Termine als JSON</div>
          <div id="events-endpoint-preview" class="endpoint-tomorrow-preview" aria-live="polite"></div>
        </div>
      </div>
      <div class="col-md-4" data-aos="fade-up" data-aos-delay="300">
        <a href="https://erfindergeist.org/wp-json/erfindergeist/v2/tomorrow"
           target="_blank" rel="noopener noreferrer"
           class="endpoint-card"
           aria-label="Tomorrow Endpunkt öffnen">
          <div class="endpoint-icon" aria-hidden="true">🌅</div>
          <div class="endpoint-method">GET</div>
          <div class="endpoint-path">/tomorrow</div>
          <div class="endpoint-desc" data-i18n="plugin.endpoint.tomorrow.desc">Nur die Termine von morgen</div>
          <div id="tomorrow-preview" class="endpoint-tomorrow-preview" aria-live="polite"></div>
          <i data-lucide="external-link" class="endpoint-ext" aria-hidden="true"></i>
        </a>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-12" data-aos="fade-up">
        <div class="analogy-box">
          <i data-lucide="info" aria-hidden="true"></i>
          <p class="mb-0" data-i18n="plugin.endpoint.tomorrow.hint">Hinweis: Der <code>/tomorrow</code>-Endpunkt gibt nur dann Daten zurück, wenn morgen tatsächlich ein Termin stattfindet. Ist nichts geplant, bleibt die Antwort leer.</p>
        </div>
      </div>
    </div>

  </div>
</section>
