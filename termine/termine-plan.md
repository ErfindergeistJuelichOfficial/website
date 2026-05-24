# termine/ - Vollständige Implementierungsdokumentation

Erfindergeist Jülich e.V. - Single-Page Erklärer-Website für die technische Infrastruktur
(NextCloud → WordPress-Plugin → REST API / ICS / PDF-Pipeline / Home Assistant).

**Zielgruppe:** Kinder und Erwachsene. Ton: verständlich, spielerisch, nicht kindisch.
**Stack:** PHP 8.3 (nur als Template-Engine), kein Backend-Routing. Alle Logik clientseitig.

---

## Dateistruktur (Ist-Zustand)

```
termine/
├── index.php                        # Hauptdokument; bindet alle Templates ein
├── CLAUDE.md                        # Modulspezifische Regeln (lies zuerst)
├── templates/
│   ├── section-hero.php
│   ├── section-architektur.php
│   ├── section-termine.php
│   ├── section-downloads.php
│   ├── section-ics.php
│   ├── section-plugin.php
│   ├── section-homeassistant.php
│   ├── section-archivments.php      # Achtung: Typo im Dateinamen (Absicht beibehalten)
│   └── section-sponsoring.php
├── css/
│   ├── main.css                     # Globale Vars, Dark Mode, Navbar, Buttons, Utilities
│   └── sections/
│       ├── section-hero.css
│       ├── section-architektur.css
│       ├── section-termine.css
│       ├── section-ics.css
│       ├── section-plugin.css
│       ├── section-downloads.css
│       ├── section-homeassistant.css
│       ├── section-archivments.css
│       └── section-sponsoring.css
├── js/
│   ├── i18n.js          # DE/EN Übersetzungen + Toggle
│   ├── theme.js         # Dark/Light + localStorage
│   ├── accessibility.js # A11y-Toolbar, Schriftgröße, Kontrast, Bewegung
│   ├── animations.js    # GSAP, AOS, Typed.js, Rough Notation, SVG-Linien
│   ├── achievements.js  # Gamification-System (7 Errungenschaften)
│   └── main.js          # App-Init, alle Event-Listener, API-Aufrufe
├── stylebook.html        # Lokale Komponenten-Referenz (nicht deployen)
├── A11Y.md              # Barrierefreiheits-Checkliste
└── compose.yaml         # Podman-Compose für lokales PHP
```

---

## index.php - Aufbau

PHP wird ausschließlich als Template-Engine genutzt:
- `filemtime()` an jedem lokalen CSS/JS-Link als Cache-Buster (`?v=...`)
- `include __DIR__ . '/templates/section-*.php'` für alle Sections
- Keine PHP-Logik, keine Datenbankzugriffe

**Script-Ladereihenfolge (Pflicht):**
```
jQuery → Bootstrap → GSAP → ScrollTrigger → AOS → Typed.js → Lucide → Rough Notation
→ i18n.js → theme.js → accessibility.js → animations.js → achievements.js → main.js
→ eg-footer.js (Share-Server Web Component)
```

**Feste IDs im index.php (nicht umbenennen):**
- `#main-nav` - sticky Navbar
- `#main-content` - Sprungziel für Skip-Link
- `#a11y-toolbar`, `#a11y-btn`, `#a11y-panel` - Accessibility-Widget
- `#scroll-top` - Scroll-to-top-Button
- `#copy-toast`, `#copy-toast-text` - geteilter Clipboard-Toast
- `#theme-toggle` - Dark/Light-Button
- `#lang-dropdown-btn`, `.lang-option[data-lang]` - Sprachauswahl

---

## CSS-Architektur

### CSS Custom Properties (css/main.css)

**Light Mode (`:root`):**
```css
--color-primary:       #107c6f   /* etwas dunkler als Brand-Farbe für WCAG */
--color-primary-rgb:   16,124,111
--color-primary-dark:  #107c6f
--color-primary-light: #e6f5f3   /* Hover-Hintergründe */
--color-secondary:     #F9B338
--color-secondary-light: #fef6e4
--color-bg:            #f6fbfa
--color-surface:       #ffffff
--color-text:          #1a2e2c
--color-text-muted:    #4a6b67
--color-border:        #d0e8e4
--color-shadow:        rgba(var(--color-primary-rgb), .12)
--font-scale:          1
--navbar-height:       70px
```

