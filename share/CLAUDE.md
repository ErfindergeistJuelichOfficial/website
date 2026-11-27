# CLAUDE.md - share/

## Purpose

The `share/` folder serves two purposes:

1. **Asset host**: All shared libraries (Bootstrap, GSAP, Lucide, AOS, Typed.js, Rough Notation, Caveat font, logo) live here and are served from `https://share.erfindergeist.org/`.
2. **Download page**: `index.php` lists tabs for downloads, presentations, logos, QR codes and configs.

Deployed at: <https://share.erfindergeist.org/>

---

## Production Environment

**Target: shared hosting** via FTP - no Docker, no containers, no SSH access.

- Apache with PHP 8.x (PHP version set in `compose.yaml` for local parity)
- No `mod_rewrite` dependency - all routes use real directory/file structure
- No server-side config files beyond `.htaccess` (CORS headers, directory listing off)
- Deployment via `FTP-Deploy-Action` in `.github/workflows/deploy-share.yml`

---

## API

`GET https://share.erfindergeist.org/api/v1/assets`

Returns a single JSON-LD (`application/ld+json`) document with Schema.org types:

- `DataCatalog` at the root
- `MediaObject` per file (name, path, contentUrl, encodingFormat, contentSize)
- `PresentationDigitalDocument` per presentation subfolder

Sections: `css`, `fonts`, `img`, `js` (recursive), `qr`, `downloads`, `presentations`, `config`.
`config.content` includes the parsed JSON of every file in `config/`.

**JSON-LD rule:** Every file in `config/` must be valid JSON-LD - always include `@context`, `@type`, and `@id` at the root level. The API exposes their raw content directly; structured metadata makes it machine-readable without additional documentation.

| File | `@type` | Entry `@type` |
| --- | --- | --- |
| `chronicle.json` | `ItemList` | `Event` |
| `links.json` | `ItemList` | `ListItem` → `WebPage` / `EntryPoint` / `SoftwareSourceCode` |
| `tags.json` | `DefinedTermSet` | `Place` (location tags), `DefinedTerm` (description tags) |
| `downloads.json` | `DataCatalog` | `DataCatalog` pro Ordner → `MediaObject` |
| `galerie.json` | `DataCatalog` | `ImageGallery` pro Album → Bild `{name, caption, blurred}` |

**Configs liegen nicht im Repo:** `config/*.json` kommen aus der Nextcloud (`Public/Configs`) und werden
von `deploy-share.yml` vor dem FTP-Sync geladen. Lokal mit echten Daten: Service `share` in `gui/compose.yaml`
(nutzt `SOURCE_DIR` aus `gui/.env`). `galerie.json` und `downloads.json` erscheinen in
`config.files`, aber nicht in `config.content` (Inhalt steht in `gallery` bzw. `downloads`).

Note: `links.json` changed from a plain array to a JSON-LD object (`itemListElement` array, `name` instead of `title`). Update any consumers accordingly.

**Routing without mod_rewrite:** `api/v1/assets/index.php` includes `api.php` directly.
Apache serves `index.php` via standard directory index; `api/v1/assets` redirects 301 to `api/v1/assets/`.

`index.php` (the page) defines `EG_API_INCLUDED` before requiring `api.php` so the HTTP handler is suppressed and only `eg_assets_data()` runs.

---

## Folder Structure

