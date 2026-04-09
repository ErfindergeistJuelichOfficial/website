<!DOCTYPE html>
<html lang="de">
  <head>
    <title>Erfindergeist - Share</title>
  </head>
  <body>
    <ul>
    <?PHP
      $entries = array();
      $allowed_extensions = array("pdf", "docx");

      if ($handle = opendir('.')) {
        while (false !== ($entry = readdir($handle))) {
          if ($entry != "." && $entry != "..") {
            $path_parts = pathinfo($entry);
            $extension = isset($path_parts['extension']) ? strtolower($path_parts['extension']) : "";

            if (in_array($extension, $allowed_extensions)) {
              $entries[] = $entry;
            }
          }
        }

        closedir($handle);
      }

      natcasesort($entries);

      foreach ($entries as $entry) {
        $safeLabel = htmlspecialchars($entry, ENT_QUOTES, 'UTF-8');
        $safeUrl = rawurlencode($entry);
        echo "<li><button type='button' onclick=\"window.location.href='" . $safeUrl . "'\">" . $safeLabel . "</button></li>";
      }

      ?>
    </ul>
  </body>
</html>
