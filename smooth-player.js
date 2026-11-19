// BWHS Smooth Playback Enhancer v3 — Instant start, adaptive quality
(function() {
  function getSmoothQuality() {
    try {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        const down = conn.downlink || 10;
        const type = (conn.effectiveType || '').toLowerCase();
        if (down < 2 || type.includes('2g') || type === '3g') return '480';
        if (down < 4) return '720';
        if (down < 8) return '1080';
      }
    } catch(e) {}
    return '1080';
  }

  const q = getSmoothQuality();
  console.log('BWHS Instant mode: quality', q + 'p');

  // Force override builders
  window.buildVixsrcParams = function(startAt) {
    const start = Math.max(0, Math.floor(Number(startAt) || 0));
    return [
      'autoplay=1','autoPlay=true','startAt=' + start,'lang=en',
      'primaryColor=4f46e5','secondaryColor=0f172a','skin=vixsrc',
      'canPlayFHD=1','quality=' + q,'maxQuality=' + q,'res=' + q
    ].join('&');
  };

  window.hdQuery = function(extra) {
    const base = ['autoplay=1','autoPlay=true','quality=' + q,'maxQuality=' + q,'res=' + q,'q=' + q];
    if (extra) base.push(extra);
    return base.join('&');
  };

  // Instant play helper
  window.instantPlay = function() {
    const frame = document.getElementById('playerFrame');
    if (frame && frame.src && frame.src !== 'about:blank') {
      try { frame.contentWindow.postMessage({ event: 'command', func: 'playVideo', args: [] }, '*'); } catch(e){}
    }
  };
})();
