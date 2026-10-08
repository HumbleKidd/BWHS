package online.bwhs.clone

import android.os.Bundle
import android.view.KeyEvent
import android.webkit.WebView
import androidx.fragment.app.FragmentActivity

class TvActivity : FragmentActivity() {
    private lateinit var web: WebView
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = SiteShell.attach(this)
        web.isFocusable = true
        web.isFocusableInTouchMode = true
        web.requestFocus()
        Updater.check(this)
    }
    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && web.canGoBack()) {
            web.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }
}
