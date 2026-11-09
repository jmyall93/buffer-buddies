# Buffer Buddies v1.4 — Five-account configuration

The v1.3 TV interface, US/Canadian-only channel filtering, EPG, favourites and Fire TV browser support are unchanged. The D1 schema now enforces a maximum of five user accounts. Usernames are case-insensitive and stored in lowercase: **Jeff signs in as `Jeff` or `jeff`**.

## First account

No account has been created or deployed yet. On a trusted computer, after creating your D1 database and running `schema.sql`, run:

```bash
node create-users.mjs Jeff
```

The helper asks for a password and generates a salted PBKDF2 password hash and SQL statement. Run that SQL in the Cloudflare D1 console. Repeat for up to four additional accounts. Do **not** put passwords or generated SQL in GitHub.

**Security note:** The requested temporary password `password` is deliberately not embedded in the package. The existing provisioning helper rejects passwords shorter than 12 characters. Choose a unique 12+ character password when you provision Jeff, and don't reuse credentials from other services. There is no built-in password change or reset UI yet.

**Concurrent viewers:** Five accounts does not increase the planned simultaneous-viewer target of two. Actual concurrency is source-dependent and not yet enforced in code.

---

# Buffer Buddies v1.3 — Fire TV interface refresh

A redesigned remote-friendly browser experience based on the approved purple/cyan TV guide concept. This is a functional web prototype, **not a native Fire TV APK**. The logo in the app is currently an emoji placeholder; the approved mascot artwork is a design reference, not an embedded production asset.

### What changed
- Full dark TV layout, side navigation, preview player, channel browser and horizontal 30-minute EPG grid.
- EPG grid displays matching imported XMLTV programme titles; missing schedules are explicitly labelled.
- Sports and favourites shortcuts, focus styles and responsive mobile preview.
- US/Canada filtering, login, D1 sessions and per-user cloud favourites retained from v1.2.

### Important limitations
- Browser-local M3U/XMLTV import remains unchanged; no automatic EPG refresh or synced catalogues.
- Fire TV browser playback and remote behavior require physical testing. Some streams may fail due to codecs, CORS or rights.
- The UI supports large playlists but initially renders up to 150 channel buttons and 12 guide rows.
- No licensed premium streams, VOD library, native APK, or DRM bypass.

# Buffer Buddies v1.2 — Private IPTV prototype

Cloudflare Worker + D1 + static Fire TV-friendly web client. Supports two manually provisioned accounts, server-side favourites, M3U catalogues, XMLTV guide file import and HLS playback. This is a development prototype, not a native Fire TV APK or licensed channel service.

## Setup

1. Install Node.js 20+ and Wrangler: `npm install -g wrangler`.
2. `wrangler login`
3. `wrangler d1 create buffer-buddies` and paste the returned database ID into `wrangler.jsonc`.
4. `wrangler d1 execute buffer-buddies --remote --file=schema.sql`
5. On your trusted local machine, run `node create-users.mjs viewer1` and `node create-users.mjs viewer2` (use strong unique passwords). Each prints an INSERT statement. Execute each statement in the Cloudflare D1 console (or Wrangler CLI). **Do not commit SQL containing password hashes to GitHub.**
6. Deploy: `wrangler deploy`. Open the Worker URL and log in.
7. Import an authorized M3U file or try the public catalogue; import an XMLTV file with matching `tvg-id`/`channel` identifiers to display now/next schedules.

## Fire TV Stick 4K / 4K Max

Open the deployed HTTPS URL in a compatible Fire TV browser for an initial test. The interface has large buttons, focus indicators and basic arrow-key navigation. This is **not yet an installable native Fire TV app**. Fire TV browser playback is subject to browser codec, HLS/CORS and source restrictions; test real channels before relying on it. A native Android/Fire OS player is a later milestone.

## Security and limitations

- Account registration is disabled; only manually provision the intended two viewers.
- PBKDF2-SHA256 210,000 iterations and per-user random salts protect stored passwords. Cookies are HttpOnly, Secure, SameSite=Lax and expire after 7 days. Session tokens are hashed in D1.
- Use HTTPS only. Add Cloudflare WAF rate limiting to `/api/login` before exposing publicly. There is no built-in login throttling, password reset, MFA, or session management UI yet.
- Favourites are stored per account in D1; playlists and XMLTV guide files are loaded locally in the browser, not synced between devices. Large XMLTV files may be memory-intensive.
- The public catalogue is community-maintained and its listings are **not individually verified for content rights, geographic availability or uptime**. Use only streams you are authorized to view.
- 10,000+ entries are supported as catalogue records, not a guarantee of 10,000 working channels. The interface renders the first 150 matching entries at a time to reduce DOM load.
- No server-side video relay, DRM bypass, recording, VOD library, automated EPG refresh, health monitoring, or guaranteed two simultaneous streams. Concurrent playback depends on source rights and capacity.
- Do not use Cloudflare Workers as an unrestricted proxy for third-party streams.

## Files

- `public/index.html` — Fire TV-friendly browser interface
- `src/worker.js` — login/session/favourites APIs
- `schema.sql` — D1 database tables
- `create-users.mjs` — local password-hash and SQL helper
- `wrangler.jsonc` — deployment configuration (replace D1 ID)


## US/Canada-only catalogue rules (v1.2)

- The built-in public loader requests `countries/us.m3u` and `countries/ca.m3u` only, and de-duplicates identical stream URLs/EPG IDs. These country playlists are maintained by third parties; their metadata and rights are not independently verified.
- Manually imported M3U entries must explicitly declare `tvg-country="US"`, `tvg-country="CA"`, `country="US"` or `country="CA"` in `#EXTINF`. Entries with unknown country metadata are excluded rather than guessed from channel name. A tag is not proof of rights or country of origin.
- XMLTV programme entries are retained only when `programme channel` matches the `tvg-id` of a retained US/Canadian channel. Entries with missing IDs cannot be matched.
- Previously saved favourites remain in D1 but will not appear unless their channel is in the currently filtered catalogue. Existing user rows remain unchanged. The cookie name changes from `rt_session` to `bb_session`, so viewers must sign in again.
- If upgrading an existing deployment, keep the existing D1 database ID in `wrangler.jsonc` instead of creating a new database; `database_name` can be changed back to the existing D1 name. Do not rerun account provisioning or delete D1.
- Imported playlists and EPG remain browser-local; accounts and favourites remain cloud-backed. A Fire TV browser prototype is **not** a native Fire TV APK.
- This project does not supply premium channels or bypass DRM, geo-restrictions, or subscriptions.
