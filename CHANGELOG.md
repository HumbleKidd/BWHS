# BWHS changelog

## 2026-10-07 — 24/7 PLAY sync lock + mobile reload

### Mobile reload
- Removed the fixed Reload button that sat over the bottom text on phones.
- Reload is now a small faded icon at the far left of the movie title.
- It stays out of the title, synopsis, and missed-films row. It is only there if a device needs a manual refresh.

### Same film, same moment, every device
- The channel no longer builds a private playlist per device. That was why the mini PC could be on a different film and a different missed list.
- Every device now uses the same locked daily catalog and the same Jamaica channel clock.
- Old `bwhs24` browser caches are cleared on load so a stale reel cannot keep playing.
- The player joins at the shared timestamp, preloads the next film, and swaps at the boundary.
- If a tab was in the background, or the clock lock arrives late, it seeks back to the shared position instead of staying drifted.
- Regular view and fullscreen use the same player, so both stay on the channel.

Hard refresh `24-autoplay.html` once on each device (laptop, phones, mini PC) so they drop the old cached page.
