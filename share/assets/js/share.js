if (window.lucide) { lucide.createIcons(); }

document.getElementById('theme-toggle').addEventListener('click', function () {
  var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('eg-theme', next);
});

// ── Router ────────────────────────────────────────────────────────────────────
var TAB_DEFAULT = 'downloads';
var TAB_HASHES = {
  'downloads':     'tab-downloads-trigger',
  'presentations': 'tab-presentations-trigger',
  'logos':         'tab-logos-trigger',
  'qr':            'tab-qr-trigger',
  'configs':       'tab-configs-trigger',
  'apis':          'tab-apis-trigger',
};
var TRIGGER_TO_HASH = {};
Object.keys(TAB_HASHES).forEach(function (h) { TRIGGER_TO_HASH[TAB_HASHES[h]] = h; });

function routeRead() {
  var params = new URLSearchParams(window.location.search);
  var hash   = window.location.hash.slice(1);
  return {
    tab:     TAB_HASHES[hash] ? hash : TAB_DEFAULT,
    q:       params.get('q')       || '',
    bereich: params.get('bereich') || '',
    thema:   params.get('thema')   || '',
    gruppe:  params.get('gruppe')  || '',
  };
}

function routeWrite(tab, q, bereich, thema, gruppe) {
  var params = new URLSearchParams();
  if (q)       { params.set('q',       q); }
  if (bereich) { params.set('bereich', bereich); }
  if (thema)   { params.set('thema',   thema); }
  if (gruppe)  { params.set('gruppe',  gruppe); }
  var search = params.toString() ? '?' + params.toString() : '';
  var hash   = tab !== TAB_DEFAULT ? '#' + tab : '';
  history.replaceState(null, '', (search + hash) || window.location.pathname);
}

// ── Apply initial tab from route ──────────────────────────────────────────────
var route = routeRead();
var tabTriggerEl = document.getElementById(TAB_HASHES[route.tab]);
if (tabTriggerEl) { bootstrap.Tab.getOrCreateInstance(tabTriggerEl).show(); }

var activeTab = route.tab;
document.querySelectorAll('[data-bs-toggle="tab"]').forEach(function (trigger) {
  trigger.addEventListener('shown.bs.tab', function () {
    activeTab = TRIGGER_TO_HASH[this.id] || TAB_DEFAULT;
    routeWrite(activeTab, activeQ, activeBereich, activeThema, activeGruppe);
  });
});

// ── Downloads filters ─────────────────────────────────────────────────────────
var activeQ       = route.q;
var activeBereich = route.bereich;
var activeThema   = route.thema;
var activeGruppe  = route.gruppe;

var searchEl = document.getElementById('file-search');
if (searchEl && route.q) { searchEl.value = route.q; }

function setSelectValue(id, val) {
  var el = document.getElementById(id);
  if (el && val) { el.value = val; }
}
setSelectValue('bereich-filter', route.bereich);
setSelectValue('thema-filter',   route.thema);
setSelectValue('gruppe-filter',  route.gruppe);

if (searchEl) {
  searchEl.addEventListener('input', function () {
    activeQ = this.value;
    routeWrite(activeTab, activeQ, activeBereich, activeThema, activeGruppe);
    applyDownloadFilters();
  });
}

function bindDlFilter(id, setter) {
  var el = document.getElementById(id);
  if (el) {
    el.addEventListener('change', function () {
      setter(this.value);
      routeWrite(activeTab, activeQ, activeBereich, activeThema, activeGruppe);
      applyDownloadFilters();
    });
  }
}
bindDlFilter('bereich-filter', function (v) { activeBereich = v; });
bindDlFilter('thema-filter',   function (v) { activeThema   = v; });
bindDlFilter('gruppe-filter',  function (v) { activeGruppe  = v; });

function applyDownloadFilters() {
  var q = activeQ.toLowerCase();
  document.querySelectorAll('#downloads-table tbody tr').forEach(function (row) {
    var parts        = row.dataset.folder ? row.dataset.folder.split('/') : [];
    var nameMatch    = !q || row.dataset.name.toLowerCase().includes(q)
                          || row.dataset.folder.toLowerCase().includes(q);
    var bereichMatch = !activeBereich || (parts[0] || '') === activeBereich;
    var themaMatch   = !activeThema   || (parts[1] || '') === activeThema;
    var gruppeMatch  = !activeGruppe  || (parts[2] || '') === activeGruppe;
    row.style.display = (nameMatch && bereichMatch && themaMatch && gruppeMatch) ? '' : 'none';
  });
}

if (route.q || route.bereich || route.thema || route.gruppe) {
  applyDownloadFilters();
}

// ── Copy-to-clipboard ─────────────────────────────────────────────────────────
document.querySelectorAll('.btn-copy').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var url = btn.dataset.url;
    navigator.clipboard.writeText(url).then(function () {
      var icon = btn.querySelector('[data-lucide]');
      if (!icon) { return; }
      icon.setAttribute('data-lucide', 'clipboard-check');
      lucide.createIcons({ nodes: [icon] });
      setTimeout(function () {
        icon.setAttribute('data-lucide', 'clipboard');
        lucide.createIcons({ nodes: [icon] });
      }, 2000);
    });
  });
});

// ── Scroll-to-top ─────────────────────────────────────────────────────────────
var scrollBtn = document.getElementById('scroll-top');
window.addEventListener('scroll', function () {
  scrollBtn.classList.toggle('visible', window.scrollY > 300);
});
scrollBtn.addEventListener('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
