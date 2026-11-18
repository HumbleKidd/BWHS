// BWHS Smooth Playback Enhancer v2
// Forces adaptive/lower quality to stop buffering

(function() {
  function getSmoothQuality() {
    try {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        const down = conn.downlink || 10;
        const type = (conn.effectiveType || '').toLowerCase();
        if (down < 2.5 || type.includes('2g') || type === '3g') return '720';
        if (down < 6) return '1080';
      }
    } catch(e) {}
    return '1080';
  }

  const q = getSmoothQuality();
  console.log('BWHS Smooth mode: quality set to', q + 'p');

  // Override builders if they exist
  if (typeof window.buildVixsrcParams === 'function') {
    window.buildVixsrcParams = function(startAt) {
      const start = Math.max(0, Math.floor(Number(startAt) || 0));
      return [
        'autoplay=1','autoPlay=true','startAt=' + start,'lang=en',
        'primaryColor=4f46e5','secondaryColor=0f172a','skin=vixsrc',
        'canPlayFHD=1','quality=' + q,'maxQuality=' + q,'res=' + q
      ].join('&');
    };
  }

  if (typeof window.hdQuery === 'function') {
    window.hdQuery = function(extra) {
      const base = ['autoplay=1','autoPlay=true','quality=' + q,'maxQuality=' + q,'res=' + q,'q=' + q];
      if (extra) base.push(extra);
      return base.join('&');
    };
  }

  // Also try to lower quality on existing player if already loaded
  setTimeout(() => {
    const frame = document.getElementById('playerFrame');
    if (frame && frame.src && frame.src.includes('quality=2160')) {
      frame.src = frame.src.replace(/quality=2160/g, 'quality=' + q)
                           .replace(/maxQuality=2160/g, 'maxQuality=' + q)
                           .replace(/res=2160/g, 'res=' + q);
      console.log('Reloaded player with smoother quality');
    }
  }, 1500);
})();
