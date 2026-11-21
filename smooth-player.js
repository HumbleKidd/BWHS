// BWHS Smooth Playback Enhancer v3
// Adaptive quality + regular & fullscreen smoothness
(function() {
  function getSmoothQuality() {
    try {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        const down = conn.downlink || 10;
        const type = (conn.effectiveType || '').toLowerCase();
        if (down < 3 || type.includes('2g') || type === '3g' || type === 'slow-2g') return '720';
        if (down < 8) return '1080';
      }
    } catch(e) {}
    return '1080';
  }

  const q = getSmoothQuality();
  console.log('BWHS Smooth mode: quality locked to', q + 'p for buttery playback');

  // Force override if functions exist (belt and suspenders)
  if (typeof window.buildVixsrcParams === 'function') {
    const orig = window.buildVixsrcParams;
    window.buildVixsrcParams = function(startAt) {
      const params = orig(startAt);
      return params.replace(/quality=\d+/g, 'quality=' + q)
                   .replace(/maxQuality=\d+/g, 'maxQuality=' + q)
                   .replace(/res=\d+/g, 'res=' + q);
    };
  }

  // Clean up any remaining high-quality params on load
  setTimeout(() => {
    const frame = document.getElementById('playerFrame');
    if (frame && frame.src && /quality=(2160|1440)/.test(frame.src)) {
      frame.src = frame.src.replace(/quality=\d+/g, 'quality=' + q)
                           .replace(/maxQuality=\d+/g, 'maxQuality=' + q)
                           .replace(/res=\d+/g, 'res=' + q);
      console.log('Forced smoother quality on live player');
    }
  }, 800);
})();
