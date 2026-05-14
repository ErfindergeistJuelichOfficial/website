'use strict';

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  const btn = document.getElementById('theme-toggle');
  if (!btn) { return; }

  const icon = btn.querySelector('[data-lucide]');
  if (icon) {
    icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    if (window.lucide) { lucide.createIcons({ nodes: [icon] }); }
  }

  const isDark = theme === 'dark';
  btn.setAttribute(
    'aria-label',
    isDark
      ? (window.t ? window.t('nav.toggle.light') : 'Helles Design aktivieren')
      : (window.t ? window.t('nav.toggle.dark') : 'Dunkles Design aktivieren')
  );
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(saved || preferred);
}
