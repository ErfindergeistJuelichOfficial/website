<?php
$gallery_json = json_encode(
    $gallery_data ?? [],
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
);
$has_albums = !empty($gallery_data['hasPart']);
?>
<div class="tab-pane fade" id="tab-galerie" role="tabpanel" aria-labelledby="tab-galerie-trigger">

  <?php if (!$has_albums) : ?>
    <div class="empty-state text-center py-5">
      <i data-lucide="images" aria-hidden="true"></i>
      <p class="mt-3">Keine Galerien gefunden.</p>
    </div>
  <?php else : ?>
    <script>var GALLERY_DATA = <?= $gallery_json ?>;</script>

    <nav aria-label="Galerie Navigation" class="mb-3">
      <ol class="breadcrumb mb-0" id="gallery-breadcrumb"></ol>
    </nav>

    <div id="gallery-album-info" class="d-none gallery-album-info mb-3" role="region" aria-label="Album-Informationen">
      <div class="d-flex justify-content-between align-items-start gap-3">
        <div class="flex-grow-1">
          <div id="gallery-album-info-meta" class="text-muted small"></div>
          <div id="gallery-album-info-desc" class="d-none mt-1"></div>
          <div id="gallery-album-info-tags" class="d-none mt-2"></div>
        </div>
        <div id="gallery-album-info-links" class="d-none d-flex gap-2 flex-shrink-0 align-items-start"></div>
      </div>
    </div>

    <div id="gallery-grid" class="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4"></div>

    <div id="gallery-images" class="d-none">
      <div class="row g-2" id="gallery-thumb-grid"></div>
    </div>

    <!-- Lightbox Modal -->
    <div class="modal fade" id="gallery-lightbox" tabindex="-1"
         aria-label="Bild Vollansicht" aria-modal="true" role="dialog">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content bg-dark border-0">
          <div class="modal-header border-0 pb-1">
            <span id="gallery-lb-caption" class="text-light small me-auto"></span>
            <button type="button" class="btn-close btn-close-white ms-2"
                    data-bs-dismiss="modal" aria-label="Schliessen"></button>
          </div>
          <div class="modal-body p-2 position-relative d-flex align-items-center justify-content-center">
            <button id="gallery-lb-prev" class="gallery-lb-nav gallery-lb-nav--prev gallery-lb-btn"
                    aria-label="Vorheriges Bild">
              <i data-lucide="chevron-left" aria-hidden="true"></i>
            </button>
            <img id="gallery-lb-img" src="" alt=""
                 aria-hidden="true" aria-describedby="gallery-lb-caption"
                 class="img-fluid" style="max-height:80vh;object-fit:contain">
            <button id="gallery-lb-next" class="gallery-lb-nav gallery-lb-nav--next gallery-lb-btn"
                    aria-label="Nächstes Bild">
              <i data-lucide="chevron-right" aria-hidden="true"></i>
            </button>
          </div>
          <div class="modal-footer border-0 pt-1 justify-content-between align-items-center">
            <span id="gallery-lb-counter" class="text-muted small" role="status"></span>
            <div class="gallery-lb-actions d-flex gap-2">
              <a id="gallery-lb-download" href="#" download
                 class="gallery-lb-btn" aria-label="Bild herunterladen">
                <i data-lucide="download" aria-hidden="true"></i>
              </a>
              <button id="gallery-lb-copy" class="gallery-lb-btn"
                      aria-label="Direktlink zum Bild kopieren">
                <i data-lucide="image" aria-hidden="true"></i>
              </button>
              <div id="gallery-lb-share-panel" class="gallery-lb-share-panel" role="group" aria-label="Teilen">
                <button id="gallery-lb-copy-link" class="gallery-lb-btn"
                        aria-label="Seiten-Link kopieren">
                  <i data-lucide="link" aria-hidden="true"></i>
                </button>
                <?php // phpcs:disable Generic.Files.LineLength -- SVG path data cannot be shortened ?>
                <a id="gallery-lb-wa" href="#" target="_blank" rel="noopener noreferrer"
                   class="gallery-lb-btn" aria-label="Via WhatsApp teilen">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a id="gallery-lb-tg" href="#" target="_blank" rel="noopener noreferrer"
                   class="gallery-lb-btn" aria-label="Via Telegram teilen">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </a>
                <a id="gallery-lb-mst" href="#" target="_blank" rel="noopener noreferrer"
                   class="gallery-lb-btn" aria-label="Via Mastodon teilen">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.066-.049c-1.517.363-3.072.546-4.632.546-2.677 0-3.4-1.267-3.604-1.795a5.185 5.185 0 0 1-.314-1.411.053.053 0 0 1 .066-.054c1.518.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/></svg>
                </a>
                <a id="gallery-lb-bsky" href="#" target="_blank" rel="noopener noreferrer"
                   class="gallery-lb-btn" aria-label="Via Bluesky teilen">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.26.902 1.453.139 1.7 0 3.553 0 4.514c0 .966.61 7.92 1.02 9.066.812 2.234 3.632 2.93 6.157 2.526 3.338-.54 6.77-1.648 7.38-3.73.24-.82.48-3.214.48-4.186-.005-.005-.34-.37-.04.616zm0 0c1.087-2.114 4.046-6.053 6.798-7.995 2.636-1.861 3.641-1.545 4.3-1.352.763.247.902 2.1.902 3.061 0 .966-.61 7.92-1.02 9.066-.812 2.234-3.632 2.93-6.157 2.526-3.338-.54-6.77-1.648-7.38-3.73-.24-.82-.48-3.214-.48-4.186.005-.005.34-.37.04.616z"/></svg>
                </a>
                <?php // phpcs:enable Generic.Files.LineLength ?>
                <a id="gallery-lb-mail" href="#"
                   class="gallery-lb-btn" aria-label="Via E-Mail teilen">
                  <i data-lucide="mail" aria-hidden="true"></i>
                </a>
              </div>
              <button id="gallery-lb-share" class="gallery-lb-btn"
                      aria-label="Teilen" aria-expanded="false" aria-controls="gallery-lb-share-panel">
                <i data-lucide="share-2" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  <?php endif; ?>
</div>
