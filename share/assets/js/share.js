if (window.lucide) { lucide.createIcons(); }

document.getElementById('theme-toggle').addEventListener('click', function () {
  var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('eg-theme', next);
});

var anchorTabMap = {
  '#presentations': 'tab-presentations-trigger',
  '#logos':         'tab-logos-trigger',
  '#qr':            'tab-qr-trigger',
  '#configs':       'tab-configs-trigger',
  '#apis':          'tab-apis-trigger'
};
var trigger = anchorTabMap[window.location.hash];
if (trigger) {
  var el = document.getElementById(trigger);
  if (el) { bootstrap.Tab.getOrCreateInstance(el).show(); }
}

var activeBereich = '';
var activeThema   = '';
var activeGruppe  = '';

document.getElementById('file-search').addEventListener('input', applyDownloadFilters);

function bindDlFilter(id, setter) {
  var el = document.getElementById(id);
  if (el) {
    el.addEventListener('change', function () { setter(this.value); applyDownloadFilters(); });
  }
}
bindDlFilter('bereich-filter', function (v) { activeBereich = v; });
bindDlFilter('thema-filter',   function (v) { activeThema   = v; });
bindDlFilter('gruppe-filter',  function (v) { activeGruppe  = v; });

function applyDownloadFilters() {
  var q = document.getElementById('file-search').value.toLowerCase();
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

var scrollBtn = document.getElementById('scroll-top');
window.addEventListener('scroll', function () {
  scrollBtn.classList.toggle('visible', window.scrollY > 300);
});
scrollBtn.addEventListener('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
