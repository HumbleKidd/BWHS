/* BWHS Live Announcer — real-time banner, no reload */
(function() {
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

  function start() {
    if (!firebase.apps.length) firebase.initializeApp(CFG);
    var db = firebase.database();
    var lastId = 0;

    // Create banner
    var bar = document.createElement("div");
    bar.id = "bwhs-announce-bar";
    bar.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(90deg,#4f46e5,#ec4899);color:#fff;padding:14px 18px;font-family:system-ui,sans-serif;font-size:0.95rem;font-weight:700;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.3);transform:translateY(-120%);transition:transform .4s cubic-bezier(.2,.8,.2,1);pointer-events:none;";
    bar.innerHTML = '<span id="bwhs-announce-text"></span>';
    document.body.appendChild(bar);

    function show(text) {
      document.getElementById("bwhs-announce-text").textContent = text;
      bar.style.transform = "translateY(0)";
      bar.style.pointerEvents = "auto";
      clearTimeout(bar._t);
      bar._t = setTimeout(function() {
        bar.style.transform = "translateY(-120%)";
        bar.style.pointerEvents = "none";
      }, 12000);
    }

    db.ref("announcements/current").on("value", function(snap) {
      var v = snap.val();
      if (!v || !v.text || v.id === lastId) return;
      lastId = v.id;
      show(v.text);
    });
  }

  if (window.firebase && firebase.database) {
    start();
  } else {
    load("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js", function() {
      load("https://www.gstatic.com/firebasejs/10.13.2/firebase-database-compat.js", start);
    });
  }
})();
