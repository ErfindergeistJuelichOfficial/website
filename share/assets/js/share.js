if (window.lucide) { lucide.createIcons(); }

// ── Theme toggle ──────────────────────────────────────────────────────────────
$('#theme-toggle').on('click', function () {
  var next = $('html').attr('data-theme') === 'dark' ? 'light' : 'dark';
  $('html').attr('data-theme', next);
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
$.each(TAB_HASHES, function (h, id) { TRIGGER_TO_HASH[id] = h; });

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
var route     = routeRead();
var activeTab = route.tab;
var tabEl     = document.getElementById(TAB_HASHES[route.tab]);
if (tabEl) { bootstrap.Tab.getOrCreateInstance(tabEl).show(); }

$('[data-bs-toggle="tab"]').on('shown.bs.tab', function () {
  activeTab = TRIGGER_TO_HASH[this.id] || TAB_DEFAULT;
  routeWrite(activeTab, activeQ, activeBereich, activeThema, activeGruppe);
});

// ── Downloads filters ─────────────────────────────────────────────────────────
var activeQ       = route.q;
var activeBereich = route.bereich;
var activeThema   = route.thema;
var activeGruppe  = route.gruppe;

if (route.q)       { $('#file-search').val(route.q); }
if (route.bereich) { $('#bereich-filter').val(route.bereich); }
if (route.thema)   { $('#thema-filter').val(route.thema); }
if (route.gruppe)  { $('#gruppe-filter').val(route.gruppe); }

function updateClearButton() {
  $('#clear-filters').toggle(!!(activeQ || activeBereich || activeThema || activeGruppe));
}

$('#file-search').on('input', function () {
  activeQ = $(this).val();
  routeWrite(activeTab, activeQ, activeBereich, activeThema, activeGruppe);
  applyDownloadFilters();
  updateClearButton();
});

$('#bereich-filter').on('change', function () {
  activeBereich = $(this).val();
  routeWrite(activeTab, activeQ, activeBereich, activeThema, activeGruppe);
  applyDownloadFilters();
  updateClearButton();
});

$('#thema-filter').on('change', function () {
  activeThema = $(this).val();
  routeWrite(activeTab, activeQ, activeBereich, activeThema, activeGruppe);
  applyDownloadFilters();
  updateClearButton();
});

$('#gruppe-filter').on('change', function () {
  activeGruppe = $(this).val();
  routeWrite(activeTab, activeQ, activeBereich, activeThema, activeGruppe);
  applyDownloadFilters();
  updateClearButton();
});

$('#clear-filters').on('click', function () {
  activeQ = ''; activeBereich = ''; activeThema = ''; activeGruppe = '';
  $('#file-search').val('');
  $('#bereich-filter, #thema-filter, #gruppe-filter').val('');
  routeWrite(activeTab, '', '', '', '');
  applyDownloadFilters();
  updateClearButton();
});

function applyDownloadFilters() {
  var q = activeQ.toLowerCase();
  $('#downloads-table tbody tr').each(function () {
    var folder       = $(this).data('folder') || '';
    var name         = $(this).data('name')   || '';
    var parts        = folder ? folder.split('/') : [];
    var nameMatch    = !q || name.toLowerCase().includes(q) || folder.toLowerCase().includes(q);
    var bereichMatch = !activeBereich || (parts[0] || '') === activeBereich;
    var themaMatch   = !activeThema   || (parts[1] || '') === activeThema;
    var gruppeMatch  = !activeGruppe  || (parts[2] || '') === activeGruppe;
    $(this).toggle(nameMatch && bereichMatch && themaMatch && gruppeMatch);
  });
}

if (route.q || route.bereich || route.thema || route.gruppe) {
  applyDownloadFilters();
}
updateClearButton();

// ── Copy-to-clipboard ─────────────────────────────────────────────────────────
$('.btn-copy').on('click', function () {
  var $btn = $(this);
  navigator.clipboard.writeText($btn.data('url')).then(function () {
    var icon = $btn.find('[data-lucide]').get(0);
    if (!icon) { return; }
    icon.setAttribute('data-lucide', 'clipboard-check');
    lucide.createIcons({ nodes: [icon] });
    setTimeout(function () {
      icon.setAttribute('data-lucide', 'clipboard');
      lucide.createIcons({ nodes: [icon] });
    }, 2000);
  });
});

// ── Scroll-to-top ─────────────────────────────────────────────────────────────
$(window).on('scroll', function () {
  $('#scroll-top').toggleClass('visible', $(window).scrollTop() > 300);
});
$('#scroll-top').on('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
