package online.bwhs.clone

import android.app.Activity
import android.app.AlertDialog
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

object Updater {
    private const val API = "https://api.github.com/repos/HumbleKidd/BWHS/releases/latest"
    private const val THIS = "clone-apk-v2"

    fun check(activity: Activity) {
        Executors.newSingleThreadExecutor().execute {
            try {
                val conn = URL(API).openConnection() as HttpURLConnection
                conn.setRequestProperty("User-Agent", "bwhs-clone")
                conn.setRequestProperty("Accept", "application/vnd.github+json")
                val body = conn.inputStream.bufferedReader().readText()
                val json = JSONObject(body)
                val tag = json.optString("tag_name")
                if (tag.isBlank() || tag == THIS) return@execute
                val assets = json.optJSONArray("assets") ?: return@execute
                var link = ""
                for (i in 0 until assets.length()) {
                    val a = assets.getJSONObject(i)
                    if (a.optString("name").endsWith(".apk")) {
                        link = a.optString("browser_download_url")
                        break
                    }
                }
                if (link.isBlank()) return@execute
                val url = link
                activity.runOnUiThread { offer(activity, tag, url) }
            } catch (_: Exception) {
            }
        }
    }

    private fun offer(activity: Activity, tag: String, url: String) {
        if (activity.isFinishing) return
        AlertDialog.Builder(activity)
            .setTitle("Update ready")
            .setMessage("Release $tag is on GitHub. Install it now?")
            .setPositiveButton("Update") { _, _ -> download(activity, url) }
            .setNegativeButton("Later", null)
            .show()
    }

    private fun download(activity: Activity, url: String) {
        val dm = activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val req = DownloadManager.Request(Uri.parse(url))
            .setTitle("BWHS clone")
            .setDestinationInExternalFilesDir(activity, Environment.DIRECTORY_DOWNLOADS, "bwhs-clone.apk")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
        val id = dm.enqueue(req)
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context?, intent: Intent?) {
                val done = intent?.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1) ?: return
                if (done != id) return
                activity.unregisterReceiver(this)
                val file = File(activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "bwhs-clone.apk")
                val uri = FileProvider.getUriForFile(activity, activity.packageName + ".files", file)
                val install = Intent(Intent.ACTION_VIEW)
                    .setDataAndType(uri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                activity.startActivity(install)
            }
        }
        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        if (Build.VERSION.SDK_INT >= 33) activity.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        else activity.registerReceiver(receiver, filter)
    }
}