**Dark Mode (`[data-theme="dark"]`):**
```css
--color-primary:       #159989   /* Brand-Farbe, auf dark gut sichtbar */
--color-primary-rgb:   21,153,137
--color-bg:            #0d1918
--color-surface:       #162624
--color-text:          #e0f0ee
--color-border:        #2a4440
--color-shadow:        rgba(0,0,0,.35)
```

**Niemals Hex-Werte hardcoden** wenn eine Variable existiert.
**RGBA der Primärfarbe:** `rgba(var(--color-primary-rgb), alpha)` - nicht den Hex-Wert!

### Section-Hintergründe
```
.section-arch       surface (weiss)
.section-events     primary-light (hell-grün)
.section-ics        primary-light
.section-plugin     surface
.section-pdf        secondary-light (hell-gelb)
.section-downloads  secondary-light
.section-ha         linear-gradient(135deg, #0d7060, #0a5a4c)  ← dunkelgrün, weisser Text
.section-sponsor    gradient secondary-light → bg
```

### Overflow-Bug-Fix (MUSS erhalten bleiben)
```css
html    { overflow-x: clip; }
body    { max-width: 100%; }     /* verhindert body-Wachstum durch GSAP-x-Animationen */
section { overflow-x: clip; }
```
`overflow-x: clip` oder `hidden` auf `body` NICHT setzen - bricht `position:fixed` (Scroll-top, A11y-Panel).

### CSS-Regeln
- CSS nur in der zugehörigen Section-Datei oder `main.css` (nie inline, Ausnahme: GSAP-Initialzustände)
- Bootstrap zuerst: `--bs-*` Variablen überschreiben, nicht `.btn`, `.dropdown` etc. manuell overriden
- Totes CSS sofort entfernen wenn HTML entfernt wird

---

## JS-Module im Detail

### js/i18n.js

**Struktur:**
```js
const translations = { de: { 'key': 'Wert', ... }, en: { 'key': 'Value', ... } };
let currentLang = 'de';
window.t(key)           // Übersetzung abrufen (in anderen Modulen nutzbar)
applyTranslations(lang) // Alle [data-i18n]-Elemente updaten + Typed.js neu starten
toggleLanguage()        // de ↔ en wechseln
initI18n()              // aus localStorage lesen + anwenden
```

**HTML-Attribute:**
```html
data-i18n="key"              <!-- textContent wird gesetzt -->
data-i18n-attr="aria-label"  <!-- setAttribute() statt textContent -->
data-i18n-html               <!-- innerHTML (für Translations mit <code>, <strong>) -->
```

**Regeln:**
- Jeder neue Key muss in BEIDEN Sprachen eingetragen werden
- Entfernte HTML-Elemente → Keys aus `translations.de` und `translations.en` sofort löschen
- Keys für JS-generierte Elemente (über `window.t()`) trotzdem in beiden Sprachen eintragen

**Sonderfall `plugin.description`:** Dieser Key enthält HTML (`<code>`, `<strong>`) und wird mit `data-i18n-html` geladen.

### js/theme.js

```js
setTheme(theme)   // 'dark' | 'light' - setzt data-theme auf <html>, aktualisiert Icon + aria-label
toggleTheme()
initTheme()       // localStorage → System-Präferenz-Fallback
```

Abhängigkeit: `window.t()` aus i18n.js muss bereits geladen sein.

### js/accessibility.js

```js
setFontScale(scale)    // 0.85 | 1 | 1.2 → --font-scale CSS-Variable
setHighContrast(on)    // .high-contrast auf <html>
setReduceMotion(reduce)// .reduce-motion auf <html>
openA11yPanel()
closeA11yPanel()
initAccessibility()    // localStorage + OS-Präferenz-Fallback (prefers-reduced-motion)
```

Panel-Verhalten: `hidden`-Attribut + `.open`-Klasse (CSS-Transition). Escape schließt. Click outside schließt.

### js/animations.js

