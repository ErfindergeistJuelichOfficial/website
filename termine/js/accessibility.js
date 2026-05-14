'use strict';

function setFontScale(scale) {
  document.documentElement.style.setProperty('--font-scale', scale);
  localStorage.setItem('fontScale', scale);
  document.querySelectorAll('.a11y-font-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.scale) === parseFloat(scale));
  });
}

function setHighContrast(on) {
  document.documentElement.classList.toggle('high-contrast', on);
  localStorage.setItem('highContrast', on ? '1' : '0');
  document.querySelectorAll('.a11y-contrast-btn').forEach(btn => {
    btn.classList.toggle('active', (btn.dataset.contrast === 'high') === on);
  });
}

function setReduceMotion(reduce) {
  document.documentElement.classList.toggle('reduce-motion', reduce);
  localStorage.setItem('reduceMotion', reduce ? '1' : '0');
  document.querySelectorAll('.a11y-motion-btn').forEach(btn => {
    btn.classList.toggle('active', (btn.dataset.motion === 'off') === reduce);
  });
}

function openA11yPanel() {
  const panel = document.getElementById('a11y-panel');
  const btn = document.getElementById('a11y-btn');
  if (!panel) { return; }
  panel.removeAttribute('hidden');
  panel.classList.add('open');
  btn.setAttribute('aria-expanded', 'true');
  const first = panel.querySelector('button:not([disabled]), [tabindex="0"]');
  if (first) { first.focus(); }
}

function closeA11yPanel() {
  const panel = document.getElementById('a11y-panel');
  const btn = document.getElementById('a11y-btn');
  if (!panel) { return; }
  panel.classList.remove('open');
  panel.setAttribute('hidden', '');
  btn.setAttribute('aria-expanded', 'false');
  btn.focus();
}

function initAccessibility() {
  // Restore font scale
  const scale = parseFloat(localStorage.getItem('fontScale')) || 1;
  setFontScale(scale);

  // Restore high contrast
  if (localStorage.getItem('highContrast') === '1') { setHighContrast(true); }

  // Restore reduce motion (also respect OS setting)
  const systemReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const savedReduce = localStorage.getItem('reduceMotion');
  const reduce = savedReduce !== null ? savedReduce === '1' : systemReduce;
  if (reduce) { setReduceMotion(true); }

  // Panel toggle
  document.getElementById('a11y-btn')?.addEventListener('click', () => {
    const panel = document.getElementById('a11y-panel');
    panel?.classList.contains('open') ? closeA11yPanel() : openA11yPanel();
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('a11y-panel')?.classList.contains('open')) {
      closeA11yPanel();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', e => {
    const toolbar = document.getElementById('a11y-toolbar');
    if (toolbar && !toolbar.contains(e.target) && document.getElementById('a11y-panel')?.classList.contains('open')) {
      closeA11yPanel();
    }
  });

  // Font size buttons
  document.querySelectorAll('.a11y-font-btn').forEach(btn => {
    btn.addEventListener('click', () => setFontScale(parseFloat(btn.dataset.scale)));
  });

  // Contrast buttons
  document.querySelectorAll('.a11y-contrast-btn').forEach(btn => {
    btn.addEventListener('click', () => setHighContrast(btn.dataset.contrast === 'high'));
  });

  // Motion buttons
  document.querySelectorAll('.a11y-motion-btn').forEach(btn => {
    btn.addEventListener('click', () => setReduceMotion(btn.dataset.motion === 'off'));
  });
}
