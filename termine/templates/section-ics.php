<!-- ── WAS IST ICS? ────────────────────────────── -->
<section id="ics" class="section-ics py-5" aria-labelledby="ics-title">
  <div class="container">
    <div class="row align-items-center g-5">

      <!-- Icon col -->
      <div class="col-lg-4 text-center" data-aos="fade-right">
        <div class="ics-icon-wrap d-inline-block">
          <i data-lucide="calendar-days" class="section-big-icon" aria-hidden="true"></i>
          <span class="ics-badge" aria-hidden="true">ICS</span>
        </div>
      </div>

      <!-- Text col -->
      <div class="col-lg-8" data-aos="fade-left">
        <h2 id="ics-title" class="section-title section-title-anim" data-i18n="ics.title">Was ist ICS?</h2>
        <p class="lead" data-i18n="ics.subtitle">Der Stundenplan für deinen Computer</p>
        <p data-i18n="ics.description">
          Eine ICS-Datei ist wie ein digitaler Stundenplan. Dein Kalender-Programm kann sie lesen und alle Termine automatisch eintragen.
        </p>
        <div class="analogy-box" data-aos="fade-up" data-aos-delay="150">
          <i data-lucide="lightbulb" aria-hidden="true"></i>
          <p class="mb-0" data-i18n="ics.analogy">Stell dir vor, du hast einen Zettel mit allen Terminen — ICS ist genau das, aber für Computer!</p>
        </div>
        <div class="analogy-box mt-3" data-aos="fade-up" data-aos-delay="220">
          <i data-lucide="refresh-cw" aria-hidden="true"></i>
          <p class="mb-0" data-i18n="ics.autoupdate">Einmal abonnieren, immer aktuell: Wenn du unsere ICS-Datei in Google Kalender, Outlook oder Apple Kalender einbindest, werden neue und geänderte Termine automatisch übernommen — ganz ohne erneuten Import!</p>
        </div>
        <div class="d-flex flex-wrap gap-2 mt-3">
          <a href="https://erfindergeist.org/wp-json/erfindergeist/v2/ics"
             target="_blank" rel="noopener noreferrer"
             class="btn btn-primary"
             data-i18n="ics.link.label">
            Unsere ICS-Datei ansehen
          </a>
          <button type="button"
                  id="ics-copy-btn"
                  class="btn-icon"
                  data-url="https://erfindergeist.org/wp-json/erfindergeist/v2/ics"
                  aria-label="ICS-Link kopieren"
                  data-i18n="ics.copy.label"
                  data-i18n-attr="aria-label"
                  title="ICS-Link kopieren">
            <i data-lucide="clipboard" aria-hidden="true"></i>
          </button>
        </div>
      </div>

    </div>

    <!-- Code example -->
    <div class="row mt-5">
      <div class="col-12" data-aos="fade-up">
        <p class="fw-semibold mb-2" data-i18n="ics.example.title">So sieht eine ICS-Datei aus:</p>
        <div class="code-block">
          <div class="code-block-label">beispiel.ics</div>
          <pre><code>BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Erfindergeist Jülich//Termine//DE

BEGIN:VEVENT
DTSTART:20250515T180000Z
DTEND:20250515T210000Z
SUMMARY:Offener Abend
LOCATION:Erfindergeist Werkstatt&#44; Marie-Juchacz-Weg 2 52428 Jülich
DESCRIPTION:Komm vorbei und mach mit!
END:VEVENT

END:VCALENDAR</code></pre>
        </div>
      </div>
    </div>
  </div>
</section>
