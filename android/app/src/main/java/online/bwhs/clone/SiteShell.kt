package online.bwhs.clone

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout

object SiteShell {
    const val CLONE_URL = "https://bwhs.online/clone/"
    private const val GUARD = """
      (function(){
        if (window.__bwhsControls) return;
        window.__bwhsControls = 1;
        window.open = function(){ return null; };
        var css = document.createElement('style');
        css.textContent = [
          '.video-viewport{position:relative}',
          '.video-viewport iframe, iframe#playerFrame{pointer-events:none !important}',
          '.bwhs-ui{position:absolute;inset:0;z-index:90;display:flex;flex-direction:column;justify-content:flex-end}',
          '.bwhs-mid{position:absolute;left:0;right:0;top:0;bottom:54px;display:flex;align-items:center;justify-content:center;gap:28px}',
          '.bwhs-big{width:84px;height:84px;border:0;border-radius:50%;background:rgba(0,0,0,.62);color:#fff;font-size:34px}',
          '.bwhs-skip{width:54px;height:54px;border:0;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;font-size:18px}',
          '.bwhs-bar{display:flex;align-items:center;gap:8px;padding:8px 10px;background:linear-gradient(transparent,rgba(0,0,0,.8));color:#fff;font:13px sans-serif}',
          '.bwhs-bar input{flex:1}',
          '.bwhs-bar button{border:0;background:transparent;color:#fff;font-size:16px}'
        ].join('');
        document.documentElement.appendChild(css);
        function tell(frame, payload){
          try { frame.contentWindow.postMessage(payload, '*'); } catch(e) {}
        }
        function mount(vp){
          if (!vp || vp.querySelector('.bwhs-ui')) return;
          var frame = vp.querySelector('iframe');
          if (frame) {
            frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation allow-forms');
            frame.style.pointerEvents = 'none';
          }
          var ui = document.createElement('div');
          ui.className = 'bwhs-ui';
          ui.innerHTML = '<div class="bwhs-mid"><button class="bwhs-skip" data-act="back">-10</button><button class="bwhs-big" data-act="toggle">||</button><button class="bwhs-skip" data-act="fwd">+10</button></div><div class="bwhs-bar"><button data-act="toggle">Play</button><input type="range" min="0" max="1000" value="0"><span class="bwhs-time">0:00</span><button data-act="fs">Full</button></div>';
          vp.appendChild(ui);
          var paused = false, pos = 0, timer = null;
          var big = ui.querySelector('.bwhs-big');
          var label = ui.querySelector('.bwhs-bar button');
          var range = ui.querySelector('input');
          var time = ui.querySelector('.bwhs-time');
          function fmt(s){ s=Math.floor(s); return Math.floor(s/60)+':' + String(s%60).padStart(2,'0'); }
          function paint(){ time.textContent = fmt(pos); range.value = Math.min(1000, pos); }
          function play(){
            paused = false; big.textContent = '||'; label.textContent = 'Pause';
            if (frame) tell(frame, {event:'command',func:'playVideo'});
            clearInterval(timer);
            timer = setInterval(function(){ pos += 1; paint(); }, 1000);
          }
          function pause(){
            paused = true; big.textContent = '>'; label.textContent = 'Play';
            clearInterval(timer);
            if (frame) tell(frame, {event:'command',func:'pauseVideo'});
          }
          ui.addEventListener('click', function(e){
            e.preventDefault(); e.stopPropagation();
            var act = e.target.getAttribute && e.target.getAttribute('data-act');
            if (act === 'toggle') { paused ? play() : pause(); }
            else if (act === 'back') { pos = Math.max(0, pos-10); paint(); }
            else if (act === 'fwd') { pos += 10; paint(); }
            else if (act === 'fs') {
              var node = vp;
              if (document.fullscreenElement) document.exitFullscreen();
              else if (node.requestFullscreen) node.requestFullscreen();
            }
          }, true);
          range.addEventListener('input', function(){ pos = Number(range.value); time.textContent = fmt(pos); });
          play();
        }
        document.querySelectorAll('.video-viewport').forEach(mount);
        new MutationObserver(function(){ document.querySelectorAll('.video-viewport').forEach(mount); })
          .observe(document.documentElement, {childList:true, subtree:true});
      })();
    """

    @SuppressLint("SetJavaScriptEnabled")
    fun attach(activity: Activity): WebView {
        val root = FrameLayout(activity)
        root.setBackgroundColor(Color.BLACK)
        activity.setContentView(root)
        val web = WebView(activity)
        root.addView(web, FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ))
        val s = web.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.mediaPlaybackRequiresUserGesture = false
        s.javaScriptCanOpenWindowsAutomatically = false
        s.setSupportMultipleWindows(false)
        s.cacheMode = WebSettings.LOAD_DEFAULT
        s.useWideViewPort = true
        s.loadWithOverviewMode = true
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        web.overScrollMode = View.OVER_SCROLL_NEVER
        var custom: View? = null
        var callback: WebChromeClient.CustomViewCallback? = null
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowCustomView(view: View?, cb: CustomViewCallback?) {
                if (custom != null) { cb?.onCustomViewHidden(); return }
                custom = view
                callback = cb
                view?.let {
                    root.addView(it, FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    ))
                }
                web.visibility = View.GONE
            }
            override fun onHideCustomView() {
                custom?.let { root.removeView(it) }
                custom = null
                callback?.onCustomViewHidden()
                callback = null
                web.visibility = View.VISIBLE
            }
            override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: android.os.Message?): Boolean = false
        }
        web.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                view?.evaluateJavascript(GUARD, null)
            }
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val uri = request?.url ?: return true
                val url = uri.toString()
                val host = uri.host.orEmpty()
                if (url.startsWith("intent:") || url.startsWith("market:") || url.startsWith("tel:")) return true
                if (url.endsWith(".m3u8") || url.endsWith(".mp4")) {
                    activity.startActivity(PlayerActivity.intent(activity, url))
                    return true
                }
                if (request.isForMainFrame && host.isNotEmpty() && !host.endsWith("bwhs.online")) return true
                return false
            }
        }
        web.loadUrl(CLONE_URL)
        return web
    }
}
