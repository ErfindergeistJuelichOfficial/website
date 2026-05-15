<?php
$__hasBereich = !empty($bereiche);
$__hasThema   = !empty($themen);
$__hasGruppe  = !empty($gruppen);
?>
<div class="tab-pane fade show active" id="tab-downloads" role="tabpanel" aria-labelledby="tab-downloads-trigger">

  <div class="d-flex gap-2 mb-3 flex-wrap align-items-center">
    <input type="search" id="file-search" class="form-control" style="max-width:280px"
           placeholder="Dateien suchen…" aria-label="Dateien suchen">
    <?php if ($__hasBereich) : ?>
      <select id="bereich-filter" class="form-select" style="max-width:180px" aria-label="Bereich filtern">
        <option value="">Alle Bereiche</option>
        <?php foreach ($bereiche as $__b) : ?>
          <option value="<?= htmlspecialchars($__b, ENT_QUOTES, 'UTF-8') ?>">
            <?= htmlspecialchars($__b, ENT_QUOTES, 'UTF-8') ?>
          </option>
        <?php endforeach; ?>
      </select>
    <?php endif; ?>
    <?php if ($__hasThema) : ?>
      <select id="thema-filter" class="form-select" style="max-width:180px" aria-label="Thema filtern">
        <option value="">Alle Themen</option>
        <?php foreach ($themen as $__t) : ?>
          <option value="<?= htmlspecialchars($__t, ENT_QUOTES, 'UTF-8') ?>">
            <?= htmlspecialchars($__t, ENT_QUOTES, 'UTF-8') ?>
          </option>
        <?php endforeach; ?>
      </select>
    <?php endif; ?>
    <?php if ($__hasGruppe) : ?>
      <select id="gruppe-filter" class="form-select" style="max-width:180px" aria-label="Gruppe filtern">
        <option value="">Alle Gruppen</option>
        <?php foreach ($gruppen as $__g) : ?>
          <option value="<?= htmlspecialchars($__g, ENT_QUOTES, 'UTF-8') ?>">
            <?= htmlspecialchars($__g, ENT_QUOTES, 'UTF-8') ?>
          </option>
        <?php endforeach; ?>
      </select>
    <?php endif; ?>
    <button type="button" id="clear-filters" class="btn btn-sm btn-outline-danger dl-clear-btn"
            aria-label="Filter löschen">
      <i data-lucide="x" aria-hidden="true"></i> Filter löschen
    </button>
  </div>

  <?php if (empty($entries)) : ?>
    <div class="empty-state text-center py-5">
      <i data-lucide="folder-open" aria-hidden="true"></i>
      <p class="mt-3">Noch keine Dateien vorhanden.</p>
    </div>
  <?php else : ?>
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0" id="downloads-table">
        <thead>
          <tr>
            <th class="dl-fmt-col">Format</th>
            <th>Name</th>
            <?php if ($__hasBereich) :
?><th>Bereich</th><?php
            endif; ?>
            <?php if ($__hasThema) :
?><th>Thema</th><?php
            endif; ?>
            <?php if ($__hasGruppe) :
?><th>Gruppe</th><?php
            endif; ?>
            <th></th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($entries as $entry) :
            $ext      = strtolower(pathinfo($entry['name'], PATHINFO_EXTENSION));
            $safeLabel = htmlspecialchars($entry['name'], ENT_QUOTES, 'UTF-8');
            $safeUrl   = implode('/', array_map('rawurlencode', explode('/', $entry['path'])));
            $iconName  = EG_ICON_MAP[$ext]  ?? 'file';
            $extClass  = EG_CLASS_MAP[$ext] ?? 'default';
            $parts     = $entry['folder'] !== '' ? explode('/', $entry['folder']) : [];
          ?>
            <tr data-folder="<?= htmlspecialchars($entry['folder'], ENT_QUOTES, 'UTF-8') ?>"
                data-name="<?= htmlspecialchars($entry['name'], ENT_QUOTES, 'UTF-8') ?>">
              <td class="dl-fmt-col">
                <span class="file-badge <?= $extClass ?>"><?= strtoupper($ext) ?></span>
              </td>
              <td class="dl-name-cell">
                <a href="<?= $safeUrl ?>" target="_blank" rel="noopener noreferrer" class="dl-name-link">
                  <span class="fw-semibold"><?= $safeLabel ?></span>
                  <?php if ($entry['description'] !== '') : ?>
                    <small class="text-muted d-block"><?= htmlspecialchars($entry['description'], ENT_QUOTES, 'UTF-8') ?></small>
                  <?php endif; ?>
                </a>
              </td>
              <?php if ($__hasBereich) : ?>
                <td class="text-muted small"><?= htmlspecialchars($parts[0] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
              <?php endif; ?>
              <?php if ($__hasThema) : ?>
                <td class="text-muted small"><?= htmlspecialchars($parts[1] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
              <?php endif; ?>
              <?php if ($__hasGruppe) : ?>
                <td class="text-muted small"><?= htmlspecialchars($parts[2] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
              <?php endif; ?>
              <td class="dl-action-col">
                <?php if ($entry['wikiUrl'] !== '') : ?>
                  <a href="<?= htmlspecialchars($entry['wikiUrl'], ENT_QUOTES, 'UTF-8') ?>"
                     class="btn btn-sm btn-outline-primary"
                     target="_blank" rel="noopener noreferrer">Wiki</a>
                <?php endif; ?>
              </td>
              <td class="dl-action-col">
                <?php if ($entry['rawUrl'] !== '') : ?>
                  <a href="<?= htmlspecialchars($entry['rawUrl'], ENT_QUOTES, 'UTF-8') ?>"
                     class="btn btn-sm btn-outline-secondary"
                     target="_blank" rel="noopener noreferrer">Raw</a>
                <?php endif; ?>
              </td>
              <td class="dl-action-col">
                <a href="<?= $safeUrl ?>" target="_blank" rel="noopener noreferrer"
                   class="btn btn-sm btn-outline-secondary" aria-label="Herunterladen">
                  <i data-lucide="download" aria-hidden="true"></i>
                </a>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  <?php endif; ?>

  <?php if (!empty($dl_errors)) : ?>
    <div class="alert alert-warning mt-4 mb-0" role="alert">
      <strong>_meta.json Fehler:</strong>
      <ul class="mb-0 mt-1">
        <?php foreach ($dl_errors as $__err) : ?>
          <li><?= htmlspecialchars($__err, ENT_QUOTES, 'UTF-8') ?></li>
        <?php endforeach; ?>
      </ul>
    </div>
  <?php endif; ?>

</div>
