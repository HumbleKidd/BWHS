// BWHS Smooth Playback Enhancer v4 — main view + fullscreen carry-over
(function() {
  function getSmoothQuality() {
    try {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        const down = conn.downlink || 10;
        const type = (conn.effectiveType || '').toLowerCase();
        if (down < 5 || type.includes('2g') || type === '3g' || type === '4g' || type === 'slow-2g') return '720';
        if (down < 12) return '1080';
      }
    } catch(e) {}
    return '720';
  }
  const q = getSmoothQuality();
  console.log('BWHS Smooth: locked to', q + 'p (main + fullscreen)');

  function cleanPlayer() {
    const frame = document.getElementById('playerFrame');
    const vp = document.getElementById('videoViewport');
    [frame, vp].forEach(el => {
      if (!el) return;
      el.style.transform = 'none';
      el.style.willChange = 'auto';
      el.style.contain = 'none';
      el.style.filter = 'none';
    });
    if (frame && frame.src && /quality=(2160|1440|1080)/.test(frame.src) && q === '720') {
      // Only force-reload if currently higher and we want 720
      const newSrc = frame.src.replace(/quality=\d+/g, 'quality=' + q)
                              .replace(/maxQuality=\d+/g, 'maxQuality=' + q)
                              .replace(/res=\d+/g, 'res=' + q);
      if (newSrc !== frame.src) {
        frame.src = newSrc;
      }
    }
  }

  // Override builders
  if (typeof window.buildVixsrcParams === 'function') {
    const orig = window.buildVixsrcParams;
    window.buildVixsrcParams = function(startAt) {
      const params = orig(startAt);
      return params.replace(/quality=\d+/g, 'quality=' + q)
                   .replace(/maxQuality=\d+/g, 'maxQuality=' + q)
                   .replace(/res=\d+/g, 'res=' + q);
    };
  }

  setTimeout(cleanPlayer, 600);
  ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange'].forEach(e => {
    document.addEventListener(e, () => setTimeout(cleanPlayer, 50));
  });
  window.addEventListener('load', cleanPlayer);
})();
