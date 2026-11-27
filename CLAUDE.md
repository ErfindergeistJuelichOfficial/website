# Project

PHP 8.3+

## Code Conventions

- PHP 8.3+ features: full type declarations, union types, short array syntax `[]`
- KISS — no over-engineering, no OOP without reason
- Indentation: **2 spaces** throughout (HTML and PHP)
- Line endings: **LF** (enforced via `.gitattributes`)
- PHP alternative syntax requires a space before the colon: `if ($x) :` / `else :` / `foreach ($x as $y) :` — never `if($x):` or `else:`
- JavaScript brace style: K&R — opening brace on the **same line** as the statement (`if (x) {`, `function f() {`)
- JavaScript control structures: **always use `{ }` braces**, even for single-line bodies — never `if (x) doSomething();`

## Security Rules

These rules apply to every PHP file in the project. No exceptions.

- **HTML output:** always `htmlspecialchars($var, ENT_QUOTES, 'UTF-8')` before echoing any filesystem-derived or user-controlled value into HTML
- **URL construction:** always `rawurlencode($var)` for values interpolated into URLs or `href` attributes
- **File system access:** validate paths with `is_file()` / `is_dir()`; never use `$_GET`/`$_POST` directly as file paths
- **Forbidden functions:** `eval()`, `shell_exec()`, `exec()`, `system()`, `passthru()` — never use
- **Error display:** never `ini_set('display_errors', 1)` in production code

## Design Tokens

- Primary: `#159989` · Secondary: `#F9B338`
- Logo: landscape (~200×60px), served from `https://share.erfindergeist.org/img/logo.svg`

**CSS color rule:** Never hardcode a hex value that has a corresponding `--color-*` CSS variable — always use `var(--color-primary)`, `var(--color-primary-dark)`, `var(--color-surface)` etc. For RGBA variants of the primary color use `rgba(var(--color-primary-rgb), alpha)` instead of the raw hex digits.

