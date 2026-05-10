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

  // ICS copy-to-clipboard button
  var icsCopyBtn = document.getElementById('ics-copy-btn');
  if (icsCopyBtn) {
    icsCopyBtn.addEventListener('click', function () {
      var url     = icsCopyBtn.dataset.url;
      var icon    = icsCopyBtn.querySelector('i[data-lucide]');
      var toastEl = document.getElementById('ics-toast');

      function onCopied() {
        icon.setAttribute('data-lucide', 'clipboard-check');
        if (window.lucide) lucide.createIcons({ nodes: [icon] });
        setTimeout(function () {
          icon.setAttribute('data-lucide', 'clipboard');
          if (window.lucide) lucide.createIcons({ nodes: [icon] });
        }, 2000);
        if (toastEl) {
          toastEl.classList.add('show');
          clearTimeout(toastEl._t);
          toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 3000);
        }
      }

      function fallbackCopy() {
        var ta = document.createElement('textarea');
        ta.value = url;
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        onCopied();
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(onCopied).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    });
  }

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

  // Load and render events section (max 7)
  (function loadEvents() {
    var listEl  = document.getElementById('events-list');
    var loadEl  = document.getElementById('events-loading');
    var errorEl = document.getElementById('events-error');
    var emptyEl = document.getElementById('events-empty');
    if (!listEl) return;

    var WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    var tagsConfig = null;

    function esc(s) {
      return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function pad(n) { return String(n).padStart(2, '0'); }

    // Handles both ISO-8601 ("2025-05-15T18:00:00") and ICS compact ("20250515T180000[Z]")
    function parseDate(raw) {
      if (!raw) return new Date(NaN);
      var d = new Date(raw);
      if (!isNaN(d)) return d;
      var m = String(raw).match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
      if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
      return new Date(NaN);
    }

    function parseTags(desc) {
      if (!desc) return [];
      return desc.toLowerCase().split(/\s+/).filter(function (w) { return w.startsWith('#'); });
    }
    function resolveLocation(tags, fallback) {
      if (tagsConfig && tagsConfig.location_tags) {
        for (var i = 0; i < tags.length; i++) {
          var t = tagsConfig.location_tags[tags[i]];
          if (t) return t.location || t;
        }
      }
      return fallback || '';
    }
    function resolveTagLabel(tags) {
      if (tagsConfig && tagsConfig.description_tags) {
        for (var i = 0; i < tags.length; i++) {
          var t = tagsConfig.description_tags[tags[i]];
          if (t) return t.label || null;
        }
      }
      return null;
    }

    function renderEvents(list) {
      list = list.slice(0, 7);
      if (loadEl) loadEl.remove();
      if (!list.length) { if (emptyEl) emptyEl.classList.remove('d-none'); return; }

      list.forEach(function (ev) {
        var s       = parseDate(ev.dtstart);
        var ok      = !isNaN(s);
        var weekday = ok ? WEEKDAYS[s.getDay()] : '—';
        var dateStr = ok ? pad(s.getDate()) + '.' + pad(s.getMonth() + 1) + '.' + String(s.getFullYear()).slice(2) : '';
        var timeStr = ok ? pad(s.getHours()) + ':' + pad(s.getMinutes()) : '';

        var rawTags  = parseTags(ev.description || '');
        var title    = esc(ev.title || ev.summary || '—');
        var loc      = esc(resolveLocation(rawTags, ev.location || ''));
        var tagLabel = resolveTagLabel(rawTags);

        var html = '<div class="event-card" role="listitem">'
          + '<div class="event-date-badge">'
          + '<span class="event-weekday">' + weekday + '</span>'
          + '<div class="event-badge-right">'
          + (dateStr ? '<span class="event-date">' + dateStr + '</span>' : '')
          + (timeStr ? '<span class="event-time">' + timeStr + '</span>' : '')
          + '</div>'
          + '</div>'
          + '<div class="event-info">'
          + '<p class="event-title">' + title + '</p>'
          + '<div class="event-meta">';
        if (loc)      html += '<span><i data-lucide="map-pin"></i>' + loc + '</span>';
        if (tagLabel) html += '<span class="event-tag-badge">' + esc(tagLabel) + '</span>';
        html += '</div></div></div>';
        listEl.insertAdjacentHTML('beforeend', html);
      });
      if (window.lucide) lucide.createIcons();
    }

    Promise.all([
      fetch('https://share.erfindergeist.org/config/tags.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; }),
      fetch('https://erfindergeist.org/wp-json/erfindergeist/v2/events')
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
    ]).then(function (results) {
      tagsConfig = results[0];
      var data   = results[1];
      var list   = Array.isArray(data) ? data : (data.events || data.items || []);
      renderEvents(list);
    }).catch(function () {
      if (loadEl) loadEl.remove();
      if (errorEl) errorEl.classList.remove('d-none');
    });
  }());


});
