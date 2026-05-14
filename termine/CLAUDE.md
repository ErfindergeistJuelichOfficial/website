# CLAUDE.md — termine/

## Purpose

Single-page explainer for the technical infrastructure of Erfindergeist Jülich.
Audience: children and adults. Explains the flow from NextCloud through the WordPress plugin
to REST API, ICS calendar, GitHub PDF generator and share server.

## Design

See [root CLAUDE.md](../CLAUDE.md) for design tokens and the no-CDN rule.
Logo: landscape format (~200×60px), user provides `img/logo.svg`.

## Technologies

Bootstrap 5.3 · jQuery 3.7 · GSAP 3 + ScrollTrigger · AOS · Typed.js · Lucide Icons · Rough Notation · Caveat Font

## Required Features

- Responsive (mobile / tablet / desktop)
- WCAG 2.1 AA accessibility + accessibility toolbar (bottom-left, fixed)
- Dark / light mode toggle (`data-theme` on `<html>`, localStorage)
- Language toggle DE/EN (`data-i18n` system, localStorage, `lang` attribute switches)
- Scroll-to-top button (bottom-right, shown after 300px scroll)
- Sticky navbar with smooth scroll

## Language

- All visible texts carry a `data-i18n="key"` attribute
- Translations object in `js/i18n.js`: `translations.de` / `translations.en`
- German is default
- `data-i18n-attr="aria-label"` sets an attribute instead of `textContent` (e.g. for aria-labels)
- `data-i18n-html` attribute allows HTML in the translation (set via `innerHTML`)
- `window.t(key)` — JS helper for translations in dynamically generated code
- Every new key must be added in **both** languages (DE + EN)
- Removed HTML elements → delete the corresponding i18n keys from `js/i18n.js` immediately

## Style & Animations

- `h1`–`h3`: Caveat (handwriting), rest: system font stack
- GSAP: hero cascade-in, architecture SVG arrow animation (stroke-dashoffset), card stagger
- AOS: scroll-reveal for all explain cards
- Rough Notation: highlights around key terms in card texts
- `prefers-reduced-motion` disables all animations

## JS Modules

- `js/i18n.js` — translations + toggle
- `js/theme.js` — dark/light + localStorage
- `js/accessibility.js` — toolbar, font scale, high contrast, reduce motion
- `js/animations.js` — GSAP, AOS, Typed.js, Rough Notation
- `js/main.js` — app init, scroll-to-top, event listeners

## HTML Load Order

libs (jquery → bootstrap → gsap → ScrollTrigger → aos → typed → lucide → rough-notation)
→ i18n → theme → accessibility → animations → main

## Assets & Libraries on Share

See [root CLAUDE.md](../CLAUDE.md) for the full list of available libraries, the no-CDN rule, and Lucide icon constraints.

Custom JS/CSS files live locally in the project (`js/`, `css/`).

## CSS Structure

```text
css/
├── main.css                      # Global styles (vars, dark mode, navbar, buttons, analogy box, code block …)
└── sections/
    ├── section-hero.css          # Hero section only
    ├── section-termine.css       # Events section only
    ├── section-architektur.css   # Architecture section only (chips, constellation, lines)
    ├── section-ics.css           # ICS section + toast only
    ├── section-plugin.css        # Plugin section only (endpoint cards, explain cards, REST analogy)
    ├── section-downloads.css     # Downloads section only (PDF steps, PDF cards)
    ├── section-homeassistant.css # Home Assistant section only
    └── section-sponsoring.css    # Sponsoring section only
```

**Rule:** CSS used exclusively in one section belongs in its file under `css/sections/`. Global styles (navbar, buttons, layout utilities, components used in multiple sections like `.analogy-box` or `.code-block`) belong in `main.css`.

## CSS Rules

**Bootstrap first:** Before writing custom CSS, check whether Bootstrap already covers it via CSS variables.

- Button colours via `--bs-btn-bg`, `--bs-btn-hover-bg` etc. set on the class (do not override `background-color`)
- Dropdown styling via `--bs-dropdown-*` vars in `:root` (do not override `.dropdown-menu` / `.dropdown-item` manually)
- Colours, body, links via `--bs-primary`, `--bs-body-bg`, `--bs-link-color` etc. in `:root`

**Remove dead CSS immediately:** When HTML elements are removed, the corresponding CSS must also be removed. Never leave CSS for non-existent classes or IDs in the stylesheet.

**No inline CSS in HTML:** Styles belong in `main.css`, not as `style="…"` attributes. Exceptions only for GSAP initial states (e.g. `opacity:0; pointer-events:none` on the scroll-to-top button) that GSAP itself overrides. For everything else:

- Use state classes (e.g. `text-muted`, `d-none`)
- Extract repeated styles into a CSS class (e.g. `.events-loading-icon`)
- Set one-off context-specific styles via specific CSS selector (e.g. `.section-ha .badge { font-size: .8rem }`)
- Prefer Bootstrap utilities (`mt-3`, `mx-auto`, `text-muted`) where appropriate

## Required Checks

**New files:** Always check whether the new file needs to be added to the deploy workflows (`deploy-termine-prod.yml`, `deploy-termine-test.yml`) under `exclude` (e.g. local helpers, mocks, docs).

**HTML changes:** When elements are removed or restructured, always check:

- Are there CSS classes in `css/main.css` that are now dead? → remove immediately.
- Are there `data-i18n` keys in `js/i18n.js` that are no longer referenced? → remove immediately.

## Code Quality & Security

See root [CLAUDE.md](../CLAUDE.md) for the full rules. Summary for this module:

- All PHP output into HTML **must** use `htmlspecialchars($var, ENT_QUOTES, 'UTF-8')`
- All values interpolated into URLs **must** use `rawurlencode($var)`
- Run `podman compose run --rm composer analyse` from the project root before committing
- `composer analyse` must pass with zero errors

## Bugs

Do not introduce bugs. Follow code quality standards.

## Known Bug: Horizontal Overflow / Full Width

**Symptom:** Page becomes narrower than the viewport or a horizontal scrollbar appears.

**Cause:** GSAP animations with `x: ±N` (horizontal translation) temporarily push elements beyond the viewport edge. `overflow-x: clip` on `html` alone is not enough because `html` grows with wide child elements.

**Fixes that must NEVER be removed:**

```css
html    { overflow-x: clip; }
body    { max-width: 100%; }
section { overflow-x: clip; }   /* clips GSAP animation overflow */
```

**Rules:**

- Do NOT set `overflow-x: clip` on `body` — breaks `position: fixed` elements (scroll-to-top button, a11y toolbar)
- Do NOT set `overflow-x: hidden` on `body` — same reason
- When adding CSS always verify that `body { max-width: 100% }` and `section { overflow-x: clip }` are still present
- Keep GSAP horizontal `x` values as small as possible (max ±40px)
