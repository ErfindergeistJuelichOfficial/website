'use strict';

(function () {
  if (customElements.get('eg-linktree')) { return; }

  var LOGO_URL = 'https://share.erfindergeist.org/img/logo.svg';

  // Lucide-style stroke icons (inline, no dependency on lucide.min.js)
  var ICONS = {
    heart:        '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    landmark:     '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 20 7H4z"/>',
    globe:        '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    book:         '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    image:        '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    presentation: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
    message:      '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    mail:         '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    wrench:       '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    repair:       '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    dices:        '<rect width="12" height="12" x="2" y="10" rx="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01"/><path d="M10 14h.01"/><path d="M15 6h.01"/><path d="M18 9h.01"/>',
    palette:      '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    userPlus:     '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/>',
    piggyBank:    '<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/>',
    mapPin:       '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    arrow:        '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>'
  };

  // Brand icons are fill-based (same paths as eg-footer)
  var BRANDS = {
    facebook:  '<path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01z"/>',
    instagram: '<path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12c0 3.259.014 3.668.072 4.948.059 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24c3.259 0 3.668-.014 4.948-.072 1.277-.059 2.148-.261 2.913-.558.788-.306 1.459-.717 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.689.072-4.948 0-3.259-.014-3.667-.072-4.947-.059-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>',
    linkedin:  '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
    github:    '<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>',
    mastodon:  '<path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/>'
  };

  // Accent colors per button; brand colors for social platforms
  var GROUPS = [
    {
      title: 'Unterstützen',
      hero:  true,
      links: [
        { title: 'Spenden via PayPal', sub: 'Schnell & unkompliziert helfen', icon: 'heart',
          href: 'http://paypal.erfindergeist.org/' },
        { title: 'Spenden via Überweisung', sub: 'Unsere Bankverbindung', icon: 'landmark',
          href: 'https://erfindergeist.org/konto/' },
        { title: 'Fördermitglied werden', sub: 'Regelmäßige Unterstützung', icon: 'userPlus',
          href: 'https://erfindergeist.org/mitglied-werden/' },
        // No href: rendered as a non-clickable info tile
        { title: 'Spendendose', sub: 'In unserer Werkstatt vor Ort', icon: 'piggyBank' }
      ]
    },
    {
      title: 'Entdecken',
      links: [
        { title: 'Webseite', sub: 'Alles über den Verein', icon: 'globe', accent: 'var(--lt-primary)',
          href: 'https://www.erfindergeist.org' },
        { title: 'Wiki', sub: 'Wissen & Anleitungen', icon: 'book', accent: '#3b82f6',
          href: 'https://wiki.erfindergeist.org/' },
        { title: 'Galerie', sub: 'Bilder unserer Veranstaltungen', icon: 'image', accent: '#ec4899',
          href: 'https://galerie.erfindergeist.org/' },
        { title: 'Präsentationen', sub: 'Vorträge & Folien', icon: 'presentation', accent: '#8b5cf6',
          href: 'https://presentations.erfindergeist.org/' }
      ]
    },
    {
      title: 'Mitmachen',
      links: [
        { title: 'Discord', sub: 'Chatte mit der Community', icon: 'message', accent: '#5865F2',
          href: 'http://discord.erfindergeist.org/' },
        { title: 'Newsletter', sub: 'Keine Neuigkeit verpassen', icon: 'mail', accent: 'var(--lt-secondary)',
          href: 'https://listmonk.erfindergeist.org/subscription/form' },
        { title: 'Offene Werkstatt', sub: 'Raum, Maschinen & Werkzeug', icon: 'wrench', accent: '#f97316',
          href: 'https://werkstatt.erfindergeist.org/' },
        { title: 'Repair Café', sub: 'Reparieren statt wegwerfen', icon: 'repair', accent: '#22c55e',
          href: 'http://repaircafe.erfindergeist.org/' },
        { title: 'Gesellschaftsspiele', sub: 'Gemeinsam spielen', icon: 'dices', accent: '#ef4444',
          href: 'https://erfindergeist.org/angebote/gesellschaftsspiele/' },
        { title: 'Kreativ-Tag', sub: 'Basteln, malen, gestalten', icon: 'palette', accent: '#d946ef',
          href: 'https://erfindergeist.org/angebote/kreativ-tag/' }
      ]
    },
    {
      title: 'Folgen',
      links: [
        { title: 'Instagram', sub: '@erfindergeistjuelich', brand: 'instagram', accent: '#E4405F',
          href: 'https://www.instagram.com/erfindergeistjuelich/' },
        { title: 'Mastodon', sub: '@verein', brand: 'mastodon', accent: '#6364FF',
          href: 'https://social.erfindergeist.org/@verein' },
        { title: 'Facebook', sub: 'erfindergeistjuelich', brand: 'facebook', accent: '#1877F2',
          href: 'https://www.facebook.com/erfindergeistjuelich' },
        { title: 'LinkedIn', sub: 'Erfindergeist Jülich e.V.', brand: 'linkedin', accent: '#0A66C2',
          href: 'https://www.linkedin.com/company/erfindergeist-j%C3%BClich-e-v/' },
        { title: 'GitHub', sub: 'Unser Open-Source-Code', brand: 'github', accent: '#6e5494',
          href: 'https://github.com/ErfindergeistJuelichOfficial' }
      ]
    }
  ];

  // Fallbacks keep the component styled on WordPress, where share.css is not loaded
  var CSS_LINKTREE = 'eg-linktree{'
    + 'display:block;'
    + '--lt-primary:var(--color-primary,#159989);'
    + '--lt-primary-rgb:var(--color-primary-rgb,21,153,137);'
    + '--lt-secondary:var(--color-secondary,#F9B338);'
    + '--lt-surface:var(--color-surface,#ffffff);'
    + '--lt-text:var(--color-text,#1a2e2c);'
    + '--lt-muted:var(--color-text-muted,#4a6b67);'
    + '--lt-border:var(--color-border,#d0e8e4);'
    + '}'
    + '.eg-lt{'
    + 'container-type:inline-size;max-width:110em;margin:0 auto;padding:1.5em 0;'
    + 'font-size:clamp(1rem,.85rem + .35vw,1.6rem);color:var(--lt-text);line-height:1.35;'
    + '}'
    + '.eg-lt *,.eg-lt *::before,.eg-lt *::after{box-sizing:border-box;}'

    // Header
    + '.eg-lt-head{display:flex;flex-direction:column;align-items:center;text-align:center;gap:.6em;margin-bottom:2.2em;}'
    + '.eg-lt-logo{height:3.6em;width:auto;max-width:80%;}'
    + '.eg-lt-tagline{margin:0;color:var(--lt-muted);font-size:1em;}'
    + '.eg-lt-tagline b{color:var(--lt-primary);}'

    // Groups
    + '.eg-lt-group{margin:0 0 2.2em;}'
    + '.eg-lt .eg-lt-title{'
    + 'display:flex;align-items:center;gap:.8em;margin:0 0 .9em;padding:0;border:0;'
    + 'font-size:.78em;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--lt-primary);'
    + '}'
    + '.eg-lt .eg-lt-title::after{'
    + 'content:"";flex:1;height:2px;border-radius:2px;'
    + 'background:linear-gradient(90deg,rgba(var(--lt-primary-rgb),.45),transparent);'
    + '}'
    + '.eg-lt-grid{display:grid;gap:.9em;grid-template-columns:minmax(0,1fr);list-style:none;margin:0;padding:0;}'
    + '.eg-lt-grid li{margin:0;padding:0;min-width:0;}'
    + '@container (min-width:34em){.eg-lt-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}'
    + '@container (min-width:56em){.eg-lt-grid{grid-template-columns:repeat(3,minmax(0,1fr));}}'
    + '@container (min-width:90em){.eg-lt-grid{grid-template-columns:repeat(4,minmax(0,1fr));}}'
    + '@container (min-width:56em){.eg-lt-group-hero .eg-lt-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}'

    // Button
    + '.eg-lt .eg-lt-btn{'
    + '--accent:var(--lt-primary);'
    + 'position:relative;isolation:isolate;overflow:hidden;'
    + 'display:flex;align-items:center;gap:.9em;height:100%;min-height:4.6em;padding:.85em 1em;'
    + 'background:var(--lt-surface);color:var(--lt-text);text-decoration:none;'
    + 'border:2px solid var(--lt-border);border-radius:1.1em;'
    + 'box-shadow:0 .15em .4em rgba(0,0,0,.04);'
    + 'transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s,border-color .25s,color .25s;'
    + 'animation:eg-lt-in .5s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--i) * 45ms);'
    + '}'
    // Accent wash that sweeps in from the left on hover
    + '.eg-lt .eg-lt-btn::before{'
    + 'content:"";position:absolute;inset:0;z-index:-1;'
    + 'background:linear-gradient(110deg,color-mix(in srgb,var(--accent) 14%,transparent),transparent 70%);'
    + 'transform:translateX(-101%);transition:transform .45s cubic-bezier(.22,1,.36,1);'
    + '}'
    + '.eg-lt a.eg-lt-btn:hover,.eg-lt a.eg-lt-btn:focus-visible{'
    + 'transform:translateY(-4px);color:var(--lt-text);text-decoration:none;'
    + 'border-color:var(--accent);'
    + 'box-shadow:0 .9em 1.8em -.6em color-mix(in srgb,var(--accent) 55%,transparent);'
    + '}'
    + '.eg-lt a.eg-lt-btn:hover::before,.eg-lt a.eg-lt-btn:focus-visible::before{transform:translateX(0);}'
    + '.eg-lt a.eg-lt-btn:active{transform:translateY(-1px) scale(.98);}'
    // Strong focus ring for keyboard and TV remote navigation
    + '.eg-lt a.eg-lt-btn:focus-visible{outline:.22em solid var(--accent);outline-offset:.22em;}'

    + '.eg-lt-icon{'
    + 'flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;'
    + 'width:2.8em;height:2.8em;border-radius:.85em;'
    + 'background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);'
    + 'transition:transform .35s cubic-bezier(.34,1.56,.64,1),background .25s,color .25s;'
    + '}'
    + '.eg-lt-icon svg{width:1.45em;height:1.45em;display:block;}'
    + '.eg-lt a.eg-lt-btn:hover .eg-lt-icon,.eg-lt a.eg-lt-btn:focus-visible .eg-lt-icon{'
    + 'background:var(--accent);color:#fff;transform:rotate(-8deg) scale(1.08);'
    + '}'
    + '.eg-lt-text{display:flex;flex-direction:column;min-width:0;flex:1;}'
    + '.eg-lt-label{font-weight:700;font-size:1.05em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.eg-lt-sub{font-size:.8em;color:var(--lt-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.eg-lt-arrow{'
    + 'flex-shrink:0;display:inline-flex;width:1.9em;height:1.9em;align-items:center;justify-content:center;'
    + 'border-radius:50%;color:var(--lt-muted);opacity:.55;'
    + 'transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .25s,color .25s,background .25s;'
    + '}'
    + '.eg-lt-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}'
    + '.eg-lt-arrow svg{width:1.05em;height:1.05em;display:block;}'
    + '.eg-lt a.eg-lt-btn:hover .eg-lt-arrow,.eg-lt a.eg-lt-btn:focus-visible .eg-lt-arrow{'
    + 'opacity:1;color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent);'
    + 'transform:translate(2px,-2px) rotate(0deg);'
    + '}'

    // Hero buttons (donations): gradient with a recurring shine
    + '.eg-lt .eg-lt-hero{'
    + '--accent:var(--lt-secondary);min-height:5.6em;border:0;color:#fff;'
    + 'background:linear-gradient(120deg,var(--lt-primary) 0%,color-mix(in srgb,var(--lt-primary) 60%,var(--lt-secondary)) 55%,var(--lt-secondary) 130%);'
    + 'background-size:160% 100%;background-position:0 0;'
    + 'box-shadow:0 .7em 1.6em -.7em rgba(var(--lt-primary-rgb),.7);'
    + 'transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s,background-position .6s;'
    + '}'
    + '.eg-lt .eg-lt-hero::before{'
    + 'transform:none;width:40%;left:-60%;right:auto;'
    + 'background:linear-gradient(100deg,transparent,rgba(255,255,255,.38),transparent);'
    + 'animation:eg-lt-shine 4.5s ease-in-out infinite;animation-delay:calc(var(--i) * .8s + 1s);'
    + '}'
    + '.eg-lt a.eg-lt-hero:hover,.eg-lt a.eg-lt-hero:focus-visible{'
    + 'color:#fff;background-position:100% 0;'
    + 'box-shadow:0 1.1em 2em -.7em rgba(var(--lt-primary-rgb),.85);'
    + '}'
    + '.eg-lt a.eg-lt-hero:hover::before,.eg-lt a.eg-lt-hero:focus-visible::before{transform:none;}'
    + '.eg-lt-hero .eg-lt-icon{width:3.2em;height:3.2em;background:rgba(255,255,255,.2);color:#fff;}'
    + '.eg-lt-hero .eg-lt-label{font-size:1.18em;white-space:normal;}'
    + '.eg-lt-hero .eg-lt-sub,.eg-lt-hero .eg-lt-arrow{color:rgba(255,255,255,.9);opacity:1;}'
    + '.eg-lt a.eg-lt-hero:hover .eg-lt-icon,.eg-lt a.eg-lt-hero:focus-visible .eg-lt-icon{'
    + 'background:#fff;color:var(--lt-primary);'
    + '}'
    + '.eg-lt a.eg-lt-hero:hover .eg-lt-icon svg{animation:eg-lt-beat .9s ease-in-out infinite;}'
    + '.eg-lt a.eg-lt-hero:hover .eg-lt-arrow,.eg-lt a.eg-lt-hero:focus-visible .eg-lt-arrow{'
    + 'color:#fff;background:rgba(255,255,255,.22);'
    + '}'
    + '.eg-lt a.eg-lt-hero:focus-visible{outline-color:var(--lt-secondary);}'

    // Dark theme of share.css (data-theme="dark")
    + '[data-theme="dark"] .eg-lt .eg-lt-btn:not(.eg-lt-hero){box-shadow:none;}'
    + '[data-theme="dark"] .eg-lt-logo{filter:brightness(1.3);}'

    + '@keyframes eg-lt-in{from{opacity:0;transform:translateY(14px) scale(.97);}to{opacity:1;transform:none;}}'
    + '@keyframes eg-lt-shine{0%,60%{left:-60%;}100%{left:130%;}}'
    + '@keyframes eg-lt-beat{0%,100%{transform:scale(1);}30%{transform:scale(1.2);}60%{transform:scale(.95);}}'

    // Small phones: tighter buttons
    + '@container (max-width:22em){'
    + '.eg-lt .eg-lt-btn{gap:.7em;padding:.7em .8em;min-height:4em;}'
    + '.eg-lt-icon,.eg-lt-hero .eg-lt-icon{width:2.4em;height:2.4em;}'
    + '.eg-lt .eg-lt-hero{min-height:4.6em;}'
    + '.eg-lt-hero .eg-lt-label{font-size:1.05em;}'
    + '}'

    + '@media (prefers-reduced-motion:reduce){'
    + '.eg-lt .eg-lt-btn,.eg-lt .eg-lt-btn::before,.eg-lt-icon,.eg-lt-arrow,.eg-lt-icon svg{'
    + 'animation:none !important;transition:none !important;'
    + '}'
    + '.eg-lt a.eg-lt-btn:hover,.eg-lt a.eg-lt-btn:focus-visible{transform:none;}'
    + '}';

  function svg(paths, filled) {
    var attrs = filled
      ? 'fill="currentColor"'
      : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
    return '<svg viewBox="0 0 24 24" ' + attrs + ' aria-hidden="true" focusable="false">' + paths + '</svg>';
  }

  function buildButton(link, hero, index) {
    var icon  = link.brand ? svg(BRANDS[link.brand], true) : svg(ICONS[link.icon], false);
    var style = '--i:' + index + (link.accent ? ';--accent:' + link.accent : '');
    var cls   = 'eg-lt-btn' + (hero ? ' eg-lt-hero' : '');
    var body  = '<span class="eg-lt-icon">' + icon + '</span>'
      + '<span class="eg-lt-text">'
      +   '<span class="eg-lt-label">' + link.title + '</span>'
      +   '<span class="eg-lt-sub">' + link.sub + '</span>'
      + '</span>';

    if (!link.href) {
      return '<li>'
        + '<div class="' + cls + '" style="' + style + '">'
        +   body
        +   '<span class="eg-lt-arrow">' + svg(ICONS.mapPin, false) + '</span>'
        + '</div>'
        + '</li>';
    }

    return '<li>'
      + '<a class="' + cls + '" href="' + link.href + '"'
      +   ' target="_blank" rel="noopener noreferrer" style="' + style + '">'
      +   body
      +   '<span class="eg-lt-arrow">' + svg(ICONS.arrow, false) + '</span>'
      +   '<span class="eg-lt-sr"> (öffnet in neuem Tab)</span>'
      + '</a>'
      + '</li>';
  }

  class EgLinktree extends HTMLElement {
    connectedCallback() {
      if (!document.getElementById('eg-linktree-styles')) {
        var style = document.createElement('style');
        style.id = 'eg-linktree-styles';
        style.textContent = CSS_LINKTREE;
        document.head.prepend(style);
      }

      var index = 0;
      var html  = GROUPS.map(function (group) {
        var buttons = group.links.map(function (link) {
          return buildButton(link, group.hero, index++);
        }).join('');

        return '<section class="eg-lt-group' + (group.hero ? ' eg-lt-group-hero' : '') + '">'
          + '<h2 class="eg-lt-title">' + group.title + '</h2>'
          + '<ul class="eg-lt-grid">' + buttons + '</ul>'
          + '</section>';
      }).join('');

      this.innerHTML =
          '<div class="eg-lt">'
        +   '<div class="eg-lt-head">'
        +     '<img src="' + LOGO_URL + '" alt="Erfindergeist Jülich" class="eg-lt-logo">'
        +     '<p class="eg-lt-tagline">Alle Links des <b>Erfindergeist Jülich e.V.</b> an einem Ort</p>'
        +   '</div>'
        +   html
        + '</div>';
    }
  }

  customElements.define('eg-linktree', EgLinktree);
}());
