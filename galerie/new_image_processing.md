# process.py - New Flow Diagram (4-Phase Architecture)

## Motivation

The original single-pass loop in `process_album()` loads all AI models upfront and keeps them
in RAM simultaneously while processing every image. The new architecture splits the work into
**4 sequential phase-loops**:

1. **Basics** - all images, no AI models
2. **Captions** - load vision model, caption all images needing it, then unload
3. **Blur** - for each blur model: load, blur all images needing it, unload; repeat
4. **Thumbnails** - all images, no AI models

**RAM benefit:** models never overlap in RAM.
Old peak = `vision_model + all_blur_models + Pillow`.
New peak = `max(vision_model, single_blur_model) + Pillow`.

---

## Level 1: Overall flow

```mermaid
flowchart TD
    main["main()"]
    check_src{"SOURCE_DIR\nexists?"}
    exit_err["exit 1"]
    scan["scan_and_process()"]
    cleanup_albums["cleanup_orphaned_albums()"]
    reconcile["reconcile_output()"]
    write_log["Write changelog\n(log/YYYYMMDD_process.txt)\n+ print time/RAM summary"]
    done["Done"]

    main --> check_src
    check_src -->|no| exit_err
    check_src -->|yes| scan
    scan --> cleanup_albums
    cleanup_albums --> reconcile
    reconcile --> write_log
    write_log --> done

    subgraph scan["scan_and_process()"]
        direction TB
        seed["Read _index.json\n(seed known_summaries)"]
        foreach_cfg["For each _config.json (recursive)"]
        load_cfg{"load_config()\nvalid?"}
        skip_cfg["Skip"]
        load_existing["load_existing_by_hash()\nread _meta.json"]
        detect_chg["detect_config_changes()\ntitle / description changed?"]
        pre_index["write_index() upfront\n(album visible immediately)"]
        proc_album["process_album() - 4 phases"]
        cleanup_img["cleanup_orphaned_images()\ndelete orphan .webp"]
        write_meta_final["write_album_meta()\nfinal _meta.json"]
        post_index["write_index() update"]

        seed --> foreach_cfg
        foreach_cfg --> load_cfg
        load_cfg -->|invalid / no title| skip_cfg --> foreach_cfg
        load_cfg -->|valid| load_existing --> detect_chg --> pre_index --> proc_album
        proc_album --> cleanup_img --> write_meta_final --> post_index --> foreach_cfg
    end
```

---

## Level 2: process_album() - Phase overview

```mermaid
flowchart TD
    start(["process_album()"])
    phase1["Phase 1: Basics\nFor each image:\nsha256, open_and_orient,\nnormalize, save _n.webp"]
    check_cap{"any image\ncaption=null\nAND VISION_MODEL active?"}
    phase2["Phase 2: Captions\nload_vision_model\ngenerate captions\nunload_vision_model"]
    skip_cap["skip Phase 2"]
    check_blur{"any image\nneeds blur\nAND blurred=false?"}
    phase3["Phase 3: Blur\nfor each blur_model:\nload -> blur all -> unload"]
    skip_blur["skip Phase 3"]
    phase4["Phase 4: Thumbnails\nFor each image:\nopen _n.webp\nmake_thumbnail\nsave _t.webp"]
    finish(["return parts[]"])

    start --> phase1 --> check_cap
    check_cap -->|yes| phase2 --> check_blur
    check_cap -->|no| skip_cap --> check_blur
    check_blur -->|yes| phase3 --> phase4
    check_blur -->|no| skip_blur --> phase4
    phase4 --> finish
```

---

## Level 3a: Phase 1 - Basics

No AI models required. Only Pillow and piexif are in RAM.