```text
share/
├── api.php                          # JSON-LD API logic (functions + HTTP handler)
├── variables.php                    # Shared constants: EG_DOWNLOAD_EXT, EG_ICON_MAP, EG_CLASS_MAP
├── api/
│   └── v1/
│       └── assets/
│           └── index.php            # Route entry point: require_once api.php
├── index.php                        # Download page: loads data via api.php, includes templates
├── compose.yaml                     # Podman Compose (local dev only - not deployed)
├── README.md                        # Local dev instructions (not deployed)
├── CLAUDE.md                        # This file (not deployed)
├── assets/
│   ├── css/
│   │   ├── share.css               # Global styles (vars, navbar, tabs, file items, logo cards …)
│   │   ├── tab-presentations.css   # Presentations tab only (.pres-*, .alert-info)
│   │   └── section-sponsoring.css  # Sponsoring section only (.sponsor-*)
│   ├── js/
│   │   └── share.js                # All custom scripts for the page
│   └── templates/
│       ├── tab-downloads.php       # Tab: Downloads (files in downloads/)
│       ├── tab-presentations.php   # Tab: Presentations (presentations/)
│       ├── tab-logos.php           # Tab: Logos (img/)
│       ├── tab-qr.php              # Tab: QR Codes (qr/)
│       └── tab-configs.php         # Tab: Configs (config/)
├── css/
│   ├── bootstrap.min.css           # Bootstrap 5.3
│   └── aos.min.css                 # AOS scroll-reveal
├── js/lib/
│   ├── jquery.min.js
│   ├── bootstrap.bundle.min.js
│   ├── gsap.min.js
│   ├── ScrollTrigger.min.js
│   ├── aos.min.js
│   ├── typed.min.js
│   ├── lucide.min.js
│   └── rough-notation.min.js
├── fonts/
│   ├── Caveat-Regular.ttf          # Handwriting font for h1-h3
│   └── Caveat-Bold.ttf
├── img/
│   └── logo.svg                    # Club logo (navbar + hero)
├── downloads/                       # Downloadable files for the Downloads tab (real files only on the server)
│   ├── *.pdf, *.docx, *.md …      # mock-* files are excluded from deployment
│   └── <subfolder>/…               # metadata per folder: config/downloads.json
├── galerie/                        # Photo gallery - only .gitignore in the repo
│   └── <album-path>/*_t.webp, *_n.webp   # from Nextcloud Public/Galerie, synced by rclone in deploy-share.yml
├── qr/                             # QR code files
├── config/                         # .htaccess in the repo; *.json from Nextcloud Public/Configs (gitignored)
└── presentations/                  # Presentation subfolders (one folder per presentation)
    └── <name>/
        ├── index.html
        └── *.pdf                   # Optional: PDF version
```

---

## Tab Order

1. Downloads - files in `downloads/` (PDF, DOCX, MD, YAML …)
2. **Galerie** - photo albums from `galerie/` (generated by `galerie/process.py`)
3. Presentations - subfolders in `presentations/`, linked via `presentations/<name>/`
4. Logos - image files from `img/`
5. QR Codes - image files from `qr/`
6. Configs - JSON files from `config/`
7. APIs - static list from `$api_entries` in `index.php`

The client-side router (`share.js`) reads and writes URL state via `history.replaceState` — no page reload.

| State | URL parameter |
| --- | --- |
| Active tab | hash: `#presentations`, `#logos`, `#qr`, `#configs`, `#apis` (downloads = default, no hash) |
| Search text | `?q=bierdeckel` |
| Bereich filter | `?bereich=marketing` |
| Thema filter | `?thema=Bierdeckel` |
| Gruppe filter | `?gruppe=spezifisch` |

Parameters can be combined: `?q=flyer&bereich=marketing#downloads`

All filter state is preserved in the URL across tab switches so links can be shared directly.

---

## Editing Tab Templates

Each tab is a standalone PHP file in `assets/templates/`.
Templates share variable scope with `index.php` (PHP `include`).
Available variables per template:

- `tab-downloads.php` — `$entries`, `$dl_errors`, `$bereiche`, `$themen`, `$gruppen`, `EG_ICON_MAP`, `EG_CLASS_MAP`
- `tab-galerie.php` — `$gallery_data` (album summaries from `config/galerie.json` without image lists; empty array when missing)
- `tab-presentations.php` — `$pres_entries` (assoc: `name => {htmls: string[], pdfs: string[]}`) — je ein sortiertes Array der gefundenen HTML- bzw. PDF-Dateien
- `tab-logos.php` — `$img_entries`
- `tab-qr.php` — `$qr_entries`
- `tab-configs.php` — `$config_entries`
- `tab-apis.php` — `$api_entries` (static array in `index.php`)

`$entries` is a flat array; each element:

```php
[
  'name'           => 'file.pdf',
  'path'           => 'downloads/subfolder/file.pdf',
  'folder'         => 'subfolder',        // '' for root files
  'description'    => 'Short description', // '' if none
  'wikiUrl'        => 'https://…',        // '' if none
  'encodingFormat' => 'application/pdf',
]
```

---

## Downloads - `config/downloads.json`

