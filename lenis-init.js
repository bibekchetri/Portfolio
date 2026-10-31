/**
 * ════════════════════════════════════════════════════════════════
 * LENIS SMOOTH SCROLL INITIALIZATION
 * Studio Freight / Darkroom Engineering Lenis
 * Provides buttery-smooth, luxury portfolio scrolling across all pages.
 * ════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  if (typeof Lenis === 'undefined') {
    console.warn('Lenis library not loaded');
    return;
  }

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.2,
    infinite: false,
  });

  // Expose global instance for programmatic scrolling
  window.lenis = lenis;

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  // Sync with page scroll callbacks on every Lenis frame
  lenis.on('scroll', function () {
    if (typeof window.processScroll === 'function') {
      window.processScroll();
    }
  });

  // Smooth anchor link scrolling via Lenis
  document.addEventListener('click', function (e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;

    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const scrollPad = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop) || 70;
      lenis.scrollTo(target, {
        offset: -scrollPad,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    }
  });

  // Back to top button integration
  const topBtn = document.getElementById('back-to-top-btn');
  if (topBtn) {
    topBtn.addEventListener('click', function (e) {
      e.preventDefault();
      lenis.scrollTo(0, {
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    });
  }
})();

