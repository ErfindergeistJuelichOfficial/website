# website

Mono-repo for the three web properties of [Erfindergeist Jülich e.V.](https://erfindergeist.org).

| Site | URL | Stack |
| ---- | --- | ----- |
| **termine** | <https://termine.erfindergeist.org/> | Static HTML · Bootstrap · GSAP · jQuery |
| **share** | <https://share.erfindergeist.org/> | PHP 8.2 · Bootstrap · file download portal |
| **presentations** | <https://presentations.erfindergeist.org/> | PHP 8.2 · Bootstrap · presentation index |

---

## Sites

### termine/

Interactive single-page explainer of the Erfindergeist tech stack. Pure static HTML/CSS/JS — no build step required. Supports German/English toggle, dark/light mode, and is WCAG 2.1 AA compliant.

### share/

File hosting and download portal. Lists all PDFs and DOCX files in the directory with previews and download buttons. Also serves shared front-end assets (Bootstrap, GSAP, fonts, logos) used by other projects.

### presentations/

Index page that lists all presentations as subdirectories. Each subdirectory contains its own `index.html` (typically reveal.js) plus optional PDFs.

---

## Local Development

### termine — Live Server

`termine/` is a static site with no build process. Use any static file server. With the [VS Code Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer):

1. Open `termine/index.html` in VS Code.
2. Click **Go Live** in the status bar (or press `Alt+L Alt+O`).
3. Browser opens at `http://127.0.0.1:5500/termine/index.html` with hot-reload on save.

### share — Podman

```powershell
cd share
podman compose up
```

Access at **<http://localhost:8080>**. The current directory is mounted into the container, so changes to PHP/CSS/JS files are reflected immediately without a restart.

```powershell
podman compose down   # stop and remove container
```

### presentations — Podman

```powershell
cd presentations
podman compose up
```

Access at **<http://localhost:8081>**. Same live-mount setup as share/.

```powershell
podman compose down   # stop and remove container
```

---

## Deployment

All three sites are deployed automatically via GitHub Actions on push to `main`:

- Changes under `termine/**` → FTP deploy to `termine.erfindergeist.org`
- Changes under `share/**` → FTP deploy to `share.erfindergeist.org`
- Changes under `presentations/**` → FTP deploy to `presentations.erfindergeist.org`

The `compose.yaml`, `README.md`, and `CLAUDE.md` files are excluded from FTP uploads.
