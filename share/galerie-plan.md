# Plan: Galerie-Tab auf share.erfindergeist.org

## Context

5 000 Bilder (und wachsend) sollen als neuer Tab auf share.erfindergeist.org erscheinen.
Bilder sind in Album-Ordnern (pro Veranstaltung) strukturiert. Metadaten: Titel/Beschreibung,
Datum, Tags. Thumbnails werden lokal per Build-Script vorerzeugt und mit hochgeladen.

---

## Ordnerstruktur

```
share/gallery/
├── 2024-sommerfest/
│   ├── _album.json          ← Album-Metadaten (JSON-LD)
│   ├── thumbnails/
│   │   ├── bild001.webp     ← Build-Script erzeugt diese
│   │   └── bild002.webp
│   ├── bild001.jpg
│   └── bild002.jpg
└── 2025-maker-faire/
    └── …
```

---

## `_album.json` Format (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "ImageGallery",
  "@id": "https://share.erfindergeist.org/gallery/2024-sommerfest",
  "name": "Sommerfest 2024",
  "description": "Rückblick auf das Sommerfest im Garten.",
  "dateCreated": "2024-07-15",
  "keywords": ["sommerfest", "community", "2024"],
  "hasPart": [
    {
      "@type": "ImageObject",
      "name": "bild001.jpg",
      "description": "Optionale Bildunterschrift",
      "thumbnail": "thumbnails/bild001.webp"
    }
  ]
}
```

Pflichtfelder: `@context`, `@type` (`ImageGallery`), `@id`.
`keywords` ist ein Array - wird als Tag-Filter verwendet.
`hasPart[].description` ist optional.
`hasPart[].thumbnail` wird vom Build-Script gesetzt.

---

## Build-Script (Empfehlung: Node.js + Sharp)

**Warum Sharp:** Schnellstes Tool bei 5 000+ Bildern, WebP-Output, `npm install sharp` reicht.
**Alternative:** Python + Pillow - einfacher Code, kein npm, aber langsamer.

**Speicherort:** `scripts/gallery-build.mjs` (liegt im Repo, wird nicht deployed)

**Was das Script macht:**

1. Scannt `share/gallery/` nach Album-Ordnern
2. Pro Bild: generiert `thumbnails/<name>.webp` (400 px breit, Quality 80)
3. Legt/aktualisiert `_album.json` an - bestehende `name`/`description`/`keywords` bleiben
   erhalten, neue Bilder werden in `hasPart` ergänzt, gelöschte Bilder werden entfernt
4. Extrahiert EXIF-Datum als `dateCreated` falls `_album.json` noch keins hat

**Aufruf:**

```bash
node scripts/gallery-build.mjs
```

---

## API-Cache (bei Galerie sinnvoll)

Bei 5 000 Bildern + vielen `_album.json`-Dateien ist ein Datei-Cache nötig.
Implementiert in `share/api.php` als optionaler Wrapper um `eg_page_data()`:

```php
// share/api.php
function eg_page_data_cached(int $ttl = 300): array
{
  $cacheFile = sys_get_temp_dir() . '/eg_share_page.json';
  if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < $ttl) {
    $cached = json_decode((string) file_get_contents($cacheFile), true);
    if (is_array($cached)) { return $cached; }
  }
  $data = eg_page_data();
  file_put_contents($cacheFile, json_encode($data));
  return $data;
}
```

`share/index.php` ruft dann `eg_page_data_cached()` statt `eg_page_data()` auf.
Cache-Invalidierung: Datei löschen (z. B. nach jedem Deploy per FTP-Hook) oder TTL abwarten.

---

## Kritische Dateien

| Datei | Änderung |
| --- | --- |
| `scripts/gallery-build.mjs` | NEU - Build-Script (Thumbnails + `_album.json`) |
| `share/api.php` | `eg_gallery_data()` + `eg_page_data_cached()` + gallery in `eg_page_data()` |
| `share/index.php` | `eg_page_data_cached()` statt `eg_page_data()`, gallery-Variablen an Template |
| `share/assets/templates/tab-gallery.php` | NEU - Album-Grid + Bilder-Grid + Lightbox |
| `share/assets/css/share.css` | Galerie-Styles (Cards, Thumbnails, Lightbox) |
| `share/assets/js/share.js` | `gallery` zu `TAB_HASHES`, album/tag-Filter im Router |
| `share/CLAUDE.md` | `_album.json`-Dokumentation, Build-Script-Anleitung |
| `.github/workflows/deploy-share.yml` | `gallery/` in Deployment aufnehmen |

---

## FTP-Upload Risiko

Mit 5 000 Bildern + 5 000 Thumbnails = ~10 000 Dateien ist FTP langsam.
`FTP-Deploy-Action` unterstützt Incremental-Upload (nur geänderte Dateien) via
Server-seitigem Diff. Beim ersten Upload dauert es lang - danach nur Delta.

---

## Verifikation

1. `node scripts/gallery-build.mjs` - erzeugt Thumbnails + `_album.json` fur Mock-Alben
2. `podman compose up` - neuer Gallery-Tab erscheint, Album-Cards sichtbar
3. Klick auf Album - Bilder-Grid mit Thumbnails
4. Tag-Filter filtert Albums korrekt
5. URL-Router: `?tag=sommerfest#gallery` offnet Galerie gefiltert
6. `podman compose run --rm composer analyse` - 0 Fehler
