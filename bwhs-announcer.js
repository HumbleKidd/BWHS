/* BWHS Live Announcer v2 — vibrant, targeted, animated, no reload */
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
    s.onerror = function () { console.warn("Failed to load", src); };
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
      #bwhs-announce-root * { pointer-events: auto; }
      .bwhs-ann-banner {
        position: fixed; left: 0; right: 0; padding: 16px 20px;
        background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899);
        color: #fff; font-family: system-ui, sans-serif; font-size: 0.98rem; font-weight: 600;
        box-shadow: 0 8px 32px rgba(0,0,0,.35); text-align: center; line-height: 1.45;
        animation: bwhsSlide .45s cubic-bezier(.2,.8,.2,1);
      }
      .bwhs-ann-banner.top { top: 0; border-radius: 0 0 18px 18px; }
      .bwhs-ann-banner.bottom { bottom: 0; border-radius: 18px 18px 0 0; animation-name: bwhsSlideUp; }
      .bwhs-ann-modal-wrap {
        position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,.45); backdrop-filter: blur(4px); animation: bwhsFade .3s ease;
      }
      .bwhs-ann-modal {
        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);
        color: #fff; border-radius: 22px; padding: 22px 24px; max-width: 420px; width: 90%;
        box-shadow: 0 25px 60px rgba(0,0,0,.5); text-align: center; line-height: 1.5;
        animation: bwhsPop .4s cubic-bezier(.2,.8,.2,1);
        border: 1px solid rgba(255,255,255,.12);
      }
      .bwhs-ann-close {
        position: absolute; top: 8px; right: 12px; background: rgba(255,255,255,.15); border: 0;
        color: #fff; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-weight: 800;
      }
      .ann-text { margin-bottom: 8px; }
      .ann-img { max-width: 100%; max-height: 220px; border-radius: 12px; margin: 8px auto; display: block; }
      .ann-movie { transition: transform .15s; }
      .ann-movie:hover { transform: scale(1.03); }
      @keyframes bwhsSlide { from { transform: translateY(-100%); opacity: 0 } to { transform: none; opacity: 1 } }
      @keyframes bwhsSlideUp { from { transform: translateY(100%); opacity: 0 } to { transform: none; opacity: 1 } }
      @keyframes bwhsPop { from { transform: scale(.85); opacity: 0 } to { transform: scale(1); opacity: 1 } }
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
    var html = data.html || ("<div class='ann-text'>" + (data.text || "").replace(/\n/g, "<br>") + "</div>");

    if (pos === "center") {
      root.innerHTML = `
        <div class="bwhs-ann-modal-wrap" onclick="if(event.target===this) this.parentElement.remove()">
          <div class="bwhs-ann-modal" style="position:relative">
            <button class="bwhs-ann-close" onclick="this.closest('#bwhs-announce-root').remove()">×</button>
            ${html}
          </div>
        </div>`;
    } else {
      var cls = pos === "bottom" ? "bottom" : "top";
      root.innerHTML = `
        <div class="bwhs-ann-banner ${cls}" style="position:relative">
          <button class="bwhs-ann-close" onclick="this.closest('#bwhs-announce-root').remove()">×</button>
          ${html}
        </div>`;
    }

    // Auto-hide after 18s for banners, longer for modal
    var ms = pos === "center" ? 25000 : 16000;
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
      // Small delay so page is ready
      setTimeout(function () { showAnnouncement(v); }, 100);
    });

    // Re-check on fullscreen change for "fullscreen" target
    ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange"].forEach(function (ev) {
      document.addEventListener(ev, function () {
        db.ref("announcements/current").once("value", function (snap) {
          var v = snap.val();
          if (v && v.id === lastId && shouldShow(v.targets || [])) {
            showAnnouncement(v);
          }
        });
      });
    });
  }

  if (window.firebase && firebase.database) {
    start();
  } else {
    load("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js", function () {
      load("https://www.gstatic.com/firebasejs/10.13.2/firebase-database-compat.js", start);
    });
  }
})();
