package online.bwhs.clone

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

object Updater {
    private const val API = "https://api.github.com/repos/HumbleKidd/BWHS/releases/latest"
    private const val THIS = "clone-apk-v4"

    fun check(activity: Activity) {
        Executors.newSingleThreadExecutor().execute {
            try {
                val conn = URL(API).openConnection() as HttpURLConnection
                conn.setRequestProperty("User-Agent", "bwhs-clone")
                conn.setRequestProperty("Accept", "application/vnd.github+json")
                val json = JSONObject(conn.inputStream.bufferedReader().readText())
                val tag = json.optString("tag_name")
                if (tag.isBlank() || tag == THIS) return@execute
                val assets = json.optJSONArray("assets") ?: return@execute
                var link = ""
                for (i in 0 until assets.length()) {
                    val asset = assets.getJSONObject(i)
                    if (asset.optString("name").endsWith(".apk")) {
                        link = asset.optString("browser_download_url")
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
            .setMessage("Release $tag is ready. Download and install now?")
            .setPositiveButton("Update") { _, _ -> fetchAndInstall(activity, url) }
            .setNegativeButton("Later", null)
            .show()
    }

    private fun fetchAndInstall(activity: Activity, url: String) {
        val dialog = AlertDialog.Builder(activity).setMessage("Downloading update...").setCancelable(false).show()
        Executors.newSingleThreadExecutor().execute {
            try {
                val file = File(activity.cacheDir, "bwhs-clone.apk")
                val conn = URL(url).openConnection() as HttpURLConnection
                conn.setRequestProperty("User-Agent", "bwhs-clone")
                conn.setRequestProperty("Accept", "application/octet-stream")
                conn.instanceFollowRedirects = true
                conn.inputStream.use { input -> file.outputStream().use { input.copyTo(it) } }
                activity.runOnUiThread {
                    dialog.dismiss()
                    install(activity, file)
                }
            } catch (_: Exception) {
                activity.runOnUiThread {
                    dialog.dismiss()
                    AlertDialog.Builder(activity).setMessage("Download failed. Try again from the release page.").show()
                }
            }
        }
    }

    private fun install(activity: Activity, file: File) {
        if (Build.VERSION.SDK_INT >= 26 && !activity.packageManager.canRequestPackageInstalls()) {
            activity.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + activity.packageName)))
        }
        val uri = FileProvider.getUriForFile(activity, activity.packageName + ".files", file)
        val intent = Intent(Intent.ACTION_VIEW)
            .setDataAndType(uri, "application/vnd.android.package-archive")
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        activity.startActivity(intent)
    }
}
