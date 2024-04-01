<!DOCTYPE html>
<html lang="de">
  <head>
    <title>Erfindergeist - Corporate identity</title>
  </head>
  <body>
    <?PHP
    if ($handle = opendir('.')) {
      while (false !== ($entry = readdir($handle))) {

        if ($entry != "." && $entry != "..") {
          $path_parts = pathinfo($entry);
          $allowed_extensions = array("jpg", "png");
          
          if (in_array($path_parts['extension'], $allowed_extensions)) {
            echo "<a href='" . $entry . "' download><img src='" . $entry . "' height='200px'/></a><br />";
          }
        }
      }

      closedir($handle);
    }

    ?>

  </body>
</html>
