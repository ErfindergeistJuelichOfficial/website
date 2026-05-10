# Plan: termine/index.html — Erfindergeist Jülich Technik-Erklärer

## Context
Leere Single-Page-Website im Ordner `termine/`, die die technische Infrastruktur des Vereins Erfindergeist Jülich erklärt (NextCloud → WordPress-Plugin → REST-API / ICS / PDF-Pipeline). Zielgruppe: Kinder + Erwachsene. CI: Primary #159989, Secondary #F9B338.

---

## Dateistruktur

```
termine/
├── index.html
├── css/
│   ├── bootstrap.min.css        (Bootstrap 5.3.x)
│   ├── aos.min.css              (Animate On Scroll)
│   └── main.css                 (Custom styles + CSS-Variablen)
├── js/
│   ├── lib/
│   │   ├── jquery.min.js            (jQuery 3.7.x)
│   │   ├── bootstrap.bundle.min.js  (Bootstrap 5.3.x)
│   │   ├── gsap.min.js              (GSAP 3.x Core)
│   │   ├── ScrollTrigger.min.js     (GSAP Plugin)
│   │   ├── aos.min.js               (AOS)
│   │   ├── typed.min.js             (Typed.js)
│   │   ├── lucide.min.js            (Lucide Icons)
│   │   └── rough-notation.min.js    (Rough Notation)
│   ├── i18n.js          (Translations DE/EN + Toggle-Logik)
│   ├── theme.js         (Dark/Light Mode + localStorage)
│   ├── accessibility.js (Accessibility-Toolbar + font-scale + high-contrast)
│   ├── animations.js    (GSAP + AOS Initialisierung, SVG-Pfeil-Animationen)
│   └── main.js          (App-Init, scroll-to-top, Event-Listener, Bootstrap-Glue)
├── fonts/
│   ├── Caveat-Regular.ttf       (handschriftliche Überschriften)
│   └── Caveat-Bold.ttf          (handschriftliche Überschriften fett)
└── img/
    └── logo.svg                 (Platzhalter — User ersetzt)
```

---

## Entscheidungen (bestätigt)
- **Logo**: Querformat/landscape (~200×60px) für Navbar
- **Dateiformat**: Reines HTML (statisch, kein PHP)
- **Sprache**: Deutsch als Default, EN per Toggle
- **Alle 4 Extra-Libraries**: Typed.js + AOS + Rough Notation + Lucide Icons

## Bibliotheken (alle lokal, alle kostenlos)

| Library | Zweck | Download |
|---|---|---|
| Bootstrap 5.3.x | Layout, Komponenten | getbootstrap.com |
| jQuery 3.7.x | DOM-Manipulation, Events | jquery.com |
| GSAP 3 + ScrollTrigger | Animationen (fly-in, Pfeile, Stagger) | gsap.com/free |
| AOS | Scroll-reveal für Cards | michalsnik.github.io/aos |
| Typed.js | Tipp-Animation im Hero | mattboldt.com/demos/typed-js |
| Lucide Icons | SVG-Icon-Library | lucide.dev |
| Rough Notation | Handgezeichnete Highlights um Schlüsselbegriffe | roughnotation.com |

> Keine DrawSVG (kostenpflichtig) — SVG-Pfad-Animationen mit CSS `stroke-dasharray` + GSAP/ScrollTrigger.

---

## Sections / Menü

| Anker | DE | EN |
|---|---|---|
| `#uebersicht` | Übersicht | Overview |
| `#architektur` | Technischer Aufbau | Architecture |
| `#ics` | ICS Kalender | ICS Calendar |
| `#plugin` | WordPress Plugin | WordPress Plugin |
| `#pdf-generator` | PDF Generator | PDF Generator |
| `#downloads` | Downloads | Downloads |
| `#api` | REST API & JSON | REST API & JSON |
| `#homeassistant` | Home Assistant | Home Assistant |

---

## Komponenten-Details

