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
```

| Tool     | Config          | Files        | What it checks                        |
| -------- | --------------- | ------------ | ------------------------------------- |
| PHPCS    | `phpcs.xml`     | PHP, JS      | PSR-12 (PHP only); braces (JS)        |
| PHPStan  | `phpstan.neon`  | PHP only     | Static type analysis (level 5)        |
| Psalm    | `psalm.xml`     | PHP only     | Taint analysis (level 4)              |
| PHPMD    | `.phpmd.xml`    | PHP only     | Code quality metrics                  |

`composer analyse` **must pass cleanly before every commit.**

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

## gui/ - lokaler Config-Editor

Lokales Webinterface fuer die JSON-Config-Dateien in `share/config/` und optionale
Galerie-Album-`_config.json`-Dateien aus einem konfigurierten Quellordner.

- Stack: Python 3.11-slim (Standardbibliothek, kein pip), Bootstrap 5 + jQuery von share.erfindergeist.org
- Port: **8082**
- Nie deployed, nur lokale Entwicklung

Kein PHP, keine Qualitaetstools fuer diesen Ordner.

## Datenmodell

Alle Aenderungen am JSON-Schema der Config-Dateien (`chronicle.json`, `links.json`, `tags.json`) oder der Album-`_config.json` muessen auch in `DATENMODELL.md` nachgezogen werden (ER-Diagramm, Speicherorte, API-Tabellen).

Property-Namen werden niemals eingedeutscht — immer die originale Bezeichnung aus dem JSON-Schema verwenden (z.B. `title`, `description`, `type`, `httpMethod` — niemals `titel`, `beschreibung`, `typ`, `http_methode`).

## Typo

Do not use - use - instead.
