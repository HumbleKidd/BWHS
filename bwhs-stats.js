/* BWHS live audience presence system.
   Tracks real viewers only. Skips the admin audience.html panel and bots.
   No public-facing live counts. Aggregates only for popular titles. */
(function () {
  var BWHS_FIREBASE = {
    apiKey: "AIzaSyBZhtlZRaWQPxFPEP02toZnsFQWOPvbUJA",
    authDomain: "bwhs-audience.firebaseapp.com",
    databaseURL: "https://bwhs-audience-default-rtdb.firebaseio.com",
    projectId: "bwhs-audience",
    storageBucket: "bwhs-audience.firebasestorage.app",
    messagingSenderId: "481701919126",
    appId: "1:481701919126:web:bc6cf2c0dc5d61f4ff85b7"
  };

  // Never track the admin panel itself
  var path = (location.pathname || "").toLowerCase();
  if (path.indexOf("audience.html") !== -1 || path.indexOf("/audience") !== -1) {
    console.log("[BWHS] Admin panel detected — presence tracking skipped.");
    try { localStorage.setItem("bwhs_is_owner", "1"); } catch(e){}
    return;
  }
  // Owner exclusion
  try {
    if (localStorage.getItem("bwhs_is_owner") === "1") {
      console.log("[BWHS] Owner browser detected — presence tracking skipped.");
      return;
    }
  } catch(e){}

  // Skip obvious bots / crawlers / headless
  var uaRaw = navigator.userAgent || "";
  var ua = uaRaw.toLowerCase();
  if (!ua || /bot|crawler|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|phantom|selenium|puppeteer|playwright|curl|wget|python-requests|go-http|axios|node-fetch/.test(ua)) {
    console.log("[BWHS] Bot / non-browser detected — presence tracking skipped.");
    return;
  }

  function loadScript(src, callback) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = callback;
    s.onerror = function () { console.error("Failed to load", src); };
    document.head.appendChild(s);
  }

  loadScript("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js", function () {
    loadScript("https://www.gstatic.com/firebasejs/10.13.2/firebase-database-compat.js", start);
  });

  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function detectDevice(userAgent) {
    var u = (userAgent || navigator.userAgent || "").toLowerCase();
    if (!u) return "Other";

    // Smart TVs / streaming sticks
    if (/smart-tv|smarttv|tizen|webos|web0s|android tv|googletv|fire tv|firetv|roku|bravia|netcast|viera|nettv|appletv|hbbtv|vidaa|philips|hisense|tcl|mi box|chromecast/.test(u)) {
      return "Smart TV";
    }
    // Tablets (check before mobile)
    if (/ipad|tablet|kindle|silk|playbook|nexus 7|nexus 10|galaxy tab|sm-t|lenovo tab|huawei mediapad|mi pad/.test(u) && !/mobile/.test(u)) {
      return "Tablet";
    }
    // Mobile phones
    if (/mobile|iphone|ipod|android.*mobile|blackberry|bb10|opera mini|iemobile|wpdesktop|webos|fennec|meego/.test(u)) {
      return "Mobile";
    }
    // Desktop / laptop
    if (/windows|macintosh|mac os|linux|cros|chrome os|ubuntu|fedora|x11/.test(u) || /mozilla/.test(u) && /gecko/.test(u)) {
      return "Desktop";
    }
    return "Other";
  }

  function start() {
    try {
      if (typeof firebase === "undefined") return;
      if (!firebase.apps.length) firebase.initializeApp(BWHS_FIREBASE);
      var db = firebase.database();

      var id = sessionStorage.getItem("bwhs_vid") || ("v_" + Math.random().toString(36).slice(2) + Date.now().toString(36));
      sessionStorage.setItem("bwhs_vid", id);

      var page = location.pathname.split("/").pop() || "index.html";
      if (page === "24-autoplay.html") page = "24/7 PLAY";
      if (page === "index.html" || page === "") page = "Home";

      var ref = db.ref("presence/" + id);
      var today = dayKey();
      var startedAt = Date.now();

      ref.onDisconnect().remove().catch(function () {});

      function currentWatching() {
        var t = document.title || "";
        if (t && t.indexOf("BWHS") !== -1) {
          t = t.replace(/\s*[·\-|]\s*BWHS.*$/i, "").replace(/^BWHS\s*[-–—]\s*/i, "").trim();
        }
        if (t && t.length > 2 && t !== "Loading Feature..." && t !== "Loading Player...") return t.slice(0, 100);
        var el = document.querySelector("#playerPageTitle, .player-title-main, .hero-title, #heroTitle, .film-title");
        if (el && el.textContent) return el.textContent.trim().slice(0, 100);
        return "";
      }

      function writePresence() {
        var watching = currentWatching();
        var device = detectDevice();
        var data = {
          page: page,
          at: firebase.database.ServerValue.TIMESTAMP,
          startedAt: startedAt,
          title: document.title || "BWHS",
          userAgent: (navigator.userAgent || "").slice(0, 220),
          device: device,
          path: location.pathname + location.hash,
          real: true
        };
        if (watching) data.watching = watching;
        return ref.update(data);
      }

      ref.set({
        page: page,
        at: firebase.database.ServerValue.TIMESTAMP,
        startedAt: startedAt,
        title: document.title || "BWHS",
        userAgent: (navigator.userAgent || "").slice(0, 220),
        device: detectDevice(),
        path: location.pathname + location.hash,
        real: true
      }).then(function () {
        writePresence();
      }).catch(function (e) {
        console.warn("Presence write failed", e);
      });

      setInterval(function () {
        writePresence().catch(function () {});
      }, 15000);

      var titleObs = new MutationObserver(function () {
        writePresence().catch(function () {});
      });
      var titleEl = document.querySelector("title");
      if (titleEl) titleObs.observe(titleEl, { childList: true, characterData: true, subtree: true });

      var pTitle = document.getElementById("playerPageTitle");
      if (pTitle) {
        var pObs = new MutationObserver(function () { writePresence().catch(function () {}); });
        pObs.observe(pTitle, { childList: true, characterData: true, subtree: true });
      }

      function bump(path, by) {
        db.ref(path).transaction(function (cur) { return (cur || 0) + (by || 1); });
      }

      if (!sessionStorage.getItem("bwhs_counted_" + today)) {
        sessionStorage.setItem("bwhs_counted_" + today, "1");
        bump("stats/totals/visits", 1);
        bump("stats/days/" + today + "/visits", 1);
      }
      bump("stats/totals/pageLoads", 1);
      bump("stats/days/" + today + "/pageLoads", 1);
      bump("stats/pages/" + page.replace(/\./g, "_"), 1);

      window.BWHSStats = {
        ready: true,
        db: db,
        watchTitle: function (name) {
          if (!name) return;
          var slug = String(name).slice(0, 80).replace(/[.#$\/\[\]]/g, "_");
          bump("stats/titles/" + slug, 1);
          ref.update({ watching: name.slice(0, 100), at: firebase.database.ServerValue.TIMESTAMP });
        },
        liveCount: function (cb) {
          db.ref("presence").on("value", function (snap) {
            var n = 0, now = Date.now();
            snap.forEach(function (ch) {
              var v = ch.val() || {};
              var at = v.at || 0;
              if (now - at < 45000) n++;
            });
            if (typeof cb === "function") cb(n);
          });
        }
      };
    } catch (err) {
      console.error("BWHS stats init error", err);
    }
  }
})();
