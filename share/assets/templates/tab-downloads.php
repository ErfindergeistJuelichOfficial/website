<div class="tab-pane fade show active" id="tab-downloads" role="tabpanel" aria-labelledby="tab-downloads-trigger">
  <input type="search" id="file-search" class="form-control mb-3"
         placeholder="Dateien suchen…" aria-label="Dateien suchen">
  <?php if (empty($entries)): ?>
    <div class="empty-state text-center py-5">
      <i data-lucide="folder-open" aria-hidden="true"></i>
      <p class="mt-3">Noch keine Dateien vorhanden.</p>
    </div>
  <?php else: ?>
    <div class="d-flex flex-column gap-2">
      <?php foreach ($entries as $entry):
        $ext       = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
        $safeLabel = htmlspecialchars($entry, ENT_QUOTES, 'UTF-8');
        $safeUrl   = rawurlencode($entry);
        $iconName  = $icon_map[$ext]  ?? 'file';
        $extClass  = $class_map[$ext] ?? 'default';
      ?>
        <a href="<?= $safeUrl ?>" target="_blank" rel="noopener noreferrer" class="file-item">
          <i data-lucide="<?= $iconName ?>" class="file-icon <?= $extClass ?>" aria-hidden="true"></i>
          <span class="file-name"><?= $safeLabel ?></span>
          <span class="file-badge <?= $extClass ?>"><?= strtoupper($ext) ?></span>
          <i data-lucide="download" class="file-dl-icon" aria-hidden="true"></i>
        </a>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>
