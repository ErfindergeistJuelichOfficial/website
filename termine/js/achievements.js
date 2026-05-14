'use strict';

(function () {
  var DEFS = [
    { id: 'bell-click', icon: 'bell'       },
    { id: 'bell-spin',  icon: 'refresh-cw' },
    { id: 'ics-solved', icon: 'calendar'   },
    { id: 'rocket',     icon: 'send'       },
    { id: 'show-me',    icon: 'link'       },
    { id: 'zap',        icon: 'zap'        },
    { id: 'json-edit',  icon: 'code-2'     },
  ];

  var RANKS_DE = [
    'Noch nichts entdeckt',
    'Neugieriger Entdecker',
    'Erfahrener Entdecker',
    'Meister-Entdecker',
    'Erfindergeist-Legende',
  ];
  var RANKS_EN = [
    'Nothing discovered yet',
    'Curious Explorer',
    'Experienced Explorer',
    'Master Explorer',
    'Erfindergeist Legend',
  ];

  var PREFIX = 'eg-ach-';
  var TOTAL  = DEFS.length;

  function isUnlocked(id) { return localStorage.getItem(PREFIX + id) === '1'; }
  function setUnlocked(id) { localStorage.setItem(PREFIX + id, '1'); }

  function count() {
    return DEFS.filter(function (d) { return isUnlocked(d.id); }).length;
  }

  function rankIndex(n) {
    if (n === 0)       { return 0; }
    if (n <= 2)        { return 1; }
    if (n <= 4)        { return 2; }
    if (n < TOTAL)     { return 3; }
    return 4;
  }

  function updateCounter() {
    var n    = count();
    var lang = (typeof currentLang !== 'undefined' ? currentLang : 'de');
    var ranks = lang === 'en' ? RANKS_EN : RANKS_DE;

    var countEl = document.getElementById('achievements-count');
    var rankEl  = document.getElementById('achievements-rank');
    var stars   = document.querySelectorAll('.ach-star');

    if (countEl) { countEl.textContent = n; }
    if (rankEl)  { rankEl.textContent  = ranks[rankIndex(n)]; }

    stars.forEach(function (star, i) {
      star.classList.toggle('ach-star--filled', i < n);
    });
  }

  function updateCard(id) {
    var card = document.querySelector('[data-achievement="' + id + '"]');
    if (!card) { return; }
    card.classList.remove('achievement-locked');
    card.classList.add('achievement-unlocked');
    if (window.lucide) { lucide.createIcons({ nodes: [card] }); }
  }

  function showToast(id) {
    var key  = 'achievement.' + id.replace(/-/g, '_') + '.name';
    var name = (window.t && window.t(key)) || id;

    var toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    var icon = document.createElement('i');
    icon.setAttribute('data-lucide', 'star');
    icon.setAttribute('aria-hidden', 'true');
    toast.appendChild(icon);

    var text = document.createElement('span');
    var lang = (typeof currentLang !== 'undefined' ? currentLang : 'de');
    var prefix = lang === 'en' ? 'Achievement unlocked: ' : 'Errungenschaft: ';
    text.textContent = prefix + name;
    toast.appendChild(text);

    document.body.appendChild(toast);
    if (window.lucide) { lucide.createIcons({ nodes: [toast] }); }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toast.classList.add('achievement-toast--visible');
      });
    });

    setTimeout(function () {
      toast.classList.remove('achievement-toast--visible');
      setTimeout(function () {
        if (toast.parentNode) { toast.parentNode.removeChild(toast); }
      }, 400);
    }, 3500);
  }

  function unlock(id) {
    if (isUnlocked(id)) { return; }
    setUnlocked(id);
    updateCard(id);
    updateCounter();
    showToast(id);
  }

  function init() {
    DEFS.forEach(function (def) {
      if (isUnlocked(def.id)) { updateCard(def.id); }
    });
    updateCounter();
  }

  function reset() {
    DEFS.forEach(function (def) { localStorage.removeItem(PREFIX + def.id); });
    document.querySelectorAll('.achievement-card').forEach(function (card) {
      card.classList.remove('achievement-unlocked');
      card.classList.add('achievement-locked');
    });
    updateCounter();
  }

  function init() {
    DEFS.forEach(function (def) {
      if (isUnlocked(def.id)) { updateCard(def.id); }
    });
    updateCounter();
    var resetBtn = document.getElementById('achievements-reset');
    if (resetBtn) { resetBtn.addEventListener('click', reset); }
  }

  window.achievements = { unlock: unlock, init: init, reset: reset };
  document.addEventListener('DOMContentLoaded', init);
}());
