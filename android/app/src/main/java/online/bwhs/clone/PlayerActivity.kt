package online.bwhs.clone

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.common.MediaItem
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView

@OptIn(UnstableApi::class)
class PlayerActivity : AppCompatActivity() {
    private var player: ExoPlayer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val view = PlayerView(this)
        setContentView(view)
        val url = intent.getStringExtra(EXTRA_URL) ?: return finish()
        val exo = ExoPlayer.Builder(this).build()
        player = exo
        view.player = exo
        view.useController = true
        exo.setMediaItem(MediaItem.fromUri(Uri.parse(url)))
        exo.prepare()
        exo.playWhenReady = true
    }

    override fun onStop() {
        player?.release()
        player = null
        super.onStop()
    }

    companion object {
        private const val EXTRA_URL = "url"
        fun intent(context: Context, url: String) =
            Intent(context, PlayerActivity::class.java).putExtra(EXTRA_URL, url)
    }
}
