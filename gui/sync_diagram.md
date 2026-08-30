# upload.py - Sync Flow Diagram

Both `upload` and `download` services use the same `upload.py` script, invoked with a mode
argument. A local `_ftp_sync.json` tracks the last known remote state so each run can skip
unchanged files without querying the server per file.

**Typical workflow:**
```
podman compose run --rm download   # 1. fetch current server state
podman compose run --rm process    # 2. generate/update WebP + JSON
podman compose run --rm upload     # 3. push changes to server
```

---

## Level 1: Entry point

```mermaid
flowchart TD
    main["main()"]
    parse["argparse\nmode: upload | download"]
    upload_main["upload_main()"]
    download_main["download_main()"]

    main --> parse
    parse -->|upload| upload_main
    parse -->|download| download_main
```

---

## Level 2: download_main()

Fetches the current server state into `share/galerie/`. Rewrites production URLs to
localhost URLs in JSON files so the local dev server works without changes.

```mermaid
flowchart TD
    start(["download_main()"])
    check_out{"OUTPUT_DIR\nmounted?"}
    exit_err["exit 1"]
    load_sync["load_sync()\nread _ftp_sync.json"]
    connect["connect()\nFTPS_TLS + login + prot_p()"]
    open_log["open_log('download')\nlog/YYYYMMDD_download.txt"]
    list_remote["list_remote_recursive()\nMLSD walk of FTP_REMOTE"]
    foreach_file["For each remote file\n(remote_path, remote_size)"]
    skip_log{"rel starts\nwith 'log/'?"}
    check_sync{"sync[rel]\n== remote_size?"}
    skip["skipped++"]
    retr["ftp.retrbinary(RETR)\ninto BytesIO buffer"]
    is_json{"suffix == .json?"}
    rewrite_dl["rewrite_for_download()\nprod URL -> localhost URL"]
    save_local["mkdir parents\nwrite bytes to local_path"]
    update_sync_json["sync[rel] =\n[remote_size, local_mtime]"]
    update_sync_bin["sync[rel] = remote_size"]
    log_entry["log: DOWNLOAD rel"]
    ftp_quit["ftp.quit()"]
    save_sync["save_sync()\nwrite _ftp_sync.json"]
    summary["print summary\n(Downloaded / Skipped / Errors)"]
    done(["Done  (exit 1 if errors)"])

    start --> check_out
    check_out -->|no| exit_err
    check_out -->|yes| load_sync --> connect --> open_log --> list_remote --> foreach_file
    foreach_file --> skip_log
    skip_log -->|yes - never sync server logs| foreach_file
    skip_log -->|no| check_sync
    check_sync -->|yes - already up to date| skip --> foreach_file
    check_sync -->|no| retr --> is_json
    is_json -->|yes| rewrite_dl --> save_local
    is_json -->|no| save_local
    save_local --> is_json2{"suffix == .json?"}
    is_json2 -->|yes| update_sync_json --> log_entry
    is_json2 -->|no| update_sync_bin --> log_entry
    log_entry --> foreach_file
    foreach_file -->|all files done| ftp_quit --> save_sync --> summary --> done
```

---

## Level 3: upload_main()

Pushes local `share/galerie/` to the server. Rewrites localhost URLs to production URLs in
JSON files before uploading. Skips files whose sync key has not changed since the last run.

```mermaid
flowchart TD
    start(["upload_main()"])
    check_out{"OUTPUT_DIR\nmounted?"}
    exit_err["exit 1"]
    load_sync["load_sync()\nread _ftp_sync.json"]
    connect["connect()\nFTPS_TLS + login + prot_p()"]
    open_log["open_log('upload')\nlog/YYYYMMDD_upload.txt"]
    list_local["rglob all local files\n(exclude _ftp_sync.json, log/)"]
    foreach_file["For each local file (sorted)"]
    is_json{"suffix == .json?"}
    rewrite_up["rewrite_for_upload()\nlocalhost URL -> prod URL\nreturns bytes"]
    key_json["sync_key =\n[rewritten_size, file_mtime]"]
    key_bin["sync_key = file_size (int)"]
    check_sync{"sync[rel]\n== sync_key?"}
    skip["skipped++"]
    ensure_dirs["ensure_remote_dirs()\nmkd missing parent dirs on server"]
    stor["ftp.storbinary(STOR)\nfrom BytesIO(payload)"]
    update_sync["sync[rel] = sync_key"]
    log_entry["log: UPLOAD rel"]
    ftp_quit["ftp.quit()"]
    save_sync["save_sync()\nwrite _ftp_sync.json"]
    summary["print summary\n(Uploaded / Skipped / Errors)"]
    done(["Done  (exit 1 if errors)"])

    start --> check_out
    check_out -->|no| exit_err
    check_out -->|yes| load_sync --> connect --> open_log --> list_local --> foreach_file
    foreach_file --> is_json
    is_json -->|yes| rewrite_up --> key_json --> check_sync
    is_json -->|no| key_bin --> check_sync
    check_sync -->|yes - unchanged| skip --> foreach_file
    check_sync -->|no - new or changed| ensure_dirs --> stor --> update_sync --> log_entry --> foreach_file
    foreach_file -->|all files done| ftp_quit --> save_sync --> summary --> done
```

---

## Sync Key Format

`_ftp_sync.json` maps `"relative/path"` to a sync key that lets the next run detect changes
without querying the server:

| File type | sync_key stored | Change detected when |
| --- | --- | --- |
| Binary (`.webp`) | `file_size` (int) | size differs |
| JSON (upload side) | `[rewritten_size, mtime]` | rewritten byte count OR file mtime changed |
| JSON (download side) | `[remote_size, local_mtime]` | remote size differs |

JSON files use two-part keys because URL rewriting can produce the same byte count even when
the content changes (same-length URLs), and because the same file might be re-encoded with
different whitespace. The mtime component catches same-size edits.

---

## URL Rewriting

JSON files (`_meta.json`, `_index.json`) contain absolute URLs for JSON-LD `@id` fields.
Two environments use different base URLs:

| Direction | From | To |
| --- | --- | --- |
| Upload | `http://localhost:8080/galerie` | `https://share.erfindergeist.org/galerie` |
| Download | `https://share.erfindergeist.org/galerie` | `http://localhost:8080/galerie` |

Rewriting is a plain `str.replace` / `bytes.replace` — no JSON parsing required.

---

## Key Functions

| Function | Purpose |
| --- | --- |
| `load_sync()` | Read `_ftp_sync.json`; return `{}` if missing or corrupt |
| `save_sync(sync)` | Write `_ftp_sync.json` (sorted keys for stable diffs) |
| `connect()` | Open `FTP_TLS`, login, `prot_p()` (data channel encryption), binary mode |
| `ensure_remote_dirs(ftp, path)` | Walk parent segments, `mkd` each if missing |
| `list_remote_recursive(ftp, dir)` | Recursive MLSD walk; returns `[(path, size), ...]` |
| `rewrite_for_upload(path)` | Read local file, replace localhost URL, return bytes |
| `rewrite_for_download(data)` | Replace prod URL in bytes, return bytes |
| `open_log(mode)` | Open timestamped log file in `log/` |
