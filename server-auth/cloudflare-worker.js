const COINNESS_NEWS_ENDPOINT = "https://api.coinness.com/feed/v1/breaking-news";
const COOKIE_NAME = "coin_board_session";
const PARTITIONED_COOKIE_NAME = "__Host-coin_board_session_partitioned";
const SESSION_TTL_SECONDS = 24 * 60 * 60;
const BOARD_POSTS_KEY = "free-board-posts";
const BOARD_ADMIN_LOGS_KEY = "free-board-admin-logs";
const BOARD_CATEGORIES_KEY = "free-board-categories";
const USAGE_STATS_KEY = "usage-stats-v1";
const NEWS_STORE_KEY = "coinness-news-store-v1";
const MARKET_DATA_KEY = "market-data-v1";
const MARKET_DATA_CHUNK_PREFIX = "market-data-v1:chunk:";
const SCREEN_SETTINGS_KEY = "screen-settings-v1";
const LOGIN_ATTEMPT_KEY_PREFIX = "login-attempt:";
const EMAIL_OTP_KEY_PREFIX = "email-login-otp:";
const EMAIL_OTP_RATE_KEY_PREFIX = "email-login-rate:";
const EMAIL_OTP_CURRENT_KEY_PREFIX = "email-login-current:";
const EMAIL_OTP_GLOBAL_RATE_KEY = "email-login-global-rate";
const EMAIL_OTP_SIGNUP_GLOBAL_RATE_KEY = "email-signup-global-rate";
const MEMBER_PASSWORD_ATTEMPT_KEY_PREFIX = "member-password-attempt:";
const MEMBER_PASSWORD_RESET_KEY_PREFIX = "member-password-reset:";
const MEMBER_PASSWORD_RESET_GLOBAL_RATE_KEY = "member-password-reset-global-rate";
const MEMBER_SIGNUP_RATE_KEY_PREFIX = "member-signup-rate-v2:";
const MEMBER_SIGNUP_GLOBAL_RATE_KEY = "member-signup-global-rate-v2";
const MEMBERS_KEY = "site-members-v1";
const MEMBER_MAX_ITEMS = 200;
const BOARD_MAX_POSTS = 200;
const BOARD_MAX_MEDIA = 10;
const BOARD_MAX_COMMENTS = 100;
const BOARD_ADMIN_LOG_LIMIT = 100;
const BOARD_CATEGORY_LIMIT = 30;
const DEFAULT_BOARD_CATEGORIES = [
  { value: "free", label: "자유게시판" },
  { value: "image", label: "이미지" },
  { value: "video", label: "영상" },
  { value: "game", label: "게임" },
  { value: "usemap", label: "스타크래프트" },
  { value: "info", label: "정보" },
];
const NEWS_STORE_MAX_ITEMS = 1000;
const NEWS_PAGE_MAX_ITEMS = 40;
const BOARD_MEDIA_KEY_PREFIX = "free-board-media:";
const BOARD_MEDIA_MAX_BYTES = 200 * 1024 * 1024;
const BOARD_MEDIA_CHUNK_BYTES = 1024 * 1024;
const BOARD_MEDIA_R2_CHUNK_BYTES = 8 * 1024 * 1024;
const BOARD_MEDIA_R2_PARALLEL_CHUNKS = 4;
const BOARD_MEDIA_R2_KEY_PREFIX = "free-board-media";
const BOARD_MEDIA_UPLOAD_KEY_PREFIX = `${BOARD_MEDIA_KEY_PREFIX}upload:`;
const BOARD_MEDIA_UPLOAD_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const MARKET_DATA_MAX_BYTES = 8 * 1024 * 1024;
const MARKET_DATA_CHUNK_CHARS = 256 * 1024;
const LIVE_PRICE_FETCH_TIMEOUT_MS = 12000;
const LIVE_PRICE_UPBIT_BATCH_SIZE = 80;
const LIVE_PRICE_BITHUMB_BATCH_SIZE = 80;
const GITHUB_PAGES_MONTHLY_SOFT_LIMIT_BYTES = 100 * 1024 * 1024 * 1024;
const USAGE_BEACON_MAX_BYTES = 25 * 1024 * 1024;
const DEFAULT_NEWS_CACHE_SECONDS = 10 * 60;
const LOGIN_FAILURE_LIMIT = 10;
const LOGIN_LOCK_MS = 30 * 60 * 1000;
const EMAIL_OTP_TTL_MS = 60 * 1000;
const EMAIL_OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const EMAIL_OTP_HOURLY_LIMIT = 5;
const EMAIL_OTP_GLOBAL_HOURLY_LIMIT = 10;
const EMAIL_OTP_VERIFY_LIMIT = 5;
const MEMBER_PASSWORD_MIN_LENGTH = 8;
const MEMBER_PASSWORD_MAX_LENGTH = 20;
const MEMBER_PASSWORD_LEGACY_ITERATIONS = 210000;
const MEMBER_PASSWORD_ITERATIONS = 100000;
const MEMBER_PASSWORD_RESET_TTL_MS = 10 * 60 * 1000;
const MEMBER_SIGNUP_COOLDOWN_MS = 60 * 1000;
const MEMBER_SIGNUP_HOURLY_LIMIT = 5;
const MEMBER_SIGNUP_GLOBAL_HOURLY_LIMIT = 30;
const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const GITHUB_OIDC_JWKS_URL = `${GITHUB_OIDC_ISSUER}/.well-known/jwks`;
const GITHUB_OIDC_REPOSITORY = "fnfnfn3232/coin";
const GITHUB_OIDC_AUDIENCE = "coin-board-auth-market-data";
const SCREEN_MARKET_BOARDS = ["binance", "upbit", "bithumb", "coinbase"];
const SCREEN_NAV_ITEMS = ["market", "news", "board", "resources"];
const SCREEN_RESOURCE_ITEMS = ["futures", "ranking", "audit"];
const SCREEN_RESOURCE_LABEL_DEFAULTS = {
  futures: "선물",
  ranking: "랭킹",
  audit: "실사 보유량",
};
const DEFAULT_SCREEN_SETTINGS = {
  navOrder: ["market", "news", "board", "resources"],
  resourceOrder: ["futures", "ranking", "audit"],
  resourceLabels: { ...SCREEN_RESOURCE_LABEL_DEFAULTS },
  boardOrder: ["binance", "upbit", "bithumb", "coinbase"],
  statusPosition: "summary",
  visibleStats: {
    binance: true,
    upbit: true,
    bithumb: true,
    coinbase: true,
  },
  visibleStatus: {
    auto: true,
    lastUpdated: true,
    fx: true,
    manual: true,
    manualHint: true,
  },
};

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  };
}

function applySecurityHeaders(headers) {
  const target = headers instanceof Headers ? headers : new Headers(headers || {});
  Object.entries(securityHeaders()).forEach(([key, value]) => {
    if (!target.has(key)) target.set(key, value);
  });
  return target;
}

function isAllowedOrigin(request, env) {
  return Boolean(env.FRONTEND_ORIGIN && request.headers.get("Origin") === env.FRONTEND_ORIGIN);
}

function jsonResponse(body, status = 200, env = {}) {
  const serialized = JSON.stringify(body);
  const responseBytes = new TextEncoder().encode(serialized).byteLength;
  return new Response(serialized, {
    status,
    headers: applySecurityHeaders({
      "Content-Type": "application/json; charset=utf-8",
      "X-Response-Bytes": String(responseBytes),
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": env.FRONTEND_ORIGIN || "",
      "Access-Control-Allow-Credentials": "true",
      "Vary": "Origin",
    }),
  });
}

