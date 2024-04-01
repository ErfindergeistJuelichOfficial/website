<!DOCTYPE html>
<html lang="de">
  <head>
    <title>Erfindergeist - Corporate identity</title>
  </head>
  <body>
    <ul>
    <?PHP
      if ($handle = opendir('.')) {
        while (false !== ($entry = readdir($handle))) {

          if ($entry != "." && $entry != "..") {
            $path_parts = pathinfo($entry);
            $allowed_extensions = array("pdf", "docx");
            
            if (in_array($path_parts['extension'], $allowed_extensions)) {
              echo "<li><a href='" . $entry . "' download>" . $entry . "</a></li>";
            }
          }
        }

        closedir($handle);
      }

      ?>
    </ul>
  </body>
</html>
