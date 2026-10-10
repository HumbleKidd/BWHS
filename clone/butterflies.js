(function(){
  const TMDB_KEY = '129637a8869a61522af21b80f6eb5129';
  const IMG_BASE = 'https://image.tmdb.org/t/p/w342';

  // ===== Flying Butterflies (pure CSS/SVG art — no external images) =====
  const layer = document.createElement('div');
  layer.id = 'butterfly-layer';
  document.body.appendChild(layer);

  const butterflies = [];
  const classes = ['bf1','bf2','bf3','bf4','bf5','bf6'];
  const count = 7;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'butterfly ' + classes[i % classes.length];
    el.innerHTML = `
      <div class="wing left"></div>
      <div class="body"></div>
      <div class="wing right"></div>
    `;
    layer.appendChild(el);
    butterflies.push({
      el,
      x: Math.random() * (window.innerWidth || 1200),
      y: Math.random() * (window.innerHeight || 800),
      vx: (Math.random() - 0.5) * 2.2,
      vy: (Math.random() - 0.5) * 1.4,
      depth: 0.5 + Math.random() * 1.1,
      phase: Math.random() * Math.PI * 2,
      colorClass: classes[i % classes.length]
    });
  }

  function animateButterflies() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    butterflies.forEach((b) => {
      b.phase += 0.016 + Math.random() * 0.006;
      b.x += b.vx + Math.sin(b.phase) * 0.9;
      b.y += b.vy + Math.cos(b.phase * 0.7) * 0.55;
      if (b.x < -100) b.x = w + 40;
      if (b.x > w + 100) b.x = -40;
      if (b.y < -80) b.y = h + 30;
      if (b.y > h + 80) b.y = -30;
      if (Math.random() < 0.0035) {
        b.vx = (Math.random() - 0.5) * 2.6;
        b.vy = (Math.random() - 0.5) * 1.7;
      }
      b.depth += (Math.random() - 0.5) * 0.008;
      b.depth = Math.max(0.45, Math.min(1.6, b.depth));
      const scale = b.depth;
      const rot = Math.sin(b.phase * 1.2) * 18 + (b.vx > 0 ? 8 : -8);
      b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) scale(${scale}) rotate(${rot}deg)`;
      b.el.style.opacity = Math.min(0.92, 0.45 + b.depth * 0.35);
      b.el.style.zIndex = Math.round(b.depth * 15);
    });
    requestAnimationFrame(animateButterflies);
  }
  requestAnimationFrame(animateButterflies);

  // ===== 3D Flip Synopsis Popup =====
  let popup = null;
  let hideTimer = null;
  let currentCard = null;
  const creditsCache = new Map();

  function ensurePopup() {
    if (popup) return popup;
    popup = document.createElement('div');
    popup.className = 'synopsis-popup';
    popup.innerHTML = `
      <div class="flip-inner">
        <div class="sp-front">
          <div class="sp-poster"><img alt="Poster" /></div>
          <div class="sp-info">
            <p class="sp-synopsis"></p>
            <div class="sp-meta">
              <span class="sp-rating"><i class="fa-solid fa-star"></i> <span class="sp-rating-val"></span></span>
              <span class="sp-date"></span>
            </div>
            <div class="sp-casts"></div>
          </div>
        </div>
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
      const casts = (data.cast || []).slice(0, 3).map(c => c.name).filter(Boolean);
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
    if (type === 'person' || !item.overview && !item.title && !item.name) return;
    clearTimeout(hideTimer);
    currentCard = card;
    const p = ensurePopup();
    const posterEl = p.querySelector('.sp-poster img');
    const synEl = p.querySelector('.sp-synopsis');
    const ratingEl = p.querySelector('.sp-rating-val');
    const dateEl = p.querySelector('.sp-date');
    const castsEl = p.querySelector('.sp-casts');

    const poster = item.poster_path ? IMG_BASE + item.poster_path : (item.profile_path ? IMG_BASE + item.profile_path : '');
    posterEl.src = poster || '';
    posterEl.style.display = poster ? 'block' : 'none';
    synEl.textContent = item.overview || item.name || 'No synopsis available.';
    ratingEl.textContent = item.vote_average ? Number(item.vote_average).toFixed(1) : 'NR';
    const date = item.release_date || item.first_air_date || '';
    dateEl.textContent = date ? date.slice(0, 4) : '—';

    const rect = card.getBoundingClientRect();
    const pw = 220;
    let left = rect.left + rect.width / 2 - pw / 2;
    let top = rect.top - 8;
    if (left < 10) left = 10;
    if (left + pw > window.innerWidth - 10) left = window.innerWidth - pw - 10;
    if (top < 10) top = rect.bottom + 8;
    if (top + 320 > window.innerHeight) top = Math.max(10, window.innerHeight - 340);
    p.style.left = left + 'px';
    p.style.top = top + 'px';
    p.style.width = pw + 'px';
    p.classList.add('visible');

    castsEl.innerHTML = '<span style="opacity:.55">Loading cast…</span>';
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
    }, 180);
  }

  // Desktop hover
  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest && e.target.closest('.media-card, .shelf-card, .upcoming-card, .panel-item-card');
    if (card && card._bwhsItem && card !== currentCard) {
      showPopup(card);
    }
  }, true);

  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest && e.target.closest('.media-card, .shelf-card, .upcoming-card, .panel-item-card');
    if (card && card === currentCard) {
      // Check if still over the card
      const related = e.relatedTarget;
      if (!related || !card.contains(related)) hidePopup();
    }
  }, true);

  // Mobile / touch: tap to show briefly
  document.addEventListener('click', (e) => {
    const card = e.target.closest && e.target.closest('.media-card, .shelf-card, .upcoming-card');
    if (card && card._bwhsItem && window.matchMedia('(hover: none)').matches) {
      showPopup(card);
      setTimeout(hidePopup, 3200);
    }
  }, true);

  window.addEventListener('scroll', () => {
    if (popup) popup.classList.remove('visible');
    currentCard = null;
  }, { passive: true });

  // Re-bind on dynamic cards via MutationObserver (helps if cards are added after load)
  const obs = new MutationObserver(() => {
    // Nothing heavy — events are delegated so this is just a light touch
  });
  obs.observe(document.body, { childList: true, subtree: true });
})();
