# CLAUDE.md — termine/

## Ziel

Single-Page-Erklärer zur technischen Infrastruktur von Erfindergeist Jülich.
Zielgruppe: Kinder + Erwachsene. Erklärt den Weg von NextCloud über das WordPress-Plugin
zu REST-API, ICS-Kalender, GitHub PDF-Generator und Share-Server.

## CI

- Primary: #159989 · Secondary: #F9B338
- Logo: Querformat/landscape (~200×60px), User liefert `img/logo.svg`

## Technologien

Bootstrap 5.3 · jQuery 3.7 · GSAP 3 + ScrollTrigger · AOS · Typed.js · Lucide Icons · Rough Notation · Caveat Font

## Pflicht-Features

- Responsive (Mobile / Tablet / Desktop)
- WCAG 2.1 AA Barrierefreiheit + Accessibility-Toolbar (bottom-left, fixed)
- Dark / Light Mode Toggle (`data-theme` auf `<html>`, localStorage)
- Sprach-Toggle DE/EN (`data-i18n` System, localStorage, `lang`-Attribut wechselt)
- Scroll-to-Top Button (bottom-right, ab 300px Scroll)
- Sticky Navbar mit Smooth Scroll

## Sprache

- Alle sichtbaren Texte tragen `data-i18n="key"` Attribut
- Translations-Objekt in `js/i18n.js`: `translations.de` / `translations.en`
- Deutsch ist Default
- `data-i18n-attr="aria-label"` setzt statt `textContent` ein Attribut (z.B. für aria-labels)
- `data-i18n-html` als Attribut erlaubt HTML in der Übersetzung (wird per `innerHTML` gesetzt)
- `window.t(key)` — JS-Helper für Translations in dynamisch erzeugtem Code
- Jeder neue Key muss in **beiden** Sprachen eingetragen werden (DE + EN)
- Entfernte HTML-Elemente → zugehörige i18n-Keys sofort aus `js/i18n.js` löschen

## Stil & Animationen

- `h1`–`h3`: Caveat (handschriftlich), Rest: System-Font-Stack
- GSAP: Hero cascade-in, Architektur-SVG Pfeil-Animation (stroke-dashoffset), Card stagger
- AOS: Scroll-reveal für alle Explain-Cards
- Rough Notation: Highlights um Schlüsselbegriffe in Card-Texten
- `prefers-reduced-motion` deaktiviert alle Animationen

## JS-Module

- `js/i18n.js` — Translations + Toggle
- `js/theme.js` — Dark/Light + localStorage
- `js/accessibility.js` — Toolbar, font-scale, high-contrast, reduce-motion
- `js/animations.js` — GSAP, AOS, Typed.js, Rough Notation
- `js/main.js` — App-Init, scroll-to-top, Event-Listener

## Ladesequenz im HTML

libs (jquery → bootstrap → gsap → ScrollTrigger → aos → typed → lucide → rough-notation)
→ i18n → theme → accessibility → animations → main

## Assets & Bibliotheken auf Share

**Alle externen Abhängigkeiten kommen von `https://share.erfindergeist.org/` — kein CDN, kein npm.**

| Typ | Pfad auf Share |
|-----|---------------|
| CSS | `/css/bootstrap.min.css`, `/css/aos.min.css` |
| JS  | `/js/lib/jquery.min.js`, `bootstrap.bundle.min.js`, `gsap.min.js`, `ScrollTrigger.min.js`, `aos.min.js`, `typed.min.js`, `lucide.min.js`, `rough-notation.min.js` |
| Fonts | `/fonts/Caveat-Regular.ttf`, `/fonts/Caveat-Bold.ttf` |
| Logo | `/img/logo.svg` |

Eigene JS/CSS-Dateien liegen lokal im Projekt (`js/`, `css/`).  
Neue externe Libs müssen auf Share abgelegt werden — keine externen CDN-URLs einbauen.

## Lucide Icons

Lucide wird über `lucide.min.js` von Share geladen und mit `lucide.createIcons()` initialisiert.

**Wichtig: Lucide-Version auf Share ist älter — folgende Icons existieren NICHT:**
`facebook`, `instagram`, `linkedin`, `github`, `mastodon` und andere Brand-Icons.

Für Social-Icons immer **Inline-SVG** verwenden (Lucide-Stroke-Stil: `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`). Mastodon-Icon ist fill-basiert (Sonderfall).

**Dynamische Icons:** Wenn `data-lucide`-Elemente per JS ins DOM eingefügt werden, muss danach `lucide.createIcons()` erneut aufgerufen werden.

## Bibliotheken

Wenn eine Funktion durch eine bereits geladene Bibliothek abgedeckt werden kann, ist diese zu verwenden — keine neue Abhängigkeit hinzufügen. Keine eigene Lösung bauen, wenn Bootstrap, GSAP, jQuery, Lucide o.ä. das Problem bereits lösen.

