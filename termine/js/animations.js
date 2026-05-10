'use strict';

window.initTyped = function () {
  const el = document.getElementById('typed-text');
  if (!el || typeof Typed === 'undefined') return;

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

function initArchDiagram() {
  const arrows = document.querySelectorAll('.arch-arrow');
  if (!arrows.length) return;

  arrows.forEach(arrow => {
    const len = arrow.getTotalLength ? arrow.getTotalLength() : 250;
    gsap.set(arrow, { strokeDasharray: len, strokeDashoffset: len });
  });

  ScrollTrigger.create({
    trigger: '#architektur',
    start: 'top 65%',
    once: true,
    onEnter: () => {
      arrows.forEach((arrow, i) => {
        gsap.to(arrow, {
          strokeDashoffset: 0,
          duration: 1.1,
          delay: i * 0.22,
          ease: 'power2.inOut',
        });
      });
    },
  });

  // Node hover pulse
  document.querySelectorAll('.arch-node').forEach(node => {
    node.addEventListener('mouseenter', () => {
      gsap.to(node.querySelector('.arch-node-rect'), { scale: 1.06, duration: 0.2, ease: 'power2.out', transformOrigin: 'center' });
    });
    node.addEventListener('mouseleave', () => {
      gsap.to(node.querySelector('.arch-node-rect'), { scale: 1, duration: 0.2, ease: 'power2.in' });
    });
  });
}

function initHeroAnim() {
  const tl = gsap.timeline({ delay: 0.2 });
  tl.from('#hero-logo',       { opacity: 0, y: -30, duration: 0.7, ease: 'back.out(1.7)' })
    .from('#hero-title',      { opacity: 0, y: 45,  duration: 0.7, ease: 'power3.out' }, '-=0.3')
    .from('#hero-subtitle',   { opacity: 0, y: 20,  duration: 0.5 }, '-=0.3')
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

function initRoughNotation() {
  if (typeof RoughNotation === 'undefined') return;
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
  initArchDiagram();
  initSectionTitleAnims();
  initPdfCardHover();

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