Alle Funktionen werden von `initAnimations()` aufgerufen (aus main.js).

| Funktion | Was sie tut |
|---|---|
| `window.initTyped()` | Typed.js im Hero-Typed-Span. Wird auch bei Sprachwechsel neu gestartet. |
| `initHeroAnim()` | GSAP-Cascade: logo → title → subtitle → typed → desc → scroll-hint |
| `initArchLines()` | SVG-Linien zwischen Architektur-Quelle und Chips. stroke-dashoffset via ScrollTrigger. |
| `initSectionTitleAnims()` | Alle `.section-title-anim` fliegen per GSAP herein (alternierend links/rechts, max ±50px). |
| `initPdfCardHover()` | `.pdf-card` Hover-Lift via GSAP (y: -7). |
| `initSponsorPulse()` | `.sponsor-pulse-ring` Ringe pulsieren im Loop. |
| `initRoughNotation()` | `.rn-highlight` Elemente werden per ScrollTrigger mit handgezeichnetem Highlight annotiert. |
| `initShowMeAnimation()` | SVG-Pfeil-Animation vom ersten Termin-Titel zum JSON-Editor. Achievements: 'show-me'. |
| `initScrollTop()` | ScrollTrigger bei 300px zeigt/versteckt #scroll-top Button. |

**reduce-motion:** `initAnimations()` prüft `.reduce-motion`-Klasse. Wenn gesetzt: AOS mit duration 0, kein GSAP, kein Typed.js (nur statisch).

**GSAP x-Werte max ±40-50px** - grosse Werte verursachen den Overflow-Bug (siehe CSS-Architektur).

### js/achievements.js

7 Errungenschaften, freigeschaltet durch Benutzerinteraktionen:

| ID | Ausgelöst durch | Icon |
|---|---|---|
| `bell-click` | Ersten Klick auf `.ics-cal-bell` | bell |
| `bell-spin` | 5+ schnelle Klicks auf Bell → 360°-Drehung | refresh-cw |
| `ics-solved` | ICS-Puzzle gelöst | calendar |
| `rocket` | Klick auf `#pdf-step-upload` Card | send |
| `show-me` | Klick auf `#events-show-me` Button | link |
| `zap` | Klick auf `.ha-icon-wrap` | zap |
| `json-edit` | Inhalt des JSON-Editors geändert | code-2 |

```js
window.achievements.unlock('bell-click') // aus beliebigem anderen Modul aufrufbar
window.achievements.reset()              // löscht alle localStorage-Einträge
```

Toast-Benachrichtigung erscheint als `role="status"` Element. Rang-System (0/2/4/6/7 = 5 Stufen).

### js/main.js

Einstiegspunkt: `$(document).ready(...)`. Ruft in dieser Reihenfolge auf:
1. `initTheme()`, `initI18n()`, `initAccessibility()`, `initAnimations()`
2. `lucide.createIcons()`

Danach alle Event-Listener und self-executing IIFEs:

**Event-Listener:**
- `#theme-toggle` - toggleTheme + lucide.createIcons()
- `.lang-option[data-lang]` - applyTranslations(lang)
- `#ics-copy-btn` - copyToClipboard
- `.pdf-copy-btn` - copyToClipboard
- `#scroll-top` - smooth scroll to top
- `a[href^="#"]` - smooth scroll + Navbar-Offset + Offcanvas schliessen
- Active-Nav-Tracking via scroll

**IIFEs (self-executing):**
- `initPdfCountdown()` - Flip-Clock bis nächsten Montag 03:00 UTC
- `initIcsPuzzle()` - Spinner-Puzzle zum Lesen von DTSTART:20250515T180000Z
- `loadTomorrow()` - Fetch /tomorrow, zeigt Status-Text
- `loadEventsPreview()` - Fetch /events, zeigt Anzahl + Challenge (3. Event-Titel)
- `loadEvents()` - Fetch /events + tags.json, rendert Event-Cards + JSON-Editor
- `initRocketCard()` - Raketen-Animation auf #pdf-step-upload
- `initBell()` - Glocken-Animation auf .ics-cal-bell
- `initHaZap()` - Zap-Animation auf .ha-icon-wrap

**copyToClipboard(url, textKey, btn):** Nutzt `navigator.clipboard.writeText()` mit textarea-Fallback. Wechselt Lucide-Icon temporär zu `clipboard-check`.

---

## Sections im Detail

### Hero (`#uebersicht`)
- Logo: `https://share.erfindergeist.org/img/logo.svg`
- `#hero-title` (h1) - einziges h1 der Seite
- `#typed-text` - Typed.js Ziel, `aria-live="polite"`
- Zwei Blob-Elemente (`aria-hidden="true"`) als Hintergrunddekor
- `#hero-scroll-hint` - Scroll-Indikator (`aria-hidden`)

### Architektur (`#architektur`)
- `#arch-constellation` - Container für SVG-Linien-Animation
- `#arch-lines-svg` - leeres SVG, wird von `initArchLines()` befüllt
- `#arch-source` - Quellelement (NextCloud-Badge)
- `.arch-chip` - Ziel-Chips (fünf Empfänger)
- SVG-Klassen: `.arch-line` (Pfade), `.arch-dot` (Kreise am Ende)

### Termine (`#termine`)
- `#events-list` - wird von `loadEvents()` per JS gefüllt (max 3 Cards)
- `#events-loading`, `#events-error`, `#events-empty` - Zustandsanzeigen
- `#events-json-panel` - JSON-Editor-Panel (initial `d-none`)
- `#events-json-editor` - `<textarea>` mit live JSON
- `#events-json-error` - Fehleranzeige bei ungültigem JSON
- `#events-json-reset` - Reset-Button
- `#events-show-me` - Button, der Pfeil-Animation auslöst (Achievement: show-me)
- Event-Cards werden mit `insertAdjacentHTML` eingefügt → `lucide.createIcons({ nodes: [listEl] })` danach aufrufen

### Downloads (`#downloads`)
- 4 `.pdf-card` mit Download-Links auf share.erfindergeist.org
- `.pdf-copy-btn[data-url]` - Clipboard-Copy
- Flip-Clock: `#flip-d`, `#flip-h`, `#flip-m`, `#flip-s` (je mit `.flip-upper`, `.flip-lower`, `.flip-top`, `.flip-btm`)
- Countdown bis nächster Montag 03:00 UTC

### ICS (`#ics`)
- `.ics-cal-bell` - klickbare Glocke (Bell-Animationen + Achievements)
- `#ics-copy-btn[data-url]` - ICS-URL in Clipboard
- ICS-Beispiel-Codeblock: Datumswert `DTSTART:20250515T180000Z` ist Lösung des Puzzles
- `#ics-puzzle` - Spinner-Puzzle mit `[data-field]` Elementen
- `#ics-puzzle-success`, `#ics-puzzle-reset` - Erfolgsanzeige/Reset
- `.ics-cal-*` Abonnieren-Buttons für Google/Outlook/Apple/Yahoo/Thunderbird

### Plugin (`#plugin`)
- Drei Endpoint-Cards: `/ics`, `/events`, `/tomorrow`
- `#tomorrow-preview` - wird von `loadTomorrow()` befüllt
- `#events-endpoint-preview` - wird von `loadEventsPreview()` befüllt
- `plugin.description` Key enthält HTML → `data-i18n-html` im Template

### Downloads PDF / PDF-Generator
Beide Sections existieren: `#downloads` erklärt den Prozess, der Downloads-Bereich zeigt die Dateien.
`#pdf-step-upload` - klickbare Card mit Raketen-Animation (Achievement: rocket).

### Home Assistant (`#homeassistant`)
- `.ha-icon-wrap` - klickbar (Achievement: zap)
- YAML-Codeblock: Schlüssel `.k { color: teal }`, Werte `.v { color: amber }`
- Dunkler Section-Hintergrund → alle Texte in `#fff`

### Achievements (`#achievements` / `#archivments`)
- `.achievement-card[data-achievement="id"]` - Karte pro Errungenschaft
- `.achievement-locked` / `.achievement-unlocked` - CSS-Klassen
- `#achievements-count`, `#achievements-rank` - Counter und Rang-Text
- `.ach-star` - Sterne (werden via `ach-star--filled` aktiviert)
- `#achievements-reset` - Reset-Button

