# CLAUDE.md — share/

## Purpose

The `share/` folder serves two purposes:

1. **Asset host**: All shared libraries (Bootstrap, GSAP, Lucide, AOS, Typed.js, Rough Notation, Caveat font, logo) live here and are served from `https://share.erfindergeist.org/`.
2. **Download page**: `index.php` lists tabs for downloads, presentations, logos, QR codes and configs.

Deployed at: <https://share.erfindergeist.org/>

---

## Folder Structure

```text
share/
├── index.php                        # Entry point: loads data, includes templates
├── compose.yaml                     # Podman Compose (local only)
├── README.md                        # Test instructions (local only)
├── CLAUDE.md                        # This file (local only)
├── assets/
│   ├── css/
│   │   ├── share.css               # Global styles (vars, navbar, tabs, file items, logo cards …)
│   │   ├── tab-presentations.css   # Presentations tab only (.pres-*, .alert-info)
│   │   └── section-sponsoring.css  # Sponsoring section only (.sponsor-*)
│   ├── js/
│   │   └── share.js                # All custom scripts for the page
│   └── templates/
│       ├── tab-downloads.php       # Tab: Downloads (files in root)
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
│   ├── Caveat-Regular.ttf          # Handwriting font for h1–h3
│   └── Caveat-Bold.ttf
├── img/
│   └── logo.svg                    # Club logo (navbar + hero)
├── qr/                             # QR code files
├── config/                         # JSON config files
└── presentations/                  # Presentation subfolders (one folder per presentation)
    └── <name>/
        ├── index.html
        └── *.pdf                   # Optional: PDF version
```

---

## Tab Order

1. Downloads — files directly in root (PDF, DOCX, SVG …)
2. Presentations — subfolders in `presentations/`, linked via `presentations/<name>/`
3. Logos — image files from `img/`
4. QR Codes — image files from `qr/`
5. Configs — JSON files from `config/`

Anchor links activate the corresponding tab directly:
`#presentations`, `#logos`, `#qr`, `#configs`

---

## Editing Tab Templates

Each tab is a standalone PHP file in `assets/templates/`.
Templates share variable scope with `index.php` (PHP `include`).
Available variables per template:

| Template                  | Variables                              |
| ------------------------- | -------------------------------------- |
| `tab-downloads.php`       | `$entries`, `$icon_map`, `$class_map`  |
| `tab-presentations.php`   | `$pres_entries` (assoc: name → pdf)    |
| `tab-logos.php`           | `$img_entries`                         |
| `tab-qr.php`              | `$qr_entries`                          |
| `tab-configs.php`         | `$config_entries`                      |

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

Run Podman Compose from the `share/` folder:

```powershell
podman compose up
```

Then open <http://localhost:8080>.

> Note: External domains are not resolved locally. `index.php` works fully, but assets from `share.erfindergeist.org` (Bootstrap, Lucide …) require an internet connection.

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

---

## Sponsoring Links

- Membership: <https://erfindergeist.org/mitglied-werden/>
- Bank transfer: <http://konto.erfindergeist.org/>
- PayPal: <http://paypal.erfindergeist.org/>
- Linktree: <https://linktree.erfindergeist.org/>