function encodeContentDispositionFilename(fileName) {
  const safeName = cleanBoardText(fileName, 180).replace(/[\\/:*?"<>|]/g, "_") || "attachment";
  return `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`;
}

function mediaHeaders(media, env = {}) {
  const disposition = /^image\/|^video\//i.test(String(media.contentType || ""))
    ? "inline"
    : encodeContentDispositionFilename(media.fileName);
  const headers = applySecurityHeaders({
    "Content-Type": media.contentType,
    "Content-Disposition": disposition,
    "Cache-Control": "private, no-store",
    "Access-Control-Allow-Origin": env.FRONTEND_ORIGIN || "",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  });
  const size = Math.max(0, Math.floor(Number(media.size) || 0));
  if (size) headers.set("Content-Length", String(size));
  return headers;
}

function mediaResponse(media, status = 200, env = {}) {
  if (typeof media.readChunk === "function" && Number(media.chunkCount) > 0) {
    let index = 0;
    const stream = new ReadableStream({
      async pull(controller) {
        if (index >= media.chunkCount) {
          controller.close();
          return;
        }
        const chunk = await media.readChunk(index);
        if (!chunk) {
          controller.error(new Error("missing_media_chunk"));
          return;
        }
        controller.enqueue(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
        index += 1;
      },
    });
    return new Response(stream, { status, headers: mediaHeaders(media, env) });
  }
  return new Response(media.bytes, { status, headers: mediaHeaders(media, env) });
}

function originNotAllowedResponse(env) {
  return jsonResponse({ error: "origin_not_allowed" }, 403, env);
}

function optionsResponse(request, env) {
  if (!isAllowedOrigin(request, env)) {
    return new Response(null, {
      status: 403,
      headers: applySecurityHeaders({
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": env.FRONTEND_ORIGIN || "",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
      }),
    });
  }
  return new Response(null, {
    status: 204,
    headers: applySecurityHeaders({
      "Access-Control-Allow-Origin": env.FRONTEND_ORIGIN || "",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Authorization, Cache-Control, Content-Type, Pragma, X-File-Name",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    }),
  });
}

function textEncoder() {
  return new TextEncoder();
}

function toPositiveNumber(value) {
  const number = Number(String(value ?? "").replace(/,/g, "").trim());
  if (!Number.isFinite(number) || number <= 0) return null;
  return number;
}

async function fetchJsonWithTimeout(url, timeoutMs = LIVE_PRICE_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json,text/plain,*/*",
        "User-Agent": "coin-board-worker/1.0",
      },
      signal: controller.signal,
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    if (!response.ok) throw new Error(`fetch_failed:${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function collectSymbols(payload, boardName, fieldName = "symbol") {
  const rows = payload?.boards?.[boardName];
  if (!Array.isArray(rows)) return [];
  return [...new Set(rows
    .map((row) => String(row?.[fieldName] || "").trim().toUpperCase())
    .filter(Boolean))];
}

function recordError(errors, key, error) {
  errors[key] = error instanceof Error ? error.message : String(error || "unknown_error");
}

async function fetchLiveFxUsdKrw() {
  const payload = await fetchJsonWithTimeout("https://api.upbit.com/v1/ticker?markets=KRW-USDT");
  if (!Array.isArray(payload) || !payload.length) return null;
  return toPositiveNumber(payload[0]?.trade_price);
}

async function fetchBinanceLivePriceMap() {
  const payload = await fetchJsonWithTimeout("https://api.binance.com/api/v3/ticker/price");
  const prices = {};
  if (!Array.isArray(payload)) return prices;
  for (const item of payload) {
    const market = String(item?.symbol || "").toUpperCase();
    const price = toPositiveNumber(item?.price);
    if (!market.endsWith("USDT") || price === null) continue;
    const symbol = market.slice(0, -4);
    if (symbol) prices[symbol] = price;
  }
  return prices;
}

async function fetchUpbitLivePriceMap(symbols) {
  const prices = {};
  for (let index = 0; index < symbols.length; index += LIVE_PRICE_UPBIT_BATCH_SIZE) {
    const group = symbols.slice(index, index + LIVE_PRICE_UPBIT_BATCH_SIZE);
    if (!group.length) continue;
    const query = encodeURIComponent(group.map((symbol) => `KRW-${symbol}`).join(","));
    const payload = await fetchJsonWithTimeout(`https://api.upbit.com/v1/ticker?markets=${query}`);
    if (!Array.isArray(payload)) continue;
    for (const item of payload) {
      const market = String(item?.market || "").toUpperCase();
      const price = toPositiveNumber(item?.trade_price);
      if (!market.startsWith("KRW-") || price === null) continue;
      prices[market.replace("KRW-", "")] = price;
    }
  }
  return prices;
}

async function fetchBithumbLivePriceAndCapMaps(symbols) {
  const prices = {};
  const caps = {};
  let requestedSymbols = Array.isArray(symbols) ? symbols : [];
  if (!requestedSymbols.length) {
    try {
      const markets = await fetchJsonWithTimeout("https://api.bithumb.com/v1/market/all");
      requestedSymbols = Array.isArray(markets)
        ? markets
          .map((item) => String(item?.market || "").toUpperCase())
          .filter((market) => market.startsWith("KRW-"))
          .map((market) => market.replace("KRW-", ""))
        : [];
    } catch {
      requestedSymbols = [];
    }
  }
  const tickerRequests = [];
  for (let index = 0; index < requestedSymbols.length; index += LIVE_PRICE_BITHUMB_BATCH_SIZE) {
    const group = requestedSymbols.slice(index, index + LIVE_PRICE_BITHUMB_BATCH_SIZE);
    if (!group.length) continue;
    const query = encodeURIComponent(group.map((symbol) => `KRW-${symbol}`).join(","));
    tickerRequests.push(fetchJsonWithTimeout(`https://api.bithumb.com/v1/ticker?markets=${query}`));
  }

  const [tickerResults, capResult] = await Promise.all([
    Promise.allSettled(tickerRequests),
    fetchJsonWithTimeout("https://gw.bithumb.com/exchange/v1/trade/coinmarketcap")
      .catch(() => null),
  ]);

  for (const tickerResult of tickerResults) {
    if (tickerResult.status !== "fulfilled" || !Array.isArray(tickerResult.value)) continue;
    for (const item of tickerResult.value) {
      const market = String(item?.market || "").toUpperCase();
      const price = toPositiveNumber(item?.trade_price)
        ?? toPositiveNumber(item?.prev_closing_price);
      if (!market.startsWith("KRW-") || price === null) continue;
      prices[market.replace("KRW-", "")] = price;
    }
  }

  if (capResult && typeof capResult === "object") {
    const capData = capResult.data;
    if (capData && typeof capData === "object") {
      for (const [coinType, capValue] of Object.entries(capData)) {
        const cap = toPositiveNumber(capValue);
        const key = String(coinType || "").toUpperCase();
        if (!key || cap === null) continue;
        caps[key] = cap;
      }
    }
  }

  return { prices, caps };
}

async function fetchCoinbaseLivePriceMap() {
  const payload = await fetchJsonWithTimeout("https://api.exchange.coinbase.com/products/stats");
  const prices = {};
  if (!payload || typeof payload !== "object") return prices;
  for (const [productId, stats] of Object.entries(payload)) {
    const productIdText = String(productId || "").toUpperCase();
    const price = toPositiveNumber(stats?.stats_24hour?.last);
    if (!productIdText.endsWith("-USD") || price === null) continue;
    const symbol = productIdText.replace(/-USD$/, "");
    if (symbol) prices[symbol] = price;
  }
  return prices;
}

async function fetchLivePricePayload(marketPayload) {
  const errors = {};
  const upbitSymbols = collectSymbols(marketPayload, "upbit");
  const bithumbSymbols = collectSymbols(marketPayload, "bithumb");
  const [fxResult, binanceResult, upbitResult, bithumbResult, coinbaseResult] = await Promise.allSettled([
    fetchLiveFxUsdKrw(),
    fetchBinanceLivePriceMap(),
    fetchUpbitLivePriceMap(upbitSymbols),
    fetchBithumbLivePriceAndCapMaps(bithumbSymbols),
    fetchCoinbaseLivePriceMap(),
  ]);

  const prices = { binance: {}, upbit: {}, bithumb: {}, coinbase: {} };
  const caps = { bithumb: {} };
  let fxUsdKrw = null;

  if (fxResult.status === "fulfilled") fxUsdKrw = fxResult.value;
  else recordError(errors, "fx", fxResult.reason);
  if (binanceResult.status === "fulfilled") prices.binance = binanceResult.value || {};
  else recordError(errors, "binance", binanceResult.reason);
  if (upbitResult.status === "fulfilled") prices.upbit = upbitResult.value || {};
  else recordError(errors, "upbit", upbitResult.reason);
  if (bithumbResult.status === "fulfilled") {
    prices.bithumb = bithumbResult.value?.prices || {};
    caps.bithumb = bithumbResult.value?.caps || {};
  } else {
    recordError(errors, "bithumb", bithumbResult.reason);
  }
  if (coinbaseResult.status === "fulfilled") prices.coinbase = coinbaseResult.value || {};
  else recordError(errors, "coinbase", coinbaseResult.reason);

  return {
    fetchedAt: Math.floor(Date.now() / 1000),
    fxUsdKrw,
    prices,
    caps,
    errors,
  };
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder().encode(String(value || "")));
  return bytesToHex(digest);
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder().encode(value));
  return bytesToHex(signature);
}

function timingSafeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

function getMemberPasswordError(password) {
  const value = String(password || "");
  const characters = Array.from(value);
  const length = characters.length;
  if (length < MEMBER_PASSWORD_MIN_LENGTH || length > MEMBER_PASSWORD_MAX_LENGTH) {
    return "invalid_member_password_length";
  }
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "weak_member_password";
  }
  let previousCharacter = "";
  let consecutiveCount = 0;
  for (const character of characters) {
    if (character === previousCharacter) {
      consecutiveCount += 1;
    } else {
      previousCharacter = character;
      consecutiveCount = 1;
    }
    if (consecutiveCount > 4) return "member_password_repetition";
  }
  if (textEncoder().encode(value).byteLength > 256) return "invalid_member_password_length";
  return "";
}

async function deriveMemberPasswordHash(password, saltHex, iterations = MEMBER_PASSWORD_ITERATIONS) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    textEncoder().encode(String(password || "")),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const salt = new Uint8Array(String(saltHex || "").match(/.{2}/g)?.map((part) => parseInt(part, 16)) || []);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    hash: "SHA-256",
    salt,
    iterations: Math.max(100000, Math.floor(Number(iterations) || MEMBER_PASSWORD_ITERATIONS)),
  }, passwordKey, 256);
  return bytesToHex(bits);
}

async function createMemberPasswordCredentials(password, { validate = true } = {}) {
  if (validate) {
    const error = getMemberPasswordError(password);
    if (error) throw new Error(error);
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordSalt = bytesToHex(salt);
  return {
    passwordSalt,
    passwordHash: await deriveMemberPasswordHash(password, passwordSalt, MEMBER_PASSWORD_ITERATIONS),
    passwordIterations: MEMBER_PASSWORD_ITERATIONS,
  };
}

async function verifyMemberPassword(password, member) {
  if (!member?.passwordSalt || !member?.passwordHash) return false;
  const actual = await deriveMemberPasswordHash(password, member.passwordSalt, member.passwordIterations);
  return timingSafeEqual(actual, member.passwordHash);
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const cookies = header.split(";").map((item) => item.trim());
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key === name) return rest.join("=");
  }
  return "";
}

function getBearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function getClientIp(request) {
  const directIp = request.headers.get("CF-Connecting-IP") || "";
  if (directIp) return directIp.trim();
  const forwardedFor = request.headers.get("X-Forwarded-For") || "";
  const firstForwarded = forwardedFor.split(",")[0]?.trim();
  return firstForwarded || "unknown";
}

function getForwardedLoginClientIp(request) {
  return (request.headers.get("X-Login-Client-IP") || getClientIp(request)).trim() || "unknown";
}

function normalizeEmailAddress(value) {
  return String(value || "").trim().toLowerCase();
}

function getEmailLoginDestinations(env) {
  return [...new Set([
    normalizeEmailAddress(env?.OTP_EMAIL_TO),
    normalizeEmailAddress(env?.OTP_EMAIL_TO_2),
  ].filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))];
}

function getAllowedEmailLoginDestination(value, env) {
  const email = normalizeEmailAddress(value);
  return getEmailLoginDestinations(env).includes(email) ? email : "";
}

function getEmailLoginApiKey(recipient, env) {
  const secondDestination = normalizeEmailAddress(env?.OTP_EMAIL_TO_2);
  const secondApiKey = String(env?.RESEND_API_KEY_2 || "").trim();
  if (secondApiKey && recipient === secondDestination) return secondApiKey;
  return String(env?.RESEND_API_KEY || "").trim();
}

function isEmailLoginConfigured(env) {
  return Boolean(String(env?.RESEND_API_KEY || "").trim() && getEmailLoginDestinations(env).length);
}

function isMemberEmailDeliveryConfigured(env) {
  const sender = String(env?.OTP_EMAIL_FROM || "").trim().toLowerCase();
  return isEmailLoginConfigured(env)
    && Boolean(sender)
    && !sender.includes("onboarding@resend.dev");
}

function isMemberRegistrationEnabled(env) {
  return String(env?.MEMBER_REGISTRATION_ENABLED || "true") !== "false";
}

function maskEmailAddress(value) {
  const email = String(value || "").trim();
  const at = email.indexOf("@");
  if (at <= 0) return "";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

function generateEmailOtpCode() {
  const limit = Math.floor(0x100000000 / 1000000) * 1000000;
  const values = new Uint32Array(1);
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= limit);
  return String(values[0] % 1000000).padStart(6, "0");
}

async function getEmailOtpHash(requestId, code, env) {
  return hmacHex(env.SESSION_SECRET, `${requestId}.${code}`);
}

async function getEmailOtpCurrentKey(recipient, purpose = "login") {
  return `${EMAIL_OTP_CURRENT_KEY_PREFIX}${purpose}:${await sha256Hex(recipient)}`;
}

async function clearCurrentEmailOtp(storage, record, requestId) {
  const currentKey = String(record?.currentKey || "");
  if (!currentKey) return;
  const currentRequestId = String(await storage.get(currentKey) || "");
  if (currentRequestId === requestId) {
    await storage.delete(currentKey);
  }
}

async function sendEmailOtp(code, requestId, recipient, env) {
  if (!isEmailLoginConfigured(env)) {
    throw new Error("email_login_not_configured");
  }
  const apiKey = getEmailLoginApiKey(recipient, env);
  if (!apiKey) throw new Error("email_login_not_configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `coin-login-${requestId}`,
    },
    body: JSON.stringify({
      from: String(env.OTP_EMAIL_FROM || "코마캡 <onboarding@resend.dev>").trim(),
      to: [recipient],
      subject: "코마캡 로그인 인증번호",
      text: `코마캡 로그인 인증번호는 ${code}입니다.\n\n이 번호는 1분 동안만 사용할 수 있으며 한 번 사용하면 폐기됩니다.`,
    }),
  });
  if (!response.ok) {
    const message = (await response.text()).slice(0, 500);
    console.error("email_otp_send_failed", response.status, message);
    throw new Error("email_send_failed");
  }
}

async function sendMemberEmail({ recipient, subject, text, idempotencyKey }, env) {
  if (!isEmailLoginConfigured(env)) throw new Error("email_login_not_configured");
  const apiKey = getEmailLoginApiKey(recipient, env);
  if (!apiKey) throw new Error("email_login_not_configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: String(env.OTP_EMAIL_FROM || "ComaCap <onboarding@resend.dev>").trim(),
      to: [recipient],
      subject,
      text,
    }),
  });
  if (!response.ok) {
    const message = (await response.text()).slice(0, 500);
    console.error("member_email_send_failed", response.status, message);
    throw new Error("email_send_failed");
  }
}

async function sendSignupEmailOtp(code, requestId, recipient, env) {
  return sendMemberEmail({
    recipient,
    subject: "ComaCap signup verification code",
    text: `Your ComaCap signup verification code is ${code}.\n\nThis code expires in 1 minute. Do not share it with anyone.`,
    idempotencyKey: `coin-signup-${requestId}`,
  }, env);
}

async function sendPasswordResetOtp(code, requestId, recipient, env) {
  return sendMemberEmail({
    recipient,
    subject: "ComaCap password reset code",
    text: `Your ComaCap password reset code is ${code}.\n\nThis code expires in 10 minutes. If you did not request it, you can ignore this email.`,
    idempotencyKey: `coin-password-reset-${requestId}`,
  }, env);
}

function normalizeMemberStatus(value) {
  return ["pending", "active", "rejected", "revoked"].includes(value) ? value : "pending";
}

function normalizeMemberRecord(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || "").trim();
  const email = normalizeEmailAddress(raw.email);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return {
    id,
    email,
    emailHash: String(raw.emailHash || ""),
    passwordSalt: String(raw.passwordSalt || ""),
    passwordHash: String(raw.passwordHash || ""),
    passwordIterations: Math.max(100000, Math.floor(Number(raw.passwordIterations) || MEMBER_PASSWORD_LEGACY_ITERATIONS)),
    authVersion: Math.max(1, Math.floor(Number(raw.authVersion) || 1)),
    status: normalizeMemberStatus(raw.status),
    boardWriteApproved: raw.boardWriteApproved === true,
    boardWriteApprovedAt: Math.max(0, Math.floor(Number(raw.boardWriteApprovedAt) || 0)),
    requestedAt: Math.max(0, Math.floor(Number(raw.requestedAt) || 0)),
    emailVerifiedAt: Math.max(0, Math.floor(Number(raw.emailVerifiedAt) || 0)),
    approvedAt: Math.max(0, Math.floor(Number(raw.approvedAt) || 0)),
    rejectedAt: Math.max(0, Math.floor(Number(raw.rejectedAt) || 0)),
    revokedAt: Math.max(0, Math.floor(Number(raw.revokedAt) || 0)),
    updatedAt: Math.max(0, Math.floor(Number(raw.updatedAt) || 0)),
    lastLoginAt: Math.max(0, Math.floor(Number(raw.lastLoginAt) || 0)),
  };
}

function publicAdminMember(raw) {
  const member = normalizeMemberRecord(raw);
  if (!member) return null;
  const {
    emailHash: _emailHash,
    passwordSalt: _passwordSalt,
    passwordHash: _passwordHash,
    passwordIterations: _passwordIterations,
    authVersion: _authVersion,
    ...safe
  } = member;
  return { ...safe, passwordConfigured: Boolean(member.passwordSalt && member.passwordHash) };
}

function normalizeLoginAttemptRecord(raw) {
  return {
    failures: Math.max(0, Math.floor(Number(raw?.failures) || 0)),
    lockedUntil: Math.max(0, Math.floor(Number(raw?.lockedUntil) || 0)),
    updatedAt: Math.max(0, Math.floor(Number(raw?.updatedAt) || 0)),
  };
}

async function getLoginAttemptKey(clientIp) {
  return `${LOGIN_ATTEMPT_KEY_PREFIX}${await sha256Hex(clientIp || "unknown")}`;
}

function loginLockedResponse(record, env) {
  const retryAfterSeconds = Math.max(1, Math.ceil((record.lockedUntil - Date.now()) / 1000));
  const headers = new Headers(jsonResponse({
    error: "too_many_login_attempts",
    retryAfterSeconds,
    lockedUntil: record.lockedUntil,
  }, 429, env).headers);
  headers.set("Retry-After", String(retryAfterSeconds));
  return new Response(JSON.stringify({
    error: "too_many_login_attempts",
    retryAfterSeconds,
    lockedUntil: record.lockedUntil,
  }), { status: 429, headers });
}

async function createSessionToken(env, claims = {}) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = crypto.randomUUID();
  const role = claims.role === "member" ? "member" : "admin";
  const subject = role === "member" && /^[0-9a-f-]{36}$/i.test(String(claims.subject || ""))
    ? String(claims.subject)
    : "owner";
  const authVersion = role === "member" ? Math.max(1, Math.floor(Number(claims.authVersion) || 1)) : 0;
  const payload = `v3.${exp}.${nonce}.${role}.${subject}.${authVersion}`;
  const signature = await hmacHex(env.SESSION_SECRET, payload);
  return `${payload}.${signature}`;
}

function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

function partitionedSessionCookie(token) {
  return `${PARTITIONED_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=None; Partitioned; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

function appendSessionCookies(headers, token) {
  headers.append("Set-Cookie", sessionCookie(token));
  headers.append("Set-Cookie", partitionedSessionCookie(token));
}

function appendClearedSessionCookies(headers) {
  headers.append("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`);
  headers.append("Set-Cookie", `${PARTITIONED_COOKIE_NAME}=; HttpOnly; Secure; SameSite=None; Partitioned; Path=/; Max-Age=0`);
}

function sessionPayload(token, claims = null) {
  const parts = String(token || "").split(".");
  const expiresAt = Number(["v2", "v3"].includes(parts[0]) ? parts[1] : parts[0]) * 1000;
  return {
    ok: true,
    token,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : 0,
    role: claims?.role === "member" ? "member" : "admin",
    subject: claims?.role === "member" ? String(claims.subject || "") : "owner",
    boardWriteApproved: claims?.role !== "member" || claims?.boardWriteApproved === true,
  };
}

async function getSessionClaims(token, env) {
  const parts = String(token || "").split(".");
  if (parts.length === 3) {
    const [expText, nonce, signature] = parts;
    const exp = Number(expText);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
    const expected = await hmacHex(env.SESSION_SECRET, `${expText}.${nonce}`);
    return timingSafeEqual(signature, expected)
      ? { role: "admin", subject: "legacy", expiresAt: exp * 1000, token }
      : null;
  }
  if (parts.length === 6 && parts[0] === "v2") {
    const [version, expText, nonce, role, subject, signature] = parts;
    const exp = Number(expText);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
    if (!["admin", "member"].includes(role)) return null;
    if (role === "member" && !/^[0-9a-f-]{36}$/i.test(subject)) return null;
    const expected = await hmacHex(env.SESSION_SECRET, `${version}.${expText}.${nonce}.${role}.${subject}`);
    return timingSafeEqual(signature, expected)
      ? { role, subject, authVersion: role === "member" ? 1 : 0, expiresAt: exp * 1000, token }
      : null;
  }
  if (parts.length !== 7 || parts[0] !== "v3") return null;
  const [version, expText, nonce, role, subject, authVersionText, signature] = parts;
  const exp = Number(expText);
  const authVersion = Math.max(0, Math.floor(Number(authVersionText) || 0));
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  if (!["admin", "member"].includes(role)) return null;
  if (role === "member" && !/^[0-9a-f-]{36}$/i.test(subject)) return null;
  if (role === "member" && authVersion < 1) return null;
  const expected = await hmacHex(env.SESSION_SECRET, `${version}.${expText}.${nonce}.${role}.${subject}.${authVersion}`);
  return timingSafeEqual(signature, expected)
    ? { role, subject, authVersion, expiresAt: exp * 1000, token }
    : null;
}

async function isValidSessionToken(token, env) {
  return Boolean(await getSessionClaims(token, env));
}

async function getRequestSessionClaims(request, env) {
  const cookieTokens = [
    getCookie(request, COOKIE_NAME),
    getCookie(request, PARTITIONED_COOKIE_NAME),
  ].filter(Boolean);
  const bearerToken = getBearerToken(request);
  const tokens = [...cookieTokens];
  if (bearerToken && !tokens.includes(bearerToken)) tokens.push(bearerToken);
  for (const token of tokens) {
    const claims = await getSessionClaims(token, env);
    if (claims) return claims;
  }
  return null;
}

async function isAuthenticated(request, env) {
  return Boolean(await getRequestSessionClaims(request, env));
}

function cleanNewsText(value) {
  return String(value || "")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function makePreview(value, maxChars = 300) {
  const text = cleanNewsText(value).replace(/\s+/g, " ").trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 3).trimEnd()}...`;
}

function cleanBoardText(value, maxChars) {
  return String(value || "")
    .replace(/\0/g, "")
    .trim()
    .slice(0, maxChars);
}

function normalizeScreenSettings(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const rawNavOrder = Array.isArray(source.navOrder) ? source.navOrder : DEFAULT_SCREEN_SETTINGS.navOrder;
  const migratedNavOrder = rawNavOrder.map((item) =>
    ["ranking", "futures", "audit"].includes(item) ? "resources" : item
  );
  const navOrder = migratedNavOrder.filter(
    (item, index, values) => SCREEN_NAV_ITEMS.includes(item) && values.indexOf(item) === index
  );
  SCREEN_NAV_ITEMS.forEach((item) => {
    if (!navOrder.includes(item)) navOrder.push(item);
  });

  const rawResourceOrder = Array.isArray(source.resourceOrder)
    ? source.resourceOrder
    : DEFAULT_SCREEN_SETTINGS.resourceOrder;
  const resourceOrder = rawResourceOrder.filter(
    (item, index, values) => SCREEN_RESOURCE_ITEMS.includes(item) && values.indexOf(item) === index
  );
  SCREEN_RESOURCE_ITEMS.forEach((item) => {
    if (!resourceOrder.includes(item)) resourceOrder.push(item);
  });

  const resourceLabels = {};
  SCREEN_RESOURCE_ITEMS.forEach((item) => {
    resourceLabels[item] = cleanBoardText(source.resourceLabels?.[item], 20)
      || SCREEN_RESOURCE_LABEL_DEFAULTS[item];
  });

  const rawOrder = Array.isArray(source.boardOrder) ? source.boardOrder : DEFAULT_SCREEN_SETTINGS.boardOrder;
  const boardOrder = rawOrder.filter((board) => SCREEN_MARKET_BOARDS.includes(board));
  SCREEN_MARKET_BOARDS.forEach((board) => {
    if (!boardOrder.includes(board)) boardOrder.push(board);
  });

  const visibleStats = {};
  SCREEN_MARKET_BOARDS.forEach((board) => {
    visibleStats[board] = source.visibleStats?.[board] !== false;
  });

  const visibleStatus = {
    auto: source.visibleStatus?.auto !== false,
    lastUpdated: source.visibleStatus?.lastUpdated !== false,
    fx: source.visibleStatus?.fx !== false,
    manual: source.visibleStatus?.manual !== false,
    manualHint: source.visibleStatus?.manualHint !== false,
  };

  const statusPosition = ["summary", "title", "controls", "hidden"].includes(source.statusPosition)
    ? source.statusPosition
    : DEFAULT_SCREEN_SETTINGS.statusPosition;

  return { navOrder, resourceOrder, resourceLabels, boardOrder, statusPosition, visibleStats, visibleStatus };
}

function getSafeMediaKind(value) {
  try {
    const url = new URL(String(value || ""));
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (url.username || url.password) return "";
    if (getYouTubeEmbedUrl(url)) return "video";
    const path = url.pathname.toLowerCase();
    if (/\/api\/board\/media\/[a-z0-9-]+$/i.test(path)) return "image";
    if (/\.(png|jpe?g|gif|webp|avif)$/.test(path)) return "image";
    if (/\.(mp4|webm|ogv)$/.test(path)) return "video";
    return "";
  } catch (_error) {
    return "";
  }
}

function getYouTubeEmbedUrl(value) {
  try {
    const url = value instanceof URL ? value : new URL(String(value || ""));
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (url.username || url.password) return "";
    const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
    let videoId = "";
    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v") || "";
      } else if (parts[0] === "shorts" || parts[0] === "embed") {
        videoId = parts[1] || "";
      }
    }
    return /^[A-Za-z0-9_-]{11}$/.test(videoId) ? `https://www.youtube-nocookie.com/embed/${videoId}` : "";
  } catch (_error) {
    return "";
  }
}

function normalizePasswordHash(value) {
  const hash = cleanBoardText(value, 128);
  return /^[a-f0-9]{64}$/i.test(hash) ? hash.toLowerCase() : "";
}

function normalizeBoardComment(raw, fallback = {}) {
  const createdAt = Number(raw?.createdAt || fallback.createdAt || Date.now());
  const body = cleanBoardText(raw?.body, 3000);
  const parentId = cleanBoardText(raw?.parentId || raw?.replyToId || fallback.parentId, 80);
  if (!body) return null;
  return {
    id: cleanBoardText(raw?.id || fallback.id || `comment-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, 80),
    authorMemberId: /^[0-9a-f-]{36}$/i.test(String(raw?.authorMemberId || fallback.authorMemberId || ""))
      ? String(raw?.authorMemberId || fallback.authorMemberId)
      : "",
    author: cleanBoardText(raw?.author || "익명", 40) || "익명",
    body,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    passwordHash: normalizePasswordHash(raw?.passwordHash),
    ...(parentId ? { parentId, depth: 1 } : {}),
  };
}

function normalizeBoardPost(raw, fallback = {}) {
  const createdAt = Number(raw?.createdAt || fallback.createdAt || Date.now());
  const mediaUrls = Array.isArray(raw?.mediaUrls)
    ? raw.mediaUrls
        .map((url) => cleanBoardText(url, 1000))
        .filter((url, index, list) => getSafeMediaKind(url) && list.indexOf(url) === index)
        .slice(0, BOARD_MAX_MEDIA)
    : [];
  const title = cleanBoardText(raw?.title, 120);
  const body = cleanBoardText(raw?.body, 20000);
  if (!title || !body) return null;
  const comments = Array.isArray(raw?.comments)
    ? raw.comments
        .map((comment) => normalizeBoardComment(comment))
        .filter(Boolean)
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(0, BOARD_MAX_COMMENTS)
    : [];
  return {
    id: cleanBoardText(raw?.id || fallback.id || `post-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, 80),
    authorMemberId: /^[0-9a-f-]{36}$/i.test(String(raw?.authorMemberId || fallback.authorMemberId || ""))
      ? String(raw?.authorMemberId || fallback.authorMemberId)
      : "",
    category: normalizeBoardCategory(raw?.category),
    title,
    author: cleanBoardText(raw?.author || "익명", 40) || "익명",
    body,
    htmlEnabled: Boolean(raw?.htmlEnabled),
    mediaUrls,
    comments,
    passwordHash: normalizePasswordHash(raw?.passwordHash),
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    updatedAt: Number.isFinite(Number(raw?.updatedAt)) ? Number(raw.updatedAt) : undefined,
    views: Math.max(0, Math.floor(Number(raw?.views) || 0)),
    likes: Math.max(0, Math.floor(Number(raw?.likes) || 0)),
  };
}

function normalizeBoardCategory(category) {
  return normalizeBoardCategoryValue(category) || "free";
}

function normalizeBoardCategoryValue(category) {
  return cleanBoardText(category, 40).replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeBoardCategoryLabel(label) {
  return cleanBoardText(label, 40).replace(/\s+/g, " ").trim();
}

function normalizeBoardCategoryItem(raw) {
  const source = raw && typeof raw === "object" ? raw : { value: raw, label: raw };
  const rawLabel = normalizeBoardCategoryLabel(source.label || source.name || source.title || "");
  let value = normalizeBoardCategoryValue(source.value || source.id || source.category || rawLabel);
  let label = rawLabel;
  if (!value && label) value = normalizeBoardCategoryValue(label);
  if (!value || value === "all") return null;
  if (!label) {
    label = DEFAULT_BOARD_CATEGORIES.find((item) => item.value === value)?.label || value;
  }
  return { value, label };
}

function normalizeBoardCategories(raw) {
  const source = Array.isArray(raw) && raw.length ? raw : DEFAULT_BOARD_CATEGORIES;
  const seen = new Set();
  const categories = [];
  for (const item of source) {
    const normalized = normalizeBoardCategoryItem(item);
    if (!normalized || seen.has(normalized.value)) continue;
    seen.add(normalized.value);
    categories.push(normalized);
    if (categories.length >= BOARD_CATEGORY_LIMIT) break;
  }
  if (!seen.has("free")) {
    categories.unshift({ value: "free", label: "자유게시판" });
  }
  return categories.slice(0, BOARD_CATEGORY_LIMIT);
}

function getKstDateKey(now = Date.now()) {
  return new Date(now + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function getKstMonthKey(now = Date.now()) {
  return getKstDateKey(now).slice(0, 7);
}

function getKstHourKey(now = Date.now()) {
  return new Date(now + 9 * 60 * 60 * 1000).toISOString().slice(0, 13);
}

function getKstWeekKey(now = Date.now()) {
  const date = new Date(now + 9 * 60 * 60 * 1000);
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - ((day + 6) % 7));
  return date.toISOString().slice(0, 10);
}

function normalizeUsageStats(raw) {
  return {
    months: raw && typeof raw.months === "object" && raw.months ? raw.months : {},
    days: raw && typeof raw.days === "object" && raw.days ? raw.days : {},
    hours: raw && typeof raw.hours === "object" && raw.hours ? raw.hours : {},
    totalViews: Math.max(0, Math.floor(Number(raw?.totalViews) || 0)),
    totalBytes: Math.max(0, Math.floor(Number(raw?.totalBytes) || 0)),
    totalApiBytes: Math.max(0, Math.floor(Number(raw?.totalApiBytes) || 0)),
    totalApiRequests: Math.max(0, Math.floor(Number(raw?.totalApiRequests) || 0)),
    totalMediaBytes: Math.max(0, Math.floor(Number(raw?.totalMediaBytes) || 0)),
    totalMediaRequests: Math.max(0, Math.floor(Number(raw?.totalMediaRequests) || 0)),
    firstSeen: Math.max(0, Math.floor(Number(raw?.firstSeen) || 0)),
    lastSeen: Math.max(0, Math.floor(Number(raw?.lastSeen) || 0)),
  };
}

function normalizeUsageBucket(bucket) {
  return {
    views: Math.max(0, Math.floor(Number(bucket?.views) || 0)),
    bytes: Math.max(0, Math.floor(Number(bucket?.bytes) || 0)),
    samples: Math.max(0, Math.floor(Number(bucket?.samples) || 0)),
    apiBytes: Math.max(0, Math.floor(Number(bucket?.apiBytes) || 0)),
    apiRequests: Math.max(0, Math.floor(Number(bucket?.apiRequests) || 0)),
    mediaBytes: Math.max(0, Math.floor(Number(bucket?.mediaBytes) || 0)),
    mediaRequests: Math.max(0, Math.floor(Number(bucket?.mediaRequests) || 0)),
    lastSeen: Math.max(0, Math.floor(Number(bucket?.lastSeen) || 0)),
  };
}

function addUsageBuckets(target, source) {
  const next = normalizeUsageBucket(target);
  const item = normalizeUsageBucket(source);
  next.views += item.views;
  next.bytes += item.bytes;
  next.samples += item.samples;
  next.apiBytes += item.apiBytes;
  next.apiRequests += item.apiRequests;
  next.mediaBytes += item.mediaBytes;
  next.mediaRequests += item.mediaRequests;
  next.lastSeen = Math.max(next.lastSeen, item.lastSeen);
  return next;
}

function buildUsageSeries(stats, now = Date.now()) {
  const hours = [];
  for (let offset = 23; offset >= 0; offset -= 1) {
    const key = getKstHourKey(now - offset * 60 * 60 * 1000);
    hours.push({ key, ...normalizeUsageBucket(stats.hours[key]) });
  }

  const days = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const key = getKstDateKey(now - offset * 24 * 60 * 60 * 1000);
    days.push({ key, ...normalizeUsageBucket(stats.days[key]) });
  }

  const weekKeys = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    weekKeys.push(getKstWeekKey(now - offset * 7 * 24 * 60 * 60 * 1000));
  }
  const weekMap = Object.fromEntries(weekKeys.map((key) => [key, normalizeUsageBucket()]));
  Object.entries(stats.days).forEach(([key, bucket]) => {
    const timestamp = Date.parse(`${key}T00:00:00Z`);
    if (!Number.isFinite(timestamp)) return;
    const weekKey = getKstWeekKey(timestamp - 9 * 60 * 60 * 1000);
    if (weekMap[weekKey]) weekMap[weekKey] = addUsageBuckets(weekMap[weekKey], bucket);
  });
  const weeks = weekKeys.map((key) => ({ key, ...weekMap[key] }));

  const monthKeys = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now + 9 * 60 * 60 * 1000);
    date.setUTCMonth(date.getUTCMonth() - offset);
    monthKeys.push(date.toISOString().slice(0, 7));
  }
  const months = monthKeys.map((key) => ({ key, ...normalizeUsageBucket(stats.months[key]) }));
  return { hours, days, weeks, months };
}

function pruneUsageStats(stats, now = Date.now()) {
  const monthKeep = new Set();
  for (let offset = 0; offset < 18; offset += 1) {
    const date = new Date(now + 9 * 60 * 60 * 1000);
    date.setUTCMonth(date.getUTCMonth() - offset);
    monthKeep.add(date.toISOString().slice(0, 7));
  }
  Object.keys(stats.months).forEach((key) => {
    if (!monthKeep.has(key)) delete stats.months[key];
  });

  const dayKeep = new Set();
  for (let offset = 0; offset < 120; offset += 1) {
    dayKeep.add(getKstDateKey(now - offset * 24 * 60 * 60 * 1000));
  }
  Object.keys(stats.days).forEach((key) => {
    if (!dayKeep.has(key)) delete stats.days[key];
  });

  const hourKeep = new Set();
  for (let offset = 0; offset < 14 * 24; offset += 1) {
    hourKeep.add(getKstHourKey(now - offset * 60 * 60 * 1000));
  }
  Object.keys(stats.hours).forEach((key) => {
    if (!hourKeep.has(key)) delete stats.hours[key];
  });
  return stats;
}

function publicUsageStats(raw) {
  const stats = normalizeUsageStats(raw);
  const now = Date.now();
  const monthKey = getKstMonthKey(now);
  const dayKey = getKstDateKey(now);
  const month = normalizeUsageBucket(stats.months[monthKey]);
  const day = normalizeUsageBucket(stats.days[dayKey]);
  return {
    monthKey,
    dayKey,
    monthlySoftLimitBytes: GITHUB_PAGES_MONTHLY_SOFT_LIMIT_BYTES,
    month,
    today: day,
    totalViews: stats.totalViews,
    totalBytes: stats.totalBytes,
    totalApiBytes: stats.totalApiBytes,
    totalApiRequests: stats.totalApiRequests,
    totalMediaBytes: stats.totalMediaBytes,
    totalMediaRequests: stats.totalMediaRequests,
    totalMeasuredBytes: stats.totalBytes + stats.totalApiBytes + stats.totalMediaBytes,
    firstSeen: stats.firstSeen,
    lastSeen: stats.lastSeen,
    series: buildUsageSeries(stats, now),
    note: "페이지 전송은 브라우저 측정값이며, API와 첨부파일은 Worker가 응답 크기를 기록합니다. GitHub Pages 공식 청구/집계값은 아닙니다.",
  };
}

async function readBoardPosts(env) {
  if (!env.BOARD_POSTS) {
    throw new Error("board_storage_not_configured");
  }
  const raw = await env.BOARD_POSTS.get(BOARD_POSTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((post) => normalizeBoardPost(post))
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, BOARD_MAX_POSTS);
  } catch (_error) {
    return [];
  }
}

async function writeBoardPosts(env, posts) {
  if (!env.BOARD_POSTS) {
    throw new Error("board_storage_not_configured");
  }
  const normalized = (Array.isArray(posts) ? posts : [])
    .map((post) => normalizeBoardPost(post))
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, BOARD_MAX_POSTS);
  await env.BOARD_POSTS.put(BOARD_POSTS_KEY, JSON.stringify(normalized));
  return normalized;
}

async function readBoardCategories(env) {
  if (!env.BOARD_POSTS) {
    throw new Error("board_storage_not_configured");
  }
  const raw = await env.BOARD_POSTS.get(BOARD_CATEGORIES_KEY);
  if (!raw) return normalizeBoardCategories(DEFAULT_BOARD_CATEGORIES);
  try {
    return normalizeBoardCategories(JSON.parse(raw));
  } catch (_error) {
    return normalizeBoardCategories(DEFAULT_BOARD_CATEGORIES);
  }
}

async function writeBoardCategories(env, categories) {
  if (!env.BOARD_POSTS) {
    throw new Error("board_storage_not_configured");
  }
  const normalized = normalizeBoardCategories(categories);
  await env.BOARD_POSTS.put(BOARD_CATEGORIES_KEY, JSON.stringify(normalized));
  return normalized;
}

async function requireAuth(request, env) {
  if (await isAuthenticated(request, env)) return null;
  return jsonResponse({ error: "auth_required" }, 401, env);
}

async function requireActiveStoredAuth(request, env) {
  const claims = await getRequestSessionClaims(request, env);
  if (!claims) return jsonResponse({ error: "auth_required" }, 401, env);
  if (claims.role === "admin") return null;
  if (!env.BOARD_STORE) return null;
  const id = env.BOARD_STORE.idFromName("free-board");
  const response = await env.BOARD_STORE.get(id).fetch(new Request("https://board-store/api/session/check", {
    method: "GET",
    headers: request.headers,
  }));
  return response.ok ? null : jsonResponse({ error: "auth_required" }, 401, env);
}

async function requireBoardAccessStoredAuth(request, env) {
  const claims = await getRequestSessionClaims(request, env);
  if (!claims) return jsonResponse({ error: "auth_required" }, 401, env);
  if (claims.role === "admin") return null;
  if (!env.BOARD_STORE) return jsonResponse({ error: "board_access_approval_required" }, 403, env);
  const id = env.BOARD_STORE.idFromName("free-board");
  const response = await env.BOARD_STORE.get(id).fetch(new Request("https://board-store/api/session/check", {
    method: "GET",
    headers: request.headers,
  }));
  if (!response.ok) return jsonResponse({ error: "auth_required" }, 401, env);
  const payload = await response.json().catch(() => null);
  return payload?.role === "admin" || payload?.boardWriteApproved === true
    ? null
    : jsonResponse({ error: "board_access_approval_required" }, 403, env);
}

function base64UrlToBytes(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function parseJwtPart(value) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));
}

function getExpectedGithubOidcAudience(env) {
  return String(env.GITHUB_OIDC_AUDIENCE || GITHUB_OIDC_AUDIENCE);
}

function getExpectedGithubOidcRepository(env) {
  return String(env.GITHUB_OIDC_REPOSITORY || GITHUB_OIDC_REPOSITORY);
}

async function verifyGithubOidcToken(token, env) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("invalid_oidc_token");

  const [headerPart, payloadPart, signaturePart] = parts;
  const header = parseJwtPart(headerPart);
  const claims = parseJwtPart(payloadPart);
  if (header.alg !== "RS256" || !header.kid) throw new Error("unsupported_oidc_token");

  const now = Math.floor(Date.now() / 1000);
  if (claims.iss !== GITHUB_OIDC_ISSUER) throw new Error("invalid_oidc_issuer");
  if (claims.aud !== getExpectedGithubOidcAudience(env)) throw new Error("invalid_oidc_audience");
  if (claims.repository !== getExpectedGithubOidcRepository(env)) throw new Error("invalid_oidc_repository");
  if (claims.ref !== "refs/heads/main") throw new Error("invalid_oidc_ref");
  if (Number(claims.nbf || 0) > now + 30 || Number(claims.exp || 0) < now - 30) {
    throw new Error("expired_oidc_token");
  }

  const jwksResponse = await fetch(GITHUB_OIDC_JWKS_URL, {
    headers: { "Accept": "application/json" },
    cf: { cacheTtl: 3600, cacheEverything: true },
  });
  if (!jwksResponse.ok) throw new Error("github_oidc_jwks_failed");
  const jwks = await jwksResponse.json();
  const jwk = (jwks.keys || []).find((key) => key.kid === header.kid);
  if (!jwk) throw new Error("github_oidc_key_not_found");

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlToBytes(signaturePart),
    textEncoder().encode(`${headerPart}.${payloadPart}`)
  );
  if (!ok) throw new Error("invalid_oidc_signature");
  return claims;
}

async function requireGithubOidc(request, env) {
  const token = getBearerToken(request);
  if (!token) return jsonResponse({ error: "oidc_required" }, 401, env);
  try {
    await verifyGithubOidcToken(token, env);
    return null;
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "invalid_oidc" }, 401, env);
  }
}

function isProtectedContentPath(url) {
  return url.pathname === "/api/market-data"
    || url.pathname === "/api/live-prices"
    || url.pathname === "/api/news"
    || url.pathname === "/api/screen-settings"
    || url.pathname === "/api/usage/beacon"
    || url.pathname === "/api/usage/stats"
    || url.pathname === "/api/board/categories"
    || url.pathname === "/api/board/logs"
    || url.pathname === "/api/board/media"
    || url.pathname.startsWith("/api/board/media/")
    || url.pathname === "/api/board/posts"
    || url.pathname.startsWith("/api/board/posts/");
}

function isBoardAccessPath(url) {
  return url.pathname === "/api/board/categories"
    || url.pathname === "/api/board/media"
    || url.pathname === "/api/board/media/uploads"
    || url.pathname.startsWith("/api/board/media/uploads/")
    || url.pathname.startsWith("/api/board/media/")
    || url.pathname === "/api/board/posts"
    || url.pathname.startsWith("/api/board/posts/");
}

async function isValidPassword(password, env) {
  const passwordHash = await sha256Hex(password || "");
  return timingSafeEqual(passwordHash, env.SITE_PASSWORD_SHA256);
}

async function isAdminPassword(password, env) {
  return isValidPassword(password, env);
}

async function isMatchingPassword(password, storedHash) {
  const hash = normalizePasswordHash(storedHash);
  if (!hash) return false;
  const passwordHash = await sha256Hex(password || "");
  return timingSafeEqual(passwordHash, hash);
}

async function requireAuthOrPassword(request, env, body = null) {
  if (await isAuthenticated(request, env)) return null;
  if (body && await isValidPassword(body.password, env)) return null;
  return jsonResponse({ error: "auth_required" }, 401, env);
}

function withoutPassword(body) {
  if (!body || typeof body !== "object") return {};
  const {
    password: _password,
    adminPassword: _adminPassword,
    postPassword: _postPassword,
    newPostPassword: _newPostPassword,
    commentPassword: _commentPassword,
    ...rest
  } = body;
  return rest;
}

function publicBoardComment(comment) {
  const normalized = normalizeBoardComment(comment);
  if (!normalized) return null;
  const { passwordHash: _passwordHash, ...safeComment } = normalized;
  return safeComment;
}

function publicBoardPost(post) {
  const normalized = normalizeBoardPost(post);
  if (!normalized) return null;
  const { passwordHash: _passwordHash, comments, ...safePost } = normalized;
  safePost.comments = (comments || []).map(publicBoardComment).filter(Boolean);
  safePost.commentCount = safePost.comments.length;
  return safePost;
}

function publicBoardPosts(posts) {
  return (Array.isArray(posts) ? posts : [])
    .map(publicBoardPost)
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, BOARD_MAX_POSTS);
}

function boardJsonResponse(posts, status, env, extra = {}) {
  const safePosts = publicBoardPosts(posts);
  const body = { posts: safePosts, ...extra };
  if (extra.post) body.post = publicBoardPost(extra.post);
  if (extra.comment) body.comment = publicBoardComment(extra.comment);
  return jsonResponse(body, status, env);
}

function normalizeBoardAdminLog(raw, fallback = {}) {
  if (!raw || typeof raw !== "object") return null;
  const action = cleanBoardText(raw.action || fallback.action, 40);
  if (!["post_update", "post_delete", "comment_delete"].includes(action)) return null;
  const createdAt = Number(raw.createdAt || fallback.createdAt || Date.now());
  const changes = Array.isArray(raw.changes)
    ? raw.changes.map((item) => cleanBoardText(item, 40)).filter(Boolean).slice(0, 8)
    : [];
  return {
    id: cleanBoardText(raw.id || fallback.id || `log-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, 80),
    action,
    actor: cleanBoardText(raw.actor || fallback.actor || "user", 40),
    postId: cleanBoardText(raw.postId || "", 100),
    title: cleanBoardText(raw.title || "", 160),
    beforeTitle: cleanBoardText(raw.beforeTitle || "", 160),
    changes,
    category: normalizeBoardCategory(raw.category),
    commentId: cleanBoardText(raw.commentId || "", 100),
    commentAuthor: cleanBoardText(raw.commentAuthor || "", 40),
    commentPreview: cleanBoardText(raw.commentPreview || "", 120),
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
  };
}

function publicBoardAdminLogs(logs) {
  return (Array.isArray(logs) ? logs : [])
    .map((log) => normalizeBoardAdminLog(log))
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, BOARD_ADMIN_LOG_LIMIT);
}

async function canManagePost(post, body, env) {
  if (await isAdminPassword(body?.adminPassword || "", env)) return true;
  return isMatchingPassword(body?.postPassword || body?.password || "", post?.passwordHash || "");
}

async function canManageComment(comment, body, env) {
  if (await isAdminPassword(body?.adminPassword || "", env)) return true;
  return isMatchingPassword(body?.commentPassword || body?.password || "", comment?.passwordHash || "");
}

async function canManagePostForClaims(post, body, claims, env) {
  if (claims?.role === "admin") return true;
  if (claims?.role === "member" && post?.authorMemberId === claims.subject) return true;
  return canManagePost(post, body, env);
}

async function canManageCommentForClaims(comment, body, claims, env) {
  if (claims?.role === "admin") return true;
  if (claims?.role === "member" && comment?.authorMemberId === claims.subject) return true;
  return canManageComment(comment, body, env);
}

function jsonRequestWithoutPassword(request, body) {
  const headers = new Headers(request.headers);
  headers.set("Content-Type", "application/json");
  return new Request(request.url, {
    method: request.method,
    headers,
    body: JSON.stringify(withoutPassword(body)),
  });
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch (_error) {
    return null;
  }
}

async function parseJsonOrPlainPasswordBody(request) {
  const contentType = String(request.headers.get("Content-Type") || "").toLowerCase();
  if (contentType.includes("text/plain")) {
    return { adminPassword: await request.text() };
  }
  return parseJsonBody(request);
}

function getBoardMediaKey(id) {
  return `${BOARD_MEDIA_KEY_PREFIX}${id}`;
}

function getBoardMediaChunkKey(id, index) {
  return `${getBoardMediaKey(id)}:chunk:${index}`;
}

function getBoardMediaUploadKey(uploadId) {
  return `${BOARD_MEDIA_UPLOAD_KEY_PREFIX}${uploadId}`;
}

function getBoardMediaUploadChunkKey(uploadId, index) {
  return `${getBoardMediaUploadKey(uploadId)}:chunk:${index}`;
}

function hasBoardMediaR2(env) {
  return Boolean(env?.BOARD_MEDIA_BUCKET && typeof env.BOARD_MEDIA_BUCKET.put === "function");
}

function getBoardMediaR2ChunkKey(id, index) {
  return `${BOARD_MEDIA_R2_KEY_PREFIX}/${id}/chunks/${index}`;
}

async function readBoardMediaR2Chunk(env, id, index) {
  if (!hasBoardMediaR2(env)) return null;
  const object = await env.BOARD_MEDIA_BUCKET.get(getBoardMediaR2ChunkKey(id, index));
  if (!object) return null;
  return object.arrayBuffer();
}

function normalizeBoardMediaContentType(value) {
  const contentType = String(value || "").split(";")[0].trim().toLowerCase();
  return /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i.test(contentType)
    ? contentType
    : "application/octet-stream";
}

function getBoardMediaContentType(request) {
  return normalizeBoardMediaContentType(request.headers.get("Content-Type"));
}

function cleanBoardMediaFileName(value) {
  return cleanBoardText(value, 180).replace(/[\\/:*?"<>|]/g, "_") || "attachment";
}

function getBoardMediaFileName(request) {
  try {
    const value = decodeURIComponent(String(request.headers.get("X-File-Name") || "").trim());
    return cleanBoardMediaFileName(value);
  } catch (_error) {
    return "attachment";
  }
}

function isSafeBoardMediaUploadId(uploadId) {
  return /^upload-\d+-[a-z0-9-]{8,40}$/i.test(String(uploadId || ""));
}

function isSafeBoardMediaId(id) {
  return /^media-\d+-[a-z0-9-]{8,40}$/i.test(String(id || ""));
}

function getPostBoardMediaIds(post) {
  const ids = new Set();
  const collect = (value) => {
    const pattern = /\/api\/board\/media\/(media-\d+-[a-z0-9-]{8,40})(?:[?#\s|\]]|$)/gi;
    const text = String(value || "");
    let match;
    while ((match = pattern.exec(text))) {
      if (isSafeBoardMediaId(match[1])) ids.add(match[1]);
    }
  };
  collect(post?.body);
  (Array.isArray(post?.mediaUrls) ? post.mediaUrls : []).forEach(collect);
  return ids;
}

function parseBoardMediaUploadRoute(url) {
  const chunkMatch = url.pathname.match(/^\/api\/board\/media\/uploads\/([^/]+)\/chunks\/(\d+)$/);
  if (chunkMatch) {
    return {
      action: "chunk",
      uploadId: decodeURIComponent(chunkMatch[1]),
      index: Math.max(0, Math.floor(Number(chunkMatch[2]) || 0)),
    };
  }
  const completeMatch = url.pathname.match(/^\/api\/board\/media\/uploads\/([^/]+)\/complete$/);
  if (completeMatch) {
    return {
      action: "complete",
      uploadId: decodeURIComponent(completeMatch[1]),
    };
  }
  return null;
}

async function readBoardMediaFromKv(env, id) {
  if (!env.BOARD_POSTS) throw new Error("board_storage_not_configured");
  const metadata = await env.BOARD_POSTS.get(`${getBoardMediaKey(id)}:meta`, { type: "json" });
  if (!metadata) return null;
  const contentType = String(metadata.contentType || "application/octet-stream");
  if (metadata?.storage === "r2" && hasBoardMediaR2(env)) {
    return {
      contentType,
      fileName: metadata.fileName,
      size: metadata.size,
      chunkCount: Math.max(0, Math.floor(Number(metadata.chunkCount) || 0)),
      readChunk: (index) => readBoardMediaR2Chunk(env, id, index),
    };
  }
  if (metadata?.chunkCount) {
    return {
      contentType,
      fileName: metadata.fileName,
      size: metadata.size,
      chunkCount: Math.max(0, Math.floor(Number(metadata.chunkCount) || 0)),
      readChunk: (index) => env.BOARD_POSTS.get(getBoardMediaChunkKey(id, index), { type: "arrayBuffer" }),
    };
  }
  const bytes = await env.BOARD_POSTS.get(getBoardMediaKey(id), { type: "arrayBuffer" });
  if (!metadata || !bytes) return null;
  return { bytes, contentType, fileName: metadata.fileName };
}

async function writeBoardMediaChunks(bytes, writeChunk) {
  const chunkCount = Math.ceil(bytes.byteLength / BOARD_MEDIA_CHUNK_BYTES);
  for (let index = 0; index < chunkCount; index += 1) {
    const start = index * BOARD_MEDIA_CHUNK_BYTES;
    const end = Math.min(start + BOARD_MEDIA_CHUNK_BYTES, bytes.byteLength);
    await writeChunk(index, bytes.slice(start, end));
  }
  return chunkCount;
}

async function writeBoardMediaToKv(request, env) {
  if (!env.BOARD_POSTS) throw new Error("board_storage_not_configured");
  const contentType = getBoardMediaContentType(request);
  if (!contentType) return jsonResponse({ error: "unsupported_media_type" }, 415, env);
  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > BOARD_MEDIA_MAX_BYTES) {
    return jsonResponse({ error: "media_too_large" }, 413, env);
  }
  const id = `media-${Date.now()}-${crypto.randomUUID().slice(0, 12)}`;
  const chunkCount = await writeBoardMediaChunks(bytes, (index, chunk) => (
    env.BOARD_POSTS.put(getBoardMediaChunkKey(id, index), chunk)
  ));
  await env.BOARD_POSTS.put(`${getBoardMediaKey(id)}:meta`, JSON.stringify({
    contentType,
    fileName: getBoardMediaFileName(request),
    createdAt: Date.now(),
    size: bytes.byteLength,
    chunkCount,
  }));
  const url = new URL(request.url);
  url.pathname = `/api/board/media/${id}`;
  url.search = "";
  return jsonResponse({ id, url: url.toString(), contentType, fileName: getBoardMediaFileName(request), size: bytes.byteLength }, 201, env);
}

async function handleBoardMedia(request, env, url) {
  if (env.BOARD_STORE) {
    const id = env.BOARD_STORE.idFromName("free-board");
    return env.BOARD_STORE.get(id).fetch(request);
  }
  if (request.method === "POST" && (url.pathname === "/api/board/media/uploads" || parseBoardMediaUploadRoute(url))) {
    return jsonResponse({ error: "chunk_upload_storage_not_configured" }, 501, env);
  }
  if (request.method === "POST" && url.pathname === "/api/board/media") {
    return writeBoardMediaToKv(request, env);
  }
  if (request.method === "GET" && url.pathname.startsWith("/api/board/media/")) {
    const id = decodeURIComponent(url.pathname.split("/").pop() || "");
    const media = await readBoardMediaFromKv(env, id);
    if (!media) return jsonResponse({ error: "not_found" }, 404, env);
    return mediaResponse(media, 200, env);
  }
  return jsonResponse({ error: "not_found" }, 404, env);
}

async function handleBoardCategories(request, env) {
  if (env.BOARD_STORE) {
    const id = env.BOARD_STORE.idFromName("free-board");
    return env.BOARD_STORE.get(id).fetch(request);
  }

  if (request.method === "GET") {
    return jsonResponse({ categories: await readBoardCategories(env) }, 200, env);
  }

  if (request.method === "PUT" || request.method === "POST") {
    const body = await parseJsonBody(request);
    if (!await isAdminPassword(body?.adminPassword || body?.password || "", env)) {
      return jsonResponse({ error: "invalid_password" }, 401, env);
    }
    const categories = await writeBoardCategories(env, body?.categories || []);
    return jsonResponse({ categories }, 200, env);
  }

  return jsonResponse({ error: "not_found" }, 404, env);
}

async function handleBoardPosts(request, env, url) {
  if (env.BOARD_STORE) {
    const id = env.BOARD_STORE.idFromName("free-board");
    return env.BOARD_STORE.get(id).fetch(request);
  }

  const postId = decodeURIComponent(url.pathname.replace(/^\/api\/board\/posts\/?/, ""));
  if (request.method === "GET" && url.pathname === "/api/board/posts") {
    return jsonResponse({ posts: await readBoardPosts(env) }, 200, env);
  }

  if (request.method === "POST" && url.pathname === "/api/board/posts") {
    const body = await parseJsonBody(request);
    const authResponse = await requireAuthOrPassword(request, env, body);
    if (authResponse) return authResponse;
    const post = normalizeBoardPost(withoutPassword(body), {
      id: `post-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: Date.now(),
    });
    if (!post) return jsonResponse({ error: "invalid_post" }, 400, env);
    const posts = (await readBoardPosts(env)).filter((item) => item.id !== post.id);
    posts.unshift(post);
    return jsonResponse({ posts: await writeBoardPosts(env, posts), post }, 201, env);
  }

  if (request.method === "POST" && postId && url.pathname.endsWith("/view")) {
    const id = postId.replace(/\/view$/, "");
    const posts = await readBoardPosts(env);
    const target = posts.find((post) => post.id === id);
    if (!target) return jsonResponse({ error: "not_found" }, 404, env);
    target.views = Math.max(0, Math.floor(Number(target.views) || 0)) + 1;
    await writeBoardPosts(env, posts);
    return jsonResponse({ posts, post: target }, 200, env);
  }

  if (request.method === "POST" && postId && url.pathname.endsWith("/verify")) {
    const id = postId.replace(/\/verify$/, "");
    const body = await parseJsonBody(request);
    const authResponse = await requireAuthOrPassword(request, env, body);
    if (authResponse) return authResponse;
    const posts = await readBoardPosts(env);
    const target = posts.find((post) => post.id === id);
    if (!target) return jsonResponse({ error: "not_found" }, 404, env);
    return jsonResponse({ ok: true }, 200, env);
  }

  if (request.method === "PUT" && postId) {
    const body = await parseJsonBody(request);
    const authResponse = await requireAuthOrPassword(request, env, body);
    if (authResponse) return authResponse;
    const posts = await readBoardPosts(env);
    const index = posts.findIndex((post) => post.id === postId);
    if (index < 0) return jsonResponse({ error: "not_found" }, 404, env);
    const updated = normalizeBoardPost({
      ...posts[index],
      ...withoutPassword(body),
      id: posts[index].id,
      createdAt: posts[index].createdAt,
      views: posts[index].views,
      likes: posts[index].likes,
      updatedAt: Date.now(),
    });
    if (!updated) return jsonResponse({ error: "invalid_post" }, 400, env);
    posts[index] = updated;
    return jsonResponse({ posts: await writeBoardPosts(env, posts), post: updated }, 200, env);
  }

  if (request.method === "DELETE" && postId) {
    const body = await parseJsonBody(request.clone());
    const authResponse = await requireAuthOrPassword(request, env, body);
    if (authResponse) return authResponse;
    const posts = await readBoardPosts(env);
    const nextPosts = posts.filter((post) => post.id !== postId);
    if (nextPosts.length === posts.length) return jsonResponse({ error: "not_found" }, 404, env);
    return jsonResponse({ posts: await writeBoardPosts(env, nextPosts), ok: true }, 200, env);
  }

  return jsonResponse({ error: "not_found" }, 404, env);
}

function parsePublishAt(value) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
}

function normalizeNewsItem(entry) {
  const id = Number(entry?.id || 0);
  const publishAt = String(entry?.publishAt || "").trim();
  const publishAtTs = parsePublishAt(publishAt);
  const title = cleanNewsText(entry?.title);
  const content = cleanNewsText(entry?.content);
  if (!id || !publishAtTs || (!title && !content)) return null;

  const item = {
    id,
    publishAt,
    publishAtTs,
    headline: title || "Coinness news",
    summary: makePreview(content || title),
    sourceName: "Coinness",
    articleUrl: `https://coinness.com/news/${id}`,
    originUrl: entry?.link ? String(entry.link).trim() : "",
    originTitle: entry?.linkTitle ? String(entry.linkTitle).trim() : "",
  };
  return item;
}

function normalizeStoredNewsItem(entry) {
  const id = Number(entry?.id || 0);
  const publishAt = String(entry?.publishAt || "").trim();
  const publishAtTs = Number(entry?.publishAtTs) || parsePublishAt(publishAt);
  const headline = cleanNewsText(entry?.headline || entry?.title || entry?.originalTitle || entry?.name);
  const summary = cleanNewsText(entry?.summary || entry?.contentPreview || entry?.body || entry?.description || entry?.text);
  if (!id || !publishAtTs || (!headline && !summary)) return null;
  const item = {
    id,
    publishAt,
    publishAtTs,
    headline: headline || "Coinness news",
    summary: makePreview(summary || headline, 300),
    sourceName: cleanBoardText(entry?.sourceName || "Coinness", 40) || "Coinness",
    articleUrl: cleanBoardText(entry?.articleUrl || entry?.url || entry?.link || `https://coinness.com/news/${id}`, 1000),
    originUrl: cleanBoardText(entry?.originUrl || entry?.sourceUrl || "", 1000),
    originTitle: cleanNewsText(entry?.originTitle || entry?.linkTitle || "").slice(0, 200),
  };
  return item;
}

function getNewsStoreLimit(env) {
  const limit = Math.floor(Number(env.NEWS_STORE_LIMIT) || NEWS_STORE_MAX_ITEMS);
  return Math.min(Math.max(limit, NEWS_PAGE_MAX_ITEMS), NEWS_STORE_MAX_ITEMS);
}

function getNewsRequestLimit(value) {
  const limit = Math.floor(Number(value) || NEWS_PAGE_MAX_ITEMS);
  return Math.min(Math.max(limit, 1), NEWS_PAGE_MAX_ITEMS);
}

function getNewsRequestOffset(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function sortNewsItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => normalizeStoredNewsItem(item))
    .filter(Boolean)
    .sort((a, b) => (b.publishAtTs - a.publishAtTs) || (b.id - a.id));
}

function mergeNewsItems(existing, incoming, limit) {
  const byId = new Map();
  for (const item of sortNewsItems(existing)) byId.set(String(item.id), item);
  for (const item of sortNewsItems(incoming)) {
    byId.set(String(item.id), { ...(byId.get(String(item.id)) || {}), ...item });
  }
  return sortNewsItems([...byId.values()]).slice(0, limit);
}

function normalizeNewsQuery(value) {
  return cleanNewsText(value).replace(/\s+/g, " ").trim().slice(0, 80);
}

function filterNewsItems(items, query) {
  const normalizedQuery = normalizeNewsQuery(query).toLowerCase();
  if (!normalizedQuery) return sortNewsItems(items);
  return sortNewsItems(items).filter((item) => {
    const haystack = [
      item.headline,
      item.summary,
      item.originTitle,
      item.sourceName,
    ].join(" ").toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

function newsPageResponse(store, requestUrl, env, extra = {}) {
  const query = normalizeNewsQuery(requestUrl.searchParams.get("q") || "");
  const limit = getNewsRequestLimit(requestUrl.searchParams.get("limit"));
  const offset = getNewsRequestOffset(requestUrl.searchParams.get("offset"));
  const allItems = sortNewsItems(store?.items || []);
  const filteredItems = filterNewsItems(allItems, query);
  const pageItems = filteredItems.slice(offset, offset + limit);
  return jsonResponse({
    source: "coinness",
    mode: "preview",
    fetchedAt: Math.floor(Number(store?.fetchedAt || 0) / 1000) || Math.floor(Date.now() / 1000),
    cached: Boolean(extra.cached),
    stale: Boolean(extra.stale),
    error: extra.error || "",
    query,
    limit,
    offset,
    count: pageItems.length,
    total: filteredItems.length,
    storedCount: allItems.length,
    hasMore: offset + pageItems.length < filteredItems.length,
    nextOffset: offset + pageItems.length,
    items: pageItems,
  }, 200, env);
}

function protectedNewsPayloadFromMarketData(payload) {
  return {
    source: "worker_protected",
    status: "protected",
    retentionDays: 0,
    fetchedAt: Math.max(0, Math.floor(Number(payload?.generatedAt) || Date.now() / 1000)),
    protected: true,
    items: [],
  };
}

function emptyMarketDataPayload() {
  return {
    generatedAt: 0,
    previousGeneratedAt: 0,
    autoRefreshMinutes: 10,
    fxUsdKrw: 0,
    fxSource: "worker_protected",
    boards: { binance: [], upbit: [], bithumb: [], coinbase: [] },
    futures: { binance: [], coinbase: [] },
    coinInfo: {},
    news: {
      source: "worker_protected",
      status: "protected",
      retentionDays: 0,
      fetchedAt: 0,
      protected: true,
      items: [],
    },
    stats: {
      binance: { total: 0, withCap: 0 },
      upbit: { total: 0, withCap: 0 },
      bithumb: { total: 0, withCap: 0 },
      coinbase: { total: 0, withCap: 0 },
    },
    futuresStats: {
      binance: { total: 0, withCap: 0 },
      coinbase: { total: 0, withCap: 0 },
    },
    changes: {},
    notes: {},
    refreshIssues: {},
    protected: true,
  };
}

function normalizeMarketDataPayload(payload) {
  if (!payload || typeof payload !== "object" || !payload.boards || typeof payload.boards !== "object") {
    return null;
  }
  const normalized = {
    ...payload,
    boards: {
      binance: Array.isArray(payload.boards.binance) ? payload.boards.binance : [],
      upbit: Array.isArray(payload.boards.upbit) ? payload.boards.upbit : [],
      bithumb: Array.isArray(payload.boards.bithumb) ? payload.boards.bithumb : [],
      coinbase: Array.isArray(payload.boards.coinbase) ? payload.boards.coinbase : [],
    },
    futures: {
      binance: Array.isArray(payload.futures?.binance) ? payload.futures.binance : [],
      coinbase: Array.isArray(payload.futures?.coinbase) ? payload.futures.coinbase : [],
    },
    coinInfo: payload.coinInfo && typeof payload.coinInfo === "object" ? payload.coinInfo : {},
    stats: payload.stats && typeof payload.stats === "object" ? payload.stats : {},
    futuresStats: payload.futuresStats && typeof payload.futuresStats === "object"
      ? payload.futuresStats
      : {},
    news: protectedNewsPayloadFromMarketData(payload),
    protected: true,
  };
  return normalized;
}

async function fetchSeedNewsItems(env) {
  const seedUrl = String(env.NEWS_SEED_URL || "").trim();
  if (!seedUrl) return [];
  try {
    const response = await fetch(seedUrl, {
      headers: {
        "Accept": "application/javascript,text/javascript,text/plain,*/*",
        "Cache-Control": "no-cache",
      },
    });
    if (!response.ok) return [];
    const text = await response.text();
    const match = text.match(/window\.BOARD_DATA\s*=\s*([\s\S]*?);?\s*$/);
    if (!match) return [];
    const parsed = JSON.parse(match[1].replace(/;\s*$/, ""));
    return Array.isArray(parsed?.news?.items) ? parsed.news.items.map(normalizeStoredNewsItem).filter(Boolean) : [];
  } catch (_error) {
    return [];
  }
}

let lastGoodNews = null;
let cachedNews = null;
let cachedNewsAtMs = 0;

function getNewsCacheMs(env) {
  const seconds = Math.max(60, Math.floor(Number(env.NEWS_CACHE_SECONDS) || DEFAULT_NEWS_CACHE_SECONDS));
  return seconds * 1000;
}

async function fetchCoinnessNews(env) {
  const limit = Math.min(Math.max(Number(env.NEWS_LIMIT || NEWS_PAGE_MAX_ITEMS), 1), NEWS_PAGE_MAX_ITEMS);
  const query = new URLSearchParams({ languageCode: "ko", limit: String(limit) });
  const response = await fetch(`${COINNESS_NEWS_ENDPOINT}?${query.toString()}`, {
    headers: {
      "Accept": "application/json",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.7,en;q=0.6",
      "Cache-Control": "no-cache",
      "Referer": "https://coinness.com/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
    },
  });
  if (!response.ok) {
    throw new Error(`coinness_fetch_failed:${response.status}`);
  }
  const payload = await response.json();
  const items = Array.isArray(payload)
    ? payload.map((entry) => normalizeNewsItem(entry)).filter(Boolean)
    : [];
  return {
    source: "coinness",
    mode: "preview",
    fetchedAt: Math.floor(Date.now() / 1000),
    items,
  };
}

async function fetchCoinnessNewsSafely(env) {
  const now = Date.now();
  const cacheMs = getNewsCacheMs(env);
  if (cachedNews && now - cachedNewsAtMs < cacheMs) {
    return {
      ...cachedNews,
      cached: true,
      cacheSeconds: Math.floor(cacheMs / 1000),
    };
  }
  try {
    const news = await fetchCoinnessNews(env);
    if (news.items.length) {
      lastGoodNews = news;
      cachedNews = news;
      cachedNewsAtMs = now;
    }
    return news;
  } catch (error) {
    if (lastGoodNews) {
      return {
        ...lastGoodNews,
        stale: true,
        error: "coinness_fetch_failed",
      };
    }
    return {
      source: "coinness",
      mode: "preview",
      fetchedAt: Math.floor(Date.now() / 1000),
      error: error instanceof Error ? error.message : "coinness_fetch_failed",
      items: [],
    };
  }
}

async function handleLogin(request, env) {
  let body = {};
  try {
    body = await request.json();
  } catch (_error) {
    return jsonResponse({ error: "invalid_json" }, 400, env);
  }
  const passwordHash = await sha256Hex(body.password || "");
  if (!timingSafeEqual(passwordHash, env.SITE_PASSWORD_SHA256)) {
    return jsonResponse({ error: "invalid_password" }, 401, env);
  }
  const token = await createSessionToken(env);
  const headers = new Headers(jsonResponse({ ok: true }, 200, env).headers);
  appendSessionCookies(headers, token);
  return new Response(JSON.stringify(sessionPayload(token)), { status: 200, headers });
}

function handleLogout(env) {
  const headers = new Headers(jsonResponse({ ok: true }, 200, env).headers);
  appendClearedSessionCookies(headers);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

async function handleSession(request, env) {
  const authResponse = await requireAuth(request, env);
  if (authResponse) return authResponse;
  const token = await createSessionToken(env);
  const headers = new Headers(jsonResponse({ ok: true }, 200, env).headers);
  appendSessionCookies(headers, token);
  return new Response(JSON.stringify(sessionPayload(token)), { status: 200, headers });
}

export class BoardStore {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async readMembers() {
    const stored = await this.state.storage.get(MEMBERS_KEY);
    if (!Array.isArray(stored)) return [];
    return stored
      .map((member) => normalizeMemberRecord(member))
      .filter(Boolean)
      .sort((a, b) => b.requestedAt - a.requestedAt)
      .slice(0, MEMBER_MAX_ITEMS);
  }

  async writeMembers(members) {
    const normalized = (Array.isArray(members) ? members : [])
      .map((member) => normalizeMemberRecord(member))
      .filter(Boolean)
      .sort((a, b) => b.requestedAt - a.requestedAt)
      .slice(0, MEMBER_MAX_ITEMS);
    await this.state.storage.put(MEMBERS_KEY, normalized);
    return normalized;
  }

  async getActiveSessionClaims(request) {
    const claims = await getRequestSessionClaims(request, this.env);
    if (!claims) return null;
    if (claims.role === "admin") return { ...claims, boardWriteApproved: true };
    const member = (await this.readMembers()).find((item) => item.id === claims.subject);
    return member?.status === "active" && member.authVersion === claims.authVersion
      ? { ...claims, boardWriteApproved: member.boardWriteApproved === true }
      : null;
  }

  async getBoardAccessClaims(request) {
    const claims = await this.getActiveSessionClaims(request);
    if (!claims) return { claims: null, response: jsonResponse({ error: "auth_required" }, 401, this.env) };
    if (claims.role === "admin" || claims.boardWriteApproved === true) return { claims, response: null };
    return {
      claims,
      response: jsonResponse({ error: "board_access_approval_required" }, 403, this.env),
    };
  }

  async requireActiveAuth(request) {
    if (await this.getActiveSessionClaims(request)) return null;
    return jsonResponse({ error: "auth_required" }, 401, this.env);
  }

  async requireAdminAuth(request, body = null) {
    const password = String(body?.adminPassword || body?.password || "");
    if (password && await isAdminPassword(password, this.env)) return null;
    const claims = await this.getActiveSessionClaims(request);
    if (claims?.role === "admin") return null;
    return jsonResponse({ error: password ? "invalid_password" : "admin_required" }, 401, this.env);
  }

  async handleSessionRequest(request) {
    const claims = await this.getActiveSessionClaims(request);
    if (!claims) return jsonResponse({ error: "auth_required" }, 401, this.env);
    const token = await createSessionToken(this.env, claims);
    const headers = new Headers(jsonResponse({ ok: true }, 200, this.env).headers);
    appendSessionCookies(headers, token);
    return new Response(JSON.stringify(sessionPayload(token, claims)), { status: 200, headers });
  }

  async readPosts() {
    const stored = await this.state.storage.get(BOARD_POSTS_KEY);
    if (!Array.isArray(stored)) return [];
    return stored
      .map((post) => normalizeBoardPost(post))
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, BOARD_MAX_POSTS);
  }

  async writePosts(posts) {
    const normalized = (Array.isArray(posts) ? posts : [])
      .map((post) => normalizeBoardPost(post))
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, BOARD_MAX_POSTS);
    await this.state.storage.put(BOARD_POSTS_KEY, normalized);
    return normalized;
  }

  async readCategories() {
    const stored = await this.state.storage.get(BOARD_CATEGORIES_KEY);
    return normalizeBoardCategories(stored);
  }

  async writeCategories(categories) {
    const normalized = normalizeBoardCategories(categories);
    await this.state.storage.put(BOARD_CATEGORIES_KEY, normalized);
    return normalized;
  }

  async readScreenSettingsRecord() {
    const stored = await this.state.storage.get(SCREEN_SETTINGS_KEY);
    return {
      exists: Boolean(stored && typeof stored === "object"),
      settings: normalizeScreenSettings(stored),
    };
  }

  async writeScreenSettings(settings) {
    const normalized = normalizeScreenSettings(settings);
    await this.state.storage.put(SCREEN_SETTINGS_KEY, normalized);
    return normalized;
  }

  async readAdminLogs() {
    const stored = await this.state.storage.get(BOARD_ADMIN_LOGS_KEY);
    return publicBoardAdminLogs(stored);
  }

  async writeAdminLogs(logs) {
    const normalized = publicBoardAdminLogs(logs);
    await this.state.storage.put(BOARD_ADMIN_LOGS_KEY, normalized);
    return normalized;
  }

  async addAdminLog(log) {
    const normalized = normalizeBoardAdminLog(log, {
      id: `log-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: Date.now(),
    });
    if (!normalized) return this.readAdminLogs();
    const logs = await this.readAdminLogs();
    logs.unshift(normalized);
    return this.writeAdminLogs(logs);
  }

  async tryAddAdminLog(log) {
    try {
      return await this.addAdminLog(log);
    } catch (error) {
      console.error("board_admin_log_failed", error);
      return this.readAdminLogs();
    }
  }

  async readUsageStats() {
    return normalizeUsageStats(await this.state.storage.get(USAGE_STATS_KEY));
  }

  async writeUsageStats(stats) {
    const normalized = normalizeUsageStats(stats);
    await this.state.storage.put(USAGE_STATS_KEY, normalized);
    return normalized;
  }

  async readNewsStore() {
    const stored = await this.state.storage.get(NEWS_STORE_KEY);
    const rawItems = Array.isArray(stored)
      ? stored
      : (Array.isArray(stored?.items) ? stored.items : []);
    const normalized = {
      fetchedAt: Math.max(0, Math.floor(Number(stored?.fetchedAt) || 0)),
      seededAt: Math.max(0, Math.floor(Number(stored?.seededAt) || 0)),
      items: sortNewsItems(rawItems).slice(0, getNewsStoreLimit(this.env)),
    };
    if (rawItems.some((item) => item && typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "content"))) {
      await this.state.storage.put(NEWS_STORE_KEY, normalized);
    }
    return normalized;
  }

  async writeNewsStore(store) {
    const normalized = {
      fetchedAt: Math.max(0, Math.floor(Number(store?.fetchedAt) || Date.now())),
      seededAt: Math.max(0, Math.floor(Number(store?.seededAt) || 0)),
      items: sortNewsItems(store?.items || []).slice(0, getNewsStoreLimit(this.env)),
    };
    await this.state.storage.put(NEWS_STORE_KEY, normalized);
    return normalized;
  }

  async readMarketData() {
    const meta = await this.state.storage.get(MARKET_DATA_KEY);
    if (!meta || !Number.isFinite(Number(meta.chunkCount))) return null;
    const chunkCount = Math.max(0, Math.floor(Number(meta.chunkCount) || 0));
    if (!chunkCount) return null;
    const chunks = [];
    for (let index = 0; index < chunkCount; index += 1) {
      const chunk = await this.state.storage.get(`${MARKET_DATA_CHUNK_PREFIX}${index}`);
      if (typeof chunk !== "string") return null;
      chunks.push(chunk);
    }
    try {
      return normalizeMarketDataPayload(JSON.parse(chunks.join("")));
    } catch (_error) {
      return null;
    }
  }

  async writeMarketData(request) {
    const text = await request.text();
    const bytes = new TextEncoder().encode(text).byteLength;
    if (!bytes || bytes > MARKET_DATA_MAX_BYTES) {
      return jsonResponse({ error: "market_data_too_large" }, 413, this.env);
    }
    let payload = null;
    try {
      payload = JSON.parse(text);
    } catch (_error) {
      return jsonResponse({ error: "invalid_market_data_json" }, 400, this.env);
    }
    const normalized = normalizeMarketDataPayload(payload);
    if (!normalized) return jsonResponse({ error: "invalid_market_data" }, 400, this.env);

    const serialized = JSON.stringify(normalized);
    const chunkCount = Math.max(1, Math.ceil(serialized.length / MARKET_DATA_CHUNK_CHARS));
    const previousMeta = await this.state.storage.get(MARKET_DATA_KEY);
    const previousChunkCount = Math.max(0, Math.floor(Number(previousMeta?.chunkCount) || 0));
    for (let index = 0; index < chunkCount; index += 1) {
      const start = index * MARKET_DATA_CHUNK_CHARS;
      await this.state.storage.put(`${MARKET_DATA_CHUNK_PREFIX}${index}`, serialized.slice(start, start + MARKET_DATA_CHUNK_CHARS));
    }
    if (previousChunkCount > chunkCount) {
      const staleKeys = [];
      for (let index = chunkCount; index < previousChunkCount; index += 1) {
        staleKeys.push(`${MARKET_DATA_CHUNK_PREFIX}${index}`);
      }
      if (staleKeys.length) await this.state.storage.delete(staleKeys);
    }
    await this.state.storage.put(MARKET_DATA_KEY, {
      generatedAt: Math.max(0, Math.floor(Number(normalized.generatedAt) || 0)),
      updatedAt: Date.now(),
      bytes: new TextEncoder().encode(serialized).byteLength,
      chunkCount,
    });
    return jsonResponse({
      ok: true,
      generatedAt: normalized.generatedAt || 0,
      bytes: new TextEncoder().encode(serialized).byteLength,
      chunkCount,
    }, 200, this.env);
  }

  async handleMarketDataRequest(request, url = new URL(request.url)) {
    const since = Math.max(0, Math.floor(Number(url.searchParams.get("since")) || 0));
    if (since > 0) {
      const meta = await this.state.storage.get(MARKET_DATA_KEY);
      const generatedAt = Math.max(0, Math.floor(Number(meta?.generatedAt) || 0));
      if (generatedAt > 0 && generatedAt === since) {
        return jsonResponse({
          notModified: true,
          generatedAt,
          updatedAt: Math.max(0, Math.floor(Number(meta?.updatedAt) || 0)),
          bytes: Math.max(0, Math.floor(Number(meta?.bytes) || 0)),
        }, 200, this.env);
      }
    }
    const payload = await this.readMarketData();
    if (!payload) return jsonResponse({ error: "market_data_not_ready" }, 404, this.env);
    return jsonResponse(payload, 200, this.env);
  }

  async handleLivePricesRequest() {
    const payload = await this.readMarketData();
    return jsonResponse(await fetchLivePricePayload(payload), 200, this.env);
  }

  async refreshNewsStore(force = false) {
    const now = Date.now();
    const cacheMs = getNewsCacheMs(this.env);
    const store = await this.readNewsStore();
    if (!force && store.items.length && now - store.fetchedAt < cacheMs) {
      return { store, cached: true };
    }
    try {
      let baseItems = store.items;
      let seededAt = store.seededAt;
      if (!seededAt) {
        const seedItems = await fetchSeedNewsItems(this.env);
        if (seedItems.length) {
          baseItems = mergeNewsItems(baseItems, seedItems, getNewsStoreLimit(this.env));
          seededAt = now;
        }
      }
      const latest = await fetchCoinnessNews(this.env);
      const merged = mergeNewsItems(baseItems, latest.items, getNewsStoreLimit(this.env));
      const nextStore = await this.writeNewsStore({
        fetchedAt: now,
        seededAt,
        items: merged,
      });
      if (nextStore.items.length) {
        lastGoodNews = { ...latest, items: nextStore.items };
      }
      return { store: nextStore };
    } catch (error) {
      if (store.items.length) {
        return {
          store,
          stale: true,
          error: error instanceof Error ? error.message : "coinness_fetch_failed",
        };
      }
      const fallback = await fetchCoinnessNewsSafely(this.env);
      return {
        store: {
          fetchedAt: now,
          items: sortNewsItems(fallback.items || []).slice(0, getNewsStoreLimit(this.env)),
        },
        stale: true,
        error: fallback.error || (error instanceof Error ? error.message : "coinness_fetch_failed"),
      };
    }
  }

  async handleNewsRequest(request, url) {
    const force = url.searchParams.get("refresh") === "1";
    const result = await this.refreshNewsStore(force);
    return newsPageResponse(result.store, url, this.env, result);
  }

  async recordUsageBeacon(body) {
    const rawBytes = Math.max(0, Math.floor(Number(body?.bytes) || 0));
    const bytes = Math.min(rawBytes, USAGE_BEACON_MAX_BYTES);
    const now = Date.now();
    const monthKey = getKstMonthKey(now);
    const dayKey = getKstDateKey(now);
    const hourKey = getKstHourKey(now);
    const stats = await this.readUsageStats();
    stats.months[monthKey] = normalizeUsageBucket(stats.months[monthKey]);
    stats.days[dayKey] = normalizeUsageBucket(stats.days[dayKey]);
    stats.hours[hourKey] = normalizeUsageBucket(stats.hours[hourKey]);
    stats.months[monthKey].views += 1;
    stats.months[monthKey].samples += bytes > 0 ? 1 : 0;
    stats.months[monthKey].bytes += bytes;
    stats.months[monthKey].lastSeen = now;
    stats.days[dayKey].views += 1;
    stats.days[dayKey].samples += bytes > 0 ? 1 : 0;
    stats.days[dayKey].bytes += bytes;
    stats.days[dayKey].lastSeen = now;
    stats.hours[hourKey].views += 1;
    stats.hours[hourKey].samples += bytes > 0 ? 1 : 0;
    stats.hours[hourKey].bytes += bytes;
    stats.hours[hourKey].lastSeen = now;
    stats.totalViews += 1;
    stats.totalBytes += bytes;
    stats.firstSeen = stats.firstSeen || now;
    stats.lastSeen = now;

    return this.writeUsageStats(pruneUsageStats(stats, now));
  }

  async recordServerTransfer(kind, bytesValue) {
    const bytes = Math.max(0, Math.floor(Number(bytesValue) || 0));
    if (!bytes) return this.readUsageStats();
    const isMedia = kind === "media";
    const now = Date.now();
    const monthKey = getKstMonthKey(now);
    const dayKey = getKstDateKey(now);
    const hourKey = getKstHourKey(now);
    const stats = await this.readUsageStats();
    stats.months[monthKey] = normalizeUsageBucket(stats.months[monthKey]);
    stats.days[dayKey] = normalizeUsageBucket(stats.days[dayKey]);
    stats.hours[hourKey] = normalizeUsageBucket(stats.hours[hourKey]);
    [stats.months[monthKey], stats.days[dayKey], stats.hours[hourKey]].forEach((bucket) => {
      if (isMedia) {
        bucket.mediaBytes += bytes;
        bucket.mediaRequests += 1;
      } else {
        bucket.apiBytes += bytes;
        bucket.apiRequests += 1;
      }
      bucket.lastSeen = now;
    });
    if (isMedia) {
      stats.totalMediaBytes += bytes;
      stats.totalMediaRequests += 1;
    } else {
      stats.totalApiBytes += bytes;
      stats.totalApiRequests += 1;
    }
    stats.firstSeen = stats.firstSeen || now;
    stats.lastSeen = now;
    return this.writeUsageStats(pruneUsageStats(stats, now));
  }

  async recordMediaDownload(bytesValue) {
    return this.recordServerTransfer("media", bytesValue);
  }

  async recordApiResponse(response) {
    const bytes = Math.max(0, Math.floor(Number(response?.headers?.get("X-Response-Bytes")) || 0));
    if (bytes) await this.recordServerTransfer("api", bytes);
    return response;
  }

  async readMedia(id) {
    const media = await this.state.storage.get(getBoardMediaKey(id));
    if (!media || !media.contentType) return null;
    if (media.storage === "r2" && hasBoardMediaR2(this.env)) {
      return {
        contentType: String(media.contentType || "application/octet-stream"),
        fileName: media.fileName,
        size: media.size,
        chunkCount: Math.max(0, Math.floor(Number(media.chunkCount) || 0)),
        readChunk: (index) => readBoardMediaR2Chunk(this.env, id, index),
      };
    }
    if (media.chunkCount) {
      return {
        contentType: String(media.contentType || "application/octet-stream"),
        fileName: media.fileName,
        size: media.size,
        chunkCount: Math.max(0, Math.floor(Number(media.chunkCount) || 0)),
        readChunk: (index) => this.state.storage.get(getBoardMediaChunkKey(id, index)),
      };
    }
    if (!media.bytes) return null;
    return { bytes: media.bytes, contentType: String(media.contentType || "application/octet-stream"), fileName: media.fileName };
  }

  async deleteStoredMedia(id) {
    if (!isSafeBoardMediaId(id)) return false;
    const key = getBoardMediaKey(id);
    const media = await this.state.storage.get(key);
    if (!media || typeof media !== "object") return false;
    const chunkCount = Math.max(0, Math.floor(Number(media.chunkCount) || 0));
    if (media.storage === "r2") {
      if (!hasBoardMediaR2(this.env)) return false;
      const r2Keys = [];
      for (let index = 0; index < chunkCount; index += 1) {
        r2Keys.push(getBoardMediaR2ChunkKey(id, index));
      }
      await Promise.all(r2Keys.map((r2Key) => this.env.BOARD_MEDIA_BUCKET.delete(r2Key)));
      await this.state.storage.delete(key);
      return true;
    }
    const stateKeys = [key];
    for (let index = 0; index < chunkCount; index += 1) {
      stateKeys.push(getBoardMediaChunkKey(id, index));
    }
    await this.state.storage.delete(stateKeys);
    return true;
  }

  async cleanupUnreferencedMedia(candidateIds, posts) {
    const candidates = new Set(Array.from(candidateIds || []).filter(isSafeBoardMediaId));
    if (!candidates.size) return;
    const referenced = new Set();
    (Array.isArray(posts) ? posts : []).forEach((post) => {
      getPostBoardMediaIds(post).forEach((id) => referenced.add(id));
    });
    const removals = [...candidates]
      .filter((id) => !referenced.has(id))
      .map((id) => this.deleteStoredMedia(id));
    const results = await Promise.allSettled(removals);
    results.forEach((result) => {
      if (result.status === "rejected") console.error("board_media_cleanup_failed", result.reason);
    });
  }

  async writeMedia(request) {
    const contentType = getBoardMediaContentType(request);
    if (!contentType) return jsonResponse({ error: "unsupported_media_type" }, 415, this.env);
    const bytes = await request.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > BOARD_MEDIA_MAX_BYTES) {
      return jsonResponse({ error: "media_too_large" }, 413, this.env);
    }
    const id = `media-${Date.now()}-${crypto.randomUUID().slice(0, 12)}`;
    const chunkCount = await writeBoardMediaChunks(bytes, (index, chunk) => (
      this.state.storage.put(getBoardMediaChunkKey(id, index), chunk)
    ));
    await this.state.storage.put(getBoardMediaKey(id), {
      contentType,
      fileName: getBoardMediaFileName(request),
      createdAt: Date.now(),
      size: bytes.byteLength,
      chunkCount,
    });
    const url = new URL(request.url);
    url.pathname = `/api/board/media/${id}`;
    url.search = "";
    return jsonResponse({ id, url: url.toString(), contentType, fileName: getBoardMediaFileName(request), size: bytes.byteLength }, 201, this.env);
  }

  async cleanupExpiredMediaUploads(now = Date.now()) {
    const records = await this.state.storage.list({ prefix: BOARD_MEDIA_UPLOAD_KEY_PREFIX });
    const cleanupTasks = [];
    for (const [key, value] of records) {
      if (!key.startsWith(BOARD_MEDIA_UPLOAD_KEY_PREFIX) || key.includes(":chunk:")) continue;
      const meta = value && typeof value === "object" ? value : {};
      const createdAt = Math.max(0, Math.floor(Number(meta.createdAt) || 0));
      if (createdAt && now - createdAt <= BOARD_MEDIA_UPLOAD_MAX_AGE_MS) continue;
      const uploadId = String(meta.uploadId || key.slice(BOARD_MEDIA_UPLOAD_KEY_PREFIX.length) || "");
      if (isSafeBoardMediaUploadId(uploadId)) {
        cleanupTasks.push(this.deleteMediaUpload(uploadId));
      }
    }
    if (cleanupTasks.length) await Promise.allSettled(cleanupTasks);
  }

  async readMediaUpload(uploadId) {
    if (!isSafeBoardMediaUploadId(uploadId)) return null;
    const meta = await this.state.storage.get(getBoardMediaUploadKey(uploadId));
    if (!meta || typeof meta !== "object") return null;
    return {
      uploadId,
      fileName: cleanBoardMediaFileName(meta.fileName),
      contentType: normalizeBoardMediaContentType(meta.contentType),
      size: Math.max(0, Math.floor(Number(meta.size) || 0)),
      chunkSize: Math.max(1, Math.floor(Number(meta.chunkSize) || BOARD_MEDIA_CHUNK_BYTES)),
      chunkCount: Math.max(0, Math.floor(Number(meta.chunkCount) || 0)),
      createdAt: Math.max(0, Math.floor(Number(meta.createdAt) || 0)),
      storage: meta.storage === "r2" ? "r2" : "durable_object",
      mediaId: isSafeBoardMediaId(meta.mediaId) ? meta.mediaId : "",
      uploadedChunks: Array.isArray(meta.uploadedChunks) ? meta.uploadedChunks : [],
    };
  }

  async deleteMediaUpload(uploadId, meta, options = {}) {
    const safeMeta = meta || await this.readMediaUpload(uploadId);
    const deleteChunks = options.deleteChunks !== false;
    const chunkCount = Math.max(0, Math.floor(Number(safeMeta?.chunkCount) || 0));
    const stateDeleteKeys = [getBoardMediaUploadKey(uploadId)];
    if (safeMeta?.storage !== "r2" && deleteChunks) {
      for (let index = 0; index < chunkCount; index += 1) {
        stateDeleteKeys.push(getBoardMediaUploadChunkKey(uploadId, index));
      }
    }
    await this.state.storage.delete(stateDeleteKeys);
    if (safeMeta?.storage === "r2" && deleteChunks && hasBoardMediaR2(this.env)) {
      const mediaId = safeMeta.mediaId || "";
      const r2DeleteKeys = [];
      for (let index = 0; mediaId && index < chunkCount; index += 1) {
        r2DeleteKeys.push(getBoardMediaR2ChunkKey(mediaId, index));
      }
      await Promise.all(r2DeleteKeys.map((key) => this.env.BOARD_MEDIA_BUCKET.delete(key)));
    }
  }

  expectedMediaUploadChunkSize(meta, index) {
    if (index < 0 || index >= meta.chunkCount) return 0;
    if (index < meta.chunkCount - 1) return meta.chunkSize;
    return meta.size - (meta.chunkSize * (meta.chunkCount - 1));
  }

  async createMediaUpload(request) {
    await this.cleanupExpiredMediaUploads();
    const body = await parseJsonBody(request);
    const size = Math.max(0, Math.floor(Number(body?.size) || 0));
    if (!size || size > BOARD_MEDIA_MAX_BYTES) {
      return jsonResponse({ error: "media_too_large" }, 413, this.env);
    }
    const uploadId = `upload-${Date.now()}-${crypto.randomUUID().slice(0, 12)}`;
    const mediaId = `media-${Date.now()}-${crypto.randomUUID().slice(0, 12)}`;
    const useR2 = hasBoardMediaR2(this.env);
    const chunkSize = useR2 ? BOARD_MEDIA_R2_CHUNK_BYTES : BOARD_MEDIA_CHUNK_BYTES;
    const chunkCount = Math.ceil(size / chunkSize);
    const meta = {
      uploadId,
      mediaId,
      fileName: cleanBoardMediaFileName(body?.fileName || "attachment"),
      contentType: normalizeBoardMediaContentType(body?.contentType),
      size,
      chunkSize,
      chunkCount,
      storage: useR2 ? "r2" : "durable_object",
      createdAt: Date.now(),
      uploadedChunks: [],
    };
    await this.state.storage.put(getBoardMediaUploadKey(uploadId), meta);
    return jsonResponse({
      uploadId,
      chunkSize,
      chunkCount,
      size,
      storage: meta.storage,
      parallelChunks: useR2 ? BOARD_MEDIA_R2_PARALLEL_CHUNKS : 8,
    }, 201, this.env);
  }

  async writeMediaUploadChunk(request, uploadId, index) {
    const meta = await this.readMediaUpload(uploadId);
    if (!meta) return jsonResponse({ error: "upload_not_found" }, 404, this.env);
    if (Date.now() - meta.createdAt > BOARD_MEDIA_UPLOAD_MAX_AGE_MS) {
      await this.deleteMediaUpload(uploadId, meta);
      return jsonResponse({ error: "upload_expired" }, 410, this.env);
    }
    if (!Number.isInteger(index) || index < 0 || index >= meta.chunkCount) {
      return jsonResponse({ error: "invalid_chunk_index" }, 400, this.env);
    }
    const bytes = await request.arrayBuffer();
    const expectedSize = this.expectedMediaUploadChunkSize(meta, index);
    if (!bytes.byteLength || bytes.byteLength !== expectedSize) {
      return jsonResponse({ error: "invalid_chunk_size", expectedSize, actualSize: bytes.byteLength }, 400, this.env);
    }
    if (meta.storage === "r2") {
      if (!hasBoardMediaR2(this.env) || !meta.mediaId) {
        return jsonResponse({ error: "r2_storage_not_configured" }, 500, this.env);
      }
      await this.env.BOARD_MEDIA_BUCKET.put(getBoardMediaR2ChunkKey(meta.mediaId, index), bytes);
    } else {
      await this.state.storage.put(getBoardMediaUploadChunkKey(uploadId, index), bytes);
    }
    const uploadedSet = new Set(meta.uploadedChunks.map((value) => Math.floor(Number(value))).filter((value) => Number.isInteger(value)));
    uploadedSet.add(index);
    const uploadedChunks = [...uploadedSet].sort((left, right) => left - right);
    await this.state.storage.put(getBoardMediaUploadKey(uploadId), { ...meta, uploadedChunks });
    return jsonResponse({ ok: true, index, uploadedChunks: uploadedChunks.length, chunkCount: meta.chunkCount }, 200, this.env);
  }

  async completeMediaUpload(request, uploadId) {
    const meta = await this.readMediaUpload(uploadId);
    if (!meta) return jsonResponse({ error: "upload_not_found" }, 404, this.env);
    if (Date.now() - meta.createdAt > BOARD_MEDIA_UPLOAD_MAX_AGE_MS) {
      await this.deleteMediaUpload(uploadId, meta);
      return jsonResponse({ error: "upload_expired" }, 410, this.env);
    }
    if (meta.storage === "r2" && (!hasBoardMediaR2(this.env) || !meta.mediaId)) {
      return jsonResponse({ error: "r2_storage_not_configured" }, 500, this.env);
    }
    const readChunkSize = async (index) => (meta.storage === "r2"
      ? Math.max(0, Math.floor(Number((await this.env.BOARD_MEDIA_BUCKET.head(getBoardMediaR2ChunkKey(meta.mediaId, index)))?.size) || 0))
      : ((await this.state.storage.get(getBoardMediaUploadChunkKey(uploadId, index)))?.byteLength || 0));
    const actualSizes = [];
    if (meta.storage === "r2") {
      actualSizes.push(...await Promise.all(Array.from({ length: meta.chunkCount }, (_, index) => readChunkSize(index))));
    } else {
      for (let index = 0; index < meta.chunkCount; index += 1) {
        actualSizes.push(await readChunkSize(index));
      }
    }
    for (let index = 0; index < meta.chunkCount; index += 1) {
      const actualSize = actualSizes[index] || 0;
      const expectedSize = this.expectedMediaUploadChunkSize(meta, index);
      if (actualSize !== expectedSize) {
        return jsonResponse({ error: "missing_media_chunk", index, expectedSize, actualSize }, 400, this.env);
      }
    }

    const id = meta.mediaId || `media-${Date.now()}-${crypto.randomUUID().slice(0, 12)}`;
    if (meta.storage !== "r2") {
      for (let index = 0; index < meta.chunkCount; index += 1) {
        const chunk = await this.state.storage.get(getBoardMediaUploadChunkKey(uploadId, index));
        await this.state.storage.put(getBoardMediaChunkKey(id, index), chunk);
      }
    }
    await this.state.storage.put(getBoardMediaKey(id), {
      contentType: meta.contentType,
      fileName: meta.fileName,
      createdAt: Date.now(),
      size: meta.size,
      chunkSize: meta.chunkSize,
      chunkCount: meta.chunkCount,
      storage: meta.storage,
    });
    await this.deleteMediaUpload(uploadId, meta, { deleteChunks: false });
    const url = new URL(request.url);
    url.pathname = `/api/board/media/${id}`;
    url.search = "";
    return jsonResponse({ id, url: url.toString(), contentType: meta.contentType, fileName: meta.fileName, size: meta.size }, 201, this.env);
  }

  async handleLoginRequest(request) {
    let body = {};
    try {
      body = await request.json();
    } catch (_error) {
      return jsonResponse({ error: "invalid_json" }, 400, this.env);
    }

    const now = Date.now();
    const attemptKey = await getLoginAttemptKey(getForwardedLoginClientIp(request));
    let record = normalizeLoginAttemptRecord(await this.state.storage.get(attemptKey));

    if (record.lockedUntil > now) {
      return loginLockedResponse(record, this.env);
    }
    if (record.lockedUntil && record.lockedUntil <= now) {
      record = normalizeLoginAttemptRecord(null);
      await this.state.storage.delete(attemptKey);
    }

    const passwordHash = await sha256Hex(body.password || "");
    const passwordValid = timingSafeEqual(passwordHash, this.env.SITE_PASSWORD_SHA256);

    if (!passwordValid) {
      const failures = Math.min(LOGIN_FAILURE_LIMIT, record.failures + 1);
      const nextRecord = {
        failures,
        lockedUntil: failures >= LOGIN_FAILURE_LIMIT ? now + LOGIN_LOCK_MS : 0,
        updatedAt: now,
      };
      await this.state.storage.put(attemptKey, nextRecord);
      if (nextRecord.lockedUntil > now) {
        return loginLockedResponse(nextRecord, this.env);
      }
      return jsonResponse({
        error: "invalid_password",
        remainingAttempts: Math.max(0, LOGIN_FAILURE_LIMIT - failures),
      }, 401, this.env);
    }

    await this.state.storage.delete(attemptKey);
    const token = await createSessionToken(this.env);
    const headers = new Headers(jsonResponse({ ok: true }, 200, this.env).headers);
    appendSessionCookies(headers, token);
    return new Response(JSON.stringify(sessionPayload(token)), { status: 200, headers });
  }

  async handleEmailOtpRequest(request) {
    if (!isEmailLoginConfigured(this.env)) {
      return jsonResponse({ error: "email_login_not_configured" }, 503, this.env);
    }

    let body = {};
    try {
      body = await request.json();
    } catch (_error) {
      return jsonResponse({ error: "invalid_json" }, 400, this.env);
    }
    const requestedEmail = normalizeEmailAddress(body.email);
    const ownerRecipient = getAllowedEmailLoginDestination(requestedEmail, this.env);
    const approvedMember = (await this.readMembers()).find(
      (member) => member.email === requestedEmail && member.status === "active"
    );
    const recipient = ownerRecipient || approvedMember?.email || "";
    const role = ownerRecipient ? "admin" : (approvedMember ? "member" : "");
    const subject = ownerRecipient ? "owner" : (approvedMember?.id || "");

    const now = Date.now();
    const clientIpHash = await sha256Hex(getForwardedLoginClientIp(request));
    const rateKey = `${EMAIL_OTP_RATE_KEY_PREFIX}${clientIpHash}`;
    const rate = {
      windowStartedAt: 0,
      count: 0,
      lastSentAt: 0,
      ...((await this.state.storage.get(rateKey)) || {}),
    };
    const globalRate = {
      windowStartedAt: 0,
      count: 0,
      lastSentAt: 0,
      ...((await this.state.storage.get(EMAIL_OTP_GLOBAL_RATE_KEY)) || {}),
    };
    const retryAt = Math.max(
      Number(rate.lastSentAt) + EMAIL_OTP_RESEND_COOLDOWN_MS,
      Number(globalRate.lastSentAt) + EMAIL_OTP_RESEND_COOLDOWN_MS
    );
    if (retryAt > now) {
      const retryAfterSeconds = Math.max(1, Math.ceil((retryAt - now) / 1000));
      return jsonResponse({ error: "email_otp_rate_limited", retryAfterSeconds }, 429, this.env);
    }

    const windowStartedAt = Number(rate.windowStartedAt) || now;
    const inCurrentWindow = now - windowStartedAt < 60 * 60 * 1000;
    const hourlyCount = inCurrentWindow ? Math.max(0, Math.floor(Number(rate.count) || 0)) : 0;
    if (hourlyCount >= EMAIL_OTP_HOURLY_LIMIT) {
      const retryAfterSeconds = Math.max(1, Math.ceil((windowStartedAt + 60 * 60 * 1000 - now) / 1000));
      return jsonResponse({ error: "email_otp_hourly_limit", retryAfterSeconds }, 429, this.env);
    }
    const globalWindowStartedAt = Number(globalRate.windowStartedAt) || now;
    const inGlobalWindow = now - globalWindowStartedAt < 60 * 60 * 1000;
    const globalHourlyCount = inGlobalWindow ? Math.max(0, Math.floor(Number(globalRate.count) || 0)) : 0;
    if (globalHourlyCount >= EMAIL_OTP_GLOBAL_HOURLY_LIMIT) {
      const retryAfterSeconds = Math.max(1, Math.ceil((globalWindowStartedAt + 60 * 60 * 1000 - now) / 1000));
      return jsonResponse({ error: "email_otp_hourly_limit", retryAfterSeconds }, 429, this.env);
    }

    const requestId = crypto.randomUUID();
    const sentAt = Date.now();
    const expiresAt = sentAt + EMAIL_OTP_TTL_MS;
    await this.state.storage.put(rateKey, {
      windowStartedAt: inCurrentWindow ? windowStartedAt : now,
      count: hourlyCount + 1,
      lastSentAt: sentAt,
    });
    await this.state.storage.put(EMAIL_OTP_GLOBAL_RATE_KEY, {
      windowStartedAt: inGlobalWindow ? globalWindowStartedAt : sentAt,
      count: globalHourlyCount + 1,
      lastSentAt: sentAt,
    });

    const currentKey = await getEmailOtpCurrentKey(recipient || requestedEmail || requestId, "login");
    const previousRequestId = String(await this.state.storage.get(currentKey) || "");
    const code = generateEmailOtpCode();

    if (recipient) {
      try {
        await sendEmailOtp(code, requestId, recipient, this.env);
      } catch (error) {
        return jsonResponse({
          error: error instanceof Error ? error.message : "email_send_failed",
        }, 503, this.env);
      }
    }

    if (previousRequestId) {
      await this.state.storage.delete(`${EMAIL_OTP_KEY_PREFIX}${previousRequestId}`);
    }
    await this.state.storage.put(`${EMAIL_OTP_KEY_PREFIX}${requestId}`, {
      codeHash: await getEmailOtpHash(requestId, code, this.env),
      expiresAt,
      attempts: 0,
      currentKey,
      purpose: "login",
      role,
      subject,
    });
    await this.state.storage.put(currentKey, requestId);

    return jsonResponse({
      ok: true,
      requestId,
      expiresAt,
      maskedEmail: maskEmailAddress(requestedEmail),
    }, 200, this.env);
  }

  async handleEmailOtpVerify(request) {
    if (!isEmailLoginConfigured(this.env)) {
      return jsonResponse({ error: "email_login_not_configured" }, 503, this.env);
    }

    let body = {};
    try {
      body = await request.json();
    } catch (_error) {
      return jsonResponse({ error: "invalid_json" }, 400, this.env);
    }
    const requestId = String(body.requestId || "").trim();
    const code = String(body.code || "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(requestId) || !/^\d{6}$/.test(code)) {
      return jsonResponse({ error: "invalid_email_otp" }, 401, this.env);
    }

    const otpKey = `${EMAIL_OTP_KEY_PREFIX}${requestId}`;
    const record = await this.state.storage.get(otpKey);
    if (!record || Number(record.expiresAt) <= Date.now()) {
      await this.state.storage.delete(otpKey);
      await clearCurrentEmailOtp(this.state.storage, record, requestId);
      return jsonResponse({ error: "email_otp_expired" }, 401, this.env);
    }
    if (record.purpose !== "login" || !["admin", "member"].includes(record.role)) {
      await this.state.storage.delete(otpKey);
      await clearCurrentEmailOtp(this.state.storage, record, requestId);
      return jsonResponse({ error: "invalid_email_otp" }, 401, this.env);
    }

    const attempts = Math.max(0, Math.floor(Number(record.attempts) || 0));
    const valid = timingSafeEqual(
      String(record.codeHash || ""),
      await getEmailOtpHash(requestId, code, this.env)
    );
    if (!valid) {
      const nextAttempts = attempts + 1;
      if (nextAttempts >= EMAIL_OTP_VERIFY_LIMIT) {
        await this.state.storage.delete(otpKey);
        await clearCurrentEmailOtp(this.state.storage, record, requestId);
        return jsonResponse({ error: "email_otp_attempts_exceeded" }, 401, this.env);
      }
      await this.state.storage.put(otpKey, { ...record, attempts: nextAttempts });
      return jsonResponse({
        error: "invalid_email_otp",
        remainingAttempts: EMAIL_OTP_VERIFY_LIMIT - nextAttempts,
      }, 401, this.env);
    }

    await this.state.storage.delete(otpKey);
    await clearCurrentEmailOtp(this.state.storage, record, requestId);
    if (record.role === "member") {
      const members = await this.readMembers();
      const member = members.find((item) => item.id === record.subject);
      if (!member || member.status !== "active") {
        return jsonResponse({ error: "member_not_approved" }, 403, this.env);
      }
      member.lastLoginAt = Date.now();
      member.updatedAt = Date.now();
      await this.writeMembers(members);
      record.authVersion = member.authVersion;
      record.boardWriteApproved = member.boardWriteApproved === true;
    }
    const claims = {
      role: record.role,
      subject: record.subject,
      authVersion: record.authVersion,
      boardWriteApproved: record.role === "admin" || record.boardWriteApproved === true,
    };
    const token = await createSessionToken(this.env, claims);
    const headers = new Headers(jsonResponse({ ok: true }, 200, this.env).headers);
    appendSessionCookies(headers, token);
    return new Response(JSON.stringify(sessionPayload(token, claims)), { status: 200, headers });
  }

  async handleMemberSignupRequest(request) {
    if (!isMemberRegistrationEnabled(this.env)) {
      return jsonResponse({ error: "member_registration_not_configured" }, 503, this.env);
    }
    let body = {};
    try {
      body = await request.json();
    } catch (_error) {
      return jsonResponse({ error: "invalid_json" }, 400, this.env);
    }
    const email = normalizeEmailAddress(body.email);
    const password = String(body.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return jsonResponse({ error: "invalid_email_destination" }, 400, this.env);
    }
    const passwordError = getMemberPasswordError(password);
    if (passwordError) return jsonResponse({ error: passwordError }, 400, this.env);

    const now = Date.now();
    const clientIpHash = await sha256Hex(getForwardedLoginClientIp(request));
    const rateKey = `${MEMBER_SIGNUP_RATE_KEY_PREFIX}${clientIpHash}`;
    const rate = {
      windowStartedAt: 0,
      count: 0,
      lastRequestedAt: 0,
      ...((await this.state.storage.get(rateKey)) || {}),
    };
    const globalRate = {
      windowStartedAt: 0,
      count: 0,
      ...((await this.state.storage.get(MEMBER_SIGNUP_GLOBAL_RATE_KEY)) || {}),
    };
    const retryAt = Number(rate.lastRequestedAt) + MEMBER_SIGNUP_COOLDOWN_MS;
    if (retryAt > now) {
      return jsonResponse({
        error: "member_signup_rate_limited",
        retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1000)),
      }, 429, this.env);
    }
    const windowStartedAt = Number(rate.windowStartedAt) || now;
    const inCurrentWindow = now - windowStartedAt < 60 * 60 * 1000;
    const hourlyCount = inCurrentWindow ? Math.max(0, Math.floor(Number(rate.count) || 0)) : 0;
    const globalWindowStartedAt = Number(globalRate.windowStartedAt) || now;
    const inGlobalWindow = now - globalWindowStartedAt < 60 * 60 * 1000;
    const globalHourlyCount = inGlobalWindow ? Math.max(0, Math.floor(Number(globalRate.count) || 0)) : 0;
    if (hourlyCount >= MEMBER_SIGNUP_HOURLY_LIMIT || globalHourlyCount >= MEMBER_SIGNUP_GLOBAL_HOURLY_LIMIT) {
      return jsonResponse({ error: "member_signup_rate_limited", retryAfterSeconds: 3600 }, 429, this.env);
    }
    await this.state.storage.put(rateKey, {
      windowStartedAt: inCurrentWindow ? windowStartedAt : now,
      count: hourlyCount + 1,
      lastRequestedAt: now,
    });
    await this.state.storage.put(MEMBER_SIGNUP_GLOBAL_RATE_KEY, {
      windowStartedAt: inGlobalWindow ? globalWindowStartedAt : now,
      count: globalHourlyCount + 1,
    });

    const passwordCredentials = await createMemberPasswordCredentials(password);
    const members = await this.readMembers();
    const existingMember = members.find((item) => item.email === email);
    const isOwnerAccount = Boolean(getAllowedEmailLoginDestination(email, this.env));
    if (!existingMember && !isOwnerAccount) {
      if (members.length >= MEMBER_MAX_ITEMS) {
        return jsonResponse({ ok: true, status: "pending" }, 200, this.env);
      }
      members.push(normalizeMemberRecord({
        id: crypto.randomUUID(),
        email,
        emailHash: await sha256Hex(email),
        ...passwordCredentials,
        authVersion: 1,
        status: "pending",
        requestedAt: now,
        emailVerifiedAt: 0,
        updatedAt: now,
      }));
      await this.writeMembers(members);
    }

    // Always return the same response so this endpoint cannot be used to enumerate accounts.
    return jsonResponse({ ok: true, status: "pending" }, 200, this.env);
  }

  async handleSignupOtpRequest(request) {
    if (!isMemberEmailDeliveryConfigured(this.env)) {
      return jsonResponse({ error: "member_registration_not_configured" }, 503, this.env);
    }
    let body = {};
    try {
      body = await request.json();
    } catch (_error) {
      return jsonResponse({ error: "invalid_json" }, 400, this.env);
    }
    const email = normalizeEmailAddress(body.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return jsonResponse({ error: "invalid_email_destination" }, 400, this.env);
    }

    const now = Date.now();
    const clientIpHash = await sha256Hex(getForwardedLoginClientIp(request));
    const emailHash = await sha256Hex(email);
    const rateKey = `${EMAIL_OTP_RATE_KEY_PREFIX}signup:${clientIpHash}:${emailHash}`;
    const rate = {
      windowStartedAt: 0,
      count: 0,
      lastSentAt: 0,
      ...((await this.state.storage.get(rateKey)) || {}),
    };
    const globalRate = {
      windowStartedAt: 0,
      count: 0,
      lastSentAt: 0,
      ...((await this.state.storage.get(EMAIL_OTP_SIGNUP_GLOBAL_RATE_KEY)) || {}),
    };
    const retryAt = Math.max(
      Number(rate.lastSentAt) + EMAIL_OTP_RESEND_COOLDOWN_MS,
      Number(globalRate.lastSentAt) + EMAIL_OTP_RESEND_COOLDOWN_MS
    );
    if (retryAt > now) {
      return jsonResponse({
        error: "email_otp_rate_limited",
        retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1000)),
      }, 429, this.env);
    }
    const windowStartedAt = Number(rate.windowStartedAt) || now;
    const inCurrentWindow = now - windowStartedAt < 60 * 60 * 1000;
    const hourlyCount = inCurrentWindow ? Math.max(0, Math.floor(Number(rate.count) || 0)) : 0;
    const globalWindowStartedAt = Number(globalRate.windowStartedAt) || now;
    const inGlobalWindow = now - globalWindowStartedAt < 60 * 60 * 1000;
    const globalHourlyCount = inGlobalWindow ? Math.max(0, Math.floor(Number(globalRate.count) || 0)) : 0;
    if (hourlyCount >= EMAIL_OTP_HOURLY_LIMIT || globalHourlyCount >= EMAIL_OTP_GLOBAL_HOURLY_LIMIT) {
      return jsonResponse({ error: "email_otp_hourly_limit", retryAfterSeconds: 3600 }, 429, this.env);
    }

    const requestId = crypto.randomUUID();
    const sentAt = Date.now();
    const expiresAt = sentAt + EMAIL_OTP_TTL_MS;
    const currentKey = await getEmailOtpCurrentKey(email, "signup");
    const previousRequestId = String(await this.state.storage.get(currentKey) || "");
    const code = generateEmailOtpCode();
    const ownerAccount = Boolean(getAllowedEmailLoginDestination(email, this.env));
    await this.state.storage.put(rateKey, {
      windowStartedAt: inCurrentWindow ? windowStartedAt : now,
      count: hourlyCount + 1,
      lastSentAt: sentAt,
    });
    await this.state.storage.put(EMAIL_OTP_SIGNUP_GLOBAL_RATE_KEY, {
      windowStartedAt: inGlobalWindow ? globalWindowStartedAt : sentAt,
      count: globalHourlyCount + 1,
      lastSentAt: sentAt,
    });
    try {
      await sendSignupEmailOtp(code, requestId, email, this.env);
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : "email_send_failed" }, 503, this.env);
    }

    if (previousRequestId) await this.state.storage.delete(`${EMAIL_OTP_KEY_PREFIX}${previousRequestId}`);
    await this.state.storage.put(`${EMAIL_OTP_KEY_PREFIX}${requestId}`, {
      codeHash: await getEmailOtpHash(requestId, code, this.env),
      expiresAt,
      attempts: 0,
      currentKey,
      purpose: "signup",
      email,
      emailHash,
      ownerAccount,
    });
    await this.state.storage.put(currentKey, requestId);
    return jsonResponse({
      ok: true,
      requestId,
      expiresAt,
      maskedEmail: maskEmailAddress(email),
    }, 200, this.env);
  }

  async handleSignupOtpVerify(request) {
    if (!isMemberEmailDeliveryConfigured(this.env)) {
      return jsonResponse({ error: "member_registration_not_configured" }, 503, this.env);
    }
    let body = {};
    try {
      body = await request.json();
    } catch (_error) {
      return jsonResponse({ error: "invalid_json" }, 400, this.env);
    }
    const requestId = String(body.requestId || "").trim();
    const code = String(body.code || "").trim();
    const password = String(body.password || "");
    if (!/^[0-9a-f-]{36}$/i.test(requestId) || !/^\d{6}$/.test(code)) {
      return jsonResponse({ error: "invalid_email_otp" }, 401, this.env);
    }
    const passwordError = getMemberPasswordError(password);
    if (passwordError) return jsonResponse({ error: passwordError }, 400, this.env);
    const otpKey = `${EMAIL_OTP_KEY_PREFIX}${requestId}`;
    const record = await this.state.storage.get(otpKey);
    if (!record || record.purpose !== "signup" || Number(record.expiresAt) <= Date.now()) {
      await this.state.storage.delete(otpKey);
      await clearCurrentEmailOtp(this.state.storage, record, requestId);
      return jsonResponse({ error: "email_otp_expired" }, 401, this.env);
    }
    const attempts = Math.max(0, Math.floor(Number(record.attempts) || 0));
    const valid = timingSafeEqual(String(record.codeHash || ""), await getEmailOtpHash(requestId, code, this.env));
    if (!valid) {
      const nextAttempts = attempts + 1;
      if (nextAttempts >= EMAIL_OTP_VERIFY_LIMIT) {
        await this.state.storage.delete(otpKey);
        await clearCurrentEmailOtp(this.state.storage, record, requestId);
        return jsonResponse({ error: "email_otp_attempts_exceeded" }, 401, this.env);
      }
      await this.state.storage.put(otpKey, { ...record, attempts: nextAttempts });
      return jsonResponse({
        error: "invalid_email_otp",
        remainingAttempts: EMAIL_OTP_VERIFY_LIMIT - nextAttempts,
      }, 401, this.env);
    }

    await this.state.storage.delete(otpKey);
    await clearCurrentEmailOtp(this.state.storage, record, requestId);
    if (record.ownerAccount) {
      return jsonResponse({ ok: true, status: "owner" }, 200, this.env);
    }
    const passwordCredentials = await createMemberPasswordCredentials(password);
    const now = Date.now();
    const members = await this.readMembers();
    let member = members.find((item) => item.email === record.email);
    if (!member) {
      member = normalizeMemberRecord({
        id: crypto.randomUUID(),
        email: record.email,
        emailHash: record.emailHash || await sha256Hex(record.email),
        ...passwordCredentials,
        authVersion: 1,
        status: "pending",
        requestedAt: now,
        emailVerifiedAt: now,
        updatedAt: now,
      });
      members.push(member);
    } else if (member.status !== "active" && member.status !== "revoked") {
      member.status = "pending";
      member.requestedAt = now;
      member.emailVerifiedAt = now;
      member.updatedAt = now;
      member.rejectedAt = 0;
      Object.assign(member, passwordCredentials);
      member.authVersion = Math.max(1, member.authVersion + 1);
    }
    await this.writeMembers(members);

    if (member.status === "pending") {
      await Promise.all(getEmailLoginDestinations(this.env).map((recipient, index) =>
        sendMemberEmail({
          recipient,
          subject: "ComaCap membership approval requested",
          text: `A verified signup request is waiting for approval.\n\nApplicant: ${member.email}\n\nOpen the ComaCap admin panel to approve or reject this request.`,
          idempotencyKey: `coin-member-request-${member.id}-${member.requestedAt}-${index}`,
        }, this.env).catch((error) => console.error("member_admin_notification_failed", error))
      ));
    }
    return jsonResponse({ ok: true, status: member.status }, 200, this.env);
  }

  async handleMemberPasswordLogin(request) {
    let body = {};
    try {
      body = await request.json();
    } catch (_error) {
      return jsonResponse({ error: "invalid_json" }, 400, this.env);
    }
    const email = normalizeEmailAddress(body.email);
    const password = String(body.password || "");
    const safePassword = textEncoder().encode(password).byteLength <= 256 ? password : "";
    const clientIpHash = await sha256Hex(getForwardedLoginClientIp(request));
    const emailHash = await sha256Hex(email || "invalid");
    const attemptKey = `${MEMBER_PASSWORD_ATTEMPT_KEY_PREFIX}${clientIpHash}:${emailHash}`;
    const now = Date.now();
    let attempt = normalizeLoginAttemptRecord(await this.state.storage.get(attemptKey));
    if (attempt.lockedUntil > now) return loginLockedResponse(attempt, this.env);
    if (attempt.lockedUntil && attempt.lockedUntil <= now) {
      attempt = normalizeLoginAttemptRecord(null);
      await this.state.storage.delete(attemptKey);
    }

    const members = await this.readMembers();
    const member = members.find((item) => item.email === email);
    const fakeMember = {
      passwordSalt: (await sha256Hex(`missing:${email}`)).slice(0, 32),
      passwordHash: "0".repeat(64),
      passwordIterations: MEMBER_PASSWORD_ITERATIONS,
    };
    const passwordValid = await verifyMemberPassword(safePassword, member || fakeMember);
    const loginValid = Boolean(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      && member?.status === "active"
      && passwordValid
    );
    if (!loginValid) {
      const failures = Math.min(LOGIN_FAILURE_LIMIT, attempt.failures + 1);
      const nextAttempt = {
        failures,
        lockedUntil: failures >= LOGIN_FAILURE_LIMIT ? now + LOGIN_LOCK_MS : 0,
        updatedAt: now,
      };
      await this.state.storage.put(attemptKey, nextAttempt);
      if (nextAttempt.lockedUntil > now) return loginLockedResponse(nextAttempt, this.env);
      return jsonResponse({
        error: "invalid_member_credentials",
        remainingAttempts: Math.max(0, LOGIN_FAILURE_LIMIT - failures),
      }, 401, this.env);
    }

    await this.state.storage.delete(attemptKey);
    if (member.passwordIterations < MEMBER_PASSWORD_ITERATIONS) {
      Object.assign(member, await createMemberPasswordCredentials(password, { validate: false }));
    }
    member.lastLoginAt = now;
    member.updatedAt = now;
    await this.writeMembers(members);
    const claims = {
      role: "member",
      subject: member.id,
      authVersion: member.authVersion,
      boardWriteApproved: member.boardWriteApproved === true,
    };
    const token = await createSessionToken(this.env, claims);
    const headers = new Headers(jsonResponse({ ok: true }, 200, this.env).headers);
    appendSessionCookies(headers, token);
    return new Response(JSON.stringify(sessionPayload(token, claims)), { status: 200, headers });
  }

  async handleMemberPasswordResetRequest(request) {
    if (!isMemberEmailDeliveryConfigured(this.env)) {
      return jsonResponse({ error: "member_registration_not_configured" }, 503, this.env);
    }
    let body = {};
    try {
      body = await request.json();
    } catch (_error) {
      return jsonResponse({ error: "invalid_json" }, 400, this.env);
    }
    const email = normalizeEmailAddress(body.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return jsonResponse({ error: "invalid_email_destination" }, 400, this.env);
    }
    const now = Date.now();
    const emailHash = await sha256Hex(email);
    const clientIpHash = await sha256Hex(getForwardedLoginClientIp(request));
    const rateKey = `${EMAIL_OTP_RATE_KEY_PREFIX}password-reset:${clientIpHash}:${emailHash}`;
    const rate = { windowStartedAt: 0, count: 0, lastSentAt: 0, ...((await this.state.storage.get(rateKey)) || {}) };
    const globalRate = { windowStartedAt: 0, count: 0, lastSentAt: 0, ...((await this.state.storage.get(MEMBER_PASSWORD_RESET_GLOBAL_RATE_KEY)) || {}) };
    const retryAt = Math.max(Number(rate.lastSentAt) + EMAIL_OTP_RESEND_COOLDOWN_MS, Number(globalRate.lastSentAt) + EMAIL_OTP_RESEND_COOLDOWN_MS);
    if (retryAt > now) {
      return jsonResponse({ error: "email_otp_rate_limited", retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1000)) }, 429, this.env);
    }
    const windowStartedAt = Number(rate.windowStartedAt) || now;
    const globalWindowStartedAt = Number(globalRate.windowStartedAt) || now;
    const inWindow = now - windowStartedAt < 60 * 60 * 1000;
    const inGlobalWindow = now - globalWindowStartedAt < 60 * 60 * 1000;
    const count = inWindow ? Math.max(0, Math.floor(Number(rate.count) || 0)) : 0;
    const globalCount = inGlobalWindow ? Math.max(0, Math.floor(Number(globalRate.count) || 0)) : 0;
    if (count >= EMAIL_OTP_HOURLY_LIMIT || globalCount >= EMAIL_OTP_GLOBAL_HOURLY_LIMIT) {
      return jsonResponse({ error: "email_otp_hourly_limit", retryAfterSeconds: 3600 }, 429, this.env);
    }
    await this.state.storage.put(rateKey, { windowStartedAt: inWindow ? windowStartedAt : now, count: count + 1, lastSentAt: now });
    await this.state.storage.put(MEMBER_PASSWORD_RESET_GLOBAL_RATE_KEY, { windowStartedAt: inGlobalWindow ? globalWindowStartedAt : now, count: globalCount + 1, lastSentAt: now });

    const requestId = crypto.randomUUID();
    const expiresAt = now + MEMBER_PASSWORD_RESET_TTL_MS;
    const member = (await this.readMembers()).find((item) => item.email === email && item.status === "active");
    if (member) {
      const currentKey = await getEmailOtpCurrentKey(email, "password-reset");
      const previousRequestId = String(await this.state.storage.get(currentKey) || "");
      if (previousRequestId) await this.state.storage.delete(`${MEMBER_PASSWORD_RESET_KEY_PREFIX}${previousRequestId}`);
      const code = generateEmailOtpCode();
      try {
        await sendPasswordResetOtp(code, requestId, email, this.env);
      } catch (error) {
        return jsonResponse({ error: error instanceof Error ? error.message : "email_send_failed" }, 503, this.env);
      }
      await this.state.storage.put(`${MEMBER_PASSWORD_RESET_KEY_PREFIX}${requestId}`, {
        memberId: member.id,
        email,
        codeHash: await getEmailOtpHash(requestId, code, this.env),
        expiresAt,
        attempts: 0,
        currentKey,
      });
      await this.state.storage.put(currentKey, requestId);
    }
    return jsonResponse({ ok: true, requestId, expiresAt, maskedEmail: maskEmailAddress(email) }, 200, this.env);
  }

  async handleMemberPasswordResetConfirm(request) {
    let body = {};
    try {
      body = await request.json();
    } catch (_error) {
      return jsonResponse({ error: "invalid_json" }, 400, this.env);
    }
    const requestId = String(body.requestId || "").trim();
    const code = String(body.code || "").trim();
    const newPassword = String(body.newPassword || "");
    if (!/^[0-9a-f-]{36}$/i.test(requestId) || !/^\d{6}$/.test(code)) {
      return jsonResponse({ error: "invalid_password_reset" }, 401, this.env);
    }
    const passwordError = getMemberPasswordError(newPassword);
    if (passwordError) return jsonResponse({ error: passwordError }, 400, this.env);
    const key = `${MEMBER_PASSWORD_RESET_KEY_PREFIX}${requestId}`;
    const record = await this.state.storage.get(key);
    if (!record || Number(record.expiresAt) <= Date.now()) {
      await this.state.storage.delete(key);
      await clearCurrentEmailOtp(this.state.storage, record, requestId);
      return jsonResponse({ error: "password_reset_expired" }, 401, this.env);
    }
    const valid = timingSafeEqual(String(record.codeHash || ""), await getEmailOtpHash(requestId, code, this.env));
    if (!valid) {
      const attempts = Math.max(0, Math.floor(Number(record.attempts) || 0)) + 1;
      if (attempts >= EMAIL_OTP_VERIFY_LIMIT) {
        await this.state.storage.delete(key);
        await clearCurrentEmailOtp(this.state.storage, record, requestId);
        return jsonResponse({ error: "email_otp_attempts_exceeded" }, 401, this.env);
      }
      await this.state.storage.put(key, { ...record, attempts });
      return jsonResponse({ error: "invalid_password_reset", remainingAttempts: EMAIL_OTP_VERIFY_LIMIT - attempts }, 401, this.env);
    }
    const members = await this.readMembers();
    const member = members.find((item) => item.id === record.memberId && item.email === record.email && item.status === "active");
    if (!member) return jsonResponse({ error: "invalid_password_reset" }, 401, this.env);
    Object.assign(member, await createMemberPasswordCredentials(newPassword));
    member.authVersion = Math.max(1, member.authVersion + 1);
    member.updatedAt = Date.now();
    await this.writeMembers(members);
    await this.state.storage.delete(key);
    await clearCurrentEmailOtp(this.state.storage, record, requestId);
    return jsonResponse({ ok: true }, 200, this.env);
  }

  async handleMembersAdmin(request, url) {
    const body = await parseJsonBody(request);
    const authResponse = await this.requireAdminAuth(request, body);
    if (authResponse) return authResponse;
    const action = decodeURIComponent(url.pathname.replace(/^\/api\/admin\/members\/?/, "")) || "list";
    let members = await this.readMembers();
    if (action === "list") {
      return jsonResponse({ members: members.map(publicAdminMember).filter(Boolean) }, 200, this.env);
    }
    const memberId = String(body?.memberId || "").trim();
    const member = members.find((item) => item.id === memberId);
    if (!member) return jsonResponse({ error: "member_not_found" }, 404, this.env);
    const now = Date.now();
    if (action === "approve" || action === "restore") {
      if (!member.passwordSalt || !member.passwordHash) {
        return jsonResponse({ error: "member_password_not_set" }, 409, this.env);
      }
      member.status = "active";
      member.approvedAt = now;
      member.rejectedAt = 0;
      member.revokedAt = 0;
    } else if (action === "board-approve") {
      if (member.status !== "active") {
        return jsonResponse({ error: "member_not_active" }, 409, this.env);
      }
      member.boardWriteApproved = true;
      member.boardWriteApprovedAt = now;
    } else if (action === "board-revoke") {
      member.boardWriteApproved = false;
      member.boardWriteApprovedAt = 0;
    } else if (action === "reject") {
      member.status = "rejected";
      member.rejectedAt = now;
      member.boardWriteApproved = false;
      member.boardWriteApprovedAt = 0;
    } else if (action === "revoke") {
      member.status = "revoked";
      member.revokedAt = now;
      member.boardWriteApproved = false;
      member.boardWriteApprovedAt = 0;
    } else if (action === "delete") {
      members = members.filter((item) => item.id !== memberId);
      await this.writeMembers(members);
      return jsonResponse({ ok: true, members: members.map(publicAdminMember).filter(Boolean) }, 200, this.env);
    } else {
      return jsonResponse({ error: "invalid_member_action" }, 400, this.env);
    }
    member.updatedAt = now;
    await this.writeMembers(members);
    const statusText = action === "board-approve"
      ? "board access approved"
      : (action === "board-revoke" ? "board access revoked" : (member.status === "active" ? "approved" : member.status));
    let emailSent = null;
    if (isMemberEmailDeliveryConfigured(this.env)) {
      emailSent = true;
      try {
        await sendMemberEmail({
          recipient: member.email,
          subject: `ComaCap membership ${statusText}`,
          text: action === "board-approve"
            ? "Your ComaCap board access has been approved. You can now read the board, download attachments, and create or manage posts you own."
            : (action === "board-revoke"
              ? "Your ComaCap board access has been revoked. Your site membership remains active, but the board and its attachments are no longer accessible."
              : (member.status === "active"
                ? "Your ComaCap membership has been approved. You can now log in with your email address and the password you chose during signup. Board access requires separate administrator approval."
                : `Your ComaCap membership status is now ${member.status}.`)),
          idempotencyKey: `coin-member-${action}-${member.id}-${now}`,
        }, this.env);
      } catch (error) {
        emailSent = false;
        console.error("member_status_email_failed", error);
      }
    }
    return jsonResponse({
      ok: true,
      emailSent,
      members: members.map(publicAdminMember).filter(Boolean),
    }, 200, this.env);
  }

  async fetch(request) {
    const url = new URL(request.url);
    const postId = decodeURIComponent(url.pathname.replace(/^\/api\/board\/posts\/?/, ""));

    if (request.method === "POST" && url.pathname === "/api/login") {
      return this.handleLoginRequest(request);
    }
    if (request.method === "POST" && url.pathname === "/api/login/email/request") {
      return this.handleEmailOtpRequest(request);
    }
    if (request.method === "POST" && url.pathname === "/api/login/email/verify") {
      return this.handleEmailOtpVerify(request);
    }
    if (request.method === "POST" && url.pathname === "/api/login/member/password") {
      return this.handleMemberPasswordLogin(request);
    }
    if (request.method === "POST" && url.pathname === "/api/member/password/reset/request") {
      return this.handleMemberPasswordResetRequest(request);
    }
    if (request.method === "POST" && url.pathname === "/api/member/password/reset/confirm") {
      return this.handleMemberPasswordResetConfirm(request);
    }
    if (request.method === "POST" && url.pathname === "/api/signup/request") {
      return this.handleMemberSignupRequest(request);
    }
    if (request.method === "GET" && url.pathname === "/api/session") {
      return this.handleSessionRequest(request);
    }
    if (request.method === "GET" && url.pathname === "/api/session/check") {
      const claims = await this.getActiveSessionClaims(request);
      return claims
        ? jsonResponse({ ok: true, role: claims.role, boardWriteApproved: claims.boardWriteApproved === true }, 200, this.env)
        : jsonResponse({ error: "auth_required" }, 401, this.env);
    }
    if (request.method === "POST" && url.pathname.startsWith("/api/admin/members")) {
      return this.handleMembersAdmin(request, url);
    }

    if (request.method === "POST" && url.pathname === "/api/market-data") {
      if (request.headers.get("X-Market-Data-Sync") !== "1") {
        return jsonResponse({ error: "market_data_sync_required" }, 403, this.env);
      }
      return this.writeMarketData(request);
    }

    if (request.method === "POST" && url.pathname === "/api/usage/stats") {
      const body = await parseJsonOrPlainPasswordBody(request);
      const authResponse = await this.requireAdminAuth(request, body);
      if (authResponse) return authResponse;
      return this.recordApiResponse(
        jsonResponse({ usage: publicUsageStats(await this.readUsageStats()) }, 200, this.env)
      );
    }

    if (isProtectedContentPath(url)) {
      const authResponse = await this.requireActiveAuth(request);
      if (authResponse) return authResponse;
    }
    if (isBoardAccessPath(url)) {
      const access = await this.getBoardAccessClaims(request);
      if (access.response) return access.response;
    }

    if (url.pathname === "/api/screen-settings") {
      if (request.method === "GET") {
        return this.recordApiResponse(jsonResponse(await this.readScreenSettingsRecord(), 200, this.env));
      }
      if (request.method === "PUT" || request.method === "POST") {
        const body = await parseJsonBody(request);
        if (!await isAdminPassword(body?.adminPassword || body?.password || "", this.env)) {
          return jsonResponse({ error: "invalid_password" }, 401, this.env);
        }
        return jsonResponse({ settings: await this.writeScreenSettings(body?.settings || body) }, 200, this.env);
      }
    }

    if (request.method === "GET" && url.pathname === "/api/market-data") {
      return this.recordApiResponse(await this.handleMarketDataRequest(request, url));
    }

    if (request.method === "GET" && url.pathname === "/api/live-prices") {
      return this.recordApiResponse(await this.handleLivePricesRequest(request, url));
    }

    if (request.method === "GET" && url.pathname === "/api/news") {
      return this.recordApiResponse(await this.handleNewsRequest(request, url));
    }

    if (request.method === "POST" && url.pathname === "/api/usage/beacon") {
      const body = await parseJsonBody(request);
      const stats = await this.recordUsageBeacon(body);
      return jsonResponse({ ok: true, usage: publicUsageStats(stats) }, 200, this.env);
    }

    if (request.method === "POST" && url.pathname === "/api/board/logs") {
      const body = await parseJsonBody(request);
      if (!await isAdminPassword(body?.adminPassword || body?.password || "", this.env)) {
        return jsonResponse({ error: "invalid_password" }, 401, this.env);
      }
      return jsonResponse({ logs: await this.readAdminLogs() }, 200, this.env);
    }

    if (url.pathname === "/api/board/categories") {
      if (request.method === "GET") {
        return this.recordApiResponse(
          jsonResponse({ categories: await this.readCategories() }, 200, this.env)
        );
      }
      if (request.method === "PUT" || request.method === "POST") {
        const body = await parseJsonBody(request);
        if (!await isAdminPassword(body?.adminPassword || body?.password || "", this.env)) {
          return jsonResponse({ error: "invalid_password" }, 401, this.env);
        }
        return jsonResponse({ categories: await this.writeCategories(body?.categories || []) }, 200, this.env);
      }
    }

    if (
      request.method === "POST"
      && (
        url.pathname === "/api/board/media"
        || url.pathname === "/api/board/media/uploads"
        || url.pathname.startsWith("/api/board/media/uploads/")
      )
    ) {
      const access = await this.getBoardAccessClaims(request);
      if (access.response) return access.response;
    }

    if (request.method === "POST" && url.pathname === "/api/board/media/uploads") {
      return this.createMediaUpload(request);
    }

    const mediaUploadRoute = parseBoardMediaUploadRoute(url);
    if (request.method === "POST" && mediaUploadRoute?.action === "chunk") {
      return this.writeMediaUploadChunk(request, mediaUploadRoute.uploadId, mediaUploadRoute.index);
    }

    if (request.method === "POST" && mediaUploadRoute?.action === "complete") {
      return this.completeMediaUpload(request, mediaUploadRoute.uploadId);
    }

    if (request.method === "POST" && url.pathname === "/api/board/media") {
      return this.writeMedia(request);
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/board/media/")) {
      const id = decodeURIComponent(url.pathname.split("/").pop() || "");
      const media = await this.readMedia(id);
      if (!media) return jsonResponse({ error: "not_found" }, 404, this.env);
      const mediaSize = Math.max(0, Math.floor(Number(media.size) || Number(media.bytes?.byteLength) || 0));
      if (mediaSize) await this.recordMediaDownload(mediaSize);
      return mediaResponse(media, 200, this.env);
    }

    if (request.method === "GET" && url.pathname === "/api/board/posts") {
      return this.recordApiResponse(boardJsonResponse(await this.readPosts(), 200, this.env));
    }

    if (request.method === "POST" && url.pathname === "/api/board/posts") {
      const access = await this.getBoardAccessClaims(request);
      if (access.response) return access.response;
      const body = await parseJsonBody(request);
      const postPassword = cleanBoardText(body?.postPassword, 200);
      if (!postPassword) return jsonResponse({ error: "post_password_required" }, 400, this.env);
      const post = normalizeBoardPost({
        ...body,
        authorMemberId: access.claims?.role === "member" ? access.claims.subject : "",
      }, {
        id: `post-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        createdAt: Date.now(),
      });
      if (!post) return jsonResponse({ error: "invalid_post" }, 400, this.env);
      post.passwordHash = await sha256Hex(postPassword);
      const posts = (await this.readPosts()).filter((item) => item.id !== post.id);
      posts.unshift(post);
      return boardJsonResponse(await this.writePosts(posts), 201, this.env, { post });
    }

    if (request.method === "POST" && postId && url.pathname.endsWith("/view")) {
      const id = postId.replace(/\/view$/, "");
      const posts = await this.readPosts();
      const target = posts.find((post) => post.id === id);
      if (!target) return jsonResponse({ error: "not_found" }, 404, this.env);
      target.views = Math.max(0, Math.floor(Number(target.views) || 0)) + 1;
      await this.writePosts(posts);
      return boardJsonResponse(posts, 200, this.env, { post: target });
    }

    if (request.method === "POST" && postId && url.pathname.endsWith("/verify")) {
      const access = await this.getBoardAccessClaims(request);
      if (access.response) return access.response;
      const id = postId.replace(/\/verify$/, "");
      const body = await parseJsonBody(request);
      const posts = await this.readPosts();
      const target = posts.find((post) => post.id === id);
      if (!target) return jsonResponse({ error: "not_found" }, 404, this.env);
      if (!await canManagePostForClaims(target, body, access.claims, this.env)) {
        return jsonResponse({ error: "invalid_password" }, 401, this.env);
      }
      return jsonResponse({ ok: true }, 200, this.env);
    }

    if (request.method === "POST" && /^\/api\/board\/posts\/[^/]+\/comments$/.test(url.pathname)) {
      const access = await this.getBoardAccessClaims(request);
      if (access.response) return access.response;
      const id = decodeURIComponent(url.pathname.split("/")[4] || "");
      const body = await parseJsonBody(request);
      const commentPassword = cleanBoardText(body?.commentPassword, 200);
      if (!commentPassword) return jsonResponse({ error: "comment_password_required" }, 400, this.env);
      const posts = await this.readPosts();
      const target = posts.find((post) => post.id === id);
      if (!target) return jsonResponse({ error: "not_found" }, 404, this.env);
      const comment = normalizeBoardComment({
        ...body,
        authorMemberId: access.claims?.role === "member" ? access.claims.subject : "",
      }, {
        id: `comment-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
        createdAt: Date.now(),
      });
      if (!comment) return jsonResponse({ error: "invalid_comment" }, 400, this.env);
      comment.passwordHash = await sha256Hex(commentPassword);
      target.comments = Array.isArray(target.comments) ? target.comments : [];
      target.comments.push(comment);
      target.comments = target.comments.slice(-BOARD_MAX_COMMENTS);
      target.updatedAt = Date.now();
      return boardJsonResponse(await this.writePosts(posts), 201, this.env, { post: target, comment });
    }

    if (request.method === "DELETE" && /^\/api\/board\/posts\/[^/]+\/comments\/[^/]+$/.test(url.pathname)) {
      const access = await this.getBoardAccessClaims(request);
      if (access.response) return access.response;
      const parts = url.pathname.split("/");
      const id = decodeURIComponent(parts[4] || "");
      const commentId = decodeURIComponent(parts[6] || "");
      const body = await parseJsonBody(request);
      const posts = await this.readPosts();
      const target = posts.find((post) => post.id === id);
      if (!target) return jsonResponse({ error: "not_found" }, 404, this.env);
      const comments = Array.isArray(target.comments) ? target.comments : [];
      const comment = comments.find((item) => item.id === commentId);
      if (!comment) return jsonResponse({ error: "not_found" }, 404, this.env);
      if (!await canManageCommentForClaims(comment, body, access.claims, this.env)) {
        return jsonResponse({ error: "invalid_password" }, 401, this.env);
      }
      const adminMode = await isAdminPassword(body?.adminPassword || "", this.env);
      target.comments = comments.filter((item) => item.id !== commentId);
      target.updatedAt = Date.now();
      const savedPosts = await this.writePosts(posts);
      await this.tryAddAdminLog({
        action: "comment_delete",
        actor: access.claims?.role === "admin" || adminMode ? "admin" : (comment.authorMemberId === access.claims?.subject ? "member" : "comment_password"),
        postId: target.id,
        title: target.title,
        category: target.category,
        commentId: comment.id,
        commentAuthor: comment.author,
        commentPreview: comment.body,
      });
      return boardJsonResponse(savedPosts, 200, this.env, { post: target, ok: true });
    }

    if (request.method === "PUT" && postId) {
      const access = await this.getBoardAccessClaims(request);
      if (access.response) return access.response;
      const body = await parseJsonBody(request);
      const posts = await this.readPosts();
      const index = posts.findIndex((post) => post.id === postId);
      if (index < 0) return jsonResponse({ error: "not_found" }, 404, this.env);
      if (!await canManagePostForClaims(posts[index], body, access.claims, this.env)) {
        return jsonResponse({ error: "invalid_password" }, 401, this.env);
      }
      const beforePost = posts[index];
      const adminMode = await isAdminPassword(body?.adminPassword || "", this.env);
      const updated = normalizeBoardPost({
        ...beforePost,
        ...withoutPassword(body),
        id: beforePost.id,
        createdAt: beforePost.createdAt,
        views: beforePost.views,
        likes: beforePost.likes,
        comments: beforePost.comments,
        authorMemberId: beforePost.authorMemberId,
        passwordHash: cleanBoardText(body?.newPostPassword, 200)
          ? await sha256Hex(body.newPostPassword)
          : beforePost.passwordHash,
        updatedAt: Date.now(),
      });
      if (!updated) return jsonResponse({ error: "invalid_post" }, 400, this.env);
      const changes = [];
      if (beforePost.title !== updated.title) changes.push("제목");
      if (beforePost.body !== updated.body) changes.push("내용");
      if (beforePost.category !== updated.category) changes.push("게시판");
      if (beforePost.htmlEnabled !== updated.htmlEnabled) changes.push("HTML");
      if (cleanBoardText(body?.newPostPassword, 200)) changes.push("비밀번호");
      if (!changes.length) changes.push("기타");
      posts[index] = updated;
      const savedPosts = await this.writePosts(posts);
      await this.cleanupUnreferencedMedia(getPostBoardMediaIds(beforePost), savedPosts);
      await this.tryAddAdminLog({
        action: "post_update",
        actor: access.claims?.role === "admin" || adminMode ? "admin" : (beforePost.authorMemberId === access.claims?.subject ? "member" : "post_password"),
        postId: updated.id,
        title: updated.title,
        beforeTitle: beforePost.title !== updated.title ? beforePost.title : "",
        changes,
        category: updated.category,
      });
      return boardJsonResponse(savedPosts, 200, this.env, { post: updated });
    }

    if (request.method === "DELETE" && postId) {
      const access = await this.getBoardAccessClaims(request);
      if (access.response) return access.response;
      const body = await parseJsonBody(request);
      const posts = await this.readPosts();
      const target = posts.find((post) => post.id === postId);
      if (!target) return jsonResponse({ error: "not_found" }, 404, this.env);
      if (!await canManagePostForClaims(target, body, access.claims, this.env)) {
        return jsonResponse({ error: "invalid_password" }, 401, this.env);
      }
      const adminMode = await isAdminPassword(body?.adminPassword || "", this.env);
      const nextPosts = posts.filter((post) => post.id !== postId);
      const savedPosts = await this.writePosts(nextPosts);
      await this.cleanupUnreferencedMedia(getPostBoardMediaIds(target), savedPosts);
      await this.tryAddAdminLog({
        action: "post_delete",
        actor: access.claims?.role === "admin" || adminMode ? "admin" : (target.authorMemberId === access.claims?.subject ? "member" : "post_password"),
        postId: target.id,
        title: target.title,
        category: target.category,
      });
      return boardJsonResponse(savedPosts, 200, this.env, { ok: true });
    }

    return jsonResponse({ error: "not_found" }, 404, this.env);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return optionsResponse(request, env);

    const url = new URL(request.url);
    if (url.pathname === "/api/market-data" && request.method === "POST") {
      const authResponse = await requireGithubOidc(request, env);
      if (authResponse) return authResponse;
      if (!env.BOARD_STORE) return jsonResponse({ error: "market_data_storage_not_configured" }, 500, env);
      const id = env.BOARD_STORE.idFromName("free-board");
      const headers = new Headers(request.headers);
      headers.set("X-Market-Data-Sync", "1");
      return env.BOARD_STORE.get(id).fetch(new Request(request.url, {
        method: request.method,
        headers,
        body: request.body,
      }));
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/board/media/")) {
      if (!isAllowedOrigin(request, env)) return originNotAllowedResponse(env);
      const authResponse = await requireBoardAccessStoredAuth(request, env);
      if (authResponse) return authResponse;
      return handleBoardMedia(request, env, url);
    }

    if (!isAllowedOrigin(request, env)) {
      return originNotAllowedResponse(env);
    }

    if (url.pathname === "/api/login/email/status" && request.method === "GET") {
      const emailDestinations = getEmailLoginDestinations(env);
      return jsonResponse({
        enabled: isEmailLoginConfigured(env),
        recipientCount: emailDestinations.length,
        expiresInSeconds: Math.floor(EMAIL_OTP_TTL_MS / 1000),
      }, 200, env);
    }
    if (url.pathname === "/api/signup/status" && request.method === "GET") {
      return jsonResponse({
        enabled: isMemberRegistrationEnabled(env),
        verificationRequired: false,
        passwordResetEnabled: isMemberEmailDeliveryConfigured(env),
      }, 200, env);
    }
    if (
      request.method === "POST"
      && (
        url.pathname === "/api/login/email/request"
        || url.pathname === "/api/login/email/verify"
        || url.pathname === "/api/login/member/password"
        || url.pathname === "/api/signup/request"
        || url.pathname === "/api/member/password/reset/request"
        || url.pathname === "/api/member/password/reset/confirm"
      )
    ) {
      if (!env.BOARD_STORE) {
        return jsonResponse({ error: "email_login_storage_not_configured" }, 503, env);
      }
      const id = env.BOARD_STORE.idFromName("free-board");
      const headers = new Headers(request.headers);
      headers.set("X-Login-Client-IP", getClientIp(request));
      return env.BOARD_STORE.get(id).fetch(new Request(request.url, {
        method: request.method,
        headers,
        body: request.body,
      }));
    }
    if (url.pathname === "/api/login" && request.method === "POST") {
      if (env.BOARD_STORE) {
        const id = env.BOARD_STORE.idFromName("free-board");
        const headers = new Headers(request.headers);
        headers.set("X-Login-Client-IP", getClientIp(request));
        return env.BOARD_STORE.get(id).fetch(new Request(request.url, {
          method: request.method,
          headers,
          body: request.body,
        }));
      }
      return handleLogin(request, env);
    }
    if (url.pathname === "/api/logout" && request.method === "POST") {
      return handleLogout(env);
    }
    if (url.pathname === "/api/session" && request.method === "GET") {
      if (!env.BOARD_STORE) return handleSession(request, env);
      const id = env.BOARD_STORE.idFromName("free-board");
      return env.BOARD_STORE.get(id).fetch(request);
    }
    if (url.pathname === "/api/admin/verify" && request.method === "POST") {
      const body = await parseJsonOrPlainPasswordBody(request);
      const providedPassword = body?.adminPassword || body?.password || "";
      if (!providedPassword) {
        return jsonResponse({ error: "auth_required" }, 401, env);
      }
      if (!await isAdminPassword(providedPassword, env)) {
        return jsonResponse({ error: "invalid_password" }, 401, env);
      }
      return jsonResponse({ ok: true }, 200, env);
    }
    if (url.pathname === "/api/usage/stats" && request.method === "POST") {
      if (!env.BOARD_STORE) return jsonResponse({ error: "usage_storage_not_configured" }, 500, env);
      const id = env.BOARD_STORE.idFromName("free-board");
      return env.BOARD_STORE.get(id).fetch(request);
    }
    if (url.pathname.startsWith("/api/admin/members") && request.method === "POST") {
      if (!env.BOARD_STORE) return jsonResponse({ error: "member_storage_not_configured" }, 503, env);
      const id = env.BOARD_STORE.idFromName("free-board");
      return env.BOARD_STORE.get(id).fetch(request);
    }
    if (isProtectedContentPath(url)) {
      const authResponse = await requireActiveStoredAuth(request, env);
      if (authResponse) return authResponse;
    }
    if (isBoardAccessPath(url)) {
      const authResponse = await requireBoardAccessStoredAuth(request, env);
      if (authResponse) return authResponse;
    }
    if (url.pathname === "/api/screen-settings") {
      if (!env.BOARD_STORE) return jsonResponse({ error: "screen_settings_storage_not_configured" }, 500, env);
      const id = env.BOARD_STORE.idFromName("free-board");
      return env.BOARD_STORE.get(id).fetch(request);
    }
    if (url.pathname === "/api/market-data" && request.method === "GET") {
      if (!env.BOARD_STORE) return jsonResponse({ error: "market_data_storage_not_configured" }, 500, env);
      const id = env.BOARD_STORE.idFromName("free-board");
      return env.BOARD_STORE.get(id).fetch(request);
    }
    if (url.pathname === "/api/live-prices" && request.method === "GET") {
      if (!env.BOARD_STORE) return jsonResponse(await fetchLivePricePayload(null), 200, env);
      const id = env.BOARD_STORE.idFromName("free-board");
      return env.BOARD_STORE.get(id).fetch(request);
    }
    if (url.pathname === "/api/news" && request.method === "GET") {
      if (!env.BOARD_STORE) return jsonResponse(await fetchCoinnessNewsSafely(env), 200, env);
      const id = env.BOARD_STORE.idFromName("free-board");
      return env.BOARD_STORE.get(id).fetch(request);
    }
    if (url.pathname === "/api/usage/beacon" || url.pathname === "/api/usage/stats" || url.pathname === "/api/board/logs") {
      if (!env.BOARD_STORE) return jsonResponse({ error: "usage_storage_not_configured" }, 500, env);
      const id = env.BOARD_STORE.idFromName("free-board");
      return env.BOARD_STORE.get(id).fetch(request);
    }
    if (url.pathname === "/api/board/categories") {
      return handleBoardCategories(request, env);
    }
    if (url.pathname === "/api/board/media" || url.pathname === "/api/board/media/uploads" || url.pathname.startsWith("/api/board/media/uploads/")) {
      return handleBoardMedia(request, env, url);
    }
    if (url.pathname === "/api/board/posts" || url.pathname.startsWith("/api/board/posts/")) {
      return handleBoardPosts(request, env, url);
    }

    return jsonResponse({ error: "not_found" }, 404, env);
  },
};
