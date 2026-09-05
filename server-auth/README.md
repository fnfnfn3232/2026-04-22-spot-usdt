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
- New members enter an email address and choose their own password, then wait for approval in the site admin panel.
- Member passwords must be 8-20 characters, include both an English letter and a number, and cannot repeat the same character more than four times in a row.
- Member passwords are stored only as salted `PBKDF2-SHA256` hashes using 100,000 iterations. Plaintext passwords are never emailed to the administrator or saved in member records. Existing 210,000-iteration hashes remain valid. The current count is chosen to keep signup and login within the Cloudflare Workers Free CPU allowance.
- Approved members log in with their email address and chosen password. When a verified sender is configured, a forgotten password can be reset with a one-time code sent to that member's own email address.
- Membership approval grants main-site access, board reading, and attachment downloads to every approved member. `board-write-approve` separately allows posts, comments, uploads, and managing content. Revoking writing preserves read access; revoking board access removes both. Existing memberships migrate once to read-only under `boardPermissionVersion: 2`; old combined board approvals no longer grant writing. New writing approvals and explicit revocations are preserved after migration. Pending, rejected, and blocked members still cannot log in.
- Members with writing approval may create 3 posts per calendar day in Asia/Seoul. Deleting a post does not refund its quota; comments and edits do not count, and administrators are exempt. The Worker commits the post and per-member daily counter in one storage transaction. Counters are included in daily backups.
- Run `node --test server-auth/board-permissions.test.mjs server-auth/security-regression.test.mjs` from the repository root to check permissions and post limits.

## Required Cloudflare Worker environment variables

- `FRONTEND_ORIGIN`
  - Example: `https://fnfnfn3232.github.io`
- `SITE_PASSWORD_SHA256`
  - SHA-256 hex of the site password.
- `SESSION_SECRET`
  - Long random string used to sign session cookies.
- `RESEND_API_KEY`
  - Optional Resend API key used only by the Worker to send login codes.
- `RESEND_API_KEY_2`
  - Optional key from a second Resend account. Use this when `OTP_EMAIL_TO_2` differs from the first Resend account email and no verified sender domain is configured.
- `OTP_EMAIL_TO`
  - First private destination address for login codes. Keep it as a Worker/GitHub secret.
- `OTP_EMAIL_TO_2`
  - Optional second private destination address. Only these registered addresses can request a code.
- `OTP_EMAIL_FROM`
  - Optional verified sender for member password-reset and status emails, for example `ComaCap <login@your-domain.example>`.
  - Member signup and administrator approval work without this setting.
- `MEMBER_REGISTRATION_ENABLED`
  - Optional. Set to `false` to hide and disable new signup requests without deleting existing members.
- `NEWS_LIMIT`
  - Optional. Coinness currently accepts up to 40 per fetch; keep this at `40`.
- `NEWS_STORE_LIMIT`
  - Optional. The Worker keeps up to 1000 merged Coinness items for paging and search.
- `NEWS_CACHE_SECONDS`
  - Optional. Default/recommended value is `600` seconds, so Coinness is fetched at most about once every 10 minutes per active Worker isolate.
- `BOARD_MEDIA_BUCKET`
  - R2 bucket binding used for board attachments.
  - Recommended bucket name: `coin-board-media`.
  - Keep the bucket private. Downloads should continue through `/api/board/media/...`, where the Worker checks both login and board approval first.

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

Member password login:

```http
POST /api/login/member/password
Content-Type: application/json

{"email":"member@example.com","password":"the member password"}
```

Member signup stores a pending approval request with the email address and password chosen on the site:

```http
POST /api/signup/request
Content-Type: application/json

{"email":"member@example.com","password":"the member password"}
```

The submitted email address is not verified. Review the applicant in the site admin screen and approve only people you recognize. Passwords are stored only as salted PBKDF2 hashes.

If a verified sender is configured, forgotten passwords can be reset with a 10-minute code delivered to the approved member's own email:

```http
POST /api/member/password/reset/request
POST /api/member/password/reset/confirm
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
- `RESEND_API_KEY_2` (optional key for the second destination when using the default Resend test sender)
- `OTP_EMAIL_TO` (optional, required for email code login)
- `OTP_EMAIL_TO_2` (optional second permitted email address)
- `OTP_EMAIL_FROM` (optional; use a Resend-verified sender domain for member password-reset and status emails)

The deploy workflow creates and uses two private R2 buckets:

- `coin-board-media`: live board attachments
- `coin-site-backups`: encrypted database snapshots and attachment backup copies

No public R2 URL or download route is enabled for `coin-site-backups`. The Cloudflare API token needs permission to deploy Workers and manage/read/write R2 buckets.

## Automatic R2 backups

The Worker runs a scheduled backup every day at 03:17 KST (18:17 UTC).

- Database data is serialized and encrypted with AES-256-GCM before it is written to `database/YYYY-MM-DD.cbk`.
- Daily database snapshots are kept for at least 30 days, with a one-day pruning safety margin after the lock expires.
- R2 attachment chunks are copied incrementally to the `media/` prefix. A scheduled run copies up to 50 missing chunks so normal Worker traffic is not crowded out.
- Legacy attachments that still live in the Durable Object are copied to `legacy-media/`.
- Deleting a live attachment does not automatically delete its backup copy.
- The latest successful run summary is stored privately as `status/latest.json`.
- R2 bucket lock rules protect `database/`, `media/`, and `legacy-media/` objects from deletion or overwrite for 30 days. `status/latest.json` stays unlocked so the daily status can be updated.
- The deploy workflow preserves unrelated bucket lock rules and fails deployment if these three protection rules cannot be applied and verified.

The encryption key is derived from `BACKUP_ENCRYPTION_KEY` when that optional Worker secret exists. Otherwise the existing `SESSION_SECRET` is used, so no extra setup is required. Keep the secret used for encryption: changing or losing it makes older encrypted snapshots impossible to restore.

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
