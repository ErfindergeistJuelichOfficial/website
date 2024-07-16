<!DOCTYPE html>
<html lang="de">
  <head>
    <title>Erfindergeist - Webcam</title>
    <style>
      .main {
        display: block;
        margin-left: auto;
        margin-right: auto;
      }

      .container {
        width: 500px; /* adjust to container size as needed */
        max-width: 90vw;
        height: 500px; /* adjust to container size as needed */
      }

      .container img {
        max-width: 100%;
        max-height: 100%;
        display: block;
      }

    </style>
  </head>
  <body>
    <div>
      <?PHP

      $ignored_files = array('.', '..', 'ftp-deploy-webcam-state.json', '.htpasswd', '.htaccess', 'index.php');
      $allowed_extensions = array("jpg", "png");
      $dir = ".";
      $current_time = time();

      function scanDirAndSortByDate($dir, $ignored_files) {
        $files = array();
        foreach (scandir($dir) as $file) {
            if (in_array($file, $ignored_files)) {
              continue;
            }
            $files[$file] = filemtime($dir . '/' . $file);
        }
    
        arsort($files);
        $files = array_keys($files);
    
        return $files;
      }


      foreach (scanDirAndSortByDate($dir, $ignored_files) as $entry)) {

        if (in_array($entry, $ignored_files)) {
          continue;
        }

        ## TODO: delete file is older than x days
        
        $path_parts = pathinfo($entry);
        
        if (in_array($path_parts['extension'], $allowed_extensions)) {
          ?>
            <div class="container">
              <p><?PHP $entry ?></p>
              <p><?PHP filemtime($dir . '/' . $entry)?></p>
              <a href="<?PHP $entry?>" download>
                <img src="<?PHP  $entry?>" height='200px' alt="<?PHP $entry ?>"/>
              </a>
            </div>
          <?PHP
        }
        
      }

   

      ?>
    </div>
  </body>
</html>