## CSS-Struktur

```text
css/
├── main.css                      # Globale Styles (Vars, Dark Mode, Navbar, Buttons, Analogy-Box, Code-Block …)
└── sections/
    ├── section-hero.css          # Nur Hero-Section
    ├── section-termine.css       # Nur Termine/Events-Section
    ├── section-architektur.css   # Nur Architektur-Section (Chips, Constellation, Linien)
    ├── section-ics.css           # Nur ICS-Section + Toast
    ├── section-plugin.css        # Nur Plugin-Section (Endpoint-Cards, Explain-Cards, REST-Analogy)
    ├── section-downloads.css     # Nur Downloads-Section (PDF-Steps, PDF-Cards)
    ├── section-homeassistant.css # Nur Home-Assistant-Section
    └── section-sponsoring.css    # Nur Sponsoring-Section
```

**Regel:** CSS, das ausschließlich in einer Section verwendet wird, gehört in deren Datei unter `css/sections/`. Globale Styles (Navbar, Buttons, Layout-Utilities, Komponenten die in mehreren Sections vorkommen wie `.analogy-box` oder `.code-block`) gehören in `main.css`.

## CSS-Regeln

**Bootstrap zuerst:** Bevor eigenes CSS geschrieben wird, prüfen ob Bootstrap das bereits über CSS-Variablen abdeckt.

- Button-Farben über `--bs-btn-bg`, `--bs-btn-hover-bg` etc. auf der Klasse setzen (nicht `background-color` überschreiben)
- Dropdown-Styling über `--bs-dropdown-*` vars in `:root` (nicht `.dropdown-menu` / `.dropdown-item` manuell überschreiben)
- Farben, Body, Links über `--bs-primary`, `--bs-body-bg`, `--bs-link-color` etc. in `:root`

**Totes CSS sofort entfernen:** Wenn HTML-Elemente entfernt werden, muss das zugehörige CSS ebenfalls entfernt werden. Niemals CSS für nicht mehr existierende Klassen oder IDs im Stylesheet lassen.

**Kein Inline-CSS im HTML:** Styles gehören in `main.css`, nicht als `style="…"` Attribut. Ausnahmen nur für GSAP-Initialzustände (z.B. `opacity:0; pointer-events:none` am Scroll-Top-Button), die GSAP selbst überschreibt. Für alles andere:

- Zustandsklassen verwenden (z.B. `text-muted`, `d-none`)
- Wiederholende Styles in eine CSS-Klasse auslagern (z.B. `.events-loading-icon`)
- Einmalige kontextabhängige Styles per spezifischem CSS-Selektor setzen (z.B. `.section-ha .badge { font-size: .8rem }`)
- Bootstrap-Utilities (`mt-3`, `mx-auto`, `text-muted`) bevorzugen wenn passend

## Pflichtprüfungen

**Neue Dateien:** Immer prüfen, ob die neue Datei in den Deploy-Workflows (`deploy-termine-prod.yml`, `deploy-termine-test.yml`) unter `exclude` aufgenommen werden muss (z.B. lokale Hilfsdateien, Mocks, Doku).

**HTML-Änderungen:** Wenn Elemente entfernt oder umgebaut werden, immer prüfen:

- Gibt es CSS-Klassen in `css/main.css`, die jetzt tot sind? → sofort entfernen.
- Gibt es `data-i18n`-Keys in `js/i18n.js`, die nicht mehr referenziert werden? → sofort entfernen.

## Bugs

Baue keine Bugs ein. Halte dich an Code-Qualitätsstandards.

## Bekannter Bug: Horizontaler Overflow / volle Breite

**Symptom:** Seite wird schmaler als der Viewport oder ein horizontaler Scrollbalken erscheint.

**Ursache:** GSAP-Animationen mit `x: ±N` (horizontale Translation) schieben Elemente temporär über den Viewport-Rand. `overflow-x: clip` auf `html` allein reicht nicht, weil `html` bei breiten Kindelementen mitwächst.

**Fixe die NIEMALS entfernt werden dürfen:**

```css
html    { overflow-x: clip; }
body    { max-width: 100%; }
section { overflow-x: clip; }   /* clippt GSAP-Animations-Überlauf */
```

**Regeln:**

- `overflow-x: clip` auf `body` NICHT setzen — bricht `position: fixed` Elemente (Scroll-Top-Button, A11y-Toolbar)
- `overflow-x: hidden` auf `body` NICHT setzen — gleicher Grund
- Beim Hinzufügen von CSS immer prüfen, ob `body { max-width: 100% }` und `section { overflow-x: clip }` noch vorhanden sind
- GSAP horizontale `x`-Werte möglichst klein halten (max ±40px)
