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

## Bugs
Baue keine Bugs ein. halte dich an Code Qualitäts standards
