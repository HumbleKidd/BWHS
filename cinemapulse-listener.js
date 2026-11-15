/* CinemaPulse Live Announcer Listener for BWHS viewers
   Uses a named Firebase app so it never interferes with existing audience presence Firebase.
   Skips the admin audience.html panel completely.
   Listens in real-time and shows the popup on any page.
*/
(function () {
  var path = (location.pathname || "").toLowerCase();
  // Never show on the audience admin panel
  if (path.indexOf("audience.html") !== -1 || path.indexOf("/audience") !== -1) {
    return;
  }

  var CINEMAPULSE_CONFIG = {
    apiKey: "AIzaSyBrOc4fG4Xo4HIMkVHW9ptcfkr1POZI9VA",
    authDomain: "chat-bwhs-films.firebaseapp.com",
    databaseURL: "https://chat-bwhs-films-default-rtdb.firebaseio.com",
    projectId: "chat-bwhs-films",
    storageBucket: "chat-bwhs-films.firebasestorage.app",
    messagingSenderId: "295398658593",
    appId: "1:295398658593:web:edd928af9e81bde7240960",
    measurementId: "G-3WQYZQMKNN"
  };

  var APP_NAME = "cinemapulseApp";

  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = cb;
    s.onerror = function () { console.warn("CinemaPulse: failed to load", src); };
    document.head.appendChild(s);
  }

  function ensureFirebase(cb) {
    if (typeof firebase !== "undefined" && firebase.apps) {
      cb();
      return;
    }
    loadScript("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js", function () {
      loadScript("https://www.gstatic.com/firebasejs/10.13.2/firebase-database-compat.js", cb);
    });
  }

  ensureFirebase(function () {
    try {
      // Named app so it does not clash with any existing default Firebase app
      var app;
      try {
        app = firebase.app(APP_NAME);
      } catch (e) {
        app = firebase.initializeApp(CINEMAPULSE_CONFIG, APP_NAME);
      }
      var db = app.database();
      listen(db);
    } catch (err) {
      console.warn("CinemaPulse init error", err);
    }
  });

  var currentOverlay = null;
  var hideTimer = null;
  var audioPlayer = null;

  function removeOverlay() {
    if (hideTimer) clearInterval(hideTimer);
    if (audioPlayer) {
      try { audioPlayer.pause(); } catch (e) {}
    }
    var el = document.getElementById("cinemapulse-live-overlay");
    if (el) el.remove();
    currentOverlay = null;
  }

  function playChime() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      var freqs = [440, 554.37, 659.25, 880];
      freqs.forEach(function (f, idx) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.42);
      });
    } catch (e) {}
  }

  function showOverlay(data) {
    removeOverlay();
    if (!data || data.hidden) return;

    var style = data.popupStyle || "spotlight";
    var wrapper = document.createElement("div");
    wrapper.id = "cinemapulse-live-overlay";
    wrapper.style.cssText = "position:fixed;inset:0;z-index:999999;pointer-events:none;display:flex;padding:16px;transition:all .3s;";

    if (style === "spotlight") {
      wrapper.style.alignItems = "center";
      wrapper.style.justifyContent = "center";
      wrapper.style.background = "rgba(15,23,42,0.15)";
      wrapper.style.backdropFilter = "blur(2px)";
    } else if (style === "corner") {
      wrapper.style.alignItems = "flex-end";
      wrapper.style.justifyContent = "flex-end";
    } else {
      wrapper.style.alignItems = "flex-start";
      wrapper.style.justifyContent = "center";
    }

    var card = document.createElement("div");
    card.style.cssText = "pointer-events:auto;max-width:420px;width:100%;background:rgba(255,255,255,0.96);backdrop-filter:blur(20px);border-radius:24px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a;animation:cinemapulsePop .45s cubic-bezier(0.22,1,0.36,1);";
    if (style === "banner") card.style.maxWidth = "640px";

    // Progress bar
    var bar = document.createElement("div");
    bar.style.cssText = "height:4px;background:#f1f5f9;overflow:hidden;";
    var fill = document.createElement("div");
    fill.style.cssText = "height:100%;width:100%;background:linear-gradient(90deg,#fbbf24,#f43f5e,#6366f1);transition:width .1s linear;";
    bar.appendChild(fill);
    card.appendChild(bar);

    // Header
    var header = document.createElement("div");
    header.style.cssText = "padding:12px 16px 6px;display:flex;align-items:center;justify-content:space-between;";
    var tag = document.createElement("span");
    tag.style.cssText = "font-size:11px;font-weight:800;color:#fff;background:linear-gradient(90deg,#e11d48,#f59e0b);padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:.5px;";
    tag.textContent = data.tag || "Live";
    var closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.style.cssText = "width:28px;height:28px;border:none;background:#f1f5f9;border-radius:50%;font-size:16px;cursor:pointer;color:#64748b;";
    closeBtn.onclick = removeOverlay;
    header.appendChild(tag);
    header.appendChild(closeBtn);
    card.appendChild(header);

    // Body
    var body = document.createElement("div");
    body.style.cssText = "padding:0 16px 16px;display:flex;flex-direction:column;gap:12px;";

    var row = document.createElement("div");
    row.style.cssText = "display:flex;gap:12px;align-items:flex-start;";

    if (data.mediaType === "image" && data.mediaValue) {
      var img = document.createElement("img");
      img.src = data.mediaValue;
      img.style.cssText = "width:80px;height:80px;object-fit:cover;border-radius:16px;flex-shrink:0;";
      img.onerror = function () { this.style.display = "none"; };
      row.appendChild(img);
    } else if (data.mediaType === "sticker") {
      var sticker = document.createElement("div");
      sticker.style.cssText = "width:80px;height:80px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:40px;";
      var emojis = { popcorn: "🍿", ticket: "🎫", clapper: "🎬", micwave: "🎙️", fire: "🔥", reel: "🎞️" };
      sticker.textContent = emojis[data.mediaValue] || "🎬";
      row.appendChild(sticker);
    }

    var textBox = document.createElement("div");
    textBox.style.flex = "1";
    var h = document.createElement("h3");
    h.style.cssText = "margin:0;font-size:18px;font-weight:800;line-height:1.2;";
    h.textContent = data.headline || "Live Update";
    textBox.appendChild(h);
    if (data.message) {
      var p = document.createElement("p");
      p.style.cssText = "margin:6px 0 0;font-size:13px;color:#475569;line-height:1.4;";
      p.textContent = data.message;
      textBox.appendChild(p);
    }
    row.appendChild(textBox);
    body.appendChild(row);

    // Audio
    if (data.audioType && data.audioType !== "none") {
      var audioBox = document.createElement("div");
      audioBox.style.cssText = "background:linear-gradient(90deg,#fffbeb,#fef2f2,#eef2ff);border-radius:16px;padding:10px;display:flex;align-items:center;gap:10px;";
      var playBtn = document.createElement("button");
      playBtn.innerHTML = "▶";
      playBtn.style.cssText = "width:36px;height:36px;border:none;border-radius:12px;background:#4f46e5;color:#fff;font-size:14px;cursor:pointer;";
      audioBox.appendChild(playBtn);
      var audioLabel = document.createElement("span");
      audioLabel.style.cssText = "font-size:12px;font-weight:700;color:#1e293b;";
      audioLabel.textContent = data.audioTitle || "Host Voice Note";
      audioBox.appendChild(audioLabel);
      body.appendChild(audioBox);

      playBtn.onclick = function () {
        if (data.audioType === "chime") {
          playChime();
        } else if (data.audioDataUrl) {
          if (!audioPlayer) audioPlayer = new Audio();
          audioPlayer.src = data.audioDataUrl;
          audioPlayer.play().catch(function () {});
        }
      };

      if (data.autoplayAudio) {
        setTimeout(function () {
          if (data.audioType === "chime") playChime();
          else if (data.audioDataUrl) {
            if (!audioPlayer) audioPlayer = new Audio();
            audioPlayer.src = data.audioDataUrl;
            audioPlayer.play().catch(function () {});
          }
        }, 300);
      }
    }

    // CTA
    if (data.ctaActive && data.ctaText) {
      var a = document.createElement("a");
      a.href = data.ctaUrl || "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = data.ctaText;
      a.style.cssText = "display:block;text-align:center;padding:12px 16px;border-radius:16px;background:linear-gradient(90deg,#fbbf24,#f43f5e,#6366f1);color:#fff;font-weight:800;text-decoration:none;font-size:14px;margin-top:4px;";
      body.appendChild(a);
    }

    card.appendChild(body);
    wrapper.appendChild(card);
    document.body.appendChild(wrapper);

    // Auto-hide
    if (data.duration && data.duration > 0) {
      var total = data.duration * 1000;
      var start = Date.now();
      hideTimer = setInterval(function () {
        var left = Math.max(0, 100 - ((Date.now() - start) / total) * 100);
        fill.style.width = left + "%";
        if (left <= 0) {
          clearInterval(hideTimer);
          removeOverlay();
        }
      }, 100);
    }

    currentOverlay = data.id || Date.now();
  }

  function listen(db) {
    db.ref("cinemapulse/live").on("value", function (snap) {
      var data = snap.val();
      if (!data || data.hidden) {
        removeOverlay();
        return;
      }
      // Avoid re-showing the same one
      if (currentOverlay && data.id && currentOverlay === data.id) return;
      showOverlay(data);
    });
  }

  // Inject minimal animation style
  var style = document.createElement("style");
  style.textContent = "@keyframes cinemapulsePop{0%{opacity:0;transform:scale(0.84) translateY(20px)}65%{opacity:1;transform:scale(1.03) translateY(-3px)}100%{opacity:1;transform:scale(1) translateY(0)}}";
  document.head.appendChild(style);
})();
