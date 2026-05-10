'use strict';

$(document).ready(function () {

  // Init all modules
  initTheme();
  initI18n();
  initAccessibility();
  initAnimations();

  // Init Lucide icons
  if (window.lucide) lucide.createIcons();

  // Theme toggle
  $('#theme-toggle').on('click', function () {
    toggleTheme();
    if (window.lucide) lucide.createIcons();
  });

  // Language dropdown
  $(document).on('click', '.lang-option', function () {
    applyTranslations($(this).data('lang'));
  });

  // Scroll-to-top button
  $('#scroll-top').on('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.blur();
  });

  // Smooth scroll for all anchor links (offset for sticky navbar)
  $(document).on('click', 'a[href^="#"]', function (e) {
    const id = this.getAttribute('href');
    if (id === '#') return;
    const target = $(id);
    if (!target.length) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 72;
    $('html, body').animate({ scrollTop: target.offset().top - offset }, 550, 'swing');
    // Close mobile collapse
    const nc = document.getElementById('navbarCollapse');
    if (nc) {
      const instance = bootstrap.Collapse.getInstance(nc);
      if (instance) instance.hide();
    }
  });

  // Active nav-link tracking on scroll
  const $sections = $('section[id]');
  function updateActiveNav() {
    const scrollY = $(window).scrollTop() + 100;
    $sections.each(function () {
      const top    = $(this).offset().top;
      const bottom = top + $(this).outerHeight();
      const id     = $(this).attr('id');
      if (scrollY >= top && scrollY < bottom) {
        $('.nav-link').removeClass('active').removeAttr('aria-current');
        $(`.nav-link[href="#${id}"]`).addClass('active').attr('aria-current', 'true');
      }
    });
  }
  $(window).on('scroll.navtrack', updateActiveNav);
  updateActiveNav();

  // Navbar shrink on scroll
  $(window).on('scroll.navbar', function () {
    $('#main-nav').toggleClass('scrolled', $(this).scrollTop() > 30);
  });

  // Live JSON example — first 2 real events, mock fallback
  (function loadJsonExample() {
    const el = document.getElementById('json-example-code');
    if (!el) return;

    function formatDt(raw) {
      if (!raw) return '';
      var d = new Date(raw);
      if (isNaN(d)) return raw;
      var pad = function (n) { return String(n).padStart(2, '0'); };
      return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear()
        + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function render(events) {
      var two = events.slice(0, 2).map(function (e) {
        return {
          title:     e.title    || e.summary || '',
          startDate: formatDt(e.dtstart),
          endDate:   formatDt(e.dtend),
          location:  e.location || ''
        };
      });
      el.textContent = JSON.stringify({ events: two }, null, 2);
    }

    fetch('https://erfindergeist.org/wp-json/erfindergeist/v2/events')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        var list = Array.isArray(data) ? data : (data.events || data.items || []);
        if (list.length) render(list);
      })
      .catch(function () { /* keep mocked data already in the DOM */ });
  }());

});
