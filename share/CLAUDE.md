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
| `links.json` | `ItemList` | `ListItem` → `WebPage` / `EntryPoint` / `SoftwareSourceCode` |
| `tags.json` | `DefinedTermSet` | `Place` (location tags), `DefinedTerm` (description tags) |

Note: `links.json` changed from a plain array to a JSON-LD object (`itemListElement` array, `name` instead of `title`). Update any consumers accordingly.

**Routing without mod_rewrite:** `api/v1/assets/index.php` includes `api.php` directly.
Apache serves `index.php` via standard directory index; `api/v1/assets` redirects 301 to `api/v1/assets/`.

`index.php` (the page) defines `EG_API_INCLUDED` before requiring `api.php` so the HTTP handler is suppressed and only `eg_assets_data()` runs.

---

## Folder Structure

```text
share/
├── api.php                          # JSON-LD API logic (functions + HTTP handler)
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
├── downloads/                       # Downloadable files for the Downloads tab
│   └── *.pdf, *.docx, *.md …      # mock-* files are excluded from deployment
├── qr/                             # QR code files
├── config/                         # JSON config files (content exposed via API)
└── presentations/                  # Presentation subfolders (one folder per presentation)
    └── <name>/
        ├── index.html
        └── *.pdf                   # Optional: PDF version
```

---

## Tab Order

1. Downloads - files in `downloads/` (PDF, DOCX, MD, YAML …)
2. Presentations - subfolders in `presentations/`, linked via `presentations/<name>/`
3. Logos - image files from `img/`
4. QR Codes - image files from `qr/`
5. Configs - JSON files from `config/`
6. APIs - static list from `$api_entries` in `index.php`

Anchor links activate the corresponding tab directly:
`#presentations`, `#logos`, `#qr`, `#configs`, `#apis`

---

## Editing Tab Templates

Each tab is a standalone PHP file in `assets/templates/`.
Templates share variable scope with `index.php` (PHP `include`).
Available variables per template:

| Template                  | Variables                                      |
| ------------------------- | ---------------------------------------------- |
| `tab-downloads.php`       | `$entries`, `$icon_map`, `$class_map`          |
| `tab-presentations.php`   | `$pres_entries` (assoc: name -> pdf)           |
| `tab-logos.php`           | `$img_entries`                                 |
| `tab-qr.php`              | `$qr_entries`                                  |
| `tab-configs.php`         | `$config_entries`                              |
| `tab-apis.php`            | `$api_entries` (static array in `index.php`)   |

---

## Design

See [root CLAUDE.md](../CLAUDE.md) for design tokens and the no-CDN rule.

- Custom styles: `assets/css/share.css`
- Custom scripts: `assets/js/share.js`

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

## Do Not Deploy to Server

`compose.yaml`, `README.md`, `CLAUDE.md` → excluded via `exclude` in the workflow.
`downloads/mock-*` → mock files for local dev testing, excluded via `downloads/mock-*` pattern.

---

## Sponsoring Links

- Membership: <https://erfindergeist.org/mitglied-werden/>
- Bank transfer: <http://konto.erfindergeist.org/>
- PayPal: <http://paypal.erfindergeist.org/>
- Linktree: <https://linktree.erfindergeist.org/>
