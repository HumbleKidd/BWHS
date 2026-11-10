/* BWHS live viewers + views over time.
   Realtime Database presence system. */
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

  var s = document.createElement("script");
  s.src = "https://www.gstatic.com/firebasejs/10.13.2/firebase-database-compat.js";
  s.onload = start;
  s.onerror = function() { console.error("Failed to load Firebase"); };
  document.head.appendChild(s);

  function dayKey(d) {
    d = d || new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function start() {
    try {
      if (!firebase.apps.length) firebase.initializeApp(BWHS_FIREBASE);
      var db = firebase.database();
      var id = sessionStorage.getItem("bwhs_vid") || ("v_" + Math.random().toString(36).slice(2) + Date.now().toString(36));
      sessionStorage.setItem("bwhs_vid", id);
      var page = location.pathname.split("/").pop() || "index.html";
      var ref = db.ref("presence/" + id);
      var today = dayKey();

      ref.onDisconnect().remove().catch(function(e) { console.warn("onDisconnect failed", e); });
      ref.set({
        page: page,
        at: firebase.database.ServerValue.TIMESTAMP,
        startedAt: firebase.database.ServerValue.TIMESTAMP,
        title: document.title || "BWHS",
        userAgent: navigator.userAgent.slice(0, 120)
      }).then(function() {
        console.log("BWHS presence written for", id);
      }).catch(function(e) {
        console.error("Presence write failed", e);
      });

      setInterval(function () {
        ref.update({
          at: firebase.database.ServerValue.TIMESTAMP,
          page: page,
          title: document.title || "BWHS"
        }).catch(function() {});
      }, 25000);

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
          ref.update({ watching: slug });
        },
        liveCount: function (cb) {
          db.ref("presence").on("value", function (snap) {
            var n = 0, now = Date.now();
            snap.forEach(function (ch) {
              var at = (ch.val() || {}).at || 0;
              if (now - at < 90000) n++;
            });
            cb(n);
          });
        }
      };

      var badge = document.getElementById("bwhs-live-badge");
      if (badge) {
        window.BWHSStats.liveCount(function (n) {
          badge.textContent = n + " watching";
        });
      }
    } catch (err) {
      console.error("BWHS stats init error", err);
    }
  }
})();
