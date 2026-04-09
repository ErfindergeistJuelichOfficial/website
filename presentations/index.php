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
    </style>
  </head>
  <body>
    <main class="container py-4">
      <div class="p-3 mb-3 rounded-3 bg-primary text-white">
        <h1 class="h4 mb-1">Übersicht der Präsentationen</h1>
      </div>
      <ul class="list-group">
    <?PHP
      $directoryCount = 0;
      if ($handle = opendir('.')) {
        while (false !== ($entry = readdir($handle))) {

          if ($entry != "." && $entry != "..") {
            if (is_dir($entry)) {
              $directoryCount++;
              echo "<li class='list-group-item d-flex justify-content-between align-items-center'><a class='folder-link' href='" . $entry . "/'>" . $entry . "</a></li>";
            }
          }
        }

        closedir($handle);
      }

      ?>
      </ul>
      <p class="text-body-secondary small mt-3 mb-0">Gesamt: <?PHP echo $directoryCount; ?></p>
    </main>
    <script src="bootstrap.bundle.min.js"></script>
  </body>
</html>