/* BWHS SEO + Social Share Meta Manager
   Updates title, description, Open Graph, and Twitter cards
   when a film is opened or shared so previews show the poster.
*/
(function () {
  const SITE_NAME = 'BWHS';
  const SITE_TITLE = 'BWHS - Binge Watch Humble Streams';
  const SITE_DESC = 'Stream trending movies and TV shows instantly. Cinematic player, multiple servers, trending catalogs, and 24/7 live channel. Free to browse.';
  const SITE_IMAGE = 'https://bwhs.online/apple-touch-icon.png';
  const TMDB_IMG = 'https://image.tmdb.org/t/p/w780';

  function setMeta(name, content, isProperty = false) {
    if (!content) return;
    const attr = isProperty ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function updateMetaForFilm(item, type) {
    if (!item || !item.id) return;
    const title = item.title || item.name || 'Watch on BWHS';
    const overview = (item.overview || '').slice(0, 200);
    const poster = item.poster_path
      ? TMDB_IMG + item.poster_path
      : (item.backdrop_path ? TMDB_IMG + item.backdrop_path : SITE_IMAGE);
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const fullTitle = `${title}${year ? ' (' + year + ')' : ''} | BWHS`;
    const desc = overview || `Watch ${title} on BWHS — instant playback with multiple servers.`;

    document.title = fullTitle;
    setMeta('description', desc);
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', desc, true);
    setMeta('og:image', poster, true);
    setMeta('og:image:secure_url', poster, true);
    setMeta('og:image:alt', title + ' poster', true);
    setMeta('og:type', 'video.movie', true);
    setMeta('og:site_name', SITE_NAME, true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', poster);
    setMeta('twitter:image:alt', title + ' poster');

    // JSON-LD for the film
    let script = document.getElementById('bwhs-film-jsonld');
    if (!script) {
      script = document.createElement('script');
      script.id = 'bwhs-film-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    const schema = {
      '@context': 'https://schema.org',
      '@type': type === 'tv' ? 'TVSeries' : 'Movie',
      name: title,
      description: overview || desc,
      image: poster,
      datePublished: item.release_date || item.first_air_date || undefined,
      aggregateRating: item.vote_average ? {
        '@type': 'AggregateRating',
        ratingValue: item.vote_average,
        bestRating: 10,
        ratingCount: item.vote_count || 1
      } : undefined
    };
    script.textContent = JSON.stringify(schema);
  }

  function resetToSiteMeta() {
    document.title = SITE_TITLE;
    setMeta('description', SITE_DESC);
    setMeta('og:title', SITE_TITLE, true);
    setMeta('og:description', SITE_DESC, true);
    setMeta('og:image', SITE_IMAGE, true);
    setMeta('og:type', 'website', true);
    setMeta('twitter:title', SITE_TITLE);
    setMeta('twitter:description', SITE_DESC);
    setMeta('twitter:image', SITE_IMAGE);
    const filmLd = document.getElementById('bwhs-film-jsonld');
    if (filmLd) filmLd.remove();
  }

  // Expose for the rest of the site
  window.BWHS_updateShareMeta = updateMetaForFilm;
  window.BWHS_resetShareMeta = resetToSiteMeta;

  // Auto-update when activeMedia changes (hook into existing globals if present)
  let lastId = null;
  setInterval(() => {
    if (window.activeMedia && window.activeMedia.id && window.activeMedia.id !== lastId) {
      lastId = window.activeMedia.id;
      const type = window.activeMedia.computedType || (window.activeMedia.title ? 'movie' : 'tv');
      updateMetaForFilm(window.activeMedia, type);
    }
  }, 800);

  // Also listen for hash changes that look like watch routes
  window.addEventListener('hashchange', () => {
    const m = (location.hash || '').match(/#\/watch\/(movie|tv)\/(\d+)/);
    if (!m && !window.activeMedia) resetToSiteMeta();
  });
})();
