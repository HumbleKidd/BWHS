// BWHS Smooth Playback Enhancer v5 — force 720p default, never 4K, respect 1080 choice
(function() {
  function getPreferredQuality() {
    try {
      const saved = localStorage.getItem('bwhs_quality');
      if (saved === '1080' || saved === '720') return saved;
    } catch(e) {}
    return '720';
  }

  function forceQualityOnUrl(url) {
    if (!url || typeof url !== 'string') return url;
    const q = getPreferredQuality();
    return url
      .replace(/quality=\d+/g, 'quality=' + q)
      .replace(/maxQuality=\d+/g, 'maxQuality=' + q)
      .replace(/res=\d+/g, 'res=' + q)
      .replace(/q=\d+/g, 'q=' + q)
      .replace(/&quality=2160|&maxQuality=2160|&res=2160/g, '') // safety
      .replace(/quality=2160/g, 'quality=' + q);
  }

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
    if (frame && frame.src && frame.src.includes('http')) {
      const newSrc = forceQualityOnUrl(frame.src);
      if (newSrc !== frame.src) {
        frame.src = newSrc;
      }
    }
  }

  // Override builders if they exist
  function overrideBuilders() {
    if (typeof window.buildVixsrcParams === 'function') {
      const orig = window.buildVixsrcParams;
      window.buildVixsrcParams = function(startAt) {
        const params = orig(startAt);
        return forceQualityOnUrl('?' + params).slice(1);
      };
    }
    if (typeof window.hdQuery === 'function') {
      const origHd = window.hdQuery;
      window.hdQuery = function(extra) {
        const params = origHd(extra);
        return forceQualityOnUrl('?' + params).slice(1);
      };
    }
  }

  overrideBuilders();
  setTimeout(overrideBuilders, 500);
  setTimeout(cleanPlayer, 800);
  setTimeout(cleanPlayer, 2000);

  ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange'].forEach(e => {
    document.addEventListener(e, () => setTimeout(cleanPlayer, 100));
  });
  window.addEventListener('load', cleanPlayer);

  console.log('BWHS Smooth v5: locked to', getPreferredQuality() + 'p — never 4K');
})();
