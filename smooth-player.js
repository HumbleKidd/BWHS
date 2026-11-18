// BWHS Smooth Playback Enhancer
// Adaptive quality based on connection to reduce buffering

(function() {
  function getSmoothQuality() {
    try {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        const downlink = conn.downlink || 10;
        const type = conn.effectiveType || '';
        if (downlink < 3 || ['2g', 'slow-2g', '3g'].includes(type)) return '720';
        if (downlink < 8) return '1080';
      }
    } catch(_) {}
    return '1080';
  }

  // Override if functions exist
  const origBuild = window.buildVixsrcParams;
  if (typeof origBuild === 'function') {
    window.buildVixsrcParams = function(startAt) {
      const start = Math.max(0, Math.floor(Number(startAt) || 0));
      const q = getSmoothQuality();
      return [
        'autoplay=1',
        'autoPlay=true',
        'startAt=' + start,
        'lang=en',
        'primaryColor=4f46e5',
        'secondaryColor=0f172a',
        'skin=vixsrc',
        'canPlayFHD=1',
        'quality=' + q,
        'maxQuality=' + q,
        'res=' + q
      ].join('&');
    };
  }

  const origHd = window.hdQuery;
  if (typeof origHd === 'function') {
    window.hdQuery = function(extra) {
      const q = getSmoothQuality();
      const base = ['autoplay=1', 'autoPlay=true', 'quality=' + q, 'maxQuality=' + q, 'res=' + q, 'q=' + q];
      if (extra) base.push(extra);
      return base.join('&');
    };
  }

  console.log('BWHS Smooth Playback active — quality adapted to connection');
})();
