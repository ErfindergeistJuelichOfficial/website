<!-- ── HOME ASSISTANT ──────────────────────────── -->
<section id="homeassistant" class="section-ha py-5" aria-labelledby="ha-title">
  <div class="container">
    <div class="row align-items-center g-5">

      <!-- Icon -->
      <div class="col-lg-4 text-center" data-aos="fade-right">
        <div class="ha-icon-wrap d-inline-block" aria-hidden="true">
          <i data-lucide="home" class="section-big-icon ha-home-icon"></i>
          <i data-lucide="zap" class="ha-zap-icon"></i>
        </div>
      </div>

      <!-- Text -->
      <div class="col-lg-8" data-aos="fade-left">
        <span class="badge bg-secondary text-dark mb-2" data-i18n="ha.badge">Beispielprojekt</span>
        <h2 id="ha-title" class="section-title section-title-anim" data-i18n="ha.title">Home Assistant</h2>
        <p class="lead" data-i18n="ha.subtitle">Automatisch informiert bleiben</p>
        <p data-i18n="ha.what">
          <a href="https://www.home-assistant.io/" target="_blank" rel="noopener noreferrer">Home Assistant</a> ist eine quelloffene Smart-Home-Plattform, die du auf einem eigenen Gerät (z.B. Raspberry Pi) betreibst. Sie verbindet Lampen, Schalter, Sensoren und Dienste miteinander — und lässt sich frei automatisieren.
        </p>
        <p data-i18n="ha.description">
          Unser /tomorrow-Endpunkt liefert nur die Termine von morgen — perfekt für Smart-Home-Automationen. Kein Filtern, kein Suchen: direkt die relevanten Daten.
        </p>
        <div class="analogy-box mb-3" data-aos="fade-up" data-aos-delay="100">
          <i data-lucide="lightbulb" aria-hidden="true"></i>
          <p class="mb-0" data-i18n="ha.usecase">Beispiel: Lass deinen Smart Speaker jeden Abend ansagen, ob morgen ein Termin beim Erfindergeist stattfindet.</p>
        </div>
        <a href="https://www.home-assistant.io/"
           target="_blank" rel="noopener noreferrer"
           class="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2">
          <i data-lucide="home" aria-hidden="true"></i>
          <span data-i18n="ha.link">Zur Home Assistant Website</span>
        </a>
      </div>

    </div>

    <!-- YAML example -->
    <div class="row mt-5">
      <div class="col-12" data-aos="fade-up">
        <p class="fw-semibold mb-2" data-i18n="ha.yaml.intro">Das folgende Beispiel zeigt für Entwickler, wie eine solche Automation technisch aussehen kann:</p>
        <div class="code-block">
          <div class="code-block-label">automation.yaml</div>
          <pre><code>automation:
  - alias: "Erfindergeist morgen?"
    trigger:
      - platform: time
        at: "20:00:00"
    action:
      - service: rest_command.check_erfindergeist
      - condition: template
        value_template: >
          {{ states('sensor.erfindergeist_tomorrow') | length > 0 }}
      - service: tts.google_translate_say
        data:
          entity_id: media_player.wohnzimmer
          message: >
            Morgen gibt es einen Termin beim Erfindergeist!</code></pre>
        </div>
      </div>
    </div>
  </div>
</section>
