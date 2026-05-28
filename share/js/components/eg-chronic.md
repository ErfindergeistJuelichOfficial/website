# eg-chronic - WordPress Integration

The `<eg-chronic>` component displays all club events from the chronicle, grouped by year and month (newest first). No backend or configuration required.

## Option A: Custom HTML block (no server access needed)

Paste directly into a Gutenberg **Custom HTML** block:

```html
<script src="https://share.erfindergeist.org/js/components/eg-chronic.js"></script>
<eg-chronic></eg-chronic>
```

Save the page - done.

## Option B: functions.php + Custom HTML block (recommended)

The script is loaded cleanly via the WordPress queue and is not duplicated when the component appears multiple times.

**Step 1:** Add to `functions.php` in your active theme:

```php
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_script(
    'eg-chronic',
    'https://share.erfindergeist.org/js/components/eg-chronic.js',
    [],   // no dependencies
    null, // no version string
    true  // load in <body>, not <head>
  );
});
```

**Step 2:** Add a **Custom HTML** block to the page:

```html
<eg-chronic></eg-chronic>
```

## Notes

- Fetches `chronicle.json` and `links.json` directly from `share.erfindergeist.org` - CORS headers are already in place.
- Uses WordPress styles exclusively (no Shadow DOM, no internal CSS).
- Shows "Lade Chronik ..." while loading and an error message if the fetch fails.
- Browser support: all modern browsers (Custom Elements v1 + Fetch API). Internet Explorer is not supported.
