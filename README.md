# Erfindergeist Jülich - Website

Monorepo for all web projects of Erfindergeist Jülich e.V.

## Projects

### share/

Asset host and download page, deployed at [share.erfindergeist.org](https://share.erfindergeist.org/).

Contains all shared libraries (Bootstrap, GSAP, Lucide, AOS, Caveat font) as well as tabs for downloads, gallery, presentations, logos, QR codes and configs. Gallery images are processed by `gui/` and uploaded via FTP.

**`share/config/chronicle.json`** — Machine-readable club chronicle (JSON-LD `ItemList` of `Event` entries). Covers all activities since founding in March 2021, including events, milestones, and links (blog posts, Instagram, press coverage). Each entry has a UUID-based `@id`.

Gallery albums can reference a chronicle entry via `chronicle_id` in their `_config.json`. `gui/process.py` carries the ID forward into `_meta.json` and `_index.json` as `chronicleId`. The gallery UI then reads the corresponding links (blog, Instagram, press) from the chronicle and renders them in the album info box — no duplication of link data needed.

### termine/

Single-page explainer for the technical infrastructure of the club, deployed at [termine.erfindergeist.org](https://termine.erfindergeist.org/).

Explains the data flow from NextCloud through the WordPress plugin to REST API, ICS calendar, GitHub PDF generator and share server. Target audience: children and adults.

### gui/ - Galerie-Pipeline

Image processing pipeline (now part of `gui/`). Processes photos from a source directory, creates WebP thumbnails, detects and blurs faces. Output goes to `share/galerie/`. See gui/ section below.

### homepage/

Placeholder / landing page (no local dev server).

### presentations/

redirect to share

### gui/

Local web editor and gallery image pipeline, running at port 8082. Never deployed.

Tabs: **Chronik** (form CRUD with full/undo log), **Links**, **Tags**, **Alben** (gallery album configs), **Galerie** (process/upload/download), **Downloads**.

---

## Local Development

### PHP Quality Tools (root directory)

Applies to all PHP projects in the repo.

```powershell
# Once, or after composer.json changes
podman compose run --rm composer install

# All checks (PHPCS + PHPStan + Psalm + PHPMD)
podman compose run --rm composer analyse

# Individual tools
podman compose run --rm composer phpcs
podman compose run --rm composer phpstan
podman compose run --rm composer psalm
podman compose run --rm composer phpmd

# Auto-fix style violations
podman compose run --rm composer phpcbf
```

### share/ - Dev server (port 8080)

```powershell
cd share
podman compose up
# http://localhost:8080
```

### termine/ - Dev server (port 8081)

```powershell
cd termine
podman compose up
# http://localhost:8081
```

### gui/ - Config editor (port 8082)

```powershell
cd gui

# Start editor
podman compose up
# http://localhost:8082
```

#### Galerie-Album-Editing und Bildverarbeitung

Copy `.env.example` to `.env` and set `SOURCE_DIR` to your local photo source folder:

```powershell
# gui/.env
SOURCE_DIR=C:\Users\Lars\Fotos\Erfindergeist
```

After saving album configs via the GUI, use the **Galerie** tab to run `process.py`,
or use the command line:

```powershell
cd gui
podman compose run --rm process
```

#### Log files

Every edit/delete in the GUI appends a NDJSON line to:

- `share/config/chronicle.log`, `links.log`, `tags.log` (tracked in git)
- `<SOURCE_DIR>/album.log` (local, outside repo)

The Verlauf panel in the Chronik tab lets you undo individual changes.

### gui/ - Image processing

```powershell
cd gui

# Build once (includes pip packages for image processing)
podman compose build

# Process images (SOURCE_DIR must be set in .env)
podman compose run --rm process

# Download gallery data from server
podman compose run --rm download

# Upload gallery data to server
podman compose run --rm upload
```
