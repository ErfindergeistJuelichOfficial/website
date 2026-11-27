<?php

declare(strict_types=1);

// Load api.php as a library: EG_API_INCLUDED suppresses the HTTP handler
define('EG_API_INCLUDED', true);

require dirname(__DIR__) . '/vendor/autoload.php';
require_once dirname(__DIR__) . '/share/api.php';
