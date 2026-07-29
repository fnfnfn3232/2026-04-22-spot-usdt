# Server-side login option

GitHub Pages is static hosting. A password written in `index.html` only hides the screen; it does not protect `data.js` or API responses. Real login validation needs a server API that checks the password before returning protected data.

This folder contains a Cloudflare Worker template for that server API.

The current frontend is wired to use this API when `window.SERVER_AUTH_API_BASE` is set before the main script runs. Until a Worker URL is configured, the existing client-side lock remains as a fallback so the live site does not break.

## What changes

- Password is not stored in `index.html`.
- Browser sends password to `/api/login`.
- Worker validates it against a secret hash stored in Cloudflare environment variables.
- Worker sets an `HttpOnly` session cookie.
- Protected APIs, such as `/api/news`, return data only when that cookie is valid.
- Coinness news is stored and returned as preview-only data. Full original text is intentionally not stored.
- Board attachments can be stored in the private Cloudflare R2 bucket bound as `BOARD_MEDIA_BUCKET`.

## Required Cloudflare Worker environment variables

- `FRONTEND_ORIGIN`
  - Example: `https://fnfnfn3232.github.io`
- `SITE_PASSWORD_SHA256`
  - SHA-256 hex of the site password.
- `SESSION_SECRET`
  - Long random string used to sign session cookies.
- `RESEND_API_KEY`
  - Optional Resend API key used only by the Worker to send login codes.
- `OTP_EMAIL_TO`
  - Optional private destination address for login codes. Keep it as a Worker/GitHub secret.
- `OTP_EMAIL_FROM`
  - Optional sender. The default deployment uses `코마캡 <onboarding@resend.dev>`.
- `NEWS_LIMIT`
  - Optional. Coinness currently accepts up to 40 per fetch; keep this at `40`.
- `NEWS_STORE_LIMIT`
  - Optional. The Worker keeps up to 1000 merged Coinness items for paging and search.
- `NEWS_CACHE_SECONDS`
  - Optional. Default/recommended value is `600` seconds, so Coinness is fetched at most about once every 10 minutes per active Worker isolate.
- `BOARD_MEDIA_BUCKET`
  - R2 bucket binding used for board attachments.
  - Recommended bucket name: `coin-board-media`.
  - Keep the bucket private. Downloads should continue through `/api/board/media/...`, where the Worker checks login first.

## Generate password hash

In PowerShell:

```powershell
$password = "your-password-here"
$bytes = [Text.Encoding]::UTF8.GetBytes($password)
$hash = [Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
($hash | ForEach-Object { $_.ToString("x2") }) -join ""
```

## API shape

Login:

```http
POST /api/login
Content-Type: application/json

{"password":"..."}
```

News:

```http
GET /api/news?limit=40&offset=0&q=검색어
Cookie: coin_board_session=...
```

Logout:

```http
POST /api/logout
```

## Important limitation

This protects data served by the Worker. It does not protect any data that is still committed into public `data.js`, `board_snapshot.json`, or the GitHub repository. News lists should stay in the Worker store instead of the GitHub Pages data files.

Also, do not reuse the old client-side password as the Worker password after deployment. The old password has already existed in public frontend code. Use a new password when setting `SITE_PASSWORD_SHA256`.

## Frontend hookup

After the Worker is deployed, add this before the main inline script in `index.html`:

```html
<script>
  window.SERVER_AUTH_API_BASE = "https://coin-board-auth.your-subdomain.workers.dev";
</script>
```

Then remove the legacy client-side fallback password from `index.html` once the Worker login is confirmed.

## Deploy with GitHub Actions

This repo includes `.github/workflows/deploy-worker.yml`.

Add these GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `SITE_PASSWORD_SHA256`
- `SESSION_SECRET`
- `RESEND_API_KEY` (optional, required for email code login)
- `OTP_EMAIL_TO` (optional, required for email code login)

The deploy workflow also creates/uses the private R2 bucket named `coin-board-media`. The Cloudflare API token needs permission to deploy Workers and manage/read/write R2 buckets.

Korean GitHub menu path:

1. Repository page
2. `Settings`
3. `Secrets and variables`
4. `Actions`
5. `New repository secret`

After all four secrets are added:

1. Go to `Actions`
2. Select `Deploy Cloudflare Worker`
3. Select `Run workflow`

The Worker name is `coin-board-auth`. After a successful deploy, Cloudflare will show a URL similar to:

```text
https://coin-board-auth.<your-subdomain>.workers.dev
```

Use that URL as `window.SERVER_AUTH_API_BASE`.

Last deployment trigger prepared at 2026-06-12 17:16:37 +09:00.