All download folder metadata lives in one file in the Nextcloud (`Public/Configs/downloads.json`),
edited via the GUI Downloads tab. JSON-LD with `@context`, `@type` (`DataCatalog`) and `@id`;
`hasPart[]` holds one entry per folder (`path` relative to `downloads/`, `''` = root).

```json
{
  "@context": "https://schema.org",
  "@type": "DataCatalog",
  "@id": "https://share.erfindergeist.org/config/downloads.json",
  "hasPart": [
    {
      "@type": "DataCatalog",
      "path": "Marketing/Bierdeckel",
      "name": "Bierdeckel",
      "description": "Optional folder description, available via API.",
      "hasPart": [
        {
          "@type": "MediaObject",
          "title": "bierdeckel-vorderseite.svg",
          "description": "Short file description shown as a subtitle in the table.",
          "link_ids": ["urn:uuid:..."],
          "tags": ["stammtisch"]
        }
      ]
    }
  ]
}
```

| Field | Description |
| --- | --- |
| `hasPart[].path` | Folder below `downloads/`; matched against the folder scanned by `api.php`. |
| `hasPart[].hasPart[].title` | Filename - must match an actual file in that folder (validation warning if not). |
| `hasPart[].hasPart[].description` | Short subtitle shown below the filename in the table. |
| `hasPart[].hasPart[].link_ids` | Array of link GUIDs from `links.json`. Rendered as buttons using `EG_LINK_BUTTON_CLASS` per link type. |
| `hasPart[].hasPart[].tags` | Array of tag keys from `tags.json` (without `#`). |

- Validation errors are shown as an alert at the bottom of the Downloads tab.

---

## Shared Constants (`variables.php`)

`variables.php` is included by both `api.php` and `index.php`. It defines:

- `EG_DOWNLOAD_EXT` (`api.php`) - allowed extensions for the downloads scan
- `EG_ICON_MAP` (`tab-downloads.php`) - extension → Lucide icon name
- `EG_CLASS_MAP` (`tab-downloads.php`) - extension → CSS `.file-badge` class

---

## Design

See [root CLAUDE.md](../CLAUDE.md) for design tokens and the no-CDN rule.

- Custom styles: `assets/css/share.css`
- Custom scripts: `assets/js/share.js`

**CSS color rule:** Never hardcode a hex value that has a corresponding `--color-*` variable defined in `assets/css/share.css` `:root`. Use `var(--color-primary)`, `var(--color-primary-dark)`, `var(--color-surface)` etc. For RGBA primary shadows use `rgba(var(--color-primary-rgb), alpha)`.

