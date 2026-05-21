# Homepage

## TODO

- [ ] Define folder structure
- [ ] SEO/GEO: research state of the art
- [ ] Sitemap: set up `/sitemap` sub-domain that generates a complete sitemap of all instances from `links.json`
- [ ] Footer: verify all paths exist in `links.json`
- [ ] Footer: audit which redirects need to be configured
- [ ] Footer: decide what additional links belong in the child content section
- [ ] Linktree: create `newsletter.erfindergeist.org` subdomain with redirect to Listmonk — decide whether to show a privacy landing page first
- [ ] Termine: rebuild with `tabs.json`; extend entries with links to service pages (innerHTML support)
- [ ] Rename "Wissensvermittlung / Kreativ-Tag"? (run an association member survey)
- [ ] Mobility Day path: determine correct URL

### Open Decisions

- Is searching across JSON files practical, or do we need a database?
- Is there a suitable Composer package for full-text search?
  - **Decision:** Phase 1: plain `stripos`/`str_contains` over cached JSON -- zero deps. Phase 2 if needed: `teamtnt/tntsearch` (pure PHP, SQLite-backed, last release 2023).
- Is there a lightweight framework for defining simple GET APIs in PHP?
  - **Decision:** No framework needed for 4 endpoints. Plain PHP `match()` on path. If routing grows complex (path params): `symfony/routing` (actively maintained, PHP 8.3 native, last release 2025).
