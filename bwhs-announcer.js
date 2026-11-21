/* BWHS Live Announcer v3 — clickable, outside-close, responsive, smooth */
(function () {
  var CFG = {
    apiKey: "AIzaSyBZhtlZRaWQPxFPEP02toZnsFQWOPvbUJA",
    authDomain: "bwhs-audience.firebaseapp.com",
    databaseURL: "https://bwhs-audience-default-rtdb.firebaseio.com",
    projectId: "bwhs-audience",
    storageBucket: "bwhs-audience.firebasestorage.app",
    messagingSenderId: "481701919126",
    appId: "1:481701919126:web:bc6cf2c0dc5d61f4ff85b7"
  };

  function load(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
  }
  function currentPage() {
    var p = (location.pathname || "").toLowerCase();
    if (p.indexOf("24-autoplay") !== -1) return "247";
    return "home";
  }
  function shouldShow(targets) {
    if (!targets || !targets.length) return false;
    if (targets.indexOf("all") !== -1) return true;
    var page = currentPage();
    var fs = isFullscreen();
    if (targets.indexOf("home") !== -1 && page === "home") return true;
    if (targets.indexOf("247") !== -1 && page === "247") return true;
    if (targets.indexOf("fullscreen") !== -1 && fs) return true;
    return false;
  }

  function injectStyles() {
    if (document.getElementById("bwhs-ann-style")) return;
    var css = `
      #bwhs-announce-root { position: fixed; z-index: 999999; pointer-events: none; }
      #bwhs-announce-root a, #bwhs-announce-root button, #bwhs-announce-root .bwhs-ann-middle, #bwhs-announce-root .bwhs-ann-banner {
        pointer-events: auto !important;
      }
      .bwhs-ann-banner {
        position: fixed; left: 0; right: 0; padding: 12px 16px;
        background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899);
        color: #fff; font-family: system-ui, -apple-system, sans-serif; font-size: 0.95rem; font-weight: 600;
        box-shadow: 0 8px 32px rgba(0,0,0,.35); text-align: center; line-height: 1.45;
        animation: bwhsSlide .4s cubic-bezier(.2,.8,.2,1); max-width: 100%;
      }
      .bwhs-ann-banner.top { top: 0; border-radius: 0 0 16px 16px; }
      .bwhs-ann-banner.bottom { bottom: 0; border-radius: 16px 16px 0 0; animation-name: bwhsSlideUp; }
      .bwhs-ann-middle-wrap {
        position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,.55); backdrop-filter: blur(4px); animation: bwhsFade .25s ease;
        pointer-events: auto !important; z-index: 999999;
      }
      .bwhs-ann-middle {
        background: linear-gradient(145deg, #1e1b4b, #312e81, #4c1d95);
        color: #fff; border-radius: 20px; padding: 22px 18px 18px; max-width: 92vw; width: 420px;
        box-shadow: 0 25px 60px rgba(0,0,0,.5); text-align: center; line-height: 1.5;
        animation: bwhsPop .4s cubic-bezier(.2,.8,.2,1); border: 1px solid rgba(255,255,255,.12);
        position: relative; pointer-events: auto !important;
      }
      .bwhs-ann-close {
        position: absolute; top: 8px; right: 10px; background: rgba(255,255,255,.2); border: 0;
        color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-weight: 800; font-size: 1.1rem;
        pointer-events: auto !important; z-index: 2;
      }
      .ann-text { margin-bottom: 8px; word-break: break-word; }
      .ann-text b, .ann-text strong { font-weight: 800; }
      .ann-text i, .ann-text em { font-style: italic; }
      .ann-text u { text-decoration: underline; }
      .ann-img { max-width: 100%; max-height: 180px; border-radius: 12px; margin: 8px auto; display: block; }
      .ann-movie-compact {
        display: inline-flex; align-items: center; gap: 8px; margin: 6px 4px 0;
        padding: 4px 12px 4px 4px; background: rgba(255,255,255,.18); border-radius: 999px;
        text-decoration: none !important; color: #fff !important; font-weight: 700; font-size: .88rem;
        pointer-events: auto !important; cursor: pointer;
      }
      .ann-movie-compact img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,.4); }
      .ann-movie-modal {
        display: flex; align-items: center; gap: 12px; margin: 12px auto 0; max-width: 100%;
        padding: 10px; background: rgba(255,255,255,.12); border-radius: 14px;
        text-decoration: none !important; color: #fff !important; text-align: left;
        pointer-events: auto !important; cursor: pointer;
      }
      .ann-movie-modal img { width: 56px; height: 80px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
      a[href] { pointer-events: auto !important; cursor: pointer; }
      @media (max-width: 640px) {
        .bwhs-ann-banner { padding: 10px 12px; font-size: 0.88rem; }
        .bwhs-ann-middle { width: 94vw; padding: 18px 14px 14px; border-radius: 18px; }
        .ann-movie-modal { flex-direction: column; text-align: center; }
        .ann-movie-modal img { width: 72px; height: 100px; }
        .ann-img { max-height: 140px; }
      }
      @keyframes bwhsSlide { from { transform: translateY(-100%); opacity: 0 } to { transform: none; opacity: 1 } }
      @keyframes bwhsSlideUp { from { transform: translateY(100%); opacity: 0 } to { transform: none; opacity: 1 } }
      @keyframes bwhsPop { from { transform: scale(.86); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      @keyframes bwhsFade { from { opacity: 0 } to { opacity: 1 } }
    `;
    var s = document.createElement("style");
    s.id = "bwhs-ann-style";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function showAnnouncement(data) {
    if (!data || !shouldShow(data.targets || [])) return;
    injectStyles();
    var existing = document.getElementById("bwhs-announce-root");
    if (existing) existing.remove();

    var root = document.createElement("div");
    root.id = "bwhs-announce-root";
    document.body.appendChild(root);

    var pos = data.position || "top";
    var html = data.html || ("<div class='ann-text'>" + (data.text || "").replace(/\\n/g, "<br>") + "</div>");
    var isMiddle = (pos === "center" || pos === "middle");

    if (isMiddle) {
      root.innerHTML = `
        <div class="bwhs-ann-middle-wrap">
          <div class="bwhs-ann-middle">
            <button class="bwhs-ann-close" type="button">×</button>
            ${html}
          </div>
        </div>`;
      var wrap = root.querySelector(".bwhs-ann-middle-wrap");
      wrap.addEventListener("click", function (e) {
        if (e.target === wrap) root.remove();
      });
    } else {
      var cls = pos === "bottom" ? "bottom" : "top";
      root.innerHTML = `
        <div class="bwhs-ann-banner ${cls}">
          <button class="bwhs-ann-close" type="button">×</button>
          ${html}
        </div>`;
    }

    // Close button
    var closeBtn = root.querySelector(".bwhs-ann-close");
    if (closeBtn) closeBtn.addEventListener("click", function (e) { e.stopPropagation(); root.remove(); });

    // Ensure all links are clickable and open correctly
    root.querySelectorAll("a[href]").forEach(function (a) {
      a.style.pointerEvents = "auto";
      a.style.cursor = "pointer";
      a.addEventListener("click", function (e) {
        e.stopPropagation();
        // Let default navigation happen
      });
    });

    var ms = isMiddle ? 28000 : 16000;
    setTimeout(function () {
      var el = document.getElementById("bwhs-announce-root");
      if (el) el.remove();
    }, ms);
  }

  function start() {
    if (!firebase.apps.length) firebase.initializeApp(CFG);
    var db = firebase.database();
    var lastId = 0;

    db.ref("announcements/current").on("value", function (snap) {
      var v = snap.val();
      if (!v || !v.id || v.id === lastId) return;
      lastId = v.id;
      setTimeout(function () { showAnnouncement(v); }, 80);
    });

    ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange"].forEach(function (ev) {
      document.addEventListener(ev, function () {
        db.ref("announcements/current").once("value", function (snap) {
          var v = snap.val();
          if (v && v.id === lastId && shouldShow(v.targets || [])) showAnnouncement(v);
        });
      });
    });
  }

  if (window.firebase && firebase.database) start();
  else {
    load("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js", function () {
      load("https://www.gstatic.com/firebasejs/10.13.2/firebase-database-compat.js", start);
    });
  }
})();
