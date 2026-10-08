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
      window.open=function(){return null};
      document.querySelectorAll('iframe').forEach(function(f){
        f.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation allow-forms');
      });
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
        s.loadsImagesAutomatically = true
        s.useWideViewPort = true
        s.loadWithOverviewMode = true
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        web.isScrollbarFadingEnabled = true
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
                val url = request?.url?.toString().orEmpty()
                if (url.startsWith("intent:") || url.startsWith("market:")) return true
                if (url.endsWith(".m3u8") || url.endsWith(".mp4")) {
                    activity.startActivity(PlayerActivity.intent(activity, url))
                    return true
                }
                return false
            }
        }
        web.loadUrl(CLONE_URL)
        return web
    }
}
