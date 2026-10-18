/**
 * ════════════════════════════════════════════════════════════════
 * EXECUTIVE DELAYED RED/MAROON CURSOR GLOW CHASER
 * Features a timed millisecond follow-delay (cursor leads, light chases)
 * Automatically excludes hero photo & image logos so glow never overlays them
 * ════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  if (window.__delayedGlowInitialized) return;
  window.__delayedGlowInitialized = true;

  // Clean up any old elements
  const oldElements = document.querySelectorAll(
    '#cursor-glow-canvas, #cursor-scratch-canvas, #executive-ambient-glow, #executive-core-glow'
  );
  oldElements.forEach((el) => el.remove());

  // 1. Outer Ambient Crimson Spotlight (Trails with soft inertia ~85ms delay)
  // Layered at z-index: 1 so it stays behind content sections (z-10), hero image & logos
  const ambientGlow = document.createElement('div');
  ambientGlow.id = 'executive-ambient-glow';
  ambientGlow.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 440px;
    height: 440px;
    margin-top: -220px;
    margin-left: -220px;
    border-radius: 50%;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(200, 41, 9, 0.22) 0%,
      rgba(200, 41, 9, 0.10) 35%,
      rgba(148, 30, 6, 0.04) 55%,
      transparent 70%
    );
    filter: blur(42px);
    pointer-events: none;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform;
    transform: translate3d(-1000px, -1000px, 0);
  `;

  // 2. Inner Micro-Beacon Glow (Trails with responsive ~55ms delay)
  const coreGlow = document.createElement('div');
  coreGlow.id = 'executive-core-glow';
  coreGlow.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 72px;
    height: 72px;
    margin-top: -36px;
    margin-left: -36px;
    border-radius: 50%;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255, 100, 65, 0.35) 0%,
      rgba(200, 41, 9, 0.16) 45%,
      transparent 75%
    );
    filter: blur(10px);
    pointer-events: none;
    z-index: 2;
    opacity: 0;
    transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform;
    transform: translate3d(-1000px, -1000px, 0);
  `;

  function mountGlow() {
    if (document.body) {
      document.body.appendChild(ambientGlow);
      document.body.appendChild(coreGlow);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(ambientGlow);
        document.body.appendChild(coreGlow);
      });
    }
  }
  mountGlow();

  // Timestamped position history for true millisecond-delayed trailing
  const mouseHistory = [];
  const AMBIENT_DELAY_MS = 85; // Outer aura follows with ~85ms trailing delay
  const CORE_DELAY_MS = 55;    // Inner core follows with ~55ms trailing delay

  let ambientX = -1000;
  let ambientY = -1000;
  let coreX = -1000;
  let coreY = -1000;

  let latestX = -1000;
  let latestY = -1000;
  let isVisible = false;
  let isOverExcluded = false;
  let rafId = null;

  /**
   * Identifies hero portrait image and image logo elements
   * so the glow effect is never displayed on top of them.
   */
  function isExcludedTarget(el) {
    if (!el || !(el instanceof Element)) return false;
    return Boolean(
      el.closest(
        '.liquid-glass-frame, .liquid-glass-border, .liquid-glass-inner, .liquid-glass-img, ' +
        '#hero-shaped-photo, img[src*="hero-shaped-photo"], ' +
        '.brand-logo-item, .marquee-track, .marquee-container, .logo-card, ' +
        'img[src*="/logos/"], img[src*="logo" i], img[alt*="logo" i], ' +
        'a[href*="logos.html"], [data-no-glow]'
      )
    );
  }

  // Helper to interpolate position at target timestamp
  function getDelayedPosition(targetTime) {
    if (mouseHistory.length === 0) {
      return { x: latestX, y: latestY };
    }
    if (mouseHistory.length === 1 || targetTime <= mouseHistory[0].time) {
      return { x: mouseHistory[0].x, y: mouseHistory[0].y };
    }
    if (targetTime >= mouseHistory[mouseHistory.length - 1].time) {
      const last = mouseHistory[mouseHistory.length - 1];
      return { x: last.x, y: last.y };
    }

    // Binary / linear search for the segment
    for (let i = 0; i < mouseHistory.length - 1; i++) {
      const p1 = mouseHistory[i];
      const p2 = mouseHistory[i + 1];
      if (targetTime >= p1.time && targetTime <= p2.time) {
        const dt = p2.time - p1.time;
        const t = dt > 0 ? (targetTime - p1.time) / dt : 1;
        return {
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
        };
      }
    }

    const last = mouseHistory[mouseHistory.length - 1];
    return { x: last.x, y: last.y };
  }

  function update() {
    const now = performance.now();

    // Clean old history older than 600ms
    while (mouseHistory.length > 2 && now - mouseHistory[0].time > 600) {
      mouseHistory.shift();
    }

    // 1. Get position delayed by CORE_DELAY_MS (~55ms delay)
    const coreTarget = getDelayedPosition(now - CORE_DELAY_MS);
    coreX += (coreTarget.x - coreX) * 0.18;
    coreY += (coreTarget.y - coreY) * 0.18;
    coreGlow.style.transform = `translate3d(${coreX.toFixed(1)}px, ${coreY.toFixed(1)}px, 0)`;

    // 2. Get position delayed by AMBIENT_DELAY_MS (~85ms delay)
    const ambientTarget = getDelayedPosition(now - AMBIENT_DELAY_MS);
    ambientX += (ambientTarget.x - ambientX) * 0.12;
    ambientY += (ambientTarget.y - ambientY) * 0.12;
    ambientGlow.style.transform = `translate3d(${ambientX.toFixed(1)}px, ${ambientY.toFixed(1)}px, 0)`;

    // Check distance to keep 60fps loop running or pause when completely at rest
    const distToRest = Math.hypot(latestX - ambientX, latestY - ambientY);
    if (distToRest > 0.4 || isVisible) {
      rafId = requestAnimationFrame(update);
    } else {
      rafId = null;
    }
  }

  function syncVisibility() {
    if (isVisible && !isOverExcluded) {
      ambientGlow.style.opacity = '1';
      coreGlow.style.opacity = '1';
    } else {
      ambientGlow.style.opacity = '0';
      coreGlow.style.opacity = '0';
    }
  }

  function onMouseMove(e) {
    const now = performance.now();
    latestX = e.clientX;
    latestY = e.clientY;

    mouseHistory.push({ x: latestX, y: latestY, time: now });

    // Verify whether cursor is on hero image or image logo
    isOverExcluded = isExcludedTarget(e.target);

    if (!isVisible) {
      isVisible = true;
      ambientX = latestX;
      ambientY = latestY;
      coreX = latestX;
      coreY = latestY;
    }

    syncVisibility();

    if (!rafId) {
      rafId = requestAnimationFrame(update);
    }
  }

  function onTouchMove(e) {
    if (!e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    isOverExcluded = isExcludedTarget(target);
    onMouseMove(touch);
  }

  function onScroll() {
    if (!isVisible) return;
    const el = document.elementFromPoint(latestX, latestY);
    const wasOverExcluded = isOverExcluded;
    isOverExcluded = isExcludedTarget(el);
    if (wasOverExcluded !== isOverExcluded) {
      syncVisibility();
    }
  }

  function onMouseLeave() {
    isVisible = false;
    ambientGlow.style.opacity = '0';
    coreGlow.style.opacity = '0';
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('touchend', onMouseLeave);
})();
