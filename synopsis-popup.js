(function(){
  const TMDB_KEY = '129637a8869a61522af21b80f6eb5129';
  const IMG_BASE = 'https://image.tmdb.org/t/p/w342';

  let popup = null;
  let hideTimer = null;
  let currentCard = null;
  let elevatedCard = null;
  const creditsCache = new Map();
  const detailsCache = new Map();

  const CARD_SEL = '.media-card, .shelf-card, .upcoming-card, .panel-item-card, .sidebar-rec-card, .hero-mini-poster';

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

    popup.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    popup.addEventListener('mouseleave', () => hidePopup());

    document.addEventListener('click', (e) => {
      if (popup && popup.classList.contains('visible') && !popup.contains(e.target) && !e.target.closest('.ctx-menu')) {
        hidePopup();
      }
    }, true);

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

  async function ensureFullDetails(item, type) {
    if (item.overview && item.vote_average) return item;
    const key = type + '_' + item.id;
    if (detailsCache.has(key)) return detailsCache.get(key);
    try {
      const url = `https://api.themoviedb.org/3/${type}/${item.id}?api_key=${TMDB_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('details fail');
      const data = await res.json();
      const full = { ...item, ...data };
      detailsCache.set(key, full);
      return full;
    } catch {
      detailsCache.set(key, item);
      return item;
    }
  }

  function elevateCard(card) {
    if (elevatedCard && elevatedCard !== card) {
      elevatedCard.classList.remove('bwhs-elevated');
    }
    if (card) {
      card.classList.add('bwhs-elevated');
      elevatedCard = card;
    }
  }

  function clearElevate() {
    if (elevatedCard) {
      elevatedCard.classList.remove('bwhs-elevated');
      elevatedCard = null;
    }
  }

  function positionPopup(p, x, y, card) {
    const pw = 360;
    const ph = 180;
    let left, top;

    if (typeof x === 'number' && typeof y === 'number') {
      // Position near the click point
      left = x - pw / 2;
      top = y + 12;
      if (left < 12) left = 12;
      if (left + pw > window.innerWidth - 12) left = window.innerWidth - pw - 12;
      if (top + ph > window.innerHeight - 12) top = Math.max(12, y - ph - 12);
    } else if (card) {
      const rect = card.getBoundingClientRect();
      left = rect.left + rect.width / 2 - pw / 2;
      top = rect.bottom + 8;
      if (left < 12) left = 12;
      if (left + pw > window.innerWidth - 12) left = window.innerWidth - pw - 12;
      if (top + ph > window.innerHeight) top = Math.max(12, rect.top - ph);
    } else {
      left = Math.max(12, (window.innerWidth - pw) / 2);
      top = Math.max(12, window.innerHeight * 0.25);
    }

    p.style.left = left + 'px';
    p.style.top = top + 'px';
    p.style.width = pw + 'px';
  }

  async function showPopup(cardOrItem, typeHint, clickX, clickY) {
    let card = null;
    let item = null;
    let type = typeHint;

    if (cardOrItem && cardOrItem._bwhsItem) {
      card = cardOrItem;
      item = card._bwhsItem;
      type = card._bwhsType || (item.title ? 'movie' : 'tv');
    } else if (cardOrItem && cardOrItem.id) {
      item = cardOrItem;
      type = type || (item.title ? 'movie' : 'tv');
    } else {
      return;
    }

    if (type === 'person') return;
    clearTimeout(hideTimer);
    currentCard = card;

    if (card) elevateCard(card);

    const p = ensurePopup();
    const posterEl = p.querySelector('.sp-poster img');
    const synEl = p.querySelector('.sp-synopsis');
    const ratingEl = p.querySelector('.sp-rating-val');
    const dateEl = p.querySelector('.sp-date');
    const castsEl = p.querySelector('.sp-casts');

    // Show immediately with what we have, then enrich
    synEl.textContent = item.overview || 'Loading synopsis…';
    ratingEl.textContent = item.vote_average ? Number(item.vote_average).toFixed(1) : '…';
    const date = item.release_date || item.first_air_date || '';
    dateEl.textContent = date ? date.slice(0, 4) : '—';

    const poster = item.poster_path ? IMG_BASE + item.poster_path : (item.profile_path ? IMG_BASE + item.profile_path : '');
    posterEl.src = poster || '';
    posterEl.style.display = poster ? 'block' : 'none';

    positionPopup(p, clickX, clickY, card);
    p.classList.add('visible');

    castsEl.innerHTML = '<span style="opacity:.55">Loading cast…</span>';

    // Enrich if needed
    const fullItem = await ensureFullDetails(item, type);
    if (currentCard !== card && card) return;

    synEl.textContent = fullItem.overview || fullItem.name || 'No synopsis available.';
    ratingEl.textContent = fullItem.vote_average ? Number(fullItem.vote_average).toFixed(1) : 'NR';
    const fullDate = fullItem.release_date || fullItem.first_air_date || '';
    dateEl.textContent = fullDate ? fullDate.slice(0, 4) : '—';

    const casts = await loadCredits(fullItem, type);
    if (currentCard !== card && card) return;
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
      clearElevate();
    }, 150);
  }

  // Accept optional click coordinates
  window.BWHS_showSynopsis = function(itemOrCard, type, clickX, clickY) {
    showPopup(itemOrCard, type, clickX, clickY);
  };

  window.BWHS_hideSynopsis = hidePopup;

  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest && e.target.closest(CARD_SEL);
    if (!card) return;
    elevateCard(card);
  }, true);

  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest && e.target.closest(CARD_SEL);
    if (!card) return;
    const related = e.relatedTarget;
    if (related && card.contains(related)) return;
    if (card === elevatedCard) clearElevate();
  }, true);

  window.addEventListener('scroll', () => {
    if (popup) popup.classList.remove('visible');
    currentCard = null;
    clearElevate();
  }, { passive: true });
})();
