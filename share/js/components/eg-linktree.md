# eg-linktree - WordPress Integration

The `<eg-linktree>` component shows all links of the club linktree (donations, website, wiki, gallery, Discord, newsletter, offers and social media) as large, animated buttons grouped into sections. No backend or configuration required.

## Option A: Custom HTML block (no server access needed)

Paste directly into a Gutenberg **Custom HTML** block:

```html
<script src="https://share.erfindergeist.org/js/components/eg-linktree.js"></script>
<eg-linktree></eg-linktree>
```

Save the page - done.

## Option B: functions.php + Custom HTML block (recommended)

The script is loaded cleanly via the WordPress queue and is not duplicated when the component appears multiple times.

**Step 1:** Add to `functions.php` in your active theme:

```php
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_script(
    'eg-linktree',
    'https://share.erfindergeist.org/js/components/eg-linktree.js',
    [],   // no dependencies
    null, // no version string
    true  // load in <body>, not <head>
  );
});
```

**Step 2:** Add a **Custom HTML** block to the page:

```html
<eg-linktree></eg-linktree>
```

## Editing links

The links are special linktree links and are maintained directly in `GROUPS` inside `eg-linktree.js` (not in `links.json`). Each entry:

```js
{ title: 'Wiki', sub: 'Wissen & Anleitungen', icon: 'book', accent: '#3b82f6',
  href: 'https://wiki.erfindergeist.org/' }
```

- `icon`: key from `ICONS` (stroke icons) - or `brand`: key from `BRANDS` (social logos)
- `accent`: optional color for icon tile, border and glow on hover (default: primary)
- A group with `hero: true` renders gradient buttons (used for donations)
- Without `href` the entry is rendered as a non-clickable info tile with a map pin instead of the arrow (used for the donation box)

## Notes

- Self-contained: injects its own `<style id="eg-linktree-styles">` once, all classes prefixed with `eg-lt-` to avoid clashes with the WordPress theme.
- Uses the `--color-*` variables from `share.css` when present, with brand-color fallbacks for WordPress.
- Responsive via container queries (adapts to the width of the content column, not the viewport): 1 column on phones, 2 on tablets, 3 on desktop, 4 on very wide screens. Font size scales with the viewport, so buttons stay readable on TVs.
- Clear focus ring for keyboard and TV remote navigation; animations are disabled with `prefers-reduced-motion`.
- Browser support: all modern browsers (Custom Elements v1, container queries, `color-mix()`). Internet Explorer is not supported.
