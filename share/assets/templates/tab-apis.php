<div class="tab-pane fade" id="tab-apis" role="tabpanel" aria-labelledby="tab-apis-trigger">
  <?php if (empty($api_entries)) : ?>
    <div class="empty-state text-center py-5">
      <i data-lucide="zap" aria-hidden="true"></i>
      <p class="mt-3">Keine Endpunkte definiert.</p>
    </div>
  <?php else : ?>
    <div class="d-flex flex-column gap-2">
      <?php foreach ($api_entries as $ep) :
        $safeUrl    = htmlspecialchars($ep['url'], ENT_QUOTES, 'UTF-8');
        $safeName   = htmlspecialchars($ep['name'], ENT_QUOTES, 'UTF-8');
        $safePath   = htmlspecialchars(strtoupper($ep['method']) . ' ' . $ep['path'], ENT_QUOTES, 'UTF-8');
        $safeDesc   = htmlspecialchars($ep['description'], ENT_QUOTES, 'UTF-8');
        $safeFormat = htmlspecialchars($ep['format'], ENT_QUOTES, 'UTF-8');
        $safeVer    = htmlspecialchars($ep['version'], ENT_QUOTES, 'UTF-8');
      ?>
        <a href="<?= $safeUrl ?>" target="_blank" rel="noopener noreferrer" class="file-item api-item">
          <i data-lucide="zap" class="file-icon default" aria-hidden="true"></i>
          <span class="file-name">
            <span><?= $safeName ?></span>
            <small class="d-block text-muted api-path"><?= $safePath ?> &mdash; <?= $safeDesc ?></small>
          </span>
          <span class="file-badge default"><?= $safeVer ?></span>
          <span class="file-badge code"><?= $safeFormat ?></span>
          <i data-lucide="external-link" class="file-dl-icon" aria-hidden="true"></i>
        </a>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>