### Navbar (sticky)
- Logo links (landscape/quer — ~200×60px)
- Menüpunkte mit smooth scroll
- Rechts: Dark/Light Toggle + DE/EN Toggle
- Mobile: Hamburger mit Bootstrap Offcanvas

### Accessibility Toolbar (bottom-left, fixed)
- Button mit Lucide `accessibility` Icon
- Slide-up Panel:
  - Schriftgröße: A− / A / A+ (--font-scale CSS-Variable)
  - Kontrast: Normal / Hoch (class `high-contrast` auf `<html>`)
  - Animationen: An / Aus (class `reduce-motion` überschreibt prefers-reduced-motion)
- Vollständig tastaturzugänglich, ARIA-labeled
- Speichert Präferenz in localStorage

### Scroll-to-Top Button (bottom-right, fixed)
- Erscheint nach 300px Scroll
- Lucide `arrow-up` Icon
- GSAP fade-in/out

### Hero Section
- Großer Titel mit GSAP cascade-in
- Typed.js Untertitel: "ICS Kalender" → "WordPress Plugin" → "PDF Termine" → "REST API" → "Home Assistant"
- Kurze Intro DE/EN

### Card: Technischer Aufbau (SVG-Diagramm)
- Inline SVG Flussdiagramm:
  ```
  [NextCloud] ──► [WordPress + Plugin]
                         │
           ┌─────────────┼──────────────┐
           ▼             ▼              ▼
  [GitHub pdf-termine] [/events JSON] [/ics]
           │
     ┌─────┤
     ▼     ▼
  [PDF] [Share Server]
  ```
- GSAP + ScrollTrigger: Pfeile zeichnen sich per `stroke-dashoffset` ein
- Nodes pulsieren beim Hover

### Card: Was ist ICS?
- Animated Kalender-Icon (Lucide `calendar-days`)
- Erklärung mit Kinder-Analogie
- Live-Link: https://erfindergeist.org/wp-json/erfindergeist/v2/ics
- Code-Snippet mit Beispiel-ICS-Block

### Card: WordPress Plugin
- GitHub-Link: https://github.com/ErfindergeistJuelichOfficial/calendar-wp-plugin
- Was es tut: NextCloud-Daten abrufen, cachen, als REST-API bereitstellen
- 3 Endpoint-Cards klickbar:
  - `/ics` → https://erfindergeist.org/wp-json/erfindergeist/v2/ics
  - `/events` → https://erfindergeist.org/wp-json/erfindergeist/v2/events
  - `/tomorrow` → https://erfindergeist.org/wp-json/erfindergeist/v2/tomorrow

### Card: PDF Generator (pdf-termine)
- GitHub-Link: https://github.com/ErfindergeistJuelichOfficial/pdf-termine
- Erklärt GitHub Actions Automation
- Animiertes Flussdiagramm: Trigger → Daten holen → PDF rendern → auf Share hochladen

### Card: Downloads
- 4 Download-Cards mit PDF-Icon (Lucide `file-text`):
  - terminuebersicht_hoch.pdf → https://share.erfindergeist.org/terminuebersicht_hoch.pdf
  - terminuebersicht_quer.pdf → https://share.erfindergeist.org/terminuebersicht_quer.pdf
  - repaircafe_hoch.pdf → https://share.erfindergeist.org/repaircafe_hoch.pdf
  - repaircafe_quer.pdf → https://share.erfindergeist.org/repaircafe_quer.pdf

### Card: Was ist JSON?
- Kinder-Analogie: "Wie eine Zutatenliste beim Backen"
- JSON-Snippet (hardcoded Beispiel)

### Card: Was ist REST?
- Analogie: "Kellner im Restaurant" (Client = Gast, API = Kellner, Server = Küche)

### Card: Home Assistant & Tomorrow
- Erklärt warum `/tomorrow` für HA-Automationen ideal ist
- Beispiel HA-Automation YAML
- Lucide `home` + `zap` Icons

### Bonus Card: Was ist Caching?
- Erklärt warum das Plugin cached (weniger Last auf NextCloud)
- Vorher/Nachher-Diagramm

---

## Typografie