```mermaid
flowchart TD
    start(["Phase 1: Basics"])
    foreach_img["For each image file (sorted)"]
    compute_hash["sha256_short()\n8-char hash of source file"]
    check_skip{"hash in meta\nAND _n.webp exists\non disk?"}
    keep_existing["keep existing entry\nparts.append(existing)"]
    open_orient["open_and_orient()\ncorrect EXIF rotation"]
    file_dt["file_datetime()\nEXIF DateTimeOriginal or mtime"]
    file_exif_step["file_exif()\ncamera, focalLength, exposure, ISO"]
    make_norm["make_normalized()\nmax NORMALIZED_MAX px longest edge"]
    save_n["save _n.webp\n(unblurred at this stage)"]
    needs_blur_step["determine img_needs_blur\n(consent_collected, blur[], no_blur[])"]
    new_entry["store entry:\nblurred=false, caption=null"]
    write_meta["write_album_meta()\non_progress() -> write_index()"]
    finish(["Phase 1 done"])

    start --> foreach_img
    foreach_img --> compute_hash --> check_skip
    check_skip -->|yes - already processed| keep_existing --> write_meta
    check_skip -->|no - new or changed| open_orient --> file_dt --> file_exif_step --> make_norm --> save_n --> needs_blur_step --> new_entry --> write_meta
    write_meta --> foreach_img
    foreach_img -->|all images done| finish
```

> `_n.webp` is saved without blur at this point. Phase 3 will overwrite it with the blurred
> version for images that need it.

---

## Level 3b: Phase 2 - Captions

Vision model is loaded once, used for all images missing a caption, then unloaded before
Phase 3 begins. If no image needs a caption the entire phase is skipped.

```mermaid
flowchart TD
    start(["Phase 2: Captions"])
    check_any{"any image has\ncaption=null\nAND VISION_MODEL != disabled?"}
    skip_all["skip phase entirely"]
    load_vision["load_vision_model()\nFlorence-2 (or configured model)"]
    foreach_img["For each image without caption"]
    open_n["open _n.webp\n(use as model input)"]
    gen_cap["generate_caption()\nFlorence-2 CAPTION task\nmax_new_tokens=64"]
    store_cap["store caption in entry"]
    write_meta["write_album_meta()\non_progress() -> write_index()"]
    unload_vision["unload_vision_model()\ndel _vision_model, _vision_proc\ngc.collect()\ntorch.cuda.empty_cache() if CUDA"]
    finish(["Phase 2 done"])

    start --> check_any
    check_any -->|no| skip_all --> finish
    check_any -->|yes| load_vision --> foreach_img
    foreach_img --> open_n --> gen_cap --> store_cap --> write_meta --> foreach_img
    foreach_img -->|all images captioned| unload_vision --> finish
```

> Images that already have a caption (from a previous run) are skipped inside the loop.
> The vision model is guaranteed to be unloaded before Phase 3 loads any blur model.

---

## Level 3c: Phase 3 - Blur

One blur model at a time. The outer loop iterates over `BLUR_MODELS`; the inner loop
iterates over all images that need blur. Each model operates on the output of the previous
(iterative blur effect, same as the old single-pass `blur_faces()` behavior).

```mermaid
flowchart TD
    start(["Phase 3: Blur"])
    check_any{"any image:\nimg_needs_blur=true\nAND blurred=false?"}
    skip_all["skip phase entirely"]
    foreach_model["For each blur_model in BLUR_MODELS"]
    load_blur["load_blur_model(blur_model)\none model instance only"]
    foreach_img["For each image that needs blur"]
    open_n["open current _n.webp\n(may already have prior model's blur)"]
    detect_faces["_detect_faces_with(blur_model, img)\nbounding boxes"]
    apply_blur["apply GaussianBlur(radius=w/4)\nto each face region"]
    save_n["save _n.webp back\n(overwrite with blurred version)"]
    write_meta["write_album_meta()\non_progress() -> write_index()"]
    unload_blur["unload_blur_model(blur_model)\ndel _blur_instances[blur_model]\ngc.collect()"]
    mark_blurred["mark all blurred images:\nblurred=true in meta entries"]
    finish(["Phase 3 done"])

    start --> check_any
    check_any -->|no| skip_all --> finish
    check_any -->|yes| foreach_model
    foreach_model --> load_blur --> foreach_img
    foreach_img --> open_n --> detect_faces --> apply_blur --> save_n --> write_meta --> foreach_img
    foreach_img -->|all images done for this model| unload_blur --> foreach_model
    foreach_model -->|all models done| mark_blurred --> finish
```

