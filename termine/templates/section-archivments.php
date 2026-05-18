<?php
$ach = [
  ['id' => 'bell-click', 'icon' => 'bell'      ],
  ['id' => 'bell-spin',  'icon' => 'refresh-cw'],
  ['id' => 'ics-solved', 'icon' => 'calendar'  ],
  ['id' => 'rocket',     'icon' => 'send'       ],
  ['id' => 'show-me',    'icon' => 'link'       ],
  ['id' => 'zap',        'icon' => 'zap'        ],
  ['id' => 'json-edit',  'icon' => 'code-2'     ],
];
?>
<!-- ── ERRUNGENSCHAFTEN ──────────────────────────── -->
<section id="archivments" class="section-achievements py-5" aria-labelledby="achievements-title">
  <div class="container">

    <div class="col-12 text-center mb-5" data-aos="fade-up">
      <h2 id="achievements-title" class="section-title section-title-anim" data-i18n="achievements.title">Errungenschaften</h2>
      <p class="lead" data-i18n="achievements.subtitle">Jede Entdeckung hinterlässt eine Spur</p>
    </div>

    <div class="achievements-grid" id="achievements-grid">
      <?php foreach ($ach as $i => $a) :
        $key   = str_replace('-', '_', $a['id']);
        $delay = 50 + $i * 80;
      ?>
      <div class="achievement-card achievement-locked"
           data-achievement="<?= htmlspecialchars($a['id'], ENT_QUOTES, 'UTF-8') ?>"
           data-aos="zoom-in" data-aos-delay="<?= $delay ?>">
        <div class="achievement-icon-wrap">
          <i data-lucide="<?= htmlspecialchars($a['icon'], ENT_QUOTES, 'UTF-8') ?>" class="achievement-icon" aria-hidden="true"></i>
          <div class="achievement-lock-icon" aria-hidden="true"><i data-lucide="lock"></i></div>
          <div class="achievement-badge" aria-hidden="true"><i data-lucide="star"></i></div>
        </div>
        <p class="achievement-hint" data-i18n="achievement.<?= $key ?>.hint">???</p>
        <div class="achievement-unlocked-content">
          <p class="achievement-name" data-i18n="achievement.<?= $key ?>.name">-</p>
          <p class="achievement-desc" data-i18n="achievement.<?= $key ?>.desc">-</p>
        </div>
      </div>
      <?php endforeach; ?>
    </div>

    <!-- Counter / Rang -->
    <div class="achievements-counter" data-aos="fade-up" data-aos-delay="100">
      <p class="achievements-rank" id="achievements-rank" role="status" aria-live="polite">-</p>
      <div class="achievements-stars" aria-hidden="true">
        <?php for ($i = 0; $i < 7; $i++) : ?>
        <i data-lucide="star" class="ach-star"></i>
        <?php endfor; ?>
      </div>
      <p class="achievements-fraction">
        <span id="achievements-count" aria-live="polite">0</span>&thinsp;/&thinsp;<?= count($ach) ?>
      </p>
      <p class="achievements-counter-label small text-muted" data-i18n="achievements.counter">Errungenschaften freigeschaltet</p>
      <button id="achievements-reset" class="btn btn-outline-secondary btn-sm mt-3" data-i18n="achievements.reset">Zurücksetzen</button>
    </div>

  </div>
</section>
