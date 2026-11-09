# Buffer Buddies v1.5 — Guest Mode

This version removes the login page and automatically imports the **US and Canada** country playlists from iptv-org when the application opens.

## Deploy through GitHub + Cloudflare
1. Download and unzip this release.
2. Replace `public/index.html`, `src/worker.js`, and `wrangler.jsonc` in the existing GitHub repository with these files. Keep their folder paths exactly as shown.
3. Commit the changes. Your Cloudflare GitHub build using `npx wrangler deploy` should run automatically.
4. Open your existing `workers.dev` URL and refresh. There is no login; the channel list loads automatically.

## Important
- **This deployment is public to anyone with its URL.** There is no authentication. Do not use it for private data. Use Cloudflare Access or another access control if privacy is important.
- Your existing D1 database and accounts are **not deleted**. v1.5 simply does not use them. The D1 binding was removed from the release's `wrangler.jsonc` so the app no longer requires D1.
- Favourites are saved to browser `localStorage` on each device, not synced between devices.
- Channel list downloads depend on iptv-org and the viewer's browser being able to access the playlist URLs. Entries are not validated for playback or rights. Some streams may fail due to CORS, geoblocking, codec support or source outages.
- Only country playlists for `us` and `ca` are requested. Imported M3U files must include US/CA country tags to be accepted.
- EPG remains manual XMLTV import and only matches channels by their `tvg-id`. It is not automatically populated.
- Native Fire TV APK is not included; this remains a web app.
