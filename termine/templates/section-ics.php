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

        <!-- Direct calendar subscription buttons -->
        <div class="ics-cal-wrap">
          <div class="ics-cal-bell" aria-hidden="true">
            <i data-lucide="bell"></i>
            <span class="bell-wave bell-wave-1"></span>
            <span class="bell-wave bell-wave-2"></span>
            <span class="bell-wave bell-wave-3"></span>
          </div>
          <span class="ics-cal-label" data-i18n="ics.cal.label">Abonnieren in:</span>
          <div class="d-flex flex-wrap gap-2">
            <a href="https://calendar.google.com/calendar/r/settings/addbyurl?url=https%3A%2F%2Ferfindergeist.org%2Fwp-json%2Ferfindergeist%2Fv2%2Fics"
               class="ics-cal-btn ics-cal-google" target="_blank" rel="noopener noreferrer"
               aria-label="In Google Calendar abonnieren">
              <i data-lucide="calendar-plus" aria-hidden="true"></i>Google
            </a>
            <a href="https://outlook.live.com/calendar/0/addfromurl?url=https%3A%2F%2Ferfindergeist.org%2Fwp-json%2Ferfindergeist%2Fv2%2Fics"
               class="ics-cal-btn ics-cal-outlook" target="_blank" rel="noopener noreferrer"
               aria-label="In Outlook abonnieren">
              <i data-lucide="calendar-plus" aria-hidden="true"></i>Outlook
            </a>
            <a href="webcal://erfindergeist.org/wp-json/erfindergeist/v2/ics"
               class="ics-cal-btn ics-cal-apple"
               aria-label="In Apple Calendar abonnieren">
              <i data-lucide="calendar-plus" aria-hidden="true"></i>Apple
            </a>
            <a href="https://calendar.yahoo.com/?v=60&amp;type=26&amp;title=Erfindergeist+J%C3%BClich&amp;url=https%3A%2F%2Ferfindergeist.org%2Fwp-json%2Ferfindergeist%2Fv2%2Fics"
               class="ics-cal-btn ics-cal-yahoo" target="_blank" rel="noopener noreferrer"
               aria-label="In Yahoo Calendar abonnieren">
              <i data-lucide="calendar-plus" aria-hidden="true"></i>Yahoo
            </a>
            <a href="webcal://erfindergeist.org/wp-json/erfindergeist/v2/ics"
               class="ics-cal-btn ics-cal-thunderbird"
               aria-label="In Thunderbird abonnieren">
              <i data-lucide="calendar-plus" aria-hidden="true"></i>Thunderbird
            </a>
          </div>
        </div>
      </div>

    </div>

    <!-- Code example + puzzle -->
    <div class="row mt-5 g-4 align-items-start">

      <div class="col-lg-6" data-aos="fade-up">
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

      <!-- ICS puzzle -->
      <div class="col-lg-6" data-aos="fade-up" data-aos-delay="100">
        <p class="fw-semibold mb-3 puzzle-heading">
          <span data-i18n="ics.puzzle.question">Welches Datum und welche Uhrzeit steht bei DTSTART</span><span class="puzzle-question-mark" aria-hidden="true">?</span>
        </p>
        <div class="ics-puzzle" id="ics-puzzle" role="group">

          <div class="ics-spinner-row">

            <!-- Day -->
            <div class="spinner-group">
              <div class="spinner" data-field="day" data-min="1" data-max="31">
                <button class="spinner-btn spinner-up" aria-label="Tag erhöhen"><i data-lucide="chevron-up" aria-hidden="true"></i></button>
                <div class="spinner-val">01</div>
                <button class="spinner-btn spinner-down" aria-label="Tag verringern"><i data-lucide="chevron-down" aria-hidden="true"></i></button>
              </div>
              <span class="spinner-label" data-i18n="ics.puzzle.lbl.day">Tag</span>
            </div>

            <!-- Month -->
            <div class="spinner-group">
              <div class="spinner" data-field="month" data-min="1" data-max="12">
                <button class="spinner-btn spinner-up" aria-label="Monat erhöhen"><i data-lucide="chevron-up" aria-hidden="true"></i></button>
                <div class="spinner-val">01</div>
                <button class="spinner-btn spinner-down" aria-label="Monat verringern"><i data-lucide="chevron-down" aria-hidden="true"></i></button>
              </div>
              <span class="spinner-label" data-i18n="ics.puzzle.lbl.month">Mo</span>
            </div>

            <!-- Year -->
            <div class="spinner-group">
              <div class="spinner" data-field="year" data-min="2020" data-max="2030">
                <button class="spinner-btn spinner-up" aria-label="Jahr erhöhen"><i data-lucide="chevron-up" aria-hidden="true"></i></button>
                <div class="spinner-val">2024</div>
                <button class="spinner-btn spinner-down" aria-label="Jahr verringern"><i data-lucide="chevron-down" aria-hidden="true"></i></button>
              </div>
              <span class="spinner-label" data-i18n="ics.puzzle.lbl.year">Jahr</span>
            </div>

            <!-- Hour -->
            <div class="spinner-group">
              <div class="spinner" data-field="hour" data-min="0" data-max="23">
                <button class="spinner-btn spinner-up" aria-label="Stunde erhöhen"><i data-lucide="chevron-up" aria-hidden="true"></i></button>
                <div class="spinner-val">00</div>
                <button class="spinner-btn spinner-down" aria-label="Stunde verringern"><i data-lucide="chevron-down" aria-hidden="true"></i></button>
              </div>
              <span class="spinner-label" data-i18n="ics.puzzle.lbl.hour">Std</span>
            </div>

            <!-- Minute -->
            <div class="spinner-group">
              <div class="spinner" data-field="minute" data-min="0" data-max="59">
                <button class="spinner-btn spinner-up" aria-label="Minute erhöhen"><i data-lucide="chevron-up" aria-hidden="true"></i></button>
                <div class="spinner-val">00</div>
                <button class="spinner-btn spinner-down" aria-label="Minute verringern"><i data-lucide="chevron-down" aria-hidden="true"></i></button>
              </div>
              <span class="spinner-label" data-i18n="ics.puzzle.lbl.minute">Min</span>
            </div>

          </div>

          <!-- Success -->
          <div class="ics-puzzle-success d-none" id="ics-puzzle-success" role="alert" aria-live="polite">
            <i data-lucide="check-circle" aria-hidden="true"></i>
            <span data-i18n="ics.puzzle.success">Perfekt! Du hast DTSTART korrekt gelesen.</span>
          </div>
          <button class="btn btn-sm btn-outline-secondary mt-2 d-none" id="ics-puzzle-reset" data-i18n="ics.puzzle.reset">Zurücksetzen</button>

        </div>
      </div>

    </div>
  </div>
</section>
