/* BWHS live audience presence system.
   Tracks real viewers only. Skips the admin audience.html panel.
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
    return;
  }

  function loadScript(src, callback) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = callback;
    s.onerror = function () {
      console.error("Failed to load", src);
    };
    document.head.appendChild(s);
  }

  loadScript("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js", function () {
    loadScript("https://www.gstatic.com/firebasejs/10.13.2/firebase-database-compat.js", start);
  });

  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function detectDevice() {
    var ua = (navigator.userAgent || "").toLowerCase();
    if (/smart-tv|tizen|webos|android tv|fire tv|roku/.test(ua)) return "Smart TV";
    if (/ipad|tablet|kindle/.test(ua)) return "Tablet";
    if (/mobile|iphone|android|webos/.test(ua)) return "Mobile";
    if (/windows|macintosh|linux|cros/.test(ua)) return "Desktop";
    return "Unknown";
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
        var data = {
          page: page,
          at: firebase.database.ServerValue.TIMESTAMP,
          startedAt: startedAt,
          title: document.title || "BWHS",
          userAgent: (navigator.userAgent || "").slice(0, 180),
          device: detectDevice(),
          path: location.pathname + location.hash
        };
        if (watching) data.watching = watching;
        return ref.update(data);
      }

      ref.set({
        page: page,
        at: firebase.database.ServerValue.TIMESTAMP,
        startedAt: startedAt,
        title: document.title || "BWHS",
        userAgent: (navigator.userAgent || "").slice(0, 180),
        device: detectDevice(),
        path: location.pathname + location.hash
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
