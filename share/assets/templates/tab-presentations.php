<div class="tab-pane fade" id="tab-presentations" role="tabpanel" aria-labelledby="tab-presentations-trigger">
  <?php if (empty($pres_entries)) : ?>
    <div class="empty-state text-center py-5">
      <i data-lucide="monitor" aria-hidden="true"></i>
      <p class="mt-3">Keine Präsentationen gefunden.</p>
    </div>
  <?php else : ?>
    <div class="alert alert-info d-flex align-items-center gap-2 mb-3" role="alert" style="font-size:.85rem">
      <i data-lucide="git-branch" style="width:16px;height:16px;flex-shrink:0" aria-hidden="true"></i>
      <span>Die Präsentationen sind als Repository auf
        <a href="https://github.com/ErfindergeistJuelichOfficial" target="_blank" rel="noopener noreferrer" class="alert-link">unserem GitHub</a>
        verfügbar.
      </span>
    </div>
    <div class="d-flex flex-column gap-2">
      <?php foreach ($pres_entries as $name => $files) :
        $safeLabel = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
        $safeUrl   = rawurlencode($name);
        $htmls     = $files['htmls'];
        $pdfs      = $files['pdfs'];
      ?>
        <div class="pres-item">
          <i data-lucide="monitor" class="pres-icon" aria-hidden="true"></i>
          <span class="pres-name"><?= $safeLabel ?></span>
          <div class="pres-actions">

            <?php if (count($htmls) === 1) : ?>
              <a href="presentations/<?= $safeUrl ?>/<?= rawurlencode($htmls[0]) ?>" class="btn btn-primary btn-sm">
                <i data-lucide="play" style="width:13px;height:13px" aria-hidden="true"></i>
                Anzeigen
              </a>
            <?php elseif (count($htmls) > 1) : ?>
              <div class="dropdown">
                <button class="btn btn-primary btn-sm dropdown-toggle" type="button"
                        data-bs-toggle="dropdown" aria-expanded="false">
                  <i data-lucide="play" style="width:13px;height:13px" aria-hidden="true"></i>
                  Anzeigen
                </button>
                <ul class="dropdown-menu">
                  <?php foreach ($htmls as $htmlFile) :
                    $safeHtmlLabel = htmlspecialchars(pathinfo($htmlFile, PATHINFO_FILENAME), ENT_QUOTES, 'UTF-8');
                  ?>
                    <li>
                      <a class="dropdown-item"
                         href="presentations/<?= $safeUrl ?>/<?= rawurlencode($htmlFile) ?>">
                        <?= $safeHtmlLabel ?>
                      </a>
                    </li>
                  <?php endforeach; ?>
                </ul>
              </div>
            <?php endif; ?>

            <?php if (count($pdfs) === 1) : ?>
              <a href="presentations/<?= $safeUrl ?>/<?= rawurlencode($pdfs[0]) ?>" target="_blank"
                 rel="noopener noreferrer" class="btn btn-outline-secondary btn-sm">
                <i data-lucide="file-text" style="width:13px;height:13px" aria-hidden="true"></i>
                PDF
              </a>
            <?php elseif (count($pdfs) > 1) : ?>
              <div class="dropdown">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button"
                        data-bs-toggle="dropdown" aria-expanded="false">
                  <i data-lucide="file-text" style="width:13px;height:13px" aria-hidden="true"></i>
                  PDF
                </button>
                <ul class="dropdown-menu">
                  <?php foreach ($pdfs as $pdfFile) :
                    $safePdfLabel = htmlspecialchars(pathinfo($pdfFile, PATHINFO_FILENAME), ENT_QUOTES, 'UTF-8');
                  ?>
                    <li>
                      <a class="dropdown-item"
                         href="presentations/<?= $safeUrl ?>/<?= rawurlencode($pdfFile) ?>"
                         target="_blank" rel="noopener noreferrer">
                        <?= $safePdfLabel ?>
                      </a>
                    </li>
                  <?php endforeach; ?>
                </ul>
              </div>
            <?php endif; ?>

          </div>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>
