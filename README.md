# Erfindergeist Jülich - Website

Monorepo for all web projects of Erfindergeist Jülich e.V.

## Projects

### share/

Asset host and download page, deployed at [share.erfindergeist.org](https://share.erfindergeist.org/).

Contains all shared libraries (Bootstrap, GSAP, Lucide, AOS, Caveat font) as well as tabs for downloads, gallery, presentations, logos, QR codes and configs. Configs and gallery images live in the Nextcloud (`Public/Configs`, `Public/Galerie`) and are deployed by `.github/workflows/deploy-share.yml` - see [DATENMODELL.md](DATENMODELL.md).

**`config/chronicle.json`** (Nextcloud `Public/Configs`) — Machine-readable club chronicle (JSON-LD `ItemList` of `Event` entries). Covers all activities since founding in March 2021, including events, milestones, and links (blog posts, Instagram, press coverage). Each entry has a UUID-based `@id`.

Gallery albums can reference a chronicle entry via `chronicle_id` in `galerie.json`. The gallery UI then reads the corresponding links (blog, Instagram, press) from the chronicle and renders them in the album info box — no duplication of link data needed.

### termine/

Single-page explainer for the technical infrastructure of the club, deployed at [termine.erfindergeist.org](https://termine.erfindergeist.org/).

Explains the data flow from NextCloud through the WordPress plugin to REST API, ICS calendar, GitHub PDF generator and share server. Target audience: children and adults.

### homepage/

Placeholder / landing page (no local dev server).

### presentations/

redirect to share

### gui/

Local web editor and gallery image pipeline, running at port 8082. Never deployed.

Tabs: **Chronik** (form CRUD with full/undo log), **Links**, **Tags**, **Alben** (gallery album configs), **Galerie** (process/upload/download), **Downloads**.

The gallery pipeline (`gui/process.py`) processes photos from a source directory, creates WebP thumbnails, detects and blurs faces. Output goes to `share/galerie/`. AI inference runs on CPU, NVIDIA (CDI via `GPU_DEVICE`) or AMD/ROCm (`compose.rocm.yaml` overlay).

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

Copy `.env.example` to `.env` and set `SOURCE_DIR` to the local Nextcloud root. No FTP credentials needed -
the deploy pipeline uploads everything. `GITHUB_TOKEN` is only needed for the **Veroeffentlichen** button.

```bash
# gui/.env (minimum)
SOURCE_DIR=/home/lars/erfindergeist
GITHUB_TOKEN=github_pat_...   # optional, fine-grained: this repo, Actions read/write
```

##### GitHub-Token fuer den Button "Veroeffentlichen"

Der Button startet den Workflow `deploy-share.yml` ueber die GitHub-API. Dafuer braucht die GUI einen
**fine-grained personal access token**, der nur genau das darf:

1. In GitHub oben rechts auf das Profilbild > **Settings** > ganz unten **Developer settings**
   > **Personal access tokens** > **Fine-grained tokens** > **Generate new token**
   (direkt: <https://github.com/settings/personal-access-tokens/new>).
2. **Token name**: z.B. `egj-gui-publish`, **Expiration**: z.B. 1 Jahr (danach neu erzeugen).
3. **Resource owner**: `ErfindergeistJuelichOfficial` (nicht das eigene Konto). Falls die Organisation
   fine-grained Tokens erst freigeben muss, landet der Token als Anfrage bei den Org-Admins.
4. **Repository access**: **Only select repositories** > `website`.
5. **Permissions** > **Repository permissions** > **Actions**: **Read and write**
   (`Metadata: Read-only` wird automatisch gesetzt). Sonst nichts.
6. **Generate token**, den Wert (`github_pat_...`) sofort kopieren - er wird nur einmal angezeigt.
7. In `gui/.env` eintragen: `GITHUB_TOKEN=github_pat_...`, dann die GUI neu starten
   (`podman compose up -d gui`).

Der Token kann nur Workflows starten - er kann keinen Code aendern und kennt kein FTP-Passwort.
Jede Person (z.B. Marketing) sollte einen eigenen Token anlegen, damit er einzeln widerrufen werden kann.
Ohne Token meldet der Button "GITHUB_TOKEN fehlt"; Veroeffentlichen geht dann manuell in GitHub unter
**Actions** > **🚀 Deploy Share Index and Dependencies** > **Run workflow** (oder spaetestens im naechtlichen Lauf).

After saving album configs via the GUI, use the **Galerie** tab to run `process.py`,
or use the command line:

```powershell
cd gui
podman compose run --rm process
```

#### History

The GUI keeps no logs - the Nextcloud versions every config file (restore via the Nextcloud web UI).

### gui/ - Image processing

```powershell
cd gui

# Standard build (Pillow, OpenCV — no AI models)
podman compose build

# Build with AI support (torch, transformers, facenet-pytorch)
# Required for VISION_MODEL=florence-2 and BLUR_MODEL=owlvit or mtcnn
# Set INSTALL_AI=true in gui/.env before building
podman compose build

# Process images (SOURCE_DIR must be set in .env)
podman compose run --rm process

# Publishing: "Veroeffentlichen" button in the GUI, or run deploy-share.yml in GitHub Actions

# Unit tests for process.py, server.py and validate_configs.py (also run in CI)
podman compose run --rm test

# Check configs + gallery files like the deploy pipeline does (read-only, uses SOURCE_DIR)
podman compose run --rm validate
```

> **AI build:** set `INSTALL_AI=true` in `gui/.env`, then run `podman compose build`.
> The flag is a build-time arg — changing it requires a rebuild, not just a restart.
> `BLUR_MODEL=haar` works without AI; `owlvit` and `mtcnn` require `INSTALL_AI=true`.
>
> **GPU (CUDA):** with `INSTALL_AI=true` the image is built on the NVIDIA CUDA base.
> To actually use the GPU set `DEVICE=cuda` **and** `GPU_DEVICE=nvidia.com/gpu=all`
> in `gui/.env`. This needs the NVIDIA Container Toolkit with a current CDI spec on
> the Podman machine. If the GPU isn't detected, regenerate the (often stale) spec:
>
> ```powershell
> podman machine ssh "sudo nvidia-ctk cdi generate --output=/etc/cdi/nvidia.yaml"
> ```
>
> Leave `GPU_DEVICE` unset (or `/dev/null`) and `DEVICE=cpu` for CPU-only inference.
