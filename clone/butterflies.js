(function(){
  const TMDB_KEY = '129637a8869a61522af21b80f6eb5129';
  const IMG_BASE = 'https://image.tmdb.org/t/p/w342';

  // Realistic Butterflies
  const layer = document.createElement('div');
  layer.id = 'butterfly-layer';
  document.body.appendChild(layer);

  const butterflies = [];
  const classes = ['bf1','bf2','bf3','bf4'];
  for (let i = 0; i < 4; i++) {
    const el = document.createElement('div');
    el.className = 'butterfly ' + classes[i];
    layer.appendChild(el);
    butterflies.push({
      el,
      x: Math.random() * (window.innerWidth || 1200),
      y: Math.random() * (window.innerHeight || 800),
      vx: (Math.random() - 0.5) * 2.4,
      vy: (Math.random() - 0.5) * 1.6,
      depth: 0.55 + Math.random() * 1.0,
      phase: Math.random() * Math.PI * 2
    });
  }

  function animateButterflies() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    butterflies.forEach((b) => {
      b.phase += 0.018 + Math.random() * 0.008;
      b.x += b.vx + Math.sin(b.phase) * 1.1;
      b.y += b.vy + Math.cos(b.phase * 0.65) * 0.7;
      if (b.x < -80) b.x = w + 30;
      if (b.x > w + 80) b.x = -30;
      if (b.y < -80) b.y = h + 30;
      if (b.y > h + 80) b.y = -30;
      if (Math.random() < 0.004) {
        b.vx = (Math.random() - 0.5) * 2.8;
        b.vy = (Math.random() - 0.5) * 1.9;
      }
      b.depth += (Math.random() - 0.5) * 0.01;
      b.depth = Math.max(0.4, Math.min(1.75, b.depth));
      const scale = b.depth;
      const rot = Math.sin(b.phase * 1.4) * 22 + (b.vx > 0 ? 6 : -6);
      b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) scale(${scale}) rotate(${rot}deg)`;
      b.el.style.opacity = Math.min(0.95, 0.5 + b.depth * 0.4);
      b.el.style.zIndex = Math.round(b.depth * 20);
    });
    requestAnimationFrame(animateButterflies);
  }
  requestAnimationFrame(animateButterflies);

  // Hover Synopsis Pop-out
  let popup = null;
  let hideTimer = null;
  let currentCard = null;
  const creditsCache = new Map();

  function ensurePopup() {
    if (popup) return popup;
    popup = document.createElement('div');
    popup.className = 'synopsis-popup';
    popup.innerHTML = `
      <div class="sp-poster"><img alt="Poster" /></div>
      <div class="sp-info">
        <p class="sp-synopsis"></p>
        <div class="sp-meta">
          <span class="sp-rating"><i class="fa-solid fa-star"></i> <span class="sp-rating-val"></span></span>
          <span class="sp-date"></span>
        </div>
        <div class="sp-casts"></div>
      </div>
    `;
    document.body.appendChild(popup);
    return popup;
  }

  async function loadCredits(item, type) {
    const key = type + '_' + item.id;
    if (creditsCache.has(key)) return creditsCache.get(key);
    try {
      const url = `https://api.themoviedb.org/3/${type}/${item.id}/credits?api_key=${TMDB_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('credits fail');
      const data = await res.json();
      const casts = (data.cast || []).slice(0, 2).map(c => c.name).filter(Boolean);
      creditsCache.set(key, casts);
      return casts;
    } catch {
      creditsCache.set(key, []);
      return [];
    }
  }

  async function showPopup(card) {
    if (!card || !card._bwhsItem) return;
    const item = card._bwhsItem;
    const type = card._bwhsType || (item.title ? 'movie' : 'tv');
    if (type === 'person') return;
    clearTimeout(hideTimer);
    currentCard = card;
    const p = ensurePopup();
    const posterEl = p.querySelector('.sp-poster img');
    const synEl = p.querySelector('.sp-synopsis');
    const ratingEl = p.querySelector('.sp-rating-val');
    const dateEl = p.querySelector('.sp-date');
    const castsEl = p.querySelector('.sp-casts');

    const poster = item.poster_path ? IMG_BASE + item.poster_path : '';
    posterEl.src = poster;
    synEl.textContent = item.overview || 'No synopsis available for this title.';
    ratingEl.textContent = item.vote_average ? Number(item.vote_average).toFixed(1) : 'NR';
    const date = item.release_date || item.first_air_date || '';
    dateEl.textContent = date ? date.slice(0, 4) : '—';

    const rect = card.getBoundingClientRect();
    const pw = 200;
    let left = rect.left + rect.width / 2 - pw / 2;
    let top = rect.top - 30;
    if (left < 12) left = 12;
    if (left + pw > window.innerWidth - 12) left = window.innerWidth - pw - 12;
    if (top < 12) top = rect.bottom + 10;
    p.style.left = left + 'px';
    p.style.top = top + 'px';
    p.style.width = pw + 'px';
    p.classList.add('visible');

    castsEl.innerHTML = '<span style="opacity:.55">Loading top cast…</span>';
    const casts = await loadCredits(item, type);
    if (currentCard !== card) return;
    if (casts.length) {
      castsEl.innerHTML = casts.map(n => `<span>${n}</span>`).join('');
    } else {
      castsEl.textContent = 'Cast unavailable';
    }
  }

  function hidePopup() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (popup) popup.classList.remove('visible');
      currentCard = null;
    }, 140);
  }

  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest && e.target.closest('.media-card');
    if (card && card._bwhsItem && card !== currentCard) {
      showPopup(card);
    }
  });
  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest && e.target.closest('.media-card');
    if (card && card === currentCard) {
      hidePopup();
    }
  });
  window.addEventListener('scroll', () => {
    if (popup) popup.classList.remove('visible');
    currentCard = null;
  }, { passive: true });
})();