- Can we avoid a database entirely? Evaluate before adding MariaDB.
- Room status: can Home Assistant push a JSON file via FTP instead of a POST endpoint?
- GitHub Actions workflow strategy: fetch ICS and Outline API data at build/schedule time
- Membership form: plain PHP or web component?
- Consider integrating the [eye-able.com](https://eye-able.com/de/hilfe-center) accessibility helper

---

## Overview & Migration Goals

The goal is to replace the current patchwork of multiple websites with a single, unified homepage.

- Migrate current articles and dynamic content to our Outline instance
- Preserve existing WordPress URL paths
- Replace the current gallery with a custom gallery
- Migrate content and features from Share
- Remove login functionality from the website; editors use Outline directly
- Two languages initially (German + English) -- menus and UI strings only, not content

## Out of Scope

_(to be defined)_

---

## Technology

- PHP 8.3+
- Composer dependencies only when truly justified
- MariaDB: optional -- evaluate whether it is needed at all

---

## Libraries (all local, all free)

| Library | Purpose | Source |
|---|---|---|
| Bootstrap 5.3.x | Layout, components | getbootstrap.com |
| jQuery 3.7.x | DOM manipulation, events | jquery.com |
| GSAP 3 + ScrollTrigger | Animations (fly-in, arrows, stagger) | gsap.com/free |
| AOS | Scroll-reveal for cards | michalsnik.github.io/aos |
| Typed.js | Typing animation in hero | mattboldt.com/demos/typed-js |
| Lucide Icons | SVG icon library | lucide.dev |
| Rough Notation | Hand-drawn highlights around key terms | roughnotation.com |

> No DrawSVG (paid) -- SVG path animations use CSS `stroke-dasharray` + GSAP/ScrollTrigger.

All libraries must be served from `https://share.erfindergeist.org/` -- never from external CDNs.

---

## JS Modules

### `js/i18n.js`
- `translations.de` / `translations.en` objects
- `window.t(key)` helper function
- `applyTranslations(lang)` -- updates all `[data-i18n]` elements + `[data-i18n-attr]`
- `toggleLanguage()` / `initI18n()`
- localStorage persistence, `lang` attribute on `<html>`

### `js/theme.js`
Dark/light toggle, `data-theme` on `<html>`, localStorage persistence, respects `prefers-color-scheme`.

### `js/accessibility.js`
Toolbar panel (slide-up), font-scale CSS variable, high-contrast class, reduce-motion override. All buttons with ARIA, Escape key closes panel.

### `js/animations.js`
- GSAP hero cascade-in
- Architecture SVG: `stroke-dashoffset` arrow animation via ScrollTrigger
- `AOS.init()` for all cards
- Typed.js in hero
- Rough Notation highlights on `.rn-highlight` elements
- Checks `.reduce-motion` and skips all animations

### `js/main.js`
App init, scroll-to-top (GSAP fade), active nav-link tracking, smooth scroll, offcanvas close.

---

## Folder Structure

TODO

---

## Navigation & Paths

Notation: `(path)` = URL, `[tag]` = links.json tag

### Header

- Home (/)
- About (/about)
- Services (/angebote)
  - Open Workshop (/angebote/werkstatt)
  - Repair Cafe (/angebote/repaircafe/)
  - Board Games (/angebote/gesellschaftsspiele/)
  - Knowledge Transfer (/angebote/kreativ-tag/) -- rename? see TODO
- Events (/veranstaltungen and /termine)
- Wiki (/Wiki)
- Gallery (/Galerie)
- Become a Member (/mitglied-werden)
- Retrospective (/rueckblick)
- Contact (/kontakt)

### Footer

The footer is already finished as a web component; the following is relevant only for paths.

- Imprint (/impressum)
- Contact (/kontakt)
- Privacy (/datenschutz)
- EU Cookie Policy (/eu-cookie-richtlinie) -- must NOT be translated (EU directive)
- Linktree (/linktree)
- TODO: Sitemap (/sitemap) -- sub-domain that generates a complete sitemap from links.json

#### Footer Child Content

- Should be generated dynamically from `links.json`. TODO: verify all paths are in `links.json`
- All header nav links except Contact, under heading "Navigation"
- All endpoints
- Other paths such as downloads, station, presentations:
  - Articles of Association (/vereinssatzung)
  - Account (/Konto) [tags: "website", "donation"]
  - Station (/Station) -- bike station & book cabinet
  - Downloads (/downloads) -- migrate from Share
  - Presentations (/presentations) -- migrate from Share
  - Mobility Day (???) -- TODO: determine path
  - TODO: check which redirects need to be configured
  - TODO: decide what else belongs here

### links.json

All paths and endpoints must be added to `links.json`:
- `category: "website"`
- Consideration: sub-categories, or `category` as array. Account must also carry the `"donation"` tag.
- PayPal must also carry the `"donation"` tag.

---

## Pages

### Page Layout (all pages)

Each page shares a common bottom section:
- Sponsoring (consider making it a web component)
- Footer

Dynamic pages require a config mapping: `page path -> Outline URL`

### Home (/)

- Hero: ideally a Gaussian slit image of the workshop; if not possible, something richly animated with GSAP -- workshop photo as fallback
- Recent articles & upcoming events (short)
- Our Workshop: door status, address, map
- Newsletter
- Partners (animated logos auto-scrolling left)

### Station (/Station)

- Dynamic

### Linktree (/linktree)

- Static, renders `links.json` as a button list
- Top: all donation links ("Donate via ...") -- highlight prominently
- Link to main site -> erfindergeist.org
- Link to Discord -> discord.erfindergeist.org
- Link to Newsletter -> newsletter.erfindergeist.org (TODO: create subdomain with redirect to Listmonk -- consider privacy landing page)
- TODO: decide whether more links are needed
- Bottom: all social links

### Events / Termine (/termine)

- Static
- Tab view: list view + calendar view
- Links to ICS file, PDFs, and the events explanation page
- TODO: rebuild using `tabs.json`; extend with links to service pages (innerHTML support)

### Gallery (/Galerie)

- Static
- Take over features from Share
- Wishlist:
  - Most viewed
  - Newest photos -- via views? Tree view (folder structure), Time view (by year)
  - Search
  - Consider pagination (at least for the Time view)

---

## Features & Functions

- Fetch articles and pages from Outline API and cache them server-side
- Event display: shortcode-like mechanism in articles (similar to WordPress shortcodes)
- Server-side rendering only -- no SPA or headless JS patterns; all HTML must arrive from the backend
- Discord button (redesign WordPress plugin; link configurable in root `config.json`)
- Scroll-to-top button (from Share)
- Spam protection for forms
- Shared footer on all pages
- Partners / Friends / Supporting Members / Sponsors: auto horizontal scroll
- Anti-hammering on endpoints (similar to Wordfence -- research approach)
- Privacy-compliant visitor analytics
- Admin email notifications
- Light/dark mode
- Language toggle
- Footer from Share/Termine is a web component
- URL routing in address bar (adopt gallery routing pattern)
- Back/Forward button routing
- Search: evaluate how WordPress search works and how to build an index
- Markdown Plus renderer in PHP with Outline extensions -- **Mermaid is required**

### Integrations

- Membership form (consider as web component)
- Articles of Association: must exist as a readable page; HTML can be sourced from the repo
- Newsletter signup integration if feasible (previous attempt was poor)

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | RSS | Feed for heimat.info -- determine what format they consume |
| GET | /termine/* | 3 event endpoints from the plugin |
| GET | /articles | Articles as JSON-LD |
| GET/POST | /roomstatus | Room status -- POST may be replaceable with FTP push |

---

## Data Sources

- GitHub Actions workflow can fetch external data at schedule time: ICS files, Outline API data
- Gallery is already synced via FTP

---

## UI/UX & Design

- Complete the stylebook (see Termine/Share for reference)
- Primary: `#159989` (use `var(--color-primary)`)
- Secondary: `#F9B338` (use `var(--color-secondary)`)

---

## Accessibility (WCAG 2.1 AA)

Target: WCAG 2.1 AA. Automated check via [WAVE](https://wave.webaim.org/report#/share.erfindergeist.org) after deployment to main. Tracked in [A11Y.md](A11Y.md).

### General Rules

- Skip-to-content link at the very top
- All interactive elements with `:focus-visible` outline (3px solid secondary)
- `lang` attribute on `<html>` changes with language toggle
- Color contrast >= 4.5:1 for text, >= 3:1 for UI elements
- All decorative SVGs/images: `aria-hidden="true"`
- `prefers-reduced-motion` must be respected

### Images

- Every `<img>` needs a non-empty, meaningful `alt`
- Purely decorative: `alt=""` + `role="presentation"` (comment the exception)
- When JS sets `img.src`, `img.alt` must be set in the same call using `caption || filename` -- never empty

### Table Headers

- `<th>` must never be empty -- not even for icon/action columns
- Invisible label: `<th><span class="visually-hidden">Action name</span></th>`

### ARIA Roles

- `role="menu"` requires `role="menuitem"` on all direct children -- otherwise use `role="group"`
- `role="status"` (or `aria-live="polite"`) on elements whose text is updated dynamically via JS
- Multiple `<nav>` on one page: each needs a unique `aria-label`

### Headings

- Every page has exactly one `<h1>` describing the page
- If no visual `<h1>` is desired: `<h1 class="visually-hidden">Page name</h1>`
- Heading hierarchy must not skip levels (h1 -> h2 -> h3, never h1 -> h3)

### Interactive Elements

- Icon-only buttons/links always need `aria-label`
- Toggle buttons need `aria-expanded`
- Non-interactive elements (`<div>`, `<span>`) must not wrap content that appears interactive
- Tab lists: `<ul role="tablist">` gets `aria-label`

---

## SEO / GEO

- Must be excellent. TODO: research state of the art
- `robots.txt` pointing to JSON-LD endpoints

---

## Privacy

- Nothing special to store or process -- general privacy notices only
- No external CDNs -- all assets must be self-hosted

---

## Internationalisation

- Initially: translate menus and simple UI strings only -- not content
- Languages: German, English

---

## Security

These rules apply to every PHP file. No exceptions.

- **HTML output:** always `htmlspecialchars($var, ENT_QUOTES, 'UTF-8')` before echoing filesystem-derived or user-controlled values
- **URL construction:** always `rawurlencode($var)` for values interpolated into URLs or `href` attributes
- **Filesystem access:** validate paths with `is_file()` / `is_dir()`; never use `$_GET`/`$_POST` directly as file paths
- **Forbidden functions:** `eval()`, `shell_exec()`, `exec()`, `system()`, `passthru()` -- never use
- **Error display:** never `ini_set('display_errors', 1)` in production

---

## Code Conventions

- PHP 8.3+ features: full type declarations, union types, short array syntax `[]`
- KISS -- no over-engineering, no OOP without reason
- Indentation: **2 spaces** throughout (HTML and PHP)
- Line endings: **LF** (enforced via `.gitattributes`)
- PHP alternative syntax requires a space before the colon: `if ($x) :` / `else :` / `foreach ($x as $y) :`
- JavaScript brace style: K&R -- opening brace on the **same line** (`if (x) {`, `function f() {`)
- JavaScript control structures: **always use `{ }` braces**, even for single-line bodies

---

## Quality Tools

```bash
# via Podman (default -- no local PHP required)
podman compose run --rm composer install   # once, or after composer.json changes
podman compose run --rm composer analyse   # PHPCS + PHPStan + Psalm + PHPMD

# individual tools
podman compose run --rm composer phpcs
podman compose run --rm composer phpstan
podman compose run --rm composer psalm
podman compose run --rm composer phpmd
podman compose run --rm composer phpcbf    # auto-fix style violations
```

| Tool | Config | Files | What it checks |
|---|---|---|---|
| PHPCS | `phpcs.xml` | PHP, JS | PSR-12 (PHP only); braces (JS) |
| PHPStan | `phpstan.neon` | PHP only | Static type analysis (level 5) |
| Psalm | `psalm.xml` | PHP only | Taint analysis (level 4) |
| PHPMD | `.phpmd.xml` | PHP only | Code quality metrics |

`composer analyse` must pass cleanly before every commit.

---

## CI/CD & Deployment

- Pipelines: `.github/workflows/`
- All JSON endpoints must include JSON-LD

---

## Optional Goals

- Polls / survey functionality
- Forms functionality
