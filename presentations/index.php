<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Erfindergeist - Presentations
    </title>
    <link rel="stylesheet" href="bootstrap.min.css">
    <style>
      :root {
        --bs-primary: #159989;
        --bs-primary-rgb: 21, 153, 137;
        --bs-link-color: #159989;
        --bs-link-hover-color: #107c6f;
      }

      body {
        background-color: #f6fbfa;
      }

      .folder-link {
        color: var(--bs-primary);
        text-decoration: none;
        font-weight: 500;
      }

      .folder-link:hover {
        color: var(--bs-link-hover-color);
        text-decoration: underline;
      }

      .eg-footer {
        background: linear-gradient(135deg, #ffffff 0%, #eaf6f4 100%);
        border: 1px solid rgba(var(--bs-primary-rgb), 0.25);
      }

      .eg-footer-logo {
        width: 42px;
        height: 42px;
        object-fit: contain;
      }

      .eg-footer-link {
        color: var(--bs-primary);
        text-decoration: none;
      }

      .eg-footer-link:hover {
        color: var(--bs-link-hover-color);
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <main class="container py-4">
      <div class="p-3 mb-3 rounded-3 bg-primary text-white">
        <h1 class="h4 mb-1">Übersicht der Präsentationen</h1>
      </div>
      <ul class="list-group">
        <li class="list-group-item bg-light">
          <div class="row align-items-center">
            <div class="col">
              <span class="small text-uppercase fw-semibold text-body-secondary">Anzeigen</span>
            </div>
            <div class="col-auto text-end">
              <span class="small text-uppercase fw-semibold text-body-secondary">Downloads</span>
            </div>
          </div>
        </li>
    <?PHP
      $entries = array();
      $directoryCount = 0;
      if ($handle = opendir('.')) {
        while (false !== ($entry = readdir($handle))) {

          if ($entry != "." && $entry != "..") {
            if (is_dir($entry)) {
              $entries[] = $entry;
            }
          }
        }

        closedir($handle);
      }

      natcasesort($entries);

      foreach ($entries as $entry) {
        $directoryCount++;
        $safeLabel = htmlspecialchars($entry, ENT_QUOTES, 'UTF-8');
        $safeUrl = rawurlencode($entry);

        $hasPdf = false;
        $pdfFile = '';
        if ($entryHandle = opendir($entry)) {
          while (false !== ($file = readdir($entryHandle))) {
            if (is_file($entry . DIRECTORY_SEPARATOR . $file) && preg_match('/\\.pdf$/i', $file)) {
              $hasPdf = true;
              $pdfFile = $file;
              break;
            }
          }
          closedir($entryHandle);
        }

        echo "<li class='list-group-item'><div class='row align-items-center g-2'><div class='col'><button type='button' class='btn btn-primary btn-sm' onclick=\"window.location.href='" . $safeUrl . "/'\">" . $safeLabel . "</button></div><div class='col-auto text-end'>";

        if ($hasPdf) {
          $safePdfUrl = $safeUrl . "/" . rawurlencode($pdfFile);
          echo "<button type='button' class='btn btn-outline-secondary btn-sm' onclick=\"window.open('" . $safePdfUrl . "', '_blank', 'noopener')\">PDF</button>";
        } else {
          echo "<span class='small text-body-secondary'>-</span>";
        }

        echo "</div></div></li>";
      }

      ?>
      </ul>
      <div class="eg-footer p-4 mt-4 rounded-4 shadow-sm">
        <div class="row g-3 align-items-center">
          <div class="col-12 col-md">
            <div class="d-flex align-items-center gap-3">
              <img src="logo.svg" alt="Erfindergeist Logo" class="eg-footer-logo">
              <div>
                <p class="mb-1 fw-semibold text-dark">Erfindergeist Jülich e.V.</p>
                <p class="mb-0 text-body-secondary">Miteinander - Austauschen - Erforschen - Kreieren </p>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-auto">
            <a href="https://erfindergeist.org/" target="_blank" rel="noopener" class="btn btn-primary px-4">Zur Website</a>
          </div>
          <div class="col-12">
            <p class="mb-0 small text-body-secondary">Mehr Infos auf <a href="https://erfindergeist.org/" target="_blank" rel="noopener" class="eg-footer-link">erfindergeist.org</a></p>
          </div>
        </div>
      </div>

    </main>
    <script src="bootstrap.bundle.min.js"></script>
  </body>
</html>