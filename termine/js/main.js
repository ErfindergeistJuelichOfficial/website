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
      var icon    = icsCopyBtn.querySelector('[data-lucide]');
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

  // Load and render /tomorrow preview inside the endpoint card
  (function loadTomorrow() {
    var preview = document.getElementById('tomorrow-preview');
    if (!preview) return;

    fetch('https://erfindergeist.org/wp-json/erfindergeist/v2/tomorrow')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var isEmpty = !data || (Array.isArray(data) ? !data.length : !data.title && !data.summary);
        var key     = isEmpty ? 'plugin.tomorrow.empty' : 'plugin.tomorrow.found';

        var state = document.createElement('span');
        state.className = 'tomorrow-state';
        state.setAttribute('data-i18n', key);
        state.textContent = window.t(key);
        preview.appendChild(state);

        if (!isEmpty) {
          var item  = Array.isArray(data) ? data[0] : data;
          var title = item.title || item.summary || '';
          if (title) {
            var titleEl = document.createElement('div');
            titleEl.className = 'tomorrow-title';
            titleEl.textContent = title;
            preview.appendChild(titleEl);
          }
        }
      })
      .catch(function () {});
  }());

  // Load /events preview inside the endpoint card
  (function loadEventsPreview() {
    var preview = document.getElementById('events-endpoint-preview');
    if (!preview) return;

    fetch('https://erfindergeist.org/wp-json/erfindergeist/v2/events')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var list  = Array.isArray(data) ? data : (data.events || data.items || []);
        var count = list.length;

        var hint = document.createElement('div');
        hint.className = 'tomorrow-state';
        hint.setAttribute('data-i18n', 'plugin.events.hint');
        hint.textContent = window.t('plugin.events.hint');
        preview.appendChild(hint);

        if (count > 0) {
          var countEl = document.createElement('div');
          countEl.className = 'tomorrow-title mt-1';
          var countLabel = document.createElement('span');
          countLabel.setAttribute('data-i18n', 'plugin.events.count.label');
          countLabel.textContent = window.t('plugin.events.count.label');
          countEl.textContent = count + ' ';
          countEl.appendChild(countLabel);
          preview.appendChild(countEl);
        }

        if (count >= 3) {
          var third      = list[2];
          var thirdTitle = third.title || third.summary || '?';

          var details  = document.createElement('details');
          details.className = 'events-challenge';

          var summary  = document.createElement('summary');
          summary.setAttribute('data-i18n', 'plugin.events.challenge');
          summary.textContent = window.t('plugin.events.challenge');
          details.appendChild(summary);

          var solution = document.createElement('div');
          solution.className = 'events-challenge-solution';
          solution.textContent = thirdTitle;
          details.appendChild(solution);

          preview.appendChild(details);
        }
      })
      .catch(function () {});
  }());

  // Load and render events section (max 7)
  (function loadEvents() {
    var listEl       = document.getElementById('events-list');
    var loadEl       = document.getElementById('events-loading');
    var errorEl      = document.getElementById('events-error');
    var emptyEl      = document.getElementById('events-empty');
    var jsonPanel    = document.getElementById('events-json-panel');
    var jsonEditor   = document.getElementById('events-json-editor');
    var jsonErrorEl  = document.getElementById('events-json-error');
    var jsonResetBtn = document.getElementById('events-json-reset');
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
      var matches = String(desc).toLowerCase().match(/#[a-zäöüß0-9]+/g);
      return matches || [];
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
    function resolveTagDescription(tags) {
      if (tagsConfig && tagsConfig.description_tags) {
        for (var i = 0; i < tags.length; i++) {
          var t = tagsConfig.description_tags[tags[i]];
          if (t && t.description) return t.description;
        }
      }
      return null;
    }

    function toEditorEvent(ev) {
      var rawTags = parseTags(ev.description || '');
      return {
        titel:        ev.title || ev.summary || '',
        start:        ev.dtstart || '',
        ort:          resolveLocation(rawTags, ev.location || ''),
        beschreibung: resolveTagDescription(rawTags) || '',
      };
    }

    function renderEventCards(list) {
      listEl.innerHTML = '';
      list.slice(0, 3).forEach(function (ev) {
        var s       = parseDate(ev.start || ev.dtstart);
        var ok      = !isNaN(s);
        var weekday = ok ? WEEKDAYS[s.getDay()] : '—';
        var dateStr = ok ? pad(s.getDate()) + '.' + pad(s.getMonth() + 1) + '.' + String(s.getFullYear()).slice(2) : '';
        var timeStr = ok ? pad(s.getHours()) + ':' + pad(s.getMinutes()) : '';

        var rawTags  = parseTags(ev.description || '');
        var title    = esc(ev.titel || ev.title || ev.summary || '—');
        var loc      = esc(ev.ort || resolveLocation(rawTags, ev.location || ''));
        var tagDesc  = ev.beschreibung || resolveTagDescription(rawTags) || null;

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
          + (tagDesc ? '<p class="event-desc">' + esc(tagDesc) + '</p>' : '')
          + '<div class="event-meta">';
        if (loc) html += '<span><i data-lucide="map-pin"></i>' + loc + '</span>';
        html += '</div></div></div>';
        listEl.insertAdjacentHTML('beforeend', html);
      });
      if (window.lucide) lucide.createIcons({ nodes: [listEl] });
    }

    function renderEvents(list) {
      if (loadEl) loadEl.remove();
      if (!list.length) { if (emptyEl) emptyEl.classList.remove('d-none'); return; }
      renderEventCards(list);
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

      if (jsonPanel && jsonEditor) {
        var editorList   = list.slice(0, 3).map(toEditorEvent);
        var originalJson = JSON.stringify(editorList, null, 2);
        jsonEditor.value = originalJson;
        jsonPanel.classList.remove('d-none');

        jsonEditor.addEventListener('input', function () {
          try {
            var parsed  = JSON.parse(jsonEditor.value);
            var newList = Array.isArray(parsed) ? parsed : (parsed.events || parsed.items || []);
            jsonEditor.classList.remove('is-invalid');
            jsonErrorEl.textContent = '';
            jsonErrorEl.classList.add('d-none');
            renderEventCards(newList);
          } catch (e) {
            jsonEditor.classList.add('is-invalid');
            jsonErrorEl.textContent = e.message;
            jsonErrorEl.classList.remove('d-none');
          }
        });

        if (jsonResetBtn) {
          jsonResetBtn.addEventListener('click', function () {
            jsonEditor.value = originalJson;
            jsonEditor.classList.remove('is-invalid');
            jsonErrorEl.textContent = '';
            jsonErrorEl.classList.add('d-none');
            renderEventCards(list);
          });
        }
      }
    }).catch(function () {
      if (loadEl) loadEl.remove();
      if (errorEl) errorEl.classList.remove('d-none');
    });
  }());


});
