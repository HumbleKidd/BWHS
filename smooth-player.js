// BWHS Smooth Playback - safe 720p enforcer
(function() {
  function getQ() {
    try {
      const s = localStorage.getItem('bwhs_quality');
      if (s === '1080' || s === '720') return s;
    } catch (e) {}
    return '720';
  }
  function fixUrl(u) {
    if (!u || !u.includes('http')) return u;
    const q = getQ();
    return u
      .replace(/quality=\d+/g, 'quality=' + q)
      .replace(/maxQuality=\d+/g, 'maxQuality=' + q)
      .replace(/res=\d+/g, 'res=' + q)
      .replace(/q=\d+/g, 'q=' + q);
  }
  function apply() {
    const f = document.getElementById('playerFrame');
    if (f && f.src && /quality=\d+/.test(f.src)) {
      const n = fixUrl(f.src);
      if (n !== f.src) f.src = n;
    }
  }
  setTimeout(apply, 1000);
  setTimeout(apply, 2500);
  window.addEventListener('load', apply);
  console.log('BWHS Smooth: default', getQ() + 'p');
})();
