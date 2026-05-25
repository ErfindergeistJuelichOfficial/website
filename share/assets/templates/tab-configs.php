<div class="tab-pane fade" id="tab-configs" role="tabpanel" aria-labelledby="tab-configs-trigger">
  <?php if (empty($config_entries)) : ?>
    <div class="empty-state text-center py-5">
      <i data-lucide="file-code" aria-hidden="true"></i>
      <p class="mt-3">Keine Konfigurationsdateien gefunden.</p>
    </div>
  <?php else : ?>
    <div class="d-flex flex-column gap-2">
      <?php foreach ($config_entries as $cfgEntry) :
        $safeLabel = htmlspecialchars($cfgEntry, ENT_QUOTES, 'UTF-8');
        $safeUrl   = 'config/' . rawurlencode($cfgEntry);
      ?>
        <a href="<?= $safeUrl ?>" target="_blank" rel="noopener noreferrer" class="file-item d-flex align-items-center gap-2 text-decoration-none">
          <i data-lucide="file-code" class="file-icon code" aria-hidden="true"></i>
          <span class="file-name"><?= $safeLabel ?></span>
          <span class="file-badge code">JSON</span>
          <i data-lucide="external-link" class="file-dl-icon" aria-hidden="true"></i>
        </a>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>
