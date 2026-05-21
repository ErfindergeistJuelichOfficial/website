# Homepage

- Technologien
  - PHP 8.3
  - Composer Dependecies nur wenn die wirklich gut sind
  - Optional MariaDB

## Überlegungen

- Daten
  - ein workflow auf github kann ja auch die meisten externen Daten besorgen, den ICS, outline API Daten
  - Roomstatus prüfen ob homeassistasnt einfach ein json via FTP ablegen kann. 
  - Galerie wird ja schon via FTP synced.

- Suche
  - ist suche in jsons praktikabel oder doch besser Datenbank
  - gibt es eventuell etwas fertiges in composer
  
- API
  - gibt es ein kleines Framework mit dem man einfach GET APIs beschreiben kann

- Datenbank
  - Prüfen ob es ohne get.

## Migration

- Ziel ist es den aktuellen Flickenteppich von mehreren Webseiten zu beseitigen
- Aktuelle Beiträge und Dynamische Inhalte sollen auf unsere Outline Instanz übertragen werden
- Aktuelle Pfade aus Wordpress sollen übernommen werden.
- Galerie durch eigene Galerie ersetzen
- Inhalte und Funktionen von Share Migrieren
- Logins auf die Webseite sollen weg fallen, Redakteure können Artikel in Outline editieren
- Zwei Sprachen vorerst nur für Menü etc aber nicht für Inhalt

## Optionale Ziele

- Umfragen funktion
- Formulare funktion

## Abgrenzungen

## Menüs, Links und Pfade

- in runden klammern Pfade
- in Eckigen Klammern tags

### Header

- Startseite (/)
- Über uns (/about)
- Angebote (/angebote)
  - Offene Werkstatt (/angebote/werkstatt)
  - Repair Café (/angebote/repaircafe/)
  - Gesellschaftsspiele (/angebote/gesellschaftsspiele/)
  - Wissensvermittlung (/angebote/kreativ-tag/) eventuell umbenennen Umfrage im Verein
- Termine (/veranstaltungen und /termine)
- Wiki (/Wiki)
- Galerie (/Galerie)
- Mitglied werden (/mitglied-werden)
- Rückblick (/rueckblick)
- Kontakt (/kontakt)

### Footer

Der Footer ist als Web Komponente schon fertig, folgend nur wichtig für pfade

- Impressum (/impressum)
- Kontakt (/kontakt)
- Datenschutz (/datenschutz)
- EU-Cookie-Richtlinie (/eu-cookie-richtlinie) Darf nicht übersetzt werden EU Richtlinie!
- Linktree (/linktree)
- TODO: Sitemap (/sitemap) TODO: Sub-Domain erstellen generiert aus links.json eine komplette sitemap aller instanzen

#### Child Inhalt im Footer

- sollten dynamisch aus der links.json generiert werden. TODO: prüfen ist alles irgendwie in der links.json verfügbar?
- alle links die auch im Header menü mit Ausnahme Kontakt. Überschrift "Navigation"
- alle Endpunkte?
- Sonstige Pfade wie Downloads, Station, Präsentationen... 
  - Vereinssatzung (/vereinssatzung)
  - Konto (/Konto) ["website", "donation"]
  - Station (/Station) Fahrrad und Bücherschrank
  - Downloads (/downloads) aus share übernehmen
  - Präsentationen? (/presentations) aus share übernehmen
  - Mobilitätstag (???)
  - TODO: umleitungen nachschauen
- TODO: was noch

### links.json

alle pfade, Endpunkte müssen in die links.json aufgenommen werden
- category: "website"
- Überlegung: unter kategorien oder category ist array. Konto muss z.b. zusätzlich "donation" haben
- paypal muss auch "donation" haben

## Seiten Aufbau

zu klären gilt welche statisch als code vorliegen oder ob die aus der wiki dynamisch geladen werden.

Auf jeder Seite der untere Aufbau

- Sponsoring (eventuell eine web komponente draus machen)
- Footer

Dynamische Seiten brauchen ein config mapping: seitenpfad -> outline url

### Startseite

- am liebsten ein Gaussischen spalt der Werkstatt. wenn das nicht geht hlat was mit Gasp schön aufwendig animiert. eventuell foto der werkstatt
- Beiträge und Termine short
- Unsere Werkstatt. Doorstatus, Adresse, map
- Newsletter
- Partner (animierte logos die automatisch links scrollen)

### Station

- Dynamich

### Linktree

- statisch
- verwendet links.json stellt links als Button liste dar
  - ganz oben alle donation links (Spenden via ...) (sollen aufmerksamkeit erhaschen. irgendwie hervorheben)
  - link zur Webseite -> erfindergeist.org
  - link zu Discord -> discord.erfindergeist.org
  - link zu Newsletter -> newsletter.erfindergeist.org (TODO: sub domain mit weiterleitung zu listmonk muss noch erstellt werden, überlegen datenschutz vorseite schalten?)
  - TODO: überlegen ob wir mehr wollen
  - ganz unten alle Social links

### Termine

- statisch!
- hier sollte es tabs geben. Aktuell werden termine nur als Liste angezeigt. Es soll auch möglich sein diese in einem Kalender darzustellen. Hinweise auf das ICS, PDFs soll es geben und natürlich auf die Erklär Seite termine
- TODO: auf tabs.json umbauen. sollte aber erweitert werden mit links zu den angebots seiten. also innerHTML eventuell