### Sponsoring (`#sponsoring`)
- `.sponsor-pulse-ring` - pulsierender Ring (GSAP-Loop)
- Links zu Fördermitglied, Spendendose, Überweisung, PayPal, Linktree

---

## Interaktive Features - Implementierungsdetails

### JSON-Editor (Termine-Section)
Daten kommen von `/events` und `share.erfindergeist.org/config/tags.json` parallel.
`tags.json` enthält `location_tags` und `description_tags` zum Anreichern der Events.
Editor-Format ist vereinfacht: `[{ titel, start, ort, beschreibung }]`.
Bei Eingabe: JSON.parse() → renderEventCards() → bei Fehler: `is-invalid` + Fehlermeldung.

### Architektur-SVG-Linien
`initArchLines()` berechnet Positionen per `getBoundingClientRect()` relativ zum Container.
Pfade sind manuelle Bezier-Kurven (Index 0-4 = verschiedene Kurvenformen).
Mobil: S-Kurven statt breiter Schwünge.
Nach `window.resize`: debounced `draw()` neu aufrufen (triggered-State wird beibehalten).

### ICS-Puzzle
Antwort: `{ year: 2025, month: 5, day: 15, hour: 18, minute: 0 }` (aus DTSTART:20250515T180000Z).
Spinner haben `[data-min]` und `[data-max]` Attribute + Long-Press-Beschleunigung.
Lösung löst Achievement `ics-solved` aus.

### Flip-Clock
Echte Flip-Karten-Animation via `.flipping`-Klasse. 4 DOM-Elemente pro Einheit.
`makeUnit(id)` gibt eine Setter-Funktion zurück; Animation nur wenn sich der Wert ändert.
Ziel: nächster Montag 03:00:00 UTC (GitHub Actions Schedule).

---

## i18n - Regeln & Muster

### Neuen Key hinzufügen
1. In `translations.de` und `translations.en` eintragen
2. Im Template: `data-i18n="key"` oder `data-i18n-attr="aria-label"` oder `data-i18n-html`
3. In JS-generiertem HTML: `window.t('key')` verwenden + `data-i18n="key"` Attribut setzen (damit Sprachwechsel funktioniert)

### HTML in Übersetzungen
```js
'plugin.description': '...mit <code>/ics</code> und <strong>GET</strong>...'
// Template: <p data-i18n="plugin.description" data-i18n-html></p>
```

### Key-Konventionen
```
nav.*          Navbar-Links und Buttons
hero.*         Hero-Section
arch.*         Architektur-Section
events.*       Termine-Section
ics.*          ICS-Section
plugin.*       WordPress-Plugin-Section
pdf.*          PDF-Generator + Downloads
downloads.*    Downloads-Section
ha.*           Home-Assistant-Section
achievements.* Errungenschaften-Section
achievement.ID.name / .desc / .hint
sponsor.*      Sponsoring-Section
footer.*       Footer
a11y.*         Accessibility-Toolbar
scrolltop.*    Scroll-to-top Button
skip.*         Skip-Link
```

---

## Lucide Icons - Einschränkungen

Die Share-Server-Version ist älter. Folgende Icons existieren NICHT:
`facebook`, `instagram`, `linkedin`, `github`, `mastodon` und alle Brand-Icons.

Für Social Icons: Inline SVG (stroke-basiert: `fill="none" stroke="currentColor" stroke-width="2"`).
Mastodon ist fill-basiert (Sonderfall).

Nach JS-generiertem HTML immer `lucide.createIcons()` oder `lucide.createIcons({ nodes: [container] })` aufrufen.
In HTML-Strings: `<i data-lucide="icon" aria-hidden="true"></i>` (aria-hidden manuell setzen).

---

## WCAG 2.1 AA - Checkliste

