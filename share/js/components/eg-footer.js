'use strict';

(function () {
  if (customElements.get('eg-footer')) { return; }

  var SOCIAL = [
    {
      cls:   'footer-social-facebook',
      href:  'https://www.facebook.com/erfindergeistjuelich',
      label: 'Facebook (öffnet in neuem Tab)',
      svg:   '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01z"/></svg>'
    },
    {
      cls:   'footer-social-instagram',
      href:  'https://www.instagram.com/erfindergeistjuelich/',
      label: 'Instagram (öffnet in neuem Tab)',
      svg:   '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12c0 3.259.014 3.668.072 4.948.059 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24c3.259 0 3.668-.014 4.948-.072 1.277-.059 2.148-.261 2.913-.558.788-.306 1.459-.717 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.689.072-4.948 0-3.259-.014-3.667-.072-4.947-.059-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>'
    },
    {
      cls:   'footer-social-linkedin',
      href:  'https://www.linkedin.com/company/erfindergeist-j%C3%BClich-e-v/',
      label: 'LinkedIn (öffnet in neuem Tab)',
      svg:   '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>'
    },
    {
      cls:   'footer-social-github',
      href:  'https://github.com/ErfindergeistJuelichOfficial',
      label: 'GitHub (öffnet in neuem Tab)',
      svg:   '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>'
    },
    {
      cls:   'footer-social-mastodon',
      href:  'https://social.erfindergeist.org/@verein',
      label: 'Mastodon (öffnet in neuem Tab)',
      svg:   '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/></svg>'
    }
  ];

  var CSS_FOOTER = '.eg-footer{'
    + 'background:var(--color-surface);'
    + 'border-top:2px solid var(--color-border);'
    + 'color:var(--color-text);'
    + '}'
    + '.footer-logo{height:36px;width:auto;}'
    + '[data-theme="dark"] .footer-logo{filter:brightness(1.3);}'
    + '@media(max-width:575.98px){.eg-footer{padding-bottom:2rem !important;}}'
    + '.footer-top{'
    + 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;'
    + '}'
    + '.footer-brand{display:flex;align-items:center;gap:.75rem;}'
    + '.footer-brand-name{'
    + 'color:var(--color-text);text-decoration:none;font-weight:600;font-size:.95rem;transition:color .2s;'
    + '}'
    + '.footer-brand-name:hover{color:var(--color-primary);}'
    + '.footer-social{display:flex;gap:.45rem;}'
    + '.footer-social-btn{'
    + 'width:40px;height:40px;border-radius:50%;border:1.5px solid var(--color-border);'
    + 'display:inline-flex;align-items:center;justify-content:center;'
    + 'color:var(--color-text-muted);text-decoration:none;flex-shrink:0;'
    + 'transition:background .2s,border-color .2s,color .2s,transform .15s;'
    + '}'
    + '.footer-social-btn svg{width:18px;height:18px;display:block;}'
    + '.footer-social-btn:hover{transform:translateY(-3px);}'
    + '.footer-social-facebook:hover{background:#1877F2;border-color:#1877F2;color:#fff;}'
    + '.footer-social-instagram:hover{background:#E4405F;border-color:#E4405F;color:#fff;}'
    + '.footer-social-linkedin:hover{background:#0A66C2;border-color:#0A66C2;color:#fff;}'
    + '.footer-social-github:hover{background:#24292e;border-color:#24292e;color:#fff;}'
    + '.footer-social-mastodon:hover{background:#6364FF;border-color:#6364FF;color:#fff;}'
    + '[data-theme="dark"] .footer-social-github:hover{background:#e6edf3;border-color:#e6edf3;color:#24292e;}'
    + '.footer-divider{border-color:var(--color-border);opacity:1;margin:1.5rem 0;}'
    + '.footer-col-title{'
    + 'font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;'
    + 'color:var(--color-primary);margin-bottom:.7rem;'
    + '}'
    + '.footer-col-links{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.35rem;}'
    + '.footer-col-links a{'
    + 'color:var(--color-text-muted);text-decoration:none;font-size:.83rem;'
    + 'display:flex;align-items:center;gap:.3rem;line-height:1.3;transition:color .15s;'
    + '}'
    + '.footer-col-links a:hover{color:var(--color-primary);}'
    + '.footer-bottom{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem;}'
    + '.footer-legal{display:flex;flex-wrap:wrap;gap:.35rem 1.1rem;align-items:center;}'
    + '.footer-legal a{color:var(--color-text-muted);text-decoration:none;font-size:.8rem;transition:color .15s;}'
    + '.footer-legal a:hover{color:var(--color-primary);}'
    + '.footer-copyright{font-size:.8rem;color:var(--color-text-muted);}'
    + '@media(max-width:767px){'
    + '.footer-bottom{flex-direction:column;align-items:flex-start;gap:.5rem;}'
    + '.footer-copyright{align-self:flex-end;}'
    + '}';

  class EgFooter extends HTMLElement {
    connectedCallback() {
      var slotHtml = this.innerHTML.trim();
      var year     = new Date().getFullYear();

      if (!document.getElementById('eg-footer-styles')) {
        var style = document.createElement('style');
        style.id = 'eg-footer-styles';
        style.textContent = CSS_FOOTER;
        document.head.prepend(style);
      }

      var socialHtml = SOCIAL.map(function (s) {
        return '<a href="' + s.href + '" class="footer-social-btn ' + s.cls + '"'
          + ' target="_blank" rel="noopener noreferrer" aria-label="' + s.label + '">'
          + s.svg + '</a>';
      }).join('');

      var colsSection = slotHtml
        ? '<div class="row g-4 footer-cols mb-2">' + slotHtml + '</div>'
          + '<hr class="footer-divider">'
        : '';

      this.innerHTML =
          '<footer class="eg-footer pt-5 pb-4" role="contentinfo">'
        +   '<div class="container">'
        +     '<div class="footer-top">'
        +       '<div class="footer-brand">'
        +         '<img src="https://share.erfindergeist.org/img/logo.svg"'
        +           ' alt="Erfindergeist Jülich" class="footer-logo">'
        +         '<a href="https://erfindergeist.org" target="_blank" rel="noopener noreferrer"'
        +           ' class="footer-brand-name">Erfindergeist Jülich e.V.</a>'
        +       '</div>'
        +       '<nav class="footer-social" aria-label="Soziale Medien">'
        +         socialHtml
        +       '</nav>'
        +     '</div>'
        +     '<hr class="footer-divider">'
        +     colsSection
        +     '<div class="footer-bottom">'
        +       '<nav class="footer-legal" aria-label="Rechtliche Links">'
        +         '<a href="https://erfindergeist.org/impressum/"'
        +           ' target="_blank" rel="noopener noreferrer">Impressum</a>'
        +         '<a href="https://erfindergeist.org/kontakt/"'
        +           ' target="_blank" rel="noopener noreferrer">Kontakt</a>'
        +         '<a href="https://erfindergeist.org/datenschutz/"'
        +           ' target="_blank" rel="noopener noreferrer">Datenschutz</a>'
        +         '<a href="https://erfindergeist.org/eu-cookie-richtlinie/"'
        +           ' target="_blank" rel="noopener noreferrer">EU-Cookie-Richtlinie</a>'
        +         '<a href="https://erfindergeist.org/linktree/"'
        +           ' target="_blank" rel="noopener noreferrer">Linktree</a>'
        +       '</nav>'
        +       '<span class="footer-copyright">© ' + year + ' Erfindergeist Jülich e.V.</span>'
        +     '</div>'
        +   '</div>'
        + '</footer>';
    }
  }

  customElements.define('eg-footer', EgFooter);
}());
