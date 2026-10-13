(function(){
  const TMDB_KEY = '129637a8869a61522af21b80f6eb5129';
  const IMG_BASE = 'https://image.tmdb.org/t/p/w342';

  let popup = null;
  let hideTimer = null;
  let currentCard = null;
  let elevatedCard = null;
  const creditsCache = new Map();

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

    popup.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
    });
    popup.addEventListener('mouseleave', () => {
      hidePopup();
    });

    document.addEventListener('click', (e) => {
      if (popup && popup.classList.contains('visible') && !popup.contains(e.target)) {
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

  async function showPopup(cardOrItem, typeHint) {
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

    const poster = item.poster_path ? IMG_BASE + item.poster_path : (item.profile_path ? IMG_BASE + item.profile_path : '');
    posterEl.src = poster || '';
    posterEl.style.display = poster ? 'block' : 'none';
    synEl.textContent = item.overview || item.name || 'No synopsis available.';
    ratingEl.textContent = item.vote_average ? Number(item.vote_average).toFixed(1) : 'NR';
    const date = item.release_date || item.first_air_date || '';
    dateEl.textContent = date ? date.slice(0, 4) : '—';

    let left, top;
    if (card) {
      const rect = card.getBoundingClientRect();
      const pw = 360;
      left = rect.left + rect.width / 2 - pw / 2;
      top = rect.bottom + 8;
      if (left < 12) left = 12;
      if (left + pw > window.innerWidth - 12) left = window.innerWidth - pw - 12;
      if (top + 180 > window.innerHeight) top = Math.max(12, rect.top - 180);
    } else {
      left = Math.max(12, (window.innerWidth - 360) / 2);
      top = Math.max(12, window.innerHeight * 0.25);
    }
    p.style.left = left + 'px';
    p.style.top = top + 'px';
    p.style.width = '360px';
    p.classList.add('visible');

    castsEl.innerHTML = '<span style="opacity:.55">Loading cast…</span>';
    const casts = await loadCredits(item, type);
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
    }, 120);
  }

  window.BWHS_showSynopsis = function(itemOrCard, type) {
    showPopup(itemOrCard, type);
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
