/**
 * ════════════════════════════════════════════════════════════════
 * SUBTLE DELAYED-FOLLOW CURSOR BACKLIGHT EFFECT
 * Features:
 *   - Soft, refined intensity (reduced/toned down)
 *   - Delayed trailing follow (cursor leads, glow catches up smoothly)
 *   - Dynamic color adaptation:
 *       Over #3B39DB (Blue) -> Soft White glow
 *       Over White (Light)  -> Soft Royal Blue glow
 *       Over Black (Dark)   -> Soft White glow
 *   - Positioned completely BEHIND text and cards (z-index: 1 & 2)
 * ════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  // Only enable on desktop pointer devices
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches) {
    return;
  }

  // Remove any previous cursor elements
  const oldEls = document.querySelectorAll(
    '#cursor-glow-canvas, #cursor-scratch-canvas, #executive-ambient-glow, #executive-core-glow, ' +
    '#mouse-blue-blur, #mouse-blue-core, #mouse-white-blur, #mouse-white-core'
  );
  oldEls.forEach(el => el.remove());

  // ── 1. BLUE GLOW LAYER (Subtle, toned-down over White canvas) ──
  const blueBlurOrb = document.createElement('div');
  blueBlurOrb.id = 'mouse-blue-blur';
  blueBlurOrb.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 240px;
    height: 240px;
    margin-top: -120px;
    margin-left: -120px;
    border-radius: 50%;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(59, 57, 219, 0.22) 0%,
      rgba(79, 70, 229, 0.12) 38%,
      rgba(59, 57, 219, 0.03) 65%,
      transparent 80%
    );
    filter: blur(32px);
    pointer-events: none;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease;
    will-change: transform, opacity;
    transform: translate3d(-500px, -500px, 0);
  `;

  const blueCoreGlow = document.createElement('div');
  blueCoreGlow.id = 'mouse-blue-core';
  blueCoreGlow.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 32px;
    height: 32px;
    margin-top: -16px;
    margin-left: -16px;
    border-radius: 50%;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(59, 57, 219, 0.42) 0%,
      rgba(99, 102, 241, 0.18) 55%,
      transparent 80%
    );
    filter: blur(8px);
    pointer-events: none;
    z-index: 2;
    opacity: 0;
    transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform, opacity;
    transform: translate3d(-500px, -500px, 0);
  `;

  // ── 2. WHITE GLOW LAYER (Subtle, over Blue & Black designs) ───
  const whiteBlurOrb = document.createElement('div');
  whiteBlurOrb.id = 'mouse-white-blur';
  whiteBlurOrb.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 240px;
    height: 240px;
    margin-top: -120px;
    margin-left: -120px;
    border-radius: 50%;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255, 255, 255, 0.55) 0%,
      rgba(255, 255, 255, 0.28) 38%,
      rgba(255, 255, 255, 0.08) 65%,
      transparent 80%
    );
    filter: blur(28px);
    pointer-events: none;
    z-index: 1;
    opacity: 0;
    transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease;
    will-change: transform, opacity;
    transform: translate3d(-500px, -500px, 0);
  `;

  const whiteCoreGlow = document.createElement('div');
  whiteCoreGlow.id = 'mouse-white-core';
  whiteCoreGlow.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 32px;
    height: 32px;
    margin-top: -16px;
    margin-left: -16px;
    border-radius: 50%;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255, 255, 255, 0.70) 0%,
      rgba(255, 255, 255, 0.35) 50%,
      transparent 75%
    );
    filter: blur(8px);
    pointer-events: none;
    z-index: 2;
    opacity: 0;
    transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform, opacity;
    transform: translate3d(-500px, -500px, 0);
  `;

  function mount() {
    const parent = document.body || document.documentElement;
    parent.appendChild(blueBlurOrb);
    parent.appendChild(blueCoreGlow);
    parent.appendChild(whiteBlurOrb);
    parent.appendChild(whiteCoreGlow);
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener('DOMContentLoaded', mount);
  }

  // ── 3. STATE & COORDINATES ────────────────────────────────────
  let mouseX = -500;
  let mouseY = -500;
  let blurX = -500;
  let blurY = -500;
  let coreX = -500;
  let coreY = -500;
  let isVisible = false;
  let activeGlowColor = 'blue'; // 'blue' or 'white'
  let isHoveringInteractive = false;
  let rafId = null;

  // ── 4. COLOR DETECTION UNDER POINTER ──────────────────────────
  function detectColorContext(target) {
    if (!target || !(target instanceof Element)) return 'blue';

    let el = target;
    for (let i = 0; i < 5 && el && el !== document.body && el !== document.documentElement; i++) {
      // A) Check for explicit Blue design elements or buttons
      if (
        el.matches?.(
          '.contact-btn-primary, [class*="bg-[#3B39DB]"], .bg-indigo-600, .bg-[#4F46E5], ' +
          '.btn-pill-primary, .btn-pill-secondary, .btn-pill-accent, .contact-btn-secondary, ' +
          '.badge-pill-blue, [data-theme="blue"]'
        )
      ) {
        return 'white'; // Over blue design -> White glow
      }

      // B) Check for explicit Black / Dark design elements
      if (
        el.matches?.(
          '.bg-black, .bg-slate-900, .bg-slate-800, [class*="bg-[#0F0F1A]"], [class*="bg-[#111827]"], ' +
          '.btn-pill-dark, .dark-card, [data-theme="dark"], #mobile-menu-drawer, ' +
          '.liquid-glass-frame, #hero-shaped-photo, img[src*="photo"], footer'
        )
      ) {
        return 'white'; // Over black design -> White glow
      }

      // C) Computed style inspection for exact background color values
      try {
        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
          const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          if (match) {
            const r = parseInt(match[1], 10);
            const g = parseInt(match[2], 10);
            const b = parseInt(match[3], 10);
            const a = match[4] !== undefined ? parseFloat(match[4]) : 1;

            if (a > 0.3) {
              // Predominantly Blue (#3B39DB: 59, 57, 219)
              if (b > 160 && (b - r > 50)) {
                return 'white'; // Over blue -> White glow
              }
              // Dark / Black (luminance < 65)
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              if (lum < 65) {
                return 'white'; // Over black -> White glow
              }
              // Light / White (luminance > 180)
              if (lum > 180) {
                return 'blue'; // Over white -> Blue glow
              }
            }
          }
        }
      } catch (e) {}

      el = el.parentElement;
    }

    // Default over white website canvas is Royal Blue glow
    return 'blue';
  }

  // ── 5. SYNC OPACITY BASED ON ACTIVE THEME ─────────────────────
  function syncGlowTheme() {
    if (!isVisible) {
      blueBlurOrb.style.opacity = '0';
      blueCoreGlow.style.opacity = '0';
      whiteBlurOrb.style.opacity = '0';
      whiteCoreGlow.style.opacity = '0';
      return;
    }

    if (activeGlowColor === 'white') {
      // Over Blue or Black -> Soft White glow ON, Blue glow OFF
      blueBlurOrb.style.opacity = '0';
      blueCoreGlow.style.opacity = '0';
      whiteBlurOrb.style.opacity = '0.75';
      whiteCoreGlow.style.opacity = '0.70';
    } else {
      // Over White -> Soft Blue glow ON, White glow OFF
      blueBlurOrb.style.opacity = '0.75';
      blueCoreGlow.style.opacity = '0.70';
      whiteBlurOrb.style.opacity = '0';
      whiteCoreGlow.style.opacity = '0';
    }
  }

  // ── 6. ANIMATION LOOP WITH DELAYED-FOLLOW PHYSICS ─────────────
  // Lower lerp values (0.048 & 0.072) ensure the glow trails behind
  // the cursor smoothly with an organic, floating delay.
  function update() {
    const blurSpeed = 0.048; // Gentle delayed follow for ambient blur (cursor leads, glow trails)
    const coreSpeed = 0.072; // Smooth follow for core dot

    blurX += (mouseX - blurX) * blurSpeed;
    blurY += (mouseY - blurY) * blurSpeed;

    coreX += (mouseX - coreX) * coreSpeed;
    coreY += (mouseY - coreY) * coreSpeed;

    const scale = isHoveringInteractive ? 'scale(1.15)' : 'scale(1)';
    const blurTransform = `translate3d(${blurX.toFixed(1)}px, ${blurY.toFixed(1)}px, 0) ${scale}`;
    const coreTransform = `translate3d(${coreX.toFixed(1)}px, ${coreY.toFixed(1)}px, 0)`;

    blueBlurOrb.style.transform = blurTransform;
    whiteBlurOrb.style.transform = blurTransform;

    blueCoreGlow.style.transform = coreTransform;
    whiteCoreGlow.style.transform = coreTransform;

    const dist = Math.hypot(mouseX - blurX, mouseY - blurY);
    if (isVisible || dist > 0.2) {
      rafId = requestAnimationFrame(update);
    } else {
      rafId = null;
    }
  }

  // ── 7. EVENT LISTENERS ────────────────────────────────────────
  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isVisible) {
      isVisible = true;
      blurX = mouseX;
      blurY = mouseY;
      coreX = mouseX;
      coreY = mouseY;
    }

    // Real-time dynamic color detection
    const newGlowColor = detectColorContext(e.target);
    if (newGlowColor !== activeGlowColor) {
      activeGlowColor = newGlowColor;
    }

    // Subtle scale when hovering clickable elements
    const target = e.target;
    if (target && target instanceof Element) {
      const isInteractive = Boolean(
        target.closest('a, button, input, textarea, select, [role="button"], .project-category-card, .btn-pill-base')
      );
      if (isInteractive !== isHoveringInteractive) {
        isHoveringInteractive = isInteractive;
        blueBlurOrb.style.filter = isInteractive ? 'blur(36px)' : 'blur(32px)';
        whiteBlurOrb.style.filter = isInteractive ? 'blur(32px)' : 'blur(28px)';
      }
    }

    syncGlowTheme();

    if (!rafId) {
      rafId = requestAnimationFrame(update);
    }
  }

  function onMouseLeave() {
    isVisible = false;
    isHoveringInteractive = false;
    syncGlowTheme();
  }

  function onMouseEnter() {
    isVisible = true;
    syncGlowTheme();
    if (!rafId) {
      rafId = requestAnimationFrame(update);
    }
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('mouseenter', onMouseEnter);
})();
