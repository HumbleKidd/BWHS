// BWHS Smooth Playback Enhancer v4 — Forced 720p, zero sticking, instant
(function() {
  // Always 720p for buttery smooth, no buffer stalls on regular + fullscreen
  function getSmoothQuality() { return '720'; }

  const q = '720';

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

  // Force play helper
  window.instantPlay = function() {
    const frame = document.getElementById('playerFrame');
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({ event: 'command', func: 'playVideo', args: [] }, '*');
      frame.contentWindow.postMessage({ type: 'play' }, '*');
    } catch(e) {}
  };
})();
