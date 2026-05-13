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

  // Shared copy-to-clipboard helper
  var copyToastEl  = document.getElementById('copy-toast');
  var copyToastTxt = document.getElementById('copy-toast-text');

  function showCopyToast(textKey) {
    if (!copyToastEl || !copyToastTxt) return;
    copyToastTxt.textContent = window.t(textKey);
    copyToastEl.classList.add('show');
    clearTimeout(copyToastEl._t);
    copyToastEl._t = setTimeout(function () { copyToastEl.classList.remove('show'); }, 3000);
  }

  function copyToClipboard(url, textKey, btn) {
    function onCopied() {
      if (btn) {
        var icon = btn.querySelector('[data-lucide]');
        if (icon) {
          icon.setAttribute('data-lucide', 'clipboard-check');
          if (window.lucide) lucide.createIcons({ nodes: [icon] });
          setTimeout(function () {
            icon.setAttribute('data-lucide', 'clipboard');
            if (window.lucide) lucide.createIcons({ nodes: [icon] });
          }, 2000);
        }
      }
      showCopyToast(textKey);
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = url;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      onCopied();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(onCopied).catch(fallback);
    } else {
      fallback();
    }
  }

  // ICS copy-to-clipboard button
  var icsCopyBtn = document.getElementById('ics-copy-btn');
  if (icsCopyBtn) {
    icsCopyBtn.addEventListener('click', function () {
      copyToClipboard(icsCopyBtn.dataset.url, 'ics.toast.text', icsCopyBtn);
    });
  }

  // PDF copy-to-clipboard buttons
  document.querySelectorAll('.pdf-copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      copyToClipboard(btn.dataset.url, 'downloads.copy.text', btn);
    });
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

  // PDF countdown flip clock — next Monday 03:00 UTC (GitHub Actions schedule)
  (function initPdfCountdown() {
    if (!document.getElementById('flip-d')) return;

    function nextRun() {
      var now  = new Date();
      var day  = now.getUTCDay();
      var diff = (1 - day + 7) % 7;
      if (diff === 0 && (now.getUTCHours() > 3 || (now.getUTCHours() === 3 && now.getUTCMinutes() > 0))) {
        diff = 7;
      }
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff, 3, 0, 0, 0));
    }

    function pad(n) { return String(n).padStart(2, '0'); }

    function makeUnit(id) {
      var card  = document.getElementById(id);
      if (!card) return function() {};
      var upper = card.querySelector('.flip-upper .flip-digit');
      var lower = card.querySelector('.flip-lower .flip-digit');
      var top   = card.querySelector('.flip-top .flip-digit');
      var btm   = card.querySelector('.flip-btm .flip-digit');
      var prev  = null;

      return function set(val) {
        if (val === prev) return;
        if (prev === null) {
          upper.textContent = lower.textContent = val;
          prev = val;
          return;
        }
        var noAnim = document.documentElement.classList.contains('reduce-motion') ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (noAnim) {
          upper.textContent = lower.textContent = val;
          prev = val;
          return;
        }
        top.textContent = prev;
        btm.textContent = val;
        upper.textContent = val; // hidden by flip-top during animation, reveals in sync when it folds away
        card.classList.remove('flipping');
        void card.offsetWidth;
        card.classList.add('flipping');
        setTimeout(function () {
          lower.textContent = val; // update just before flip-btm snaps back to hidden
          card.classList.remove('flipping');
        }, 560); // 270ms + 270ms animations + tiny buffer
        prev = val;
      };
    }

    var setD = makeUnit('flip-d');
    var setH = makeUnit('flip-h');
    var setM = makeUnit('flip-m');
    var setS = makeUnit('flip-s');

    function tick() {
      var ms = nextRun() - new Date();
      if (ms <= 0) return;
      var s = Math.floor(ms / 1000);
      var m = Math.floor(s / 60); s %= 60;
      var h = Math.floor(m / 60); m %= 60;
      var d = Math.floor(h / 24); h %= 24;
      setD(String(d));
      setH(pad(h));
      setM(pad(m));
      setS(pad(s));
    }

    tick();
    setInterval(tick, 1000);
  }());

  // ICS puzzle — read DTSTART:20250515T180000Z
  (function initIcsPuzzle() {
    var puzzle = document.getElementById('ics-puzzle');
    if (!puzzle) return;

    var ANSWER  = { year: 2025, month: 5, day: 15, hour: 18, minute: 0 };
    var INITIAL = { year: 2024, month: 1,  day: 1,  hour: 0,  minute: 0 };
    var state   = Object.assign({}, INITIAL);
    var solved  = false;

    var successEl = document.getElementById('ics-puzzle-success');
    var resetBtn  = document.getElementById('ics-puzzle-reset');

    function pad(n) { return String(n).padStart(2, '0'); }

    function render() {
      puzzle.querySelector('[data-field="year"] .spinner-val').textContent   = String(state.year);
      puzzle.querySelector('[data-field="month"] .spinner-val').textContent  = pad(state.month);
      puzzle.querySelector('[data-field="day"] .spinner-val').textContent    = pad(state.day);
      puzzle.querySelector('[data-field="hour"] .spinner-val').textContent   = pad(state.hour);
      puzzle.querySelector('[data-field="minute"] .spinner-val').textContent = pad(state.minute);
    }

    function wrap(val, min, max) {
      if (val < min) return max;
      if (val > max) return min;
      return val;
    }

    function step(field, dir) {
      if (solved) return;
      var el  = puzzle.querySelector('[data-field="' + field + '"]');
      state[field] = wrap(state[field] + dir, +el.dataset.min, +el.dataset.max);
      render();
      check();
    }

    function check() {
      if (solved) return;
      var ok = Object.keys(ANSWER).every(function(k) { return state[k] === ANSWER[k]; });
      if (!ok) return;
      solved = true;
      puzzle.classList.add('solved');
      successEl.classList.remove('d-none');
      resetBtn.classList.remove('d-none');
      if (window.lucide) lucide.createIcons({ nodes: [successEl] });
      var noAnim = document.documentElement.classList.contains('reduce-motion') ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (window.gsap && !noAnim) {
        gsap.fromTo(puzzle, { scale: 1 }, { scale: 1.018, repeat: 1, yoyo: true, duration: .2, ease: 'power2.inOut' });
        gsap.from(successEl, { opacity: 0, y: 10, duration: .4, ease: 'power2.out' });
        gsap.from(resetBtn,  { opacity: 0, duration: .3, delay: .25 });
      }
    }

    function reset() {
      solved  = false;
      state   = Object.assign({}, INITIAL);
      puzzle.classList.remove('solved');
      successEl.classList.add('d-none');
      resetBtn.classList.add('d-none');
      render();
    }

    // Spinner interaction with long-press acceleration
    puzzle.querySelectorAll('.spinner-btn').forEach(function(btn) {
      var holdTimeout = null;
      var holdInterval = null;

      function doStep() {
        var field = btn.closest('[data-field]').dataset.field;
        step(field, btn.classList.contains('spinner-up') ? 1 : -1);
      }
      function stopHold() {
        clearTimeout(holdTimeout);
        clearInterval(holdInterval);
        holdTimeout = holdInterval = null;
      }

      btn.addEventListener('pointerdown', function(e) {
        e.preventDefault();
        doStep();
        holdTimeout = setTimeout(function() {
          holdInterval = setInterval(doStep, 90);
        }, 380);
      });
      btn.addEventListener('pointerup',     stopHold);
      btn.addEventListener('pointerleave',  stopHold);
      btn.addEventListener('pointercancel', stopHold);
    });

    // Mouse wheel on spinner
    puzzle.querySelectorAll('[data-field]').forEach(function(el) {
      el.addEventListener('wheel', function(e) {
        e.preventDefault();
        step(el.dataset.field, e.deltaY < 0 ? 1 : -1);
      }, { passive: false });
    });

    if (resetBtn) resetBtn.addEventListener('click', reset);

    render();
  }());

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

          var details = document.createElement('details');
          details.className = 'events-challenge';

          var summary = document.createElement('summary');

          var qText = document.createElement('span');
          qText.className = 'events-challenge-q';
          qText.setAttribute('data-i18n', 'plugin.events.challenge');
          qText.textContent = window.t('plugin.events.challenge');

          var qMark = document.createElement('span');
          qMark.className = 'events-challenge-qmark';
          qMark.setAttribute('aria-hidden', 'true');
          qMark.textContent = '?';

          summary.appendChild(qText);
          summary.appendChild(qMark);
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

        var rawTags = parseTags(ev.description || '');
        var title   = esc(ev.titel || ev.title || ev.summary || '—');
        var loc     = esc(ev.ort || resolveLocation(rawTags, ev.location || ''));
        var tagDesc = ev.beschreibung || resolveTagDescription(rawTags) || null;

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

  // Rocket upload card: pulse + arc animation on click
  (function initRocketCard() {
    var card = document.getElementById('pdf-step-upload');
    if (!card) return;

    var noAnim = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
                 document.documentElement.classList.contains('reduce-motion');
    var active = false;

    if (!noAnim) card.classList.add('pdf-step--pulsing');

    card.addEventListener('click', function () {
      if (active || noAnim) return;
      active = true;
      card.classList.remove('pdf-step--pulsing');

      var iconEl = card.querySelector('.pdf-step-icon');
      var rect   = iconEl.getBoundingClientRect();
      var cx     = rect.left + rect.width  / 2;
      var cy     = rect.top  + rect.height / 2;

      iconEl.style.visibility = 'hidden';

      var rocket = document.createElement('div');
      rocket.className = 'pdf-rocket-fly';
      rocket.setAttribute('aria-hidden', 'true');
      rocket.textContent = '🚀';
      document.body.appendChild(rocket);

      gsap.set(rocket, { x: cx, y: cy, xPercent: -50, yPercent: -50 });
      // 🚀 emoji default orientation: ~45° upper-right → rotation -45 = straight up
      gsap.to(rocket, {
        keyframes: [
          { x: cx + 35, y: cy - 150, rotation:  -5, scale: 1.15, duration: 0.7, ease: 'power1.out' },
          { x: cx + 75, y: cy - 330, rotation:   5, scale: 1.30, duration: 0.9, ease: 'none' },
          { x: cx + 85, y: cy - 530, rotation: -15, scale: 1.20, duration: 0.9, ease: 'none' },
          { x: cx + 65, y: cy - 730, rotation: -35, scale: 1.00, duration: 1.0, ease: 'none' },
          { x: cx + 30, y: cy - 980, rotation: -45, scale: 0.55, opacity: 0, duration: 1.5, ease: 'power1.in' }
        ],
        onComplete: function () { rocket.remove(); }
      });

      setTimeout(function () {
        iconEl.style.visibility = '';
        active = false;
        if (!noAnim) card.classList.add('pdf-step--pulsing');
      }, 7000);
    });
  }());

});