**Bootstrap utility rule:** When Bootstrap is loaded, prefer its utility classes over custom CSS for layout and typography — `d-flex`, `flex-column`, `align-items-center`, `justify-content-end`, `overflow-hidden`, `flex-shrink-0`, `flex-grow-1`, `h-100`, `w-100`, `fw-semibold`, `text-truncate`, `object-fit-cover`, `text-decoration-none`, etc. Write custom CSS only for project-specific styling Bootstrap does not cover (colors, borders, transitions, box-shadow, exact spacing outside Bootstrap's scale). Exception: when many elements share the same layout utilities, one CSS rule is cleaner than repeating classes on each element.

## External Assets & Libraries

**All external libraries must be loaded from `https://share.erfindergeist.org/` — never from external CDNs**
(`cdn.jsdelivr.net`, `cdnjs.cloudflare.com`, `unpkg.com` etc.).

Available on Share:

- **CSS:** `bootstrap.min.css`, `aos.min.css`
- **JS:** `jquery.min.js`, `bootstrap.bundle.min.js`, `gsap.min.js`, `ScrollTrigger.min.js`, `aos.min.js`, `typed.min.js`, `lucide.min.js`, `rough-notation.min.js`
- **Fonts:** `Caveat-Regular.ttf`, `Caveat-Bold.ttf`

Adding a new library: download it, place it in the appropriate subfolder in `share/`, then reference it as `https://share.erfindergeist.org/js/lib/file.min.js`.

If a feature is already covered by a loaded library, use it — do not add a new dependency.

## Lucide Icons

Loaded via `lucide.min.js` from Share, initialised with `lucide.createIcons()`.

**The Lucide version on Share is older — the following icons do NOT exist:**
`facebook`, `instagram`, `linkedin`, `github`, `mastodon` and other brand icons.

For social icons always use **inline SVG** (Lucide stroke style: `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`). The Mastodon icon is fill-based (special case).

**Dynamic icons:** When `data-lucide` elements are inserted into the DOM via JS, call `lucide.createIcons()` again afterwards.

**Icons in JS-generated HTML strings** (`insertAdjacentHTML`, `innerHTML`, template literals): always include `aria-hidden="true"` on the `<i>` tag — `lucide.createIcons()` does NOT add it automatically. Decorative example: `<i data-lucide="map-pin" aria-hidden="true"></i>`

## Quality Tools

```bash
# via Podman (default — no local PHP required)
podman compose run --rm composer install   # once, or after composer.json changes
podman compose run --rm composer analyse   # PHPCS + PHPStan + Psalm + PHPMD

# individual tools
podman compose run --rm composer phpcs
podman compose run --rm composer phpstan
podman compose run --rm composer psalm
podman compose run --rm composer phpmd
podman compose run --rm composer phpcbf    # auto-fix style violations
podman compose run --rm composer test      # PHPUnit (tests/share/, share/api.php)
```

| Tool     | Config          | Files        | What it checks                        |
| -------- | --------------- | ------------ | ------------------------------------- |
| PHPCS    | `phpcs.xml`     | PHP, JS      | PSR-12 (PHP only); braces (JS)        |
| PHPStan  | `phpstan.neon`  | PHP only     | Static type analysis (level 5)        |
| Psalm    | `psalm.xml`     | PHP only     | Taint analysis (level 4)              |
| PHPMD    | `.phpmd.xml`    | PHP only     | Code quality metrics                  |
| PHPUnit  | `phpunit.xml`   | `tests/share/` | Unit tests for `share/api.php`      |

`composer analyse` and `composer test` **must pass cleanly before every commit.**

**PHPUnit:** tests live in `tests/share/` (outside `share/`, so never deployed), namespace
`Erfindergeist\Tests\Share`, camelCase test methods. `tests/bootstrap.php` defines `EG_API_INCLUDED`
and loads `share/api.php` as a library. Functions that read files take the share root as a parameter
(`eg_gallery_data($root)`, `eg_config_data($root)`, `eg_downloads_config($root)`), so tests use a temp dir.
PHPCS checks `tests/`; PHPStan/Psalm/PHPMD only production code.

**Important:** Changes to quality tool configs must also be reflected in `.github/workflows/ci.yml`.

### Suppression Patterns

Use these only when a violation genuinely cannot be fixed (e.g. unavoidable structural complexity, SVG path data):

**PHPCS - long lines in PHP templates (inline SVG path data):**

```php
<?php // phpcs:disable Generic.Files.LineLength -- SVG path data cannot be shortened ?>
  <svg ...><path d="...very long path..."/></svg>
<?php // phpcs:enable Generic.Files.LineLength ?>
```

**PHPMD - built-in iterator classes without `use` statements** (`RecursiveDirectoryIterator`, `RecursiveIteratorIterator`, etc.):

```php
/**
 * @SuppressWarnings(PHPMD.MissingImport)
 */
function eg_example(): array { ... }
```

**PHPMD - complex functions:** use both annotations together:

```php
/**
 * @SuppressWarnings(PHPMD.CyclomaticComplexity)
 * @SuppressWarnings(PHPMD.NPathComplexity)
 */
function eg_complex(): array { ... }
```

## Accessibility

- Every `<img>` needs a non-empty `alt` (except explicitly decorative: `alt=""` + comment)
- When JS sets `img.src`, `img.alt` must be set in the same call (use `caption || filename` — never empty)
- `<th>` must never be empty — use `<span class="visually-hidden">Text</span>` for icon-only columns
- Every page has exactly one `<h1>` (use `class="visually-hidden"` if not visually desired)
- Multiple `<nav>` on one page: each needs a unique `aria-label`
- `role="menu"` requires `role="menuitem"` children — otherwise use `role="group"`
- Elements with JS-updated text content: `role="status"` or `aria-live="polite"`
- Icon-only interactive elements: always `aria-label`

## CI/CD & Deployment

Pipelines: `.github/workflows/`

`deploy-share.yml` (Push auf main, manuell, naechtlich 02:00 UTC, GUI-Button) holt die Configs per rclone
aus der oeffentlichen Nextcloud-Freigabe (`Public/Configs`, nur lesbar), prueft sie mit
`gui/validate_configs.py` (Fehler = Abbruch vor jedem Upload, verwaiste Verweise = nur Warnung), deployt Code + Configs per
FTP-Deploy-Action und synchronisiert `Public/Galerie` per `rclone sync` auf den Server (nur Aenderungen,
`--max-delete` als Schutz) nach `galerie/`. Beide Schritte nutzen `FTP_USERNAME_SHARE` / `FTP_PASSWORD_SHARE`
(Wurzel = `share/`), Host `erfindergeist.org`. Das all-inkl-Zertifikat lautet auf `*.kasserver.com`, daher
prüft rclone den Hostnamen bewusst nicht (`NO_CHECK_CERTIFICATE`), die Verbindung bleibt verschlüsselt.

**Laufzeit liest nie aus der Cloud:** Configs und Galerie liegen nach dem Deploy auf dem Webspace
(`share/config/`, `share/galerie/`). Ist die Nextcloud beim Deploy down, bricht der Job ab und der
Webspace behaelt den letzten guten Stand.

`ci.yml` (Push auf main, Pull Requests, monatlich, manuell): PHP-Analyse (`composer analyse`) und
Python-Unit-Tests (`gui/tests/`).

## gui/ - lokaler Config-Editor und Galerie-Pipeline

Lokales Webinterface fuer alle Configs in der Nextcloud (`Public/Configs`) sowie die
Bildverarbeitung. Wird von mehreren Personen genutzt (z.B. Marketing) - niemand braucht FTP-Zugang.

- Stack: Python 3.12-slim (mit pip: Pillow, OpenCV, numpy, piexif), Bootstrap 5 + jQuery von share.erfindergeist.org
- Port: **8082**
- Nie deployed, nur lokale Entwicklung
- Tabs: **Chronik**, **Links**, **Tags**, **Alben**, **Galerie**, **Downloads**; Button **Veroeffentlichen**
  startet `deploy-share.yml` per GitHub-API (`GITHUB_TOKEN` in `gui/.env`, fine-grained, nur Actions: write)
- Kein Verlauf/Undo - die Nextcloud versioniert jede Datei
- GPU-Inferenz: NVIDIA per `GPU_DEVICE=nvidia.com/gpu=all` (CDI), AMD/ROCm per Overlay
  `compose.rocm.yaml` (setzt `AI_BASE=plain` + ROCm-Torch-Wheels; `DEVICE=cuda` gilt auch
  fuer ROCm). CPU ist der Default.

Kein PHP, keine PHP-Qualitaetstools fuer diesen Ordner. Unit-Tests fuer `process.py`, `server.py` und `validate_configs.py`
liegen in `gui/tests/` (Python-`unittest`, keine Zusatz-Abhaengigkeit, nur Temp-Ordner) und muessen
vor jedem Commit an `gui/*.py` gruen sein: `podman compose run --rm test` (aus `gui/`).

**Ordner** (`SOURCE_DIR` in `gui/.env` = Nextcloud-Wurzel, z.B. `/home/lars/erfindergeist`):

| Host-Pfad | Container | Inhalt |
| --- | --- | --- |
| `Public/Configs/` | `/configs` | `chronicle.json`, `links.json`, `tags.json`, `downloads.json`, `galerie.json` |
| `Mitglieder/Galerie/<album>/` | `/source` (ro) | Originalfotos (privat, nur Mitglieder) |
| `Public/Galerie/<album>/` | `/output` | generierte `*_n.webp` / `*_t.webp` (verpixelt, oeffentlich) |

### gui/ - Galerie-Pipeline

`gui/process.py` verarbeitet die Bilder (nicht deployed): liest die Alben aus `galerie.json`,
die Originale aus `/source/<path>`, schreibt WebP nach `/output/<path>` und die schlanke Bildliste
zurueck in `galerie.json`. Den Upload auf den Server macht die Pipeline (rclone), nicht die GUI.

| Service | Befehl (aus `gui/`) |
| --- | --- |
| Bilder verarbeiten | `podman compose run --rm process` |
| Unit-Tests (`gui/tests/`, unittest) | `podman compose run --rm test` |
| Configs + Galerie-Dateien pruefen (wie die Pipeline, nur lesend) | `podman compose run --rm validate` |

**`galerie.json`-Schema** (`DataCatalog`, `hasPart[]` = ein `ImageGallery` pro Album):

```json
{
  "@type": "ImageGallery",
  "path": "Verein/Mobilitaetstag2025",
  "title": "string, required - fehlt: Album wird uebersprungen",
  "description": "string, optional",
  "consent_collected": true,
  "chronicle_id": "urn:uuid:..., optional",
  "link_ids": ["urn:uuid:..."],
  "preview": "DSC_0042.jpg",
  "blur":    ["IMG_007.jpg"],
  "no_blur": ["logo.jpg"],
  "imageCount": 66,
  "previewThumbnail": "20250921_185948_28518357_t.webp",
  "hasPart": [{ "name": "20250921_185948_28518357_n.webp", "caption": "...", "blurred": true }]
}
```

- Config-Felder (`path` bis `no_blur`) pflegt die GUI; `imageCount`, `previewThumbnail`, `hasPart` schreibt nur `process.py`
- `name` = `YYYYMMDD_HHMMSS_<sourceHash>_n.webp`; `sourceHash`, `dateCreated` und Thumbnail (`_t.webp`)
  werden daraus abgeleitet, nicht gespeichert. Keine Tags an Alben.
- `consent_collected` default: `false` (Gesichter werden immer gescannt)
- `blur` / `no_blur`: Dateinamen der Quelldatei (Original), nicht des WebP-Outputs
- `chronicle_id`: verknuepft Album mit Chronik-Eintrag fuer Datum und Links
- Geschrieben wird kompakt und atomar, und nur wenn sich ein Album aendert (sonst neue Nextcloud-Version)
- `process.py` immer nur auf **einem** Rechner gleichzeitig laufen lassen (sonst Nextcloud-Konfliktkopie);
  die GUI sperrt Album-Aenderungen, solange ein lokaler Lauf aktiv ist

**Inkrementell:** Bilder werden per SHA256-Hash erkannt; bereits verarbeitete Bilder
werden bei erneutem Aufruf uebersprungen. Aenderung von `consent_collected` loest
Neuverarbeitung aller Bilder des Albums aus.

**Vor jedem Commit pruefen:**

- Keine Configs oder Galerie-Dateien committed: `share/config/*.json` und `share/galerie/*` sind gitignored,
  sie liegen in der Nextcloud und werden von `deploy-share.yml` geholt
- Kein `.env` committed (nur `.env.example` ist tracked)

### gui Downloads - Design-Kopplung

`gui/` laedt `share.erfindergeist.org/assets/css/share.css` direkt. Der Downloads-Tab
in `gui/index.html` + `gui/app.js` spiegelt das Design von `share/assets/templates/tab-downloads.php`
1:1 wider (gleiche Tabellenstruktur, gleiche CSS-Klassen, gleiche Filter-Bar).

**Bei Design-Aenderungen an `share/assets/templates/tab-downloads.php` oder den
zugehoerigen CSS-Regeln in `share/assets/css/share.css` muss `gui/app.js`
(`renderDownloadsList`, `renderDownloadsRows`) entsprechend angepasst werden.**

## Datenmodell

Alle Aenderungen am JSON-Schema der Config-Dateien (`chronicle.json`, `links.json`, `tags.json`, `downloads.json`, `galerie.json`) muessen auch in `DATENMODELL.md` nachgezogen werden (ER-Diagramme, Speicherorte, API-Tabellen).

Property-Namen werden niemals eingedeutscht — immer die originale Bezeichnung aus dem JSON-Schema verwenden (z.B. `title`, `description`, `type`, `httpMethod` — niemals `titel`, `beschreibung`, `typ`, `http_methode`).

## Typo

Do not use - use - instead.