```css
@font-face {
  font-family: 'Caveat';
  src: url('../fonts/Caveat-Regular.ttf') format('truetype');
  font-weight: 400;
}
@font-face {
  font-family: 'Caveat';
  src: url('../fonts/Caveat-Bold.ttf') format('truetype');
  font-weight: 700;
}
h1, h2, h3 { font-family: 'Caveat', cursive; }
```

Caveat von Google Fonts (OFL-Lizenz, kostenlos, lokal in `fonts/`).

---

## CSS-Architektur

```css
:root {
  --color-primary: #159989;
  --color-secondary: #F9B338;
  --color-bg: #f6fbfa;
  --color-surface: #ffffff;
  --color-text: #1a2e2c;
  --font-scale: 1;
}
[data-theme="dark"] {
  --color-bg: #0d1918;
  --color-surface: #162624;
  --color-text: #e0f0ee;
}
.high-contrast { /* WCAG AAA Kontrast-Variablen */ }
.reduce-motion * { animation-duration: 0.01ms !important; }
```

---

## JS-Module

### `js/i18n.js`
- `translations.de` / `translations.en` Objekt
- `window.t(key)` Hilfsfunktion
- `applyTranslations(lang)` — updated alle `[data-i18n]` Elemente + `[data-i18n-attr]`
- `toggleLanguage()` / `initI18n()`
- localStorage-Persistenz, `lang`-Attribut auf `<html>`

### `js/theme.js`
Dark/Light Toggle, `data-theme` auf `<html>`, localStorage-Persistenz, respektiert `prefers-color-scheme`.

### `js/accessibility.js`
Toolbar-Panel (slide-up), font-scale CSS-Variable, high-contrast class, reduce-motion override. Alle Buttons mit ARIA, Escape-Taste schließt Panel.

### `js/animations.js`
- GSAP Hero cascade-in
- Architektur-SVG: `stroke-dashoffset` Pfeil-Animation via ScrollTrigger
- AOS.init() für alle Cards
- Typed.js im Hero
- Rough Notation Highlights auf `.rn-highlight` Elementen
- Prüft `.reduce-motion` und überspringt alle Animationen

### `js/main.js`
App-Init, scroll-to-top (GSAP fade), aktive Nav-Links tracken, smooth scroll, offcanvas schließen.

---

## Zugänglichkeit (WCAG 2.1 AA)
- Skip-to-content Link ganz oben
- Alle interaktiven Elemente mit `:focus-visible` Outline (3px solid secondary)
- `aria-label` auf Icons, `aria-expanded` auf Toggle-Buttons
- `lang` Attribut auf `<html>` wechselt mit SprachToggle
- Farbkontraste ≥ 4.5:1 für Text, ≥ 3:1 für UI
- Alle dekorativen SVGs/Bilder: `aria-hidden="true"`
- Alle informativen SVGs/Bilder: `alt` Text
- `prefers-reduced-motion` wird respektiert

---

## Implementierungsreihenfolge (erledigt)

0. ✅ CLAUDE.md erstellen
1. ✅ Assets herunterladen (Bootstrap, jQuery, GSAP, AOS, Typed.js, Lucide, Rough Notation, Caveat)
2. ✅ index.html Grundgerüst + Navbar + alle Sections
3. ✅ main.css (CSS-Variablen, Dark Mode, Accessibility, Layout)
4. ✅ JS-Module (i18n.js, theme.js, accessibility.js, animations.js, main.js)
5. ✅ Logo-Platzhalter (img/logo.svg)

---

## Verifikation
- Im Browser öffnen: lokaler Webserver oder `file:///.../termine/index.html`
- Responsive testen: Chrome DevTools → Mobile/Tablet/Desktop
- Dark Mode, Sprach-Toggle, Accessibility-Panel testen
- Alle Links auf Share-Server und GitHub prüfen
- GSAP Animationen auf `prefers-reduced-motion: reduce` testen
- Logo ersetzen: `img/logo.svg` durch eigenes Querformat-Logo (~200×60px)
