<!DOCTYPE html>
<html lang="de">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erfindergeist - Webcam</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .item {
      border: 2px solid black;
      border-radius: 1rem;
      padding: 1.4rem;

    }

    .item:nth-child(3n+2) {
      margin: 0 0.7rem;
    }
  </style>
</head>

<body>
  <div class="container mx-auto">
    <h3>Erfindergeist - Webcam</h3>
    <div class="flex flex-row">
      <?PHP

      $dir = ".";
      $ignored_files = array($dir, "..", "ftp-deploy-webcam-state.json", ".htpasswd", ".htaccess", "index.php");
      $allowed_extensions = array("jpg", "png");

      function outDated($file) {
        $days_ago = time() - (30*24*60*60*1000);
        return filemtime($file) > $days_ago;
      }

      $files = glob('*.png');
      usort($files, function ($a, $b) {
        return filemtime($b) - filemtime($a);
      });

      $files = array_filter($files, "outDated");

      foreach ($files as $file) {
        $path_parts = pathinfo($file);

        if (in_array($path_parts['extension'], $allowed_extensions)) {
      ?>
        <div class="basis-1/3 item">
          <p><?PHP echo $file ?></p>
          <p><?PHP echo date("d.m.Y - h:m", filemtime($dir . '/' . $file)); ?></p>
          <a href="<?PHP echo $file ?>" download>
            <img src="<?PHP echo $file ?>" height='200px' alt="<?PHP echo $file ?>" />
          </a>
        </div>
      <?PHP
        }
      }

      ?>
    </div>
  </div>
</body>

</html>