- Skip-Link am Seitenanfang (`.skip-link`)
- Einziges `<h1>` ist `#hero-title`
- Alle `<nav>` brauchen eindeutiges `aria-label`
- Alle Icons ohne Text brauchen `aria-label` oder `aria-hidden="true"`
- `[data-theme]` wechselt mit Theme; `[lang]` auf `<html>` wechselt mit Sprache
- `:focus-visible` mit `3px solid var(--color-secondary)` (konfiguriert in main.css)
- `role="status"` auf dynamisch befüllten Elementen (Copy-Toast, Typed-Text)
- Event-Cards aus JS: `role="listitem"` auf Cards, `role="list"` auf Container
- Neue Sections: `aria-labelledby` auf `<section>` setzen

---

## APIs & Externe Dienste

| URL | Zweck | Genutzt in |
|---|---|---|
| `https://erfindergeist.org/wp-json/erfindergeist/v2/events` | Alle Termine als JSON | loadEvents(), loadEventsPreview() |
| `https://erfindergeist.org/wp-json/erfindergeist/v2/ics` | ICS-Kalender-Datei | Links in ICS-Section |
| `https://erfindergeist.org/wp-json/erfindergeist/v2/tomorrow` | Morgige Termine | loadTomorrow() |
| `https://share.erfindergeist.org/config/tags.json` | Ort- und Beschreibungs-Tags | loadEvents() |
| `https://share.erfindergeist.org/terminuebersicht_hoch.pdf` | PDF-Download | Downloads-Section |
| `https://share.erfindergeist.org/terminuebersicht_quer.pdf` | PDF-Download | Downloads-Section |
| `https://share.erfindergeist.org/termine_repaircafe_hoch.pdf` | PDF-Download | Downloads-Section |
| `https://share.erfindergeist.org/termine_repaircafe_quer.pdf` | PDF-Download | Downloads-Section |

**Alle Libraries** kommen von `https://share.erfindergeist.org/` - niemals externe CDNs.

---

## Neue Section hinzufügen

1. `templates/section-neuename.php` erstellen
   - `<section id="neuename" class="section-neuename py-5" aria-labelledby="neuename-title">`
   - Heading-Klassen: `section-title section-title-anim` (GSAP-Animation), `section-subtitle`
2. `css/sections/section-neuename.css` erstellen
3. CSS-Datei in `index.php` einbinden (mit `filemtime()` Cache-Buster)
4. `<?php include __DIR__ . '/templates/section-neuename.php'; ?>` in `index.php`
5. Nav-Link in Navbar und Footer ergänzen
6. i18n-Keys für Titel und Untertitel in beiden Sprachen
7. Deploy-Workflows prüfen: Muss die neue Datei in `exclude` der `.github/workflows/*.yml`?

---

## Qualitätssicherung

```bash
# PHP-Analyse (PHPStan, Psalm, PHPCS, PHPMD)
podman compose run --rm composer analyse

# Auto-Fix PHPCS
podman compose run --rm composer phpcbf
```

Muss vor jedem Commit sauber durchlaufen. Details in Root-`CLAUDE.md`.

**Bei JS-generiertem HTML:**
- `esc(s)` aus main.js für alle User-Daten verwenden (oder `htmlspecialchars` in PHP)
- Lucide-Icons nach DOM-Einfügen: `lucide.createIcons({ nodes: [container] })`
- i18n-Keys als `data-i18n` auf das Element setzen, nicht nur per `window.t()` setzen

---

## Häufige Fallstricke

| Problem | Ursache | Lösung |
|---|---|---|
| Horizontaler Scrollbalken | GSAP `x:` zu gross | Max ±40-50px; `overflow-x:clip` auf section nicht entfernen |
| Lucide-Icon erscheint nicht | `createIcons()` vergessen nach DOM-Insert | `lucide.createIcons({ nodes: [container] })` aufrufen |
| Sprachswitch updatet nicht | `data-i18n` fehlt | Alle sichtbaren Texte brauchen `data-i18n` |
| A11y-Panel bricht aus Viewport | `position:fixed` durch `overflow:hidden` auf body | `overflow-x:clip/hidden` niemals auf body |
| Animation ignoriert reduce-motion | Nur CSS-Animation, kein JS-Check | GSAP-Animationen nach `document.documentElement.classList.contains('reduce-motion')` prüfen |
| PHPCS-Fehler Zeilenlänge | SVG path data | `// phpcs:disable Generic.Files.LineLength -- SVG path data` umschliessen |