### Galerie

- statisch
- funktionen von share übernehmen
- wünsche:
  - am häufigsten angesehen
  - Neuste Fotos (Durch views lösen? tree (Struktur der Ordner, wie jetzt), Zeit (Nach Jahr))
  - Suchen
  - überlegen PAGING zugmindesteis bei Zeit?

## Funktionen

- Beiträge und Seiten aus outline API auslesen und cachen
- Termine müssen irgendwie angezeigt werden können. Eventuell könnte man diese shortcdoe methode aus wordpress nutzen um shortcode in Beiträge einzufügen welche Ersetzt werden
- alles muss im backend gerendert werden, also keine SPA/Headless funktionen im js
- Discord Button (wordpress plugin aber bitte neu gestalten, link einfach in einer root config.json konfigurierbar machen)
- Hochscroll button (share)
- Für Formulare ein SPAM Schutz
- Footer sharen auf allen seiten
- Partner / Freunde / Fördermitglieder / Unterstützer auto horizontales scrolling
- Anti hammering auf endpunkte (wie macht wordfence dies?)
- Datenschutz konforme Besucher auswertung
- Versenden von E-Mails an Admins
- light/dark mode
- sprach toggle
- footer von share/termine ist eine web Komponente
- Routing in der Adressleiste (Galerie routing von galerie übernehmen)
- Routing im Back/Forward Button
- wordpress bietet eine such funktion an... überlegen wie dies umsetzbar ist. es müsste ja ein suchindex erstellt werden
- Markdown plus renderer in php. outline stellt viele extensions wie mermaid bereit. die Seite muss das ja auch gröseteils umsetzen können. Pflicht: mermaid

### Integrieren

- Mitgliedsantrag (eventuell eine web Komponente draus machen?)
- Vereinssatzung (muss als seite existieren und lesbar sein. das html kann ja aus dem repo bezogen werden)
- Newsletter Anmeldung integrierbar wenn möglich war aber relativ mist

## Endpunkte

- rss für heimat.info, Rausfinden was die nutzen GET
- alle 3 Termine endpunkte vom plugin GET
- Beiträge als JSON-LD aufarbeiten GET
- Roomstatus endpunkt GET/POST
  - POST könnte eventuell durch FTP ersetzt werden?

## UI/UX

- Stylebook fertigstellen siehe termine/share

## technologie

- JSON Endpunkte alle mit JSON-LD ausstatten
- Bootstrap
- jQuery
- siehe termine

## SEO/GEO

- muss sehr gut sein. TODO State of art recherchieren
- robots.txt welche auf die JSON-LD endpunkte verweist
- keine SPA oder Headless Funktionen der html code muss fertig aus dem Backend kommen

## Datenschutz

- es gibt ja nichts. nur allgemeine hinweise
- technologisch keine CDNs alles muss bei uns liegen

## Sprache

- vorerst kein content nur menu und einfache texte übersetzen, Sprachen:
- Deutsch
- Englisch

## Ordnerstruktur

TODO

## CI

Primary #159989
Secondary #F9B338.

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

## Accessibility/Zugänglichkeit (WCAG 2.1 AA)

Target: WCAG 2.1 AA. Automated check via <https://wave.webaim.org/report#/share.erfindergeist.org> (after deployment to main). Tracked in [A11Y.md](A11Y.md).

- überlegen https://eye-able.com/de/hilfe-center einzubauen
- A11Y Regeln


- Skip-to-content Link ganz oben
- Alle interaktiven Elemente mit `:focus-visible` Outline (3px solid secondary)
- `aria-label` auf Icons, `aria-expanded` auf Toggle-Buttons
- `lang` Attribut auf `<html>` wechselt mit SprachToggle
- Farbkontraste ≥ 4.5:1 für Text, ≥ 3:1 für UI
- Alle dekorativen SVGs/Bilder: `aria-hidden="true"`
- Alle informativen SVGs/Bilder: `alt` Text
- `prefers-reduced-motion` wird respektiert
- Every `<img>` needs a non-empty `alt` (except explicitly decorative: `alt=""` + comment)
- When JS sets `img.src`, `img.alt` must be set in the same call (use `caption || filename` — never empty)
- `<th>` must never be empty — use `<span class="visually-hidden">Text</span>` for icon-only columns
- Every page has exactly one `<h1>` (use `class="visually-hidden"` if not visually desired)
- Multiple `<nav>` on one page: each needs a unique `aria-label`
- `role="menu"` requires `role="menuitem"` children — otherwise use `role="group"`
- Elements with JS-updated text content: `role="status"` or `aria-live="polite"`
- Icon-only interactive elements: always `aria-label`

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

**CSS color rule:** Never hardcode a hex value that has a corresponding `--color-*` CSS variable — always use `var(--color-primary)`, `var(--color-primary-dark)`, `var(--color-surface)` etc. For RGBA variants of the primary color use `rgba(var(--color-primary-rgb), alpha)` instead of the raw hex digits.

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

## CI/CD & Deployment

Pipelines: `.github/workflows/`

## Typo

Do not use - use - instead.

## Local Development

no local code excecution. everything in a "podman compose" environment

```powershell
podman compose up
```

## Required Checks

**New files:** Always check whether the new file needs to be added to `deploy.yml` under `exclude` (e.g. local helpers, mocks, docs, `.gitkeep`).

**HTML changes in templates:** When elements in `assets/templates/` are removed or restructured, always check: