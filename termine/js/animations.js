'use strict';

window.initTyped = function () {
  const el = document.getElementById('typed-text');
  if (!el || typeof Typed === 'undefined') { return; }

  const de = ['Termine', 'ICS Kalender', 'WordPress Plugin', 'PDF Termine', 'REST API', 'Home Assistant', 'GitHub Actions'];
  const en = ['Events', 'ICS Calendar', 'WordPress Plugin', 'PDF Events', 'REST API', 'Home Assistant', 'GitHub Actions'];

  window.typedInstance = new Typed(el, {
    strings: currentLang === 'en' ? en : de,
    typeSpeed: 55,
    backSpeed: 28,
    backDelay: 1800,
    loop: true,
    smartBackspace: true,
    onStringTyped: () => el.setAttribute('aria-label', el.textContent),
  });
};

function initArchLines() {
  const container = document.getElementById('arch-constellation');
  const svg       = document.getElementById('arch-lines-svg');
  const source    = document.getElementById('arch-source');
  const chips     = [...document.querySelectorAll('.arch-chip')];

  if (!container || !svg || !source || !chips.length) { return; }

  let triggered = false;

  function buildPath(sx, sy, tx, ty, i, isMobile) {
    if (isMobile) {
      // S-curve from source center to each staggered chip
      const midY = (sy + ty) / 2;
      return `M ${sx},${sy} C ${sx},${sy + 35} ${tx},${midY} ${tx},${ty}`;
    }
    switch (i) {
      case 0: // far-left — wide left sweep
        return `M ${sx},${sy} C ${sx - 120},${sy + 80} ${tx + 60},${ty - 80} ${tx},${ty}`;
      case 1: // left — sweeping arc
        return `M ${sx},${sy} C ${sx - 60},${sy + 100} ${tx + 80},${ty - 70} ${tx},${ty}`;
      case 2: // center — gentle vertical S-curve
        return `M ${sx},${sy} C ${sx - 15},${sy + 130} ${tx + 15},${ty - 90} ${tx},${ty}`;
      case 3: // right-center — smooth arc
        return `M ${sx},${sy} C ${sx + 80},${sy + 70} ${tx - 30},${ty - 90} ${tx},${ty}`;
      case 4: // far-right — wide right sweep
        return `M ${sx},${sy} C ${sx + 150},${sy + 30} ${tx + 100},${ty - 90} ${tx},${ty}`;
      default:
        return `M ${sx},${sy} L ${tx},${ty}`;
    }
  }

  function draw() {
    svg.innerHTML = '';
    const isMobile = window.innerWidth < 768;
    const cRect = container.getBoundingClientRect();
    const sRect = source.getBoundingClientRect();
    const sx = sRect.left - cRect.left + sRect.width  / 2;
    const sy = sRect.top  - cRect.top  + sRect.height; // bottom of source

    chips.forEach((chip, i) => {
      const tRect = chip.getBoundingClientRect();
      const tx = tRect.left - cRect.left + tRect.width  / 2;
      const ty = tRect.top  - cRect.top; // top of chip

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', buildPath(sx, sy, tx, ty, i, isMobile));
      path.setAttribute('class', 'arch-line');
      svg.appendChild(path);

      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: triggered ? 0 : len });

      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', String(tx));
      dot.setAttribute('cy', String(ty));
      dot.setAttribute('class', 'arch-dot');
      svg.appendChild(dot);
      gsap.set(dot, { attr: { r: triggered ? 4.5 : 0 } });
    });
  }

  draw();

  ScrollTrigger.create({
    trigger: '#architektur',
    start: 'top 65%',
    once: true,
    onEnter: () => {
      triggered = true;
      [...svg.querySelectorAll('.arch-line')].forEach((path, i) => {
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 1.5,
          delay: i * 0.3,
          ease: 'power2.inOut',
        });
      });
      [...svg.querySelectorAll('.arch-dot')].forEach((dot, i) => {
        gsap.to(dot, {
          attr: { r: 4.5 },
          duration: 0.35,
          delay: i * 0.3 + 1.3,
          ease: 'back.out(2)',
        });
      });
    },
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(draw, 150);
  });
}

function initHeroAnim() {
  const tl = gsap.timeline({ delay: 0.2 });
  tl.from('#hero-logo',       { opacity: 0, y: -30, duration: 0.7, ease: 'back.out(1.7)' })
    .from('#hero-title',      { opacity: 0, y: 45,  duration: 0.7, ease: 'power3.out' }, '-=0.3')
    .from('.hero-subtitle',   { opacity: 0, y: 20,  duration: 0.5 }, '-=0.3')
    .from('#hero-typed-wrap', { opacity: 0, y: 20,  duration: 0.5 }, '-=0.2')
    .from('#hero-desc',       { opacity: 0, y: 20,  duration: 0.5 }, '-=0.2')
    .from('#hero-scroll-hint',{ opacity: 0,          duration: 0.4 }, '-=0.1');
}

function initScrollTop() {
  ScrollTrigger.create({
    start: 300,
    onEnter:     () => gsap.to('#scroll-top', { opacity: 1, pointerEvents: 'auto', duration: 0.3 }),
    onLeaveBack: () => gsap.to('#scroll-top', { opacity: 0, pointerEvents: 'none', duration: 0.3 }),
  });
}

function initSectionTitleAnims() {
  document.querySelectorAll('.section-title-anim').forEach((el, i) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      x: i % 2 === 0 ? -50 : 50,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
    });
  });
}

function initPdfCardHover() {
  document.querySelectorAll('.pdf-card').forEach(card => {
    card.addEventListener('mouseenter', () => gsap.to(card, { y: -7, duration: 0.25, ease: 'power2.out' }));
    card.addEventListener('mouseleave', () => gsap.to(card, { y:  0, duration: 0.25, ease: 'power2.in' }));
  });
}

function initSponsorPulse() {
  const rings = document.querySelectorAll('.sponsor-pulse-ring');
  if (!rings.length) { return; }
  gsap.fromTo(rings,
    { scale: 1, opacity: 0.5 },
    { scale: 2.2, opacity: 0, duration: 1.8, stagger: { each: 0.6, repeat: -1 }, ease: 'power1.out' }
  ).time(1.2);
}

function initRoughNotation() {
  if (typeof RoughNotation === 'undefined') { return; }
  document.querySelectorAll('.rn-highlight').forEach((el, i) => {
    const annotation = RoughNotation.annotate(el, {
      type:              el.dataset.rnType  || 'highlight',
      color:             el.dataset.rnColor || '#F9B338',
      animate:           true,
      animationDuration: 700,
      padding:           3,
      multiline:         true,
    });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      once: true,
      onEnter: () => setTimeout(() => annotation.show(), i * 180),
    });
  });
}

function initShowMeAnimation() {
  var btn = document.getElementById('events-show-me');
  if (!btn) { return; }

  btn.addEventListener('click', function () {
    if (btn.classList.contains('animating')) { return; }
    if (document.documentElement.classList.contains('reduce-motion')) { return; }

    var srcEl = document.querySelector('#events-list .event-card:first-child .event-title');
    var tgtEl = document.querySelector('.json-specimen .json-specimen-line .json-val-sample');
    if (!srcEl || !tgtEl) { return; }

    btn.classList.add('animating');
    if (window.achievements) { achievements.unlock('show-me'); }

    // Live JSON value highlight
    var jsonPanel  = document.getElementById('events-json-panel');
    var jsonEditor = document.getElementById('events-json-editor');
    if (jsonPanel && jsonEditor) {
      var firstTitle = null;
      try {
        var parsed = JSON.parse(jsonEditor.value);
        var arr = Array.isArray(parsed) ? parsed : null;
        if (arr && arr.length > 0 && (arr[0].titel || arr[0].title)) {
          firstTitle = String(arr[0].titel || arr[0].title);
        }
      } catch (e) { /* skip if JSON invalid */ }

      if (firstTitle !== null) {
        var panelHidden = jsonPanel.classList.contains('d-none');
        if (panelHidden) { jsonPanel.classList.remove('d-none'); }

        var hl = document.createElement('div');
        hl.className = 'json-val-hl';
        var hlPre = document.createElement('span');
        hlPre.className = 'json-val-hl-pre';
        hlPre.textContent = '  "titel": ';
        var hlVal = document.createElement('span');
        hlVal.className = 'json-val-hl-val';
        hlVal.textContent = '"' + firstTitle + '"';
        // hl.appendChild(hlPre);
        // hl.appendChild(hlVal);
        // jsonEditor.insertAdjacentElement('beforebegin', hl);

        gsap.fromTo(hl, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.4 });
        gsap.to(hl, {
          opacity: 0,
          duration: 0.5,
          delay: 5,
          onComplete: function () {
            if (hl.parentNode) { hl.parentNode.removeChild(hl); }
            if (panelHidden) { jsonPanel.classList.add('d-none'); }
          },
        });
      }
    }

    var srcR = srcEl.getBoundingClientRect();
    var tgtR = tgtEl.getBoundingClientRect();
    var x1 = srcR.left;
    var y1 = srcR.top + srcR.height / 2;
    var x2 = tgtR.left + tgtR.width / 2;
    var y2 = tgtR.bottom;
    var dy = y1 - y2;

    // overflow-x:clip on <html> breaks position:fixed; use absolute + scroll compensation instead
    var svgScrollY = window.scrollY || window.pageYOffset || 0;
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', window.innerWidth);
    svg.setAttribute('height', window.innerHeight);
    svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:9999;overflow:visible;';
    svg.style.transform = 'translateY(' + svgScrollY + 'px)';
    var svgScrollFn = function () {
      svg.style.transform = 'translateY(' + (window.scrollY || window.pageYOffset || 0) + 'px)';
    };
    window.addEventListener('scroll', svgScrollFn, { passive: true });

    var defs = document.createElementNS(svgNS, 'defs');
    var marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', 'eg-show-arrow');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    var poly = document.createElementNS(svgNS, 'polygon');
    poly.setAttribute('points', '0 0, 10 3.5, 0 7');
    poly.setAttribute('fill', '#F9B338');
    marker.appendChild(poly);
    defs.appendChild(marker);
    svg.appendChild(defs);

    var d = 'M ' + x1 + ' ' + y1
          + ' C ' + x1 + ' ' + (y1 - dy * 0.4)
          + ' ' + x2 + ' ' + (y2 + dy * 0.4)
          + ' ' + x2 + ' ' + y2;

    var anchor = document.createElementNS(svgNS, 'circle');
    anchor.setAttribute('cx', x1);
    anchor.setAttribute('cy', y1);
    anchor.setAttribute('r', '5');
    anchor.setAttribute('fill', '#F9B338');
    anchor.setAttribute('stroke', '#fff');
    anchor.setAttribute('stroke-width', '1.5');
    svg.appendChild(anchor);

    var path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#F9B338');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('stroke-dasharray', '10 6');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#eg-show-arrow)');
    svg.appendChild(path);
    document.body.appendChild(svg);

    var len = path.getTotalLength();
    gsap.set(path, { strokeDashoffset: len });

    var tl = gsap.timeline({
      onComplete: function () {
        window.removeEventListener('scroll', svgScrollFn);
        document.body.removeChild(svg);
        btn.classList.remove('animating');
      }
    });
    tl.to(path, { strokeDashoffset: 0, duration: 5, ease: 'none' });
    tl.to([path, anchor], { opacity: 0, duration: 0.4 });
    tl.set(path, { strokeDashoffset: len, opacity: 1 });
    tl.set(anchor, { opacity: 1 });
    tl.to(path, { strokeDashoffset: 0, duration: 5, ease: 'none' });
    tl.to([path, anchor], { opacity: 0, duration: 1 });
  });
}

function initAnimations() {
  const reduceMotion = document.documentElement.classList.contains('reduce-motion');

  gsap.registerPlugin(ScrollTrigger);
  initScrollTop();

  AOS.init({
    duration: reduceMotion ? 0 : 650,
    easing: 'ease-out-cubic',
    once: true,
    offset: 60,
    anchorPlacement: 'top-bottom',
  });

  if (reduceMotion) {
    window.initTyped();
    return;
  }

  initHeroAnim();
  initArchLines();
  initSectionTitleAnims();
  initPdfCardHover();
  initSponsorPulse();
  initShowMeAnimation();

  AOS.init({
    duration: 650,
    easing: 'ease-out-cubic',
    once: true,
    offset: 60,
    anchorPlacement: 'top-bottom',
  });

  // Rough Notation after short delay (DOM settled)
  setTimeout(initRoughNotation, 600);

  window.initTyped();
}