**Bootstrap utility rule:** Prefer Bootstrap utility classes over custom CSS for layout and typography. Write custom CSS only for properties Bootstrap does not cover (colors, borders, border-radius, box-shadow, transitions, exact spacing not on Bootstrap's scale).

| Instead of custom CSS | Use Bootstrap class |
| --- | --- |
| `display: flex / inline-flex / block` | `d-flex` / `d-inline-flex` / `d-block` |
| `flex-direction: column` | `flex-column` |
| `align-items: center` | `align-items-center` |
| `justify-content: center / flex-end` | `justify-content-center` / `justify-content-end` |
| `overflow: hidden` | `overflow-hidden` |
| `flex-shrink: 0` / `flex-grow: 1` | `flex-shrink-0` / `flex-grow-1` |
| `height: 100%` / `min-height: 100vh` | `h-100` / `min-vh-100` |
| `width: 100%` | `w-100` |
| `font-weight: 600 / 700` | `fw-semibold` / `fw-bold` |
| `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` | `text-truncate` |
| `object-fit: cover` | `object-fit-cover` |
| `text-decoration: none` | `text-decoration-none` |

**Exception:** When many elements share the same set of layout utilities, a single CSS rule is cleaner than repeating them on each element (e.g. `.gallery-lb-btn` covers 11 lightbox buttons).

---

## Presentations (relocated)

`presentations.erfindergeist.org` redirects via 301 to `share.erfindergeist.org/#presentations`.
Presentation subfolders live on the server under `share/presentations/`.

---

## Local Development

Podman Compose mirrors the production environment (Apache + PHP, same version).
Run from the `share/` folder:

```powershell
podman compose up
```

Then open <http://localhost:8080>.

`share/compose.yaml` serves only the repo - `config/*.json` and `galerie/` are empty there.
**With the real configs and gallery from the Nextcloud**, start the dev server from `gui/` instead
(same `SOURCE_DIR` as the GUI, from `gui/.env`):

```bash
cd gui
podman compose up share
```

> Assets from `share.erfindergeist.org` (Bootstrap, Lucide …) load from the internet.
> The API is available at <http://localhost:8080/api/v1/assets/> (trailing slash, or without - Apache redirects).

---

## Required Checks

**New files:** Always check whether the new file needs to be added to `deploy-share.yml` under `exclude` (e.g. local helpers, mocks, docs, `.gitkeep`).

**HTML changes in templates:** When elements in `assets/templates/` are removed or restructured, always check:

- Are there CSS classes in `assets/css/share.css` that are now dead? → remove immediately.

## Code Quality & Security

See root [CLAUDE.md](../CLAUDE.md) for the full rules. Summary for this module:

- All PHP output into HTML **must** use `htmlspecialchars($var, ENT_QUOTES, 'UTF-8')`
- All values interpolated into URLs **must** use `rawurlencode($var)`
- Run `podman compose run --rm composer analyse` from the project root before committing
- `composer analyse` must pass with zero errors

## Accessibility

Target: WCAG 2.1 AA. Automated check via <https://wave.webaim.org/report#/share.erfindergeist.org> (after deployment to main). Tracked in [A11Y.md](A11Y.md).

### Images

- Every `<img>` needs a non-empty, meaningful `alt`
- Purely decorative images: `alt=""` + `role="presentation"` (deliberate exception — comment it)
- When JS sets `img.src`, `img.alt` **must** be set in the same call using `caption || filename` — never empty

### Table headers

- `<th>` must never be empty — not even for icon/action columns
- Invisible label: `<th><span class="visually-hidden">Action name</span></th>`

### ARIA roles

- `role="menu"` requires `role="menuitem"` on all direct children — otherwise use `role="group"`
- `role="status"` (or `aria-live="polite"`) on elements whose text is updated dynamically via JS
- Multiple `<nav>` on one page: each needs a unique `aria-label`

### Headings

- Every page has exactly one `<h1>` describing the page
- If no visual `<h1>` is desired: `<h1 class="visually-hidden">Page name</h1>`
- Heading hierarchy must not skip levels (h1 -> h2 -> h3, never h1 -> h3)

### Interactive elements

- Icon-only buttons/links always need `aria-label`
- Non-interactive elements (`<div>`, `<span>`) must not wrap content that appears interactive
- Tab lists: `<ul role="tablist">` gets `aria-label`

## Do Not Deploy to Server

`compose.yaml`, `README.md`, `CLAUDE.md`, `galerie-plan.md`, `stylebook.html` → excluded via `exclude` in the workflow.
`galerie/**` → excluded from FTP-Deploy-Action; the images are synced from Nextcloud `Public/Galerie` by the rclone step in the same workflow.
`config/*.json` → gitignored; fetched from Nextcloud `Public/Configs` by the workflow before the FTP sync.

**`downloads/**` and `presentations/**` are never deployed by this repo** (excluded in `deploy-share.yml`).
They are filled by other repos with the same FTP account (own FTP-Deploy state file) and by hand; if this
repo's FTP-Deploy-Action managed them, it would delete their files as soon as a folder disappears from git.

| Path on the server | Filled by |
| --- | --- |
| `downloads/Verein/**`, `downloads/Angebote/**` | `pdf-generator` (weekly PDFs) |
| `downloads/Marketing/**` and others | by hand via FTP |
| `presentations/end-of-10/**` | `endof10-presentation` |
| `presentations/ki2/**` | `presentation-ki2` |

The files under `share/downloads/` and `share/presentations/` in this repo are local dev/mock data only
(Bierdeckel SVGs: source for the "Raw" links on GitHub; changes go to the server by hand).

---

## Sponsoring Links

- Membership: <https://erfindergeist.org/mitglied-werden/>
- Bank transfer: <http://konto.erfindergeist.org/>
- PayPal: <http://paypal.erfindergeist.org/>
- Linktree: <https://linktree.erfindergeist.org/>
