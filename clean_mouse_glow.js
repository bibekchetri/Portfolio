const fs = require('fs');
let html = fs.readFileSync('d:/files/index.html', 'utf8');

const target = `  <!-- Mouse Follower Effect (Tailored for Luxury Light Mode) -->
  <div id="mouse-glow"
    class="pointer-events-none fixed w-[500px] h-[500px] rounded-full bg-[#3B39DB] opacity-0 blur-[140px] z-0 will-change-transform transition-opacity duration-700 hidden md:block"
    style="mix-blend-mode: multiply; transform: translate3d(-50%, -50%, 0);"></div>
  <script>
    const mouseGlow = document.getElementById('mouse-glow');
    if (mouseGlow && window.matchMedia("(min-width: 768px)").matches) {
      let isGlowActive = false;
      let globalTicking = false;
      document.addEventListener('mousemove', (e) => {
        if (!isGlowActive) {
          mouseGlow.style.opacity = '0.04';
          isGlowActive = true;
        }
        if (!globalTicking) {
          window.requestAnimationFrame(() => {
            mouseGlow.style.transform = \`translate3d(\${e.clientX}px, \${e.clientY}px, 0) translate(-50%, -50%)\`;
            globalTicking = false;
          });
          globalTicking = true;
        }
      }, { passive: true });
      document.addEventListener('mouseleave', () => {
        mouseGlow.style.opacity = '0';
        isGlowActive = false;
      });
    }
  </script>
`;

const targetCRLF = target.replace(/\n/g, '\r\n');
if (html.includes(targetCRLF)) {
  html = html.replace(targetCRLF, '');
  console.log('Successfully removed mouse-glow with CRLF');
} else if (html.includes(target)) {
  html = html.replace(target, '');
  console.log('Successfully removed mouse-glow with LF');
} else {
  console.log('Target not found directly, checking regex...');
  const reg = /<!-- Mouse Follower Effect[\s\S]*?<\/script>\r?\n/m;
  if (reg.test(html)) {
    html = html.replace(reg, '');
    console.log('Successfully removed mouse-glow via regex');
  }
}

fs.writeFileSync('d:/files/index.html', html, 'utf8');

