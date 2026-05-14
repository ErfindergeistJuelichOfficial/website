<div class="tab-pane fade" id="tab-logos" role="tabpanel" aria-labelledby="tab-logos-trigger">
  <?php if (empty($img_entries)) : ?>
    <div class="empty-state text-center py-5">
      <i data-lucide="image" aria-hidden="true"></i>
      <p class="mt-3">Keine Logos gefunden.</p>
    </div>
  <?php else : ?>
    <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
      <?php foreach ($img_entries as $imgEntry) :
        $safeLabel = htmlspecialchars($imgEntry, ENT_QUOTES, 'UTF-8');
        $safeUrl   = 'img/' . rawurlencode($imgEntry);
        $ext       = strtolower(pathinfo($imgEntry, PATHINFO_EXTENSION));
      ?>
        <div class="col">
          <div class="logo-card">
            <div class="logo-card-preview">
              <img src="<?= $safeUrl ?>" alt="<?= $safeLabel ?>" loading="lazy">
            </div>
            <div class="logo-card-name" title="<?= $safeLabel ?>"><?= $safeLabel ?></div>
            <div class="logo-card-actions">
              <span class="file-badge img me-auto"><?= strtoupper($ext) ?></span>
              <a href="<?= $safeUrl ?>" target="_blank" rel="noopener noreferrer"
                 class="btn btn-outline-secondary btn-sm" title="Anzeigen" aria-label="Anzeigen">
                <i data-lucide="eye" aria-hidden="true"></i>
              </a>
              <a href="<?= $safeUrl ?>" download="<?= $safeLabel ?>"
                 class="btn btn-primary btn-sm" title="Download" aria-label="Download">
                <i data-lucide="download" aria-hidden="true"></i>
              </a>
              <button type="button"
                      class="btn btn-outline-secondary btn-sm btn-copy"
                      data-url="https://share.erfindergeist.org/<?= $safeUrl ?>"
                      aria-label="URL kopieren" title="URL kopieren">
                <i data-lucide="clipboard" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>
