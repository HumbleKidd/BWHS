/* BWHS Continue Watching Reminder Popup
   Shows 3s after load if there's a TV show left off in localStorage.
   Respects humble_save_memory flag.
*/
(function () {
  if (localStorage.getItem('humble_save_memory') === '0') return;

  // Inject styles once
  if (!document.getElementById('bwhs-continue-styles')) {
    const style = document.createElement('style');
    style.id = 'bwhs-continue-styles';
    style.textContent = `
      @keyframes bwhs-border-spin {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
      @keyframes bwhs-fade-in {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }
      .bwhs-btn {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateY(0);
      }
      .bwhs-btn:hover {
        transform: translateY(-2px);
        filter: brightness(1.08);
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
      }
      .bwhs-btn:active {
        transform: translateY(1px) scale(0.98);
        filter: brightness(0.95);
      }
    `;
    document.head.appendChild(style);
  }

  function getLastTv() {
    try {
      const hist = JSON.parse(localStorage.getItem('humble_history') || '[]');
      return hist.find(h => h.media_type === 'tv' || h.media_type === 'tvshow') || null;
    } catch (e) { return null; }
  }

  function showPopup() {
    const item = getLastTv();
    if (!item) return;

    const season = item.season || 1;
    const episode = item.episode || 1;
    const title = item.title || 'Your Show';
    const poster = item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '';
    const backdrop = item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : '';

    const teaser = 'The tension peaks as secrets unravel and alliances shatter in this unforgettable episode.';
    const controversial = '"Everything changes after this."';

    const overlay = document.createElement('div');
    overlay.id = 'bwhs-continue-popup';
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:999999; display:flex; align-items:center; justify-content:center;
      background:rgba(15,23,42,0.55); backdrop-filter:blur(4px); padding:16px;
    `;

    // Outer wrapper for animated gradient border
    const borderWrap = document.createElement('div');
    borderWrap.style.cssText = `
      max-width:520px; width:100%; padding:3px; border-radius:31px;
      background: linear-gradient(90deg, #4f46e5, #ec4899, #f59e0b, #10b981, #4f46e5);
      background-size: 300% 100%;
      animation: bwhs-border-spin 4s linear infinite;
      box-shadow: 0 30px 60px rgba(0,0,0,.4);
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background:#fff; border-radius:28px; overflow:hidden; position:relative;
      font-family:'Plus Jakarta Sans',sans-serif;
      background-image: linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.68)), url(${backdrop});
      background-size: cover; background-position: center;
      animation: bwhs-fade-in 0.4s ease;
    `;

    card.innerHTML = `
      <div style="display:flex; gap:16px; padding:20px 20px 12px;">
        <div style="flex:1; min-width:0;">
          <div style="font-size:11px; font-weight:800; color:#e11d48; letter-spacing:.5px; text-transform:uppercase; margin-bottom:4px;">📺 Pick Up Where You Left Off</div>
          <h2 style="margin:0 0 6px; font-size:26px; font-weight:800; line-height:1.1; background:linear-gradient(90deg,#4f46e5,#ec4899,#f59e0b); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">${title}</h2>
          <div style="font-size:14px; font-weight:700; color:#6366f1; margin-bottom:8px;">Season ${season} · Episode ${episode}</div>
          <p style="font-size:13px; color:#475569; line-height:1.45; margin:0 0 10px;">${teaser}</p>
          <div style="background:linear-gradient(90deg,#fef3c7,#fce7f3); border-radius:12px; padding:8px 10px; font-size:12px; font-weight:700; color:#9d174d; font-style:italic;">${controversial}</div>
        </div>
        ${poster ? `<img src="${poster}" alt="" style="width:110px; height:165px; object-fit:cover; border-radius:16px; box-shadow:0 8px 20px rgba(0,0,0,.25); flex-shrink:0;">` : ''}
      </div>
      <div style="padding:0 20px 16px; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; gap:8px;">
          <button id="bwhs-catchup" class="bwhs-btn" style="flex:1; padding:12px; border:none; border-radius:14px; background:linear-gradient(90deg,#4f46e5,#ec4899); color:#fff; font-weight:800; font-size:14px; cursor:pointer;">▶️ Catch Up</button>
          <button id="bwhs-notnow" class="bwhs-btn" style="flex:1; padding:12px; border:none; border-radius:14px; background:#f1f5f9; color:#334155; font-weight:800; font-size:14px; cursor:pointer;">Not Now</button>
        </div>
        <button id="bwhs-offmemory" class="bwhs-btn" style="width:100%; padding:10px; border:none; border-radius:12px; background:linear-gradient(90deg,#f59e0b,#f97316); color:#fff; font-weight:700; font-size:12px; cursor:pointer;">🔕 Turn Off Save Memory</button>
        <p style="font-size:11px; color:#64748b; text-align:center; margin:4px 0 0;">You can turn this back on anytime in Settings → Save Memory.</p>
      </div>
    `;

    borderWrap.appendChild(card);
    overlay.appendChild(borderWrap);
    document.body.appendChild(overlay);

    document.getElementById('bwhs-catchup').onclick = () => {
      location.hash = `#/watch/tv/${item.id}/${season}/${episode}`;
      overlay.remove();
    };
    document.getElementById('bwhs-notnow').onclick = () => overlay.remove();
    document.getElementById('bwhs-offmemory').onclick = () => {
      localStorage.setItem('humble_save_memory', '0');
      overlay.remove();
      alert('Save Memory is now off. Turn it back on anytime in Settings.');
    };
  }

  function injectSettingsToggle() {
    const sheet = document.querySelector('.mobile-settings-block');
    if (!sheet || document.getElementById('bwhs-save-memory-toggle')) return;
    const on = localStorage.getItem('humble_save_memory') !== '0';
    const div = document.createElement('div');
    div.id = 'bwhs-save-memory-toggle';
    div.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-top:1px solid #e2e8f0; margin-top:6px;';
    div.innerHTML = `
      <span style="font-size:0.78rem; font-weight:700; color:var(--text-main);">💾 Save Memory (Continue Watching)</span>
      <button id="bwhs-mem-btn" style="padding:4px 12px; border-radius:999px; border:none; font-size:0.7rem; font-weight:800; cursor:pointer; background:${on ? '#10b981' : '#94a3b8'}; color:#fff;">${on ? 'ON' : 'OFF'}</button>
    `;
    sheet.appendChild(div);
    document.getElementById('bwhs-mem-btn').onclick = () => {
      const currently = localStorage.getItem('humble_save_memory') !== '0';
      localStorage.setItem('humble_save_memory', currently ? '0' : '1');
      location.reload();
    };
  }

  setTimeout(() => {
    showPopup();
    injectSettingsToggle();
  }, 3000);

  const obs = new MutationObserver(injectSettingsToggle);
  obs.observe(document.body, { childList: true, subtree: true });
})();
