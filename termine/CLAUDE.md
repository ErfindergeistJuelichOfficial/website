# CLAUDE.md — termine/index.html

## Ziel
Single-Page-Erklärer zur technischen Infrastruktur von Erfindergeist Jülich.
Zielgruppe: Kinder + Erwachsene. Erklärt den Weg von NextCloud über das WordPress-Plugin
zu REST-API, ICS-Kalender, GitHub PDF-Generator und Share-Server.

## CI
- Primary: #159989 · Secondary: #F9B338
- Logo: Querformat/landscape (~200×60px), User liefert `img/logo.svg`

## Technologien (alle lokal in js/lib/ und fonts/)
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

## Bibliotheken
Wenn eine Funktion durch eine bereits geladene Bibliothek abgedeckt werden kann, ist diese zu verwenden — keine neue Abhängigkeit hinzufügen. Keine eigene Lösung bauen, wenn Bootstrap, GSAP, jQuery, Lucide o.ä. das Problem bereits lösen.

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

## Bugs
Baue keine Bugs ein. Halte dich an Code-Qualitätsstandards.

## Bekannter Bug: Horizontaler Overflow / volle Breite

**Symptom:** Seite wird schmaler als der Viewport oder ein horizontaler Scrollbalken erscheint.

**Ursache:** GSAP-Animationen mit `x: ±N` (horizontale Translation) schieben Elemente temporär über den Viewport-Rand. `overflow-x: clip` auf `html` allein reicht nicht, weil `html` bei breiten Kindelementen mitwächst.

**Fixe die NIEMALS entfernt werden dürfen:**

```css
html   { overflow-x: clip; }
body   { max-width: 100%; }
section { overflow-x: clip; }   /* clippt GSAP-Animations-Überlauf */
```

**Regeln:**

- `overflow-x: clip` auf `body` NICHT setzen — bricht `position: fixed` Elemente (Scroll-Top-Button, A11y-Toolbar)
- `overflow-x: hidden` auf `body` NICHT setzen — gleicher Grund
- Beim Hinzufügen von CSS immer prüfen, ob `body { max-width: 100% }` und `section { overflow-x: clip }` noch vorhanden sind
- GSAP horizontale `x`-Werte möglichst klein halten (max ±40px)