> `blurred=true` is only written to meta **after** all models have processed the image,
> so a half-finished run (interrupted between models) will re-process cleanly on restart.

---

## Level 3d: Phase 4 - Thumbnails

No AI models required. Thumbnails are derived from `_n.webp` (already normalized and blurred
if needed), not from the original source file.

```mermaid
flowchart TD
    start(["Phase 4: Thumbnails"])
    foreach_img["For each image (sorted)"]
    check_skip{"_t.webp exists\nAND hash matches meta?"}
    keep["skip - thumbnail up to date"]
    open_n["open _n.webp\n(normalized + blurred if applicable)"]
    make_thumb["make_thumbnail()\nTHUMBNAIL_WIDTH px, preserve aspect ratio"]
    save_t["save _t.webp"]
    write_meta["write_album_meta()\non_progress() -> write_index()"]
    finish(["Phase 4 done\nreturn parts[]"])

    start --> foreach_img
    foreach_img --> check_skip
    check_skip -->|yes| keep --> foreach_img
    check_skip -->|no| open_n --> make_thumb --> save_t --> write_meta --> foreach_img
    foreach_img -->|all images done| finish
```

> Quality note: thumbnail is resized from `_n.webp` (max 1920 px) rather than the original
> source. For a 400 px thumbnail width this makes no visible quality difference.

---

## RAM Profile

| Phase | Active in RAM | Typical peak |
| --- | --- | --- |
| Phase 1 (Basics) | Pillow, piexif | ~150-300 MB |
| Phase 2 (Captions) | Pillow + Florence-2 | ~3-6 GB |
| Phase 3 (Blur, per model) | Pillow + one model | ~300 MB - 2 GB |
| Phase 4 (Thumbnails) | Pillow only | ~150-300 MB |

Old single-pass peak = `Florence-2 + all blur models + Pillow` (all loaded at once).
New peak = `max(Phase 2, Phase 3)` - only one model family resident at a time.

---

## Skip Logic per Phase

Each phase has its own independent skip condition. An image that was already processed in a
previous run will be skipped by the relevant phase, allowing interrupted runs to resume.

| Phase | Skip condition (per image) |
| --- | --- |
| Phase 1 (Basics) | `sourceHash` in meta AND `_n.webp` exists on disk |
| Phase 2 (Captions) | `caption` key already present and non-null in meta entry |
| Phase 3 (Blur) | `blurred: true` already in meta entry OR `img_needs_blur=false` |
| Phase 4 (Thumbnails) | `_t.webp` exists on disk AND `sourceHash` matches meta |

---

## Time & RAM Measurement

### Implementation

```python
import time
import gc
import resource  # Linux only - process runs in container

_t_start: float = time.perf_counter()
_phase_times: dict[str, float] = {}

# Wrap each phase call in process_album():
t0 = time.perf_counter()
_run_phase1_basics(...)
_phase_times["Phase 1 (basics)"] = time.perf_counter() - t0

t0 = time.perf_counter()
_run_phase2_captions(...)
_phase_times["Phase 2 (captions)"] = time.perf_counter() - t0

# ... same for phases 3 and 4 ...

# At the end of main(), before Done:
peak_kb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss  # KB on Linux
```

`resource.getrusage(resource.RUSAGE_SELF).ru_maxrss` is the lifetime peak RSS of the process
in kilobytes (Linux). It reflects the highest RAM point across all 4 phases - no need to
sample during execution.

### Output format (end of main())

```
=== Process Summary ===
Total time:  12m 34.2s
  Phase 1 (basics):      8m 12.1s
  Phase 2 (captions):    2m 45.3s
  Phase 3 (blur):        1m 31.4s
  Phase 4 (thumbnails):  0m 05.4s
Peak RAM: 4.2 GB
```

Display conversion: `peak_kb / 1024 / 1024` -> GB (show 1 decimal place).
Time format: `int(s // 60)m {s % 60:.1f}s`.
