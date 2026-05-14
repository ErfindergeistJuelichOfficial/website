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

document.getElementById('file-search').addEventListener('input', function () {
  var q = this.value.toLowerCase();
  document.querySelectorAll('.file-item').forEach(function (item) {
    var name = item.querySelector('.file-name').textContent.toLowerCase();
    item.style.display = name.includes(q) ? '' : 'none';
  });
});

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
