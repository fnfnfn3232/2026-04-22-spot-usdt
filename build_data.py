from __future__ import annotations

import json
import html
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATA_JS_PATH = ROOT / "data.js"
SNAPSHOT_JSON_PATH = ROOT / "board_snapshot.json"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"
)
DEFAULT_FX_USD_KRW = 1350.0
FX_USD_KRW = DEFAULT_FX_USD_KRW
FX_SOURCE = "fallback_default"
AUTO_REFRESH_MINUTES = 10
COINNESS_NEWS_MAX_ITEMS = 1000
COINNESS_NEWS_BATCH_LIMIT = 20
COINNESS_NEWS_ENDPOINT = "https://api.coinness.com/feed/v1/breaking-news"
NEWS_RETENTION_DAYS = 7
COINGECKO_MARKETS_ENDPOINT = "https://api.coingecko.com/api/v3/coins/markets"
COINGECKO_MARKETS_PAGE_SIZE = 250
COINGECKO_SYMBOL_BATCH_SIZE = 50
COINMARKETCAP_QUOTES_ENDPOINT = (
    "https://pro-api.coinmarketcap.com/public-api/v3/cryptocurrency/quotes/latest"
)
COINBASE_CURRENCIES_ENDPOINT = "https://api.exchange.coinbase.com/currencies"
COINBASE_PRODUCT_STATS_ENDPOINT = "https://api.exchange.coinbase.com/products/stats"
DEFILLAMA_PROTOCOLS_ENDPOINT = "https://api.llama.fi/protocols"
DEFILLAMA_FEES_ENDPOINT = (
    "https://api.llama.fi/overview/fees"
    "?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyFees"
)
DEFILLAMA_DEX_VOLUME_ENDPOINT = (
    "https://api.llama.fi/overview/dexs"
    "?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume"
)
DEFILLAMA_OPEN_INTEREST_ENDPOINT = (
    "https://api.llama.fi/overview/open-interest"
    "?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true"
)
ETHEREUM_RPC_ENDPOINT = "https://ethereum-rpc.publicnode.com"
ERC20_DECIMALS_SELECTOR = "0x313ce567"
ERC20_TOTAL_SUPPLY_SELECTOR = "0x18160ddd"
CONTRACT_SUPPLY_WORKERS = 8
CONTRACT_SUPPLY_MAX_REQUESTS = 260
BITHUMB_BASIC_INFO_WORKERS = 8
BITHUMB_TICKER_BATCH_SIZE = 80
UPBIT_PREFER_BITHUMB_FILL_SYMBOL_MAP = {
    "1INCH": "1INCH",
    "BLEND": "BLEND",
    "MIRA": "MIRA",
    "MET2": "MET",
    "ORDER": "ORDER",
    "ORDI": "ORDI",
}
UPBIT_COMPARE_SYMBOL_MAP = {
    "MET2": "MET",
}
BITHUMB_SUPPLY_PREFER_UPBIT_SYMBOL_MAP = {
    "ORDER": "ORDER",
}
COINBASE_COMPARE_SYMBOL_MAP = {
    "COSMOSDYDX": "DYDX",
    "BOBBOB": "BOB",
    "BASED1": "BASED",
    "MANTLE": "MNT",
    "JUPITER": "JUP",
    "JITOSOL": "JTO",
    "CGLD": "CELO",
    "CORECHAIN": "CORE",
    "FUN1": "FUN",
    "IP": "DATA",
    "LIGHTER": "LIT",
    "PAX": "USDP",
}
COINBASE_COINGECKO_ID_MAP = {
    "CGLD": "celo",
    "CORECHAIN": "coredaoorg",
    "FUN1": "football-fun",
    "HONEY": "hivemapper",
    "IP": "story-2",
    "LIGHTER": "lighter",
    "PAX": "paxos-standard",
}
COINBASE_EXCLUDED_SYMBOLS = {
    "ZETACHAIN",
}
SEOUL_TIMEZONE = timezone(timedelta(hours=9))
SCHEDULED_DELISTINGS = {
    "upbit": {
        "AERGO": {
            "deadline": "2026-08-03",
            "detail": "거래지원 종료 2026.08.03 예정",
            "url": "https://www.upbit.com/service_center/notice?id=1457543706",
        },
        "AQT": {
            "deadline": "2026-08-03",
            "detail": "거래지원 종료 2026.08.03 예정",
            "url": "https://www.upbit.com/service_center/notice?id=1943837257",
        },
    },
    "bithumb": {
        "H": {
            "deadline": "2026-08-10",
            "detail": "거래지원 종료 2026.08.10 15:00 예정",
            "url": "https://m-feed.bithumb.com/notice/1654015",
        },
        "GRACY": {
            "deadline": "2026-08-18",
            "detail": "거래지원 종료 2026.08.18 15:00 예정",
            "url": "https://m-feed.bithumb.com/notice/1654098",
        },
        "SPURS": {
            "deadline": "2026-08-18",
            "detail": "거래지원 종료 2026.08.18 15:00 예정",
            "url": "https://m-feed.bithumb.com/notice/1654098",
        },
        "ZTX": {
            "deadline": "2026-08-18",
            "detail": "거래지원 종료 2026.08.18 15:00 예정",
            "url": "https://m-feed.bithumb.com/notice/1654098",
        },
        "WIKEN": {
            "deadline": "2026-08-18",
            "detail": "거래지원 종료 2026.08.18 15:00 예정",
            "url": "https://m-feed.bithumb.com/notice/1654098",
        },
        "FITFI": {
            "deadline": "2026-08-18",
            "detail": "거래지원 종료 2026.08.18 15:00 예정",
            "url": "https://m-feed.bithumb.com/notice/1654098",
        },
    },
    "coinbase": {
        "ACX": {
            "deadline": "2026-07-28",
            "detail": "거래 종료 2026.07.28 예정",
            "url": (
                "https://help.coinbase.com/en/coinbase/trading-and-funding/"
                "sending-or-receiving-cryptocurrency/token-migrations"
            ),
        },
    },
}
AMBIGUOUS_SYMBOLS_REQUIRE_NAME_OVERLAP = {
    "AI",
}
GENSYN_SYMBOL = "AI"
GENSYN_TOTAL_SUPPLY = 10_000_000_000.0
GENSYN_CIRCULATING_SUPPLY = 1_304_675_313.0
SUSPICIOUS_DROP_MIN_RATIO = 0.90
SUSPICIOUS_DROP_MIN_ABS = {
    "binance": 40,
    "upbit": 20,
    "bithumb": 30,
    "coinbase": 30,
}


def make_risk_flag(
    flag_type: str,
    label: str,
    detail: str,
    source: str,
    url: str = "",
) -> dict:
    flag = {
        "type": flag_type,
        "label": label,
        "detail": detail,
        "source": source,
    }
    if url:
        flag["url"] = url
    return flag


def scheduled_delisting_flags(exchange: str, symbol: str) -> list[dict]:
    entry = (
        SCHEDULED_DELISTINGS.get(exchange, {})
        .get(str(symbol or "").strip().upper())
    )
    if not entry:
        return []
    try:
        deadline = date.fromisoformat(str(entry.get("deadline") or ""))
    except ValueError:
        return []
    if datetime.now(SEOUL_TIMEZONE).date() > deadline:
        return []
    return [
        make_risk_flag(
            "delisting",
            "상폐예정",
            str(entry.get("detail") or "거래지원 종료 예정"),
            f"{exchange}_official_notice",
            str(entry.get("url") or ""),
        )
    ]


def fetch_binance_scheduled_delistings() -> dict[str, dict]:
    endpoint = (
        "https://www.binance.com/bapi/composite/v1/public/cms/article/"
        "catalog/list/query?catalogId=161&pageNo=1&pageSize=50"
    )
    payload = fetch_json(endpoint, retries=2, pause=0.5)
    data = payload.get("data") if isinstance(payload, dict) else None
    articles = data.get("articles") if isinstance(data, dict) else None
    if not isinstance(articles, list):
        return {}

    today = datetime.now(SEOUL_TIMEZONE).date()
    scheduled: dict[str, dict] = {}
    pattern = re.compile(
        r"^Binance Will Delist (.+?) on (\d{4}-\d{2}-\d{2})$",
        re.IGNORECASE,
    )
    excluded_terms = ("futures", "margin", "loan", "leveraged token")
    for article in articles:
        if not isinstance(article, dict):
            continue
        title = str(article.get("title") or "").strip()
        if any(term in title.lower() for term in excluded_terms):
            continue
        match = pattern.match(title)
        if not match:
            continue
        try:
            deadline = date.fromisoformat(match.group(2))
        except ValueError:
            continue
        if deadline < today:
            continue
        article_code = str(article.get("code") or "").strip()
        article_slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
        detail_url = (
            f"https://www.binance.com/en/support/announcement/{article_slug}-{article_code}"
            if article_code and article_slug
            else ""
        )
        for symbol in re.findall(r"[A-Z0-9]+", match.group(1).upper()):
            scheduled[symbol] = {
                "detail": f"현물 거래지원 종료 {deadline.isoformat()} 예정",
                "url": detail_url,
            }
    return scheduled


def normalize_text(value: str | None) -> str:
    text = str(value or "").strip().lower()
    return "".join(char for char in text if char.isalnum())


def has_hangul(value: str | None) -> bool:
    return any("\u3131" <= char <= "\u318e" or "\uac00" <= char <= "\ud7a3" for char in str(value or ""))


def parse_data_js_payload(raw_text: str) -> dict | None:
    prefix = "window.BOARD_DATA = "
    text = raw_text.strip()
    if not text.startswith(prefix):
        return None
    payload_text = text[len(prefix) :]
    if payload_text.endswith(";"):
        payload_text = payload_text[:-1]
    try:
        return json.loads(payload_text)
    except json.JSONDecodeError:
        return None


def load_previous_payload() -> dict | None:
    if SNAPSHOT_JSON_PATH.exists():
        try:
            return json.loads(SNAPSHOT_JSON_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass

    if DATA_JS_PATH.exists():
        return parse_data_js_payload(DATA_JS_PATH.read_text(encoding="utf-8"))

    return None


def clone_previous_board_rows(previous_payload: dict | None, board_name: str) -> list[dict]:
    boards = (previous_payload or {}).get("boards")
    if not isinstance(boards, dict):
        return []
    rows = boards.get(board_name)
    if not isinstance(rows, list):
        return []
    try:
        # JSON round-trip to safely deep-copy nested structures.
        return json.loads(json.dumps(rows, ensure_ascii=False))
    except (TypeError, ValueError):
        return []


def normalize_previous_board_rows(rows: list[dict], *, board_name: str, error_text: str) -> list[dict]:
    for row in rows:
        row["fallbackUsed"] = True
        row["fallbackSource"] = f"previous_payload:{board_name}"
        row["fallbackError"] = error_text
    return rows


def apply_suspicious_drop_guard(
    board_name: str,
    current_rows: list[dict],
    previous_payload: dict | None,
) -> tuple[list[dict], str | None]:
    previous_rows = clone_previous_board_rows(previous_payload, board_name)
    previous_count = len(previous_rows)
    current_count = len(current_rows)

    if previous_count <= 0:
        return current_rows, None

    if current_count <= 0:
        reason = f"suspicious_row_drop:{current_count}/{previous_count}"
        fallback_rows = normalize_previous_board_rows(
            previous_rows,
            board_name=board_name,
            error_text=reason,
        )
        return fallback_rows, reason

    if current_count >= previous_count:
        return current_rows, None

    drop_abs = previous_count - current_count
    drop_ratio = current_count / previous_count
    min_abs = SUSPICIOUS_DROP_MIN_ABS.get(board_name, 20)
    if (
        previous_count >= 100
        and drop_abs >= min_abs
        and drop_ratio < SUSPICIOUS_DROP_MIN_RATIO
    ):
        reason = f"suspicious_row_drop:{current_count}/{previous_count}"
        fallback_rows = normalize_previous_board_rows(
            previous_rows,
            board_name=board_name,
            error_text=reason,
        )
        return fallback_rows, reason

    return current_rows, None


def fetch_json(url: str, *, retries: int = 3, pause: float = 1.0) -> dict | list:
    last_error = None
    for attempt in range(retries):
        try:
            request = urllib.request.Request(
                url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "application/json,text/plain,*/*",
                },
            )
            with urllib.request.urlopen(request, timeout=45) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                return json.loads(response.read().decode(charset))
        except Exception as error:  # noqa: BLE001
            last_error = error
            if attempt < retries - 1:
                time.sleep(pause * (attempt + 1))
    raise last_error  # type: ignore[misc]


def fetch_json_post(url: str, payload: object, *, retries: int = 3, pause: float = 1.0) -> dict | list:
    last_error = None
    body = json.dumps(payload).encode("utf-8")
    for attempt in range(retries):
        try:
            request = urllib.request.Request(
                url,
                data=body,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "application/json,text/plain,*/*",
                    "Content-Type": "application/json",
                },
            )
            with urllib.request.urlopen(request, timeout=45) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                return json.loads(response.read().decode(charset))
        except Exception as error:  # noqa: BLE001
            last_error = error
            if attempt < retries - 1:
                time.sleep(pause * (attempt + 1))
    raise last_error  # type: ignore[misc]


def to_float(value: object) -> float | None:
    try:
        if isinstance(value, str):
            value = value.replace(",", "").strip()
        number = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    if number <= 0:
        return None
    return number


def safe_div(numerator: float | None, denominator: float | None) -> float | None:
    if numerator is None or denominator is None or denominator <= 0:
        return None
    return numerator / denominator


def compute_circulating_ratio(circulating_supply: float | None, total_supply: float | None) -> float | None:
    ratio = safe_div(circulating_supply, total_supply)
    if ratio is None:
        return None
    return min(max(ratio, 0.0), 1.0)


def compute_fdv_usd(
    *,
    fdv_usd: float | None,
    price_usd: float | None,
    total_supply: float | None,
    market_cap_usd: float | None,
    circulating_supply: float | None,
) -> float | None:
    if fdv_usd is not None:
        return fdv_usd
    if price_usd is not None and total_supply is not None:
        return price_usd * total_supply
    if market_cap_usd is not None and circulating_supply is not None and total_supply is not None:
        if circulating_supply > 0:
            return market_cap_usd * (total_supply / circulating_supply)
    return None


def fetch_upbit_usdt_krw_rate() -> float | None:
    payload = fetch_json("https://api.upbit.com/v1/ticker?markets=KRW-USDT")
    if not isinstance(payload, list) or not payload:
        return None
    return to_float((payload[0] or {}).get("trade_price"))


def fetch_bithumb_usdt_krw_rate() -> float | None:
    payload = fetch_json("https://api.bithumb.com/v1/ticker?markets=KRW-USDT")
    if not isinstance(payload, list) or not payload:
        return None
    item = payload[0] if isinstance(payload[0], dict) else {}
    return to_float(item.get("trade_price")) or to_float(item.get("prev_closing_price"))


def refresh_fx_usd_krw(previous_payload: dict | None = None) -> float:
    global FX_USD_KRW, FX_SOURCE
    fetch_plan = [
        (fetch_upbit_usdt_krw_rate, "upbit_krw_usdt"),
        (fetch_bithumb_usdt_krw_rate, "bithumb_usdt_krw"),
    ]
    for fetcher, source_label in fetch_plan:
        try:
            rate = fetcher()
        except Exception:  # noqa: BLE001
            rate = None
        if rate is not None:
            FX_USD_KRW = rate
            FX_SOURCE = source_label
            return FX_USD_KRW

    previous_rate = to_float((previous_payload or {}).get("fxUsdKrw"))
    if previous_rate is not None:
        FX_USD_KRW = previous_rate
        FX_SOURCE = "previous_payload"
    else:
        FX_USD_KRW = DEFAULT_FX_USD_KRW
        FX_SOURCE = "fallback_default"
    return FX_USD_KRW


def parse_iso_to_epoch(value: str | None) -> int | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return int(dt.timestamp())
    except ValueError:
        return None


def format_publish_hm(value: str | None) -> str:
    raw = str(value or "").strip()
    if not raw:
        return "-"
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        kst = dt.astimezone(timezone(timedelta(hours=9)))
        return kst.strftime("%H:%M")
    except ValueError:
        return "-"


def detect_exchange(text: str) -> str | None:
    rules = [
        ("\uc5c5\ube44\ud2b8", "\uc5c5\ube44\ud2b8"),
        ("\ubc14\uc774\ub0b8\uc2a4", "\ubc14\uc774\ub0b8\uc2a4"),
        ("\ube57\uc378", "\ube57\uc378"),
        ("\ucf54\uc778\ubca0\uc774\uc2a4", "\ucf54\uc778\ubca0\uc774\uc2a4"),
        ("\ubc14\uc774\ube44\ud2b8", "\ubc14\uc774\ube44\ud2b8"),
        ("OKX", "OKX"),
        ("\ud06c\ub77c\ucf04", "\ud06c\ub77c\ucf04"),
        ("\uac8c\uc774\ud2b8\uc544\uc774\uc624", "\uac8c\uc774\ud2b8\uc544\uc774\uc624"),
        ("GATE.IO", "게이트아이오"),
    ]
    upper = text.upper()
    for keyword, label in rules:
        if keyword.upper() in upper:
            return label
    return None


def detect_event_type(text: str) -> str:
    upper = text.upper()
    if any(keyword in upper for keyword in ["\uc0c1\uc7a5\ud3d0\uc9c0", "\uc0c1\ud3d0", "\uac70\ub798\uc9c0\uc6d0 \uc885\ub8cc", "\uc720\uc758\uc885\ubaa9"]):
        return "\uc0c1\uc7a5\ud3d0\uc9c0/\uc720\uc758"
    if "\uc0c1\uc7a5" in upper:
        return "\uc0c1\uc7a5"
    if any(keyword in upper for keyword in ["\uc785\ucd9c\uae08", "\ucd9c\uae08", "\uc785\uae08"]):
        return "\uc785\ucd9c\uae08"
    if any(keyword in upper for keyword in ["\uc810\uac80", "MAINTENANCE", "\uc5c5\uadf8\ub808\uc774\ub4dc"]):
        return "\uc810\uac80/\uc5c5\uadf8\ub808\uc774\ub4dc"
    if any(keyword in upper for keyword in ["\ud611\ub825", "\uc81c\ud734", "\ud30c\ud2b8\ub108\uc2ed"]):
        return "\ud611\ub825/\uc81c\ud734"
    if any(keyword in upper for keyword in ["\ud574\ud0b9", "\ucde8\uc57d\uc810", "\uc720\ucd9c", "EXPLOIT", "ATTACK"]):
        return "\ubcf4\uc548 \uc774\uc288"
    if any(keyword in upper for keyword in ["ETF", "SEC", "\uaddc\uc81c", "\ubc95\uc548", "\uc815\ucc45"]):
        return "\uc815\ucc45/\uc81c\ub3c4"
    if any(keyword in upper for keyword in ["\uae09\ub4f1", "\uae09\ub77d", "\ub3cc\ud30c", "\ud558\ud68c", "\uc0c1\ud68c", "\ubaa8\ub2c8\ud130\ub9c1"]):
        return "\uac00\uaca9 \ubcc0\ub3d9"
    return "\uc2dc\uc7a5 \uc18c\uc2dd"


def extract_symbol_and_pair(entry: dict, text: str) -> tuple[str | None, str | None]:
    quick_order_code = str(entry.get("quickOrderCode") or "").upper().strip()
    if quick_order_code:
        quick_order_code = quick_order_code.replace("-", "/").replace("_", "/")
        pair_match = re.search(r"\b([A-Z0-9]{2,15})/(USDT|KRW|USD|BTC|ETH)\b", quick_order_code)
        if pair_match:
            return pair_match.group(1), f"{pair_match.group(1)}/{pair_match.group(2)}"

    pair_match = re.search(r"\b([A-Z0-9]{2,15})/(USDT|KRW|USD|BTC|ETH)\b", text.upper())
    if pair_match:
        return pair_match.group(1), f"{pair_match.group(1)}/{pair_match.group(2)}"

    origin_codes = entry.get("originCodes") or []
    if isinstance(origin_codes, list):
        for code in origin_codes:
            code_text = str(code or "").upper().strip()
            if re.fullmatch(r"[A-Z][A-Z0-9]{1,9}", code_text):
                return code_text, None

    candidates = re.findall(r"\b[A-Z0-9]{2,10}\b", text.upper())
    stopwords = {"USDT", "KRW", "USD", "BTC", "ETH", "ETF", "CVD", "AI"}
    for candidate in candidates:
        if candidate in stopwords or candidate.isdigit():
            continue
        return candidate, None
    return None, None


def extract_number_hints(text: str) -> str:
    hints = re.findall(r"\$?\d[\d,\.]*%?|[0-9]{1,2}:[0-9]{2}|[0-9]+(?:\uc5b5|\uc870)", text)
    compact: list[str] = []
    seen: set[str] = set()
    for hint in hints:
        value = str(hint).strip()
        if not value:
            continue
        key = value.replace(",", "").replace("$", "")
        if key in seen:
            continue
        seen.add(key)
        compact.append(value)
        if len(compact) >= 2:
            break
    return ", ".join(compact)


def split_fact_sentences(text: str, *, max_count: int = 3) -> list[str]:
    cleaned = re.sub(r"\s+", " ", str(text or "")).strip()
    if not cleaned:
        return []

    pieces = re.split(r"(?<=[\.\!\?])\s+|(?<=\ub2e4\.)\s*|(?<=\uc694\.)\s*", cleaned)
    result: list[str] = []
    seen: set[str] = set()

    for piece in pieces:
        sentence = piece.strip(" \t\r\n\"'“”[]()")
        if len(sentence) < 10:
            continue
        if sentence in seen:
            continue
        seen.add(sentence)
        result.append(sentence)
        if len(result) >= max_count:
            break
    return result


def paraphrase_fact_sentence(sentence: str) -> str:
    text = re.sub(r"\s+", " ", str(sentence)).strip()
    text = text.strip("\"'“”[]()")
    text = re.sub(r"\s*(고|라고)\s*(전했다|밝혔다)\.?$", "\ub77c\ub294 \ucde8\uc9c0\uc785\ub2c8\ub2e4", text)
    text = re.sub(r"\s*\uc608\uc815\uc774\ub2e4\.?$", " \uc77c\uc815\uc774 \uc7a1\ud600 \uc788\uc2b5\ub2c8\ub2e4", text)
    text = re.sub(r"\s*\ucd94\uc9c4\ud55c\ub2e4\.?$", " \ucd94\uc9c4 \uacc4\ud68d\uc774 \ud655\uc778\ub429\ub2c8\ub2e4", text)
    text = re.sub(r"\s*\uae30\ub85d\ud588\ub2e4\.?$", " \uae30\ub85d\ud55c \uc0c1\ud0dc\uc785\ub2c8\ub2e4", text)
    text = re.sub(r"\s*\ub3cc\ud30c\ud588\ub2e4\.?$", " \ub3cc\ud30c\ud55c \uc0c1\ud0dc\uc785\ub2c8\ub2e4", text)
    text = re.sub(r"\s+", " ", text).strip(" .")
    if len(text) > 95:
        text = text[:92].rstrip() + "..."
    if not text.endswith("."):
        text += "."
    return text


def normalize_title_for_summary(title: str) -> str:
    text = re.sub(r"\s+", " ", str(title or "")).strip()
    text = text.strip("\"'“”")
    if len(text) > 56:
        text = text[:53].rstrip() + "..."
    return text


def normalize_title_for_summary_v2(title: str) -> str:
    text = re.sub(r"\s+", " ", str(title or "")).strip()
    text = text.strip("\"'[]()")
    if len(text) > 86:
        text = text[:83].rstrip() + "..."
    return text


def paraphrase_fact_sentence_v2(sentence: str) -> str:
    text = re.sub(r"\s+", " ", str(sentence or "")).strip()
    text = text.strip("\"'[]()")
    text = text.lstrip("-").strip()

    text = re.sub(r"\s*(?:라고|고)\s+[^\s]{1,24}(?:가|이)\s*(?:밝혔다|전했다|설명했다|보도했다)\.?$", "", text)
    text = re.sub(r"\s*(?:밝혔다|전했다|설명했다|보도했다)\.?$", "", text)

    replacements = [
        (r"\b밝혔다\b", "전했습니다"),
        (r"\b전했다\b", "알려졌습니다"),
        (r"\b보도했다\b", "보도됐습니다"),
        (r"\b설명했다\b", "설명이 나왔습니다"),
        (r"\b발표했다\b", "발표했습니다"),
        (r"\b추진한다\b", "추진 중인 것으로 보입니다"),
        (r"\b예정이다\b", "진행될 예정입니다"),
        (r"\b돌파했다\b", "돌파한 상태입니다"),
        (r"\b기록했다\b", "기록한 상태입니다"),
    ]
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text)

    text = text.replace("“", "").replace("”", "").replace('"', "")

    ending_fixes = [
        ("\uc778\uc6a9\ud558\uba70", "\uc778\uc6a9\ud55c \ub0b4\uc6a9\uc785\ub2c8\ub2e4"),
        ("\uc778\uc6a9\ud574", "\uc778\uc6a9\ud55c \ub0b4\uc6a9\uc785\ub2c8\ub2e4"),
        ("\uc804\ud574", "\uc804\ud55c \ub0b4\uc6a9\uc785\ub2c8\ub2e4"),
        ("\ubc1d\ud600", "\ubc1d\ud78c \ub0b4\uc6a9\uc785\ub2c8\ub2e4"),
        ("\uc124\uba85\ud574", "\uc124\uba85\ud55c \ub0b4\uc6a9\uc785\ub2c8\ub2e4"),
        ("\uc5b8\uae09\ud574", "\uc5b8\uae09\ud55c \ub0b4\uc6a9\uc785\ub2c8\ub2e4"),
    ]
    for suffix, normalized in ending_fixes:
        if text.endswith(suffix):
            text = text[: -len(suffix)] + normalized
            break

    text = re.sub(r"\s+", " ", text).strip(" .")
    if len(text) > 170:
        text = text[:167].rstrip() + "..."
    if not text.endswith("."):
        text += "."
    return text


def make_news_summary(
    *,
    publish_at: str,
    exchange: str | None,
    event_type: str,
    symbol: str | None,
    pair: str | None,
    title: str,
    content: str,
    source_text: str,
) -> tuple[str, str]:
    subject = pair or symbol or "\uc2dc\uc7a5 \uc804\ubc18"
    exchange_text = exchange or "\uc2dc\uc7a5"
    time_text = format_publish_hm(publish_at)
    headline = f"{exchange_text} {subject} {event_type} \uc5c5\ub370\uc774\ud2b8"

    summary_parts = [f"{time_text} \uae30\uc900 {subject} \uad00\ub828 \uc18c\uc2dd\uc785\ub2c8\ub2e4."]
    title_core = normalize_title_for_summary_v2(title)
    if title_core:
        summary_parts.append(f"\ud575\uc2ec \ud3ec\uc778\ud2b8\ub294 '{title_core}' \ub0b4\uc6a9\uc73c\ub85c \ud30c\uc545\ub429\ub2c8\ub2e4.")

    fact_sentences = split_fact_sentences(content or source_text, max_count=3)
    if fact_sentences:
        summary_parts.append(f"\uad00\ub828 \ub0b4\uc6a9\uc744 \uc815\ub9ac\ud558\uba74 {paraphrase_fact_sentence_v2(fact_sentences[0])}")
    if len(fact_sentences) > 1:
        summary_parts.append(f"\ucd94\uac00\ub85c {paraphrase_fact_sentence_v2(fact_sentences[1])}")
    if len(fact_sentences) > 2:
        summary_parts.append(f"\ud568\uaed8 \ubcfc \ubd80\ubd84\uc740 {paraphrase_fact_sentence_v2(fact_sentences[2])}")

    number_hint = extract_number_hints(source_text)
    if number_hint:
        summary_parts.append(f"\uae30\uc0ac\uc5d0\uc11c \ud655\uc778\ub418\ub294 \uc218\uce58 \ud0a4\uc6cc\ub4dc\ub294 {number_hint} \uc815\ub3c4\uc785\ub2c8\ub2e4.")
    summary_parts.append("\uc790\uc138\ud55c \ub9e5\ub77d\uacfc \uc6a9\uc5b4\ub294 \ud558\ub2e8 \uc6d0\ubb38 \ub9c1\ud06c\uc5d0\uc11c \ud655\uc778\ud558\uc2dc\uba74 \uc88b\uc2b5\ub2c8\ub2e4.")
    return headline, " ".join(summary_parts)


def build_news_item(entry: dict) -> dict | None:
    if not isinstance(entry, dict):
        return None

    publish_at = str(entry.get("publishAt") or "").strip()
    publish_at_ts = parse_iso_to_epoch(publish_at)
    if not publish_at_ts:
        return None

    try:
        news_id = int(entry.get("id"))
    except (TypeError, ValueError):
        return None

    title = clean_news_text(entry.get("title"))
    content = clean_news_text(entry.get("content"))
    if not title and not content:
        return None
    preview = make_news_preview(content or title)

    return {
        "id": news_id,
        "publishAt": publish_at,
        "publishAtTs": publish_at_ts,
        "headline": title or "코인니스 속보",
        "summary": preview,
        "originalTitle": title,
        "contentImage": str(entry.get("contentImage") or "").strip(),
        "articleUrl": f"https://coinness.com/news/{news_id}",
        "originUrl": str(entry.get("link") or "").strip(),
        "originTitle": str(entry.get("linkTitle") or "").strip(),
    }


def normalize_previous_news_items(previous_news: dict | None, *, cutoff_ts: int) -> list[dict]:
    if not isinstance(previous_news, dict):
        return []

    normalized: list[dict] = []
    for raw in previous_news.get("items") or []:
        if not isinstance(raw, dict):
            continue

        if raw.get("headline") and raw.get("summary"):
            published_ts = parse_iso_to_epoch(raw.get("publishAt"))
            if published_ts is None:
                published_ts = int(raw.get("publishAtTs") or 0)
            if published_ts >= cutoff_ts:
                title = clean_news_text(raw.get("originalTitle") or raw.get("title") or raw.get("headline"))
                preview = make_news_preview(raw.get("contentPreview") or raw.get("summary") or raw.get("content"))
                normalized.append(
                    {
                        "id": int(raw.get("id") or 0),
                        "publishAt": str(raw.get("publishAt") or ""),
                        "publishAtTs": published_ts,
                        "headline": title or str(raw.get("headline") or ""),
                        "summary": preview,
                        "originalTitle": title,
                        "contentImage": str(raw.get("contentImage") or ""),
                        "articleUrl": str(raw.get("articleUrl") or ""),
                        "originUrl": str(raw.get("originUrl") or ""),
                        "originTitle": str(raw.get("originTitle") or ""),
                    }
                )
            continue

        legacy_entry = {
            "id": raw.get("id"),
            "publishAt": raw.get("publishAt"),
            "title": raw.get("title") or "",
            "content": raw.get("content") or "",
            "link": raw.get("originUrl") or raw.get("articleUrl") or "",
            "linkTitle": raw.get("originTitle") or "",
            "quickOrderCode": "",
            "originCodes": [],
        }
        rebuilt = build_news_item(legacy_entry)
        if rebuilt and int(rebuilt.get("publishAtTs") or 0) >= cutoff_ts:
            normalized.append(rebuilt)

    return normalized


def finalize_news_items(items: list[dict]) -> list[dict]:
    dedup: dict[int, dict] = {}
    for item in items:
        news_id = int(item.get("id") or 0)
        if news_id <= 0:
            continue
        dedup[news_id] = item

    rows = list(dedup.values())
    rows.sort(
        key=lambda row: (
            int(row.get("publishAtTs") or 0),
            int(row.get("id") or 0),
        ),
        reverse=True,
    )
    return rows[:COINNESS_NEWS_MAX_ITEMS]


def fetch_coinness_news(previous_news: dict | None = None) -> dict:
    items: list[dict] = []
    seen_ids: set[int] = set()
    last_id: int | None = None
    last_at: str | None = None
    now_ts = int(time.time())
    cutoff_ts = now_ts - (NEWS_RETENTION_DAYS * 24 * 60 * 60)

    try:
        while len(items) < COINNESS_NEWS_MAX_ITEMS:
            limit = min(COINNESS_NEWS_BATCH_LIMIT, COINNESS_NEWS_MAX_ITEMS - len(items))
            query_params: dict[str, str | int] = {"languageCode": "ko", "limit": limit}
            if last_id is not None and last_at:
                query_params["lastId"] = last_id
                query_params["lastAt"] = last_at

            query = urllib.parse.urlencode(query_params)
            page = fetch_json(f"{COINNESS_NEWS_ENDPOINT}?{query}")
            if not isinstance(page, list) or not page:
                break

            page_added = 0
            page_recent = 0
            for entry in page:
                item = build_news_item(entry)
                if not item:
                    continue

                published_ts = int(item.get("publishAtTs") or 0)
                if published_ts < cutoff_ts:
                    continue
                page_recent += 1

                news_id = int(item.get("id") or 0)
                if news_id in seen_ids:
                    continue
                seen_ids.add(news_id)
                items.append(item)
                page_added += 1

            last_entry = page[-1] if isinstance(page[-1], dict) else {}
            try:
                last_id = int(last_entry.get("id"))
            except (TypeError, ValueError):
                last_id = None
            last_at = str(last_entry.get("publishAt") or "").strip() or None

            if page_recent == 0 or page_added == 0 or last_id is None or not last_at or len(page) < limit:
                break

        if items:
            return {
                "source": "coinness_feed_v1_breaking_news",
                "status": "ok",
                "retentionDays": NEWS_RETENTION_DAYS,
                "fetchedAt": now_ts,
                "items": finalize_news_items(items),
            }

        raise ValueError("coinness_news_empty")
    except Exception as error:  # noqa: BLE001
        fallback_items = finalize_news_items(normalize_previous_news_items(previous_news, cutoff_ts=cutoff_ts))
        return {
            "source": "coinness_feed_v1_breaking_news",
            "status": "fallback" if fallback_items else "error",
            "retentionDays": NEWS_RETENTION_DAYS,
            "fetchedAt": now_ts,
            "error": str(error),
            "items": fallback_items,
        }


def make_protected_news_payload() -> dict:
    return {
        "source": "worker_protected",
        "status": "protected",
        "retentionDays": 0,
        "fetchedAt": int(time.time()),
        "protected": True,
        "items": [],
    }


def build_name_keys(name: str, english_name: str, korean_name: str) -> set[str]:
    return {
        key
        for key in {
            normalize_text(name),
            normalize_text(english_name),
            normalize_text(korean_name),
        }
        if key
    }


def is_gensyn_identity(row: dict) -> bool:
    symbol = str(row.get("symbol") or row.get("compareSymbol") or "").upper()
    if symbol != GENSYN_SYMBOL:
        return False
    name_text = " ".join(
        str(row.get(key) or "")
        for key in ("name", "englishName", "koreanName", "pair")
    ).lower()
    return "gensyn" in name_text or "젠신" in name_text


def apply_gensyn_supply_override(row: dict, *, source_detail: str) -> None:
    row["name"] = "Gensyn"
    row["englishName"] = "Gensyn"
    row["koreanName"] = "젠신"
    row["circulatingSupply"] = GENSYN_CIRCULATING_SUPPLY
    row["totalSupply"] = GENSYN_TOTAL_SUPPLY
    row["circulatingRatio"] = compute_circulating_ratio(
        GENSYN_CIRCULATING_SUPPLY,
        GENSYN_TOTAL_SUPPLY,
    )
    row["supplyDetail"] = source_detail
    row["nameKeys"] = list(build_name_keys("Gensyn", "Gensyn", "젠신"))


def is_binance_bstock(item: dict) -> bool:
    return any(
        "bstocks" in str(item.get(key) or "").lower()
        for key in ("localFullName", "fullName", "name")
    )


def fetch_binance() -> tuple[list[dict], dict[str, list[dict]]]:
    payload = fetch_json("https://www.binance.com/bapi/apex/v1/public/apex/marketing/symbol/list")
    try:
        scheduled_delistings = fetch_binance_scheduled_delistings()
    except Exception:  # noqa: BLE001
        scheduled_delistings = {}
    rows: list[dict] = []
    lookup: dict[str, list[dict]] = {}
    for item in payload.get("data", []):  # type: ignore[union-attr]
        if item.get("quoteAsset") != "USDT":
            continue
        if is_binance_bstock(item):
            continue
        symbol = item.get("baseAsset") or ""
        market_cap_usd = to_float(item.get("marketCap"))
        market_cap_krw = market_cap_usd * FX_USD_KRW if market_cap_usd is not None else None
        price_usd = to_float(item.get("price"))
        price_krw = price_usd * FX_USD_KRW if price_usd is not None else None
        circulating_supply = to_float(item.get("circulatingSupply"))
        total_supply = to_float(item.get("maxSupply")) or to_float(item.get("totalSupply"))
        fdv_usd = compute_fdv_usd(
            fdv_usd=to_float(item.get("fullyDilutedMarketCap")),
            price_usd=price_usd,
            total_supply=total_supply,
            market_cap_usd=market_cap_usd,
            circulating_supply=circulating_supply,
        )
        fdv_krw = fdv_usd * FX_USD_KRW if fdv_usd is not None else None
        circulating_ratio = compute_circulating_ratio(circulating_supply, total_supply)
        tags = [str(tag) for tag in (item.get("tags") or [])]
        risk_flags = []
        scheduled_delisting = scheduled_delistings.get(str(symbol).upper())
        if scheduled_delisting:
            risk_flags.append(
                make_risk_flag(
                    "delisting",
                    "상폐예정",
                    str(scheduled_delisting.get("detail") or "현물 거래지원 종료 예정"),
                    "binance_official_announcement",
                    str(scheduled_delisting.get("url") or ""),
                )
            )
        if "Monitoring" in tags:
            risk_flags.append(
                make_risk_flag(
                    "monitoring",
                    "모니터링",
                    "바이낸스 Monitoring Tag 지정 종목",
                    "binance_symbol_tags",
                    "https://www.binance.com/en/support/announcement",
                )
            )
        row = {
            "symbol": symbol,
            "pair": f"{symbol}/USDT",
            "name": item.get("localFullName") or item.get("fullName") or item.get("name") or symbol,
            "englishName": item.get("fullName") or item.get("name") or symbol,
            "koreanName": item.get("localFullName") or item.get("fullName") or symbol,
            "marketCapUsd": market_cap_usd,
            "marketCapKrw": market_cap_krw,
            "priceUsd": price_usd,
            "priceKrw": price_krw,
            "priceSource": "binance_symbol_list",
            "circulatingSupply": circulating_supply,
            "totalSupply": total_supply,
            "fdvUsd": fdv_usd,
            "fdvKrw": fdv_krw,
            "circulatingRatio": circulating_ratio,
            "nativeCurrency": "USD",
            "marketCapRank": item.get("rank"),
            "capSource": "binance_exact",
            "capSourceDetail": "binance_symbol_list",
            "status": "ok" if market_cap_usd is not None else "missing",
            "riskFlags": risk_flags,
            "nameKeys": list(
                build_name_keys(
                    item.get("fullName") or symbol,
                    item.get("fullName") or symbol,
                    item.get("localFullName") or "",
                )
            ),
        }
        if is_gensyn_identity(row):
            apply_gensyn_supply_override(row, source_detail="known_gensyn_tokenomics")
        rows.append(row)
        lookup.setdefault(symbol.lower(), []).append(row)
    return rows, lookup


def extract_upbit_market_cap(document: dict) -> tuple[float | None, str, str]:
    provider_priority = [
        ("coin_market_cap", "upbit_cmc"),
        ("coin_gecko", "upbit_coingecko"),
        ("project_team", "upbit_project"),
    ]
    categories = document.get("categories") or []
    for category in categories:
        for item in category.get("items") or []:
            if item.get("key") != "market_cap":
                continue
            content = item.get("content") or []
            provider_map = {entry.get("key"): entry for entry in content if isinstance(entry, dict)}
            for provider_key, provider_label in provider_priority:
                entry = provider_map.get(provider_key)
                value = to_float((entry or {}).get("content"))
                if value is not None:
                    return value, provider_label, str((entry or {}).get("baseDate") or "")
    return None, "upbit_missing", ""


def extract_upbit_numeric_field(document: dict, field_keys: list[str]) -> tuple[float | None, str]:
    categories = document.get("categories") or []
    for field_key in field_keys:
        for category in categories:
            for item in category.get("items") or []:
                if item.get("key") != field_key:
                    continue
                for entry in item.get("content") or []:
                    if not isinstance(entry, dict):
                        continue
                    value = to_float(entry.get("content"))
                    if value is not None:
                        base_date = str(entry.get("baseDate") or "")
                        return value, base_date
    return None, ""


def clean_info_text(value: object) -> str:
    if value is None:
        return ""
    text = html.unescape(str(value))
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def clean_news_text(value: object) -> str:
    if value is None:
        return ""
    text = html.unescape(str(value))
    text = re.sub(r"<\s*br\s*/?\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</\s*p\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
    text = "\n".join(line for line in lines if line)
    return text.strip()


def make_news_preview(value: object, *, max_chars: int = 300) -> str:
    text = re.sub(r"\s+", " ", clean_news_text(value)).strip()
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 1].rstrip() + "…"


def keep_info_text(value: object) -> str:
    text = clean_info_text(value)
    if not text:
        return ""
    if text.lower() in {"n/a", "na", "null", "none"}:
        return ""
    if text in {"-", "미제공", "알수없음"}:
        return ""
    return text


def upbit_item_map(document: dict) -> dict[str, dict]:
    item_by_key: dict[str, dict] = {}
    for category in document.get("categories") or []:
        if not isinstance(category, dict):
            continue
        for item in category.get("items") or []:
            if isinstance(item, dict) and item.get("key"):
                item_by_key[str(item.get("key"))] = item
    return item_by_key


def upbit_text(item_by_key: dict[str, dict], key: str) -> str:
    item = item_by_key.get(key) or {}
    content = item.get("content")
    if isinstance(content, list):
        parts = []
        for entry in content:
            if not isinstance(entry, dict):
                continue
            title = keep_info_text(entry.get("title"))
            entry_content = keep_info_text(entry.get("content"))
            if title and entry_content:
                parts.append(f"{title}: {entry_content}")
            elif entry_content:
                parts.append(entry_content)
        return " / ".join(parts)
    return keep_info_text(content) or keep_info_text(item.get("baseDate")) or keep_info_text(item.get("comment"))


def upbit_links(item_by_key: dict[str, dict], key: str) -> list[dict[str, str]]:
    item = item_by_key.get(key) or {}
    links = []
    for entry in item.get("content") or []:
        if not isinstance(entry, dict):
            continue
        url = keep_info_text(entry.get("content"))
        if not url.startswith(("http://", "https://")):
            continue
        label = keep_info_text(entry.get("title")) or keep_info_text(entry.get("key")) or "링크"
        links.append({"label": label, "url": url})
    return links


def collect_upbit_coin_info(document: dict) -> dict:
    item_by_key = upbit_item_map(document)
    fields = {
        "assetName": upbit_text(item_by_key, "digital_asset_name"),
        "ticker": upbit_text(item_by_key, "ticker"),
        "releaseDate": upbit_text(item_by_key, "initial_release"),
        "assetType": upbit_text(item_by_key, "type"),
        "purpose": upbit_text(item_by_key, "main_purpose"),
        "domesticMarkets": upbit_text(item_by_key, "exchange_status_ko"),
        "globalMarkets": upbit_text(item_by_key, "exchange_status_global"),
        "mainnet": upbit_text(item_by_key, "mainnet_name") or upbit_text(item_by_key, "mainnet_yn"),
        "mainnetFeature": upbit_text(item_by_key, "features_of_the_mainnet"),
        "issuer": upbit_text(item_by_key, "name_of_the_issuing_entity"),
        "issuanceMethod": upbit_text(item_by_key, "issuance_method"),
        "circulationSchedule": upbit_text(item_by_key, "circulating_supply_schedule"),
        "securityIncidents": upbit_text(item_by_key, "security_incidents"),
        "explorer": upbit_text(item_by_key, "block_explorer"),
    }
    info = {key: value for key, value in fields.items() if value}
    links = upbit_links(item_by_key, "main_official_media")
    if links:
        info["links"] = links
    return info


def collect_bithumb_coin_info(basic_info: dict) -> dict:
    fields = {
        "assetName": keep_info_text(basic_info.get("coinTitle")),
        "description": keep_info_text(basic_info.get("description")),
        "totalIssueQty": keep_info_text(basic_info.get("totalIssueQty")),
        "marketAvailableSupply": keep_info_text(basic_info.get("marketAvailableSupply")),
        "marketTotalSupply": keep_info_text(basic_info.get("marketTotalSupply")),
        "marketStdDatetime": keep_info_text(basic_info.get("marketStdDatetime")),
        "explorer": keep_info_text(basic_info.get("bcepUrlAddr")),
    }
    info = {key: value for key, value in fields.items() if value}
    link_fields = [
        ("홈페이지", basic_info.get("websiteUrl")),
        ("국문 설명서", basic_info.get("manual")),
        ("백서", basic_info.get("whitePaper")),
        ("국문 백서", basic_info.get("koWhitePaper")),
        ("블록 탐색기", basic_info.get("bcepUrlAddr")),
    ]
    links = [
        {"label": label, "url": url_text}
        for label, url in link_fields
        if (url_text := keep_info_text(url)).startswith(("http://", "https://"))
    ]
    if links:
        info["links"] = links
    return info


def fetch_upbit_details(symbol: str) -> dict:
    query = urllib.parse.urlencode({"currency": symbol, "language": "ko"})
    payload = fetch_json(f"https://ccx.upbit.com/coin-infos/api/v1/digital-assets?{query}")
    document = payload.get("document") or {}  # type: ignore[union-attr]
    market_cap_krw, source_label, base_date = extract_upbit_market_cap(document)
    market_cap_usd = market_cap_krw / FX_USD_KRW if market_cap_krw is not None else None
    circulating_supply, circulating_base_date = extract_upbit_numeric_field(
        document,
        ["current_circulating_supply", "circulating_supply"],
    )
    total_supply, total_supply_base_date = extract_upbit_numeric_field(
        document,
        ["max_supply", "total_supply"],
    )
    return {
        "marketCapKrw": market_cap_krw,
        "marketCapUsd": market_cap_usd,
        "capSource": source_label,
        "capSourceDetail": base_date,
        "circulatingSupply": circulating_supply,
        "totalSupply": total_supply,
        "supplyDetail": circulating_base_date or total_supply_base_date or "",
        "info": collect_upbit_coin_info(document),
        "status": "ok" if market_cap_krw is not None else "missing",
    }


def fetch_upbit_prices(symbols: list[str]) -> dict[str, float]:
    if not symbols:
        return {}
    prices: dict[str, float] = {}
    batch_size = 80
    for start in range(0, len(symbols), batch_size):
        chunk = symbols[start : start + batch_size]
        query = urllib.parse.urlencode({"markets": ",".join(f"KRW-{symbol}" for symbol in chunk)})
        payload = fetch_json(f"https://api.upbit.com/v1/ticker?{query}")
        if not isinstance(payload, list):
            continue
        for item in payload:
            if not isinstance(item, dict):
                continue
            market = str(item.get("market") or "")
            if not market.startswith("KRW-"):
                continue
            symbol = market.replace("KRW-", "")
            price_krw = to_float(item.get("trade_price"))
            if price_krw is not None:
                prices[symbol] = price_krw
    return prices


def fetch_upbit() -> tuple[list[dict], dict[str, list[dict]]]:
    listings = fetch_json("https://api.upbit.com/v1/market/all?is_details=true")
    base_rows = []
    for item in listings:  # type: ignore[assignment]
        market = item.get("market", "")
        if not market.startswith("KRW-"):
            continue
        symbol = market.replace("KRW-", "")
        market_event = item.get("market_event") or {}
        risk_flags = scheduled_delisting_flags("upbit", symbol)
        if bool(market_event.get("warning")):
            risk_flags.append(
                make_risk_flag(
                    "warning",
                    "유의",
                    "업비트 거래 유의 종목",
                    "upbit_market_event",
                    "https://upbit.com/service_center/notice",
                )
            )
        base_rows.append(
            {
                "symbol": symbol,
                "pair": f"{symbol}/KRW",
                "name": item.get("korean_name") or symbol,
                "englishName": item.get("english_name") or symbol,
                "koreanName": item.get("korean_name") or symbol,
                "riskFlags": risk_flags,
            }
        )

    details: dict[str, dict] = {}
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(fetch_upbit_details, row["symbol"]): row["symbol"] for row in base_rows}
        for future in as_completed(futures):
            symbol = futures[future]
            try:
                details[symbol] = future.result()
            except Exception:  # noqa: BLE001
                details[symbol] = {
                    "marketCapKrw": None,
                    "marketCapUsd": None,
                    "capSource": "upbit_fetch_failed",
                    "capSourceDetail": "",
                    "info": {},
                    "status": "missing",
                }

    try:
        upbit_prices = fetch_upbit_prices([row["symbol"] for row in base_rows])
    except Exception:  # noqa: BLE001
        upbit_prices = {}

    rows: list[dict] = []
    lookup: dict[str, list[dict]] = {}
    for row in base_rows:
        detail = details[row["symbol"]]
        compare_symbol = UPBIT_COMPARE_SYMBOL_MAP.get(row["symbol"], row["symbol"])
        symbol_alias_of = compare_symbol if compare_symbol != row["symbol"] else None
        price_krw = upbit_prices.get(row["symbol"])
        price_usd = safe_div(price_krw, FX_USD_KRW)
        circulating_supply = to_float(detail.get("circulatingSupply"))
        total_supply = to_float(detail.get("totalSupply"))
        market_cap_krw = to_float(detail.get("marketCapKrw"))
        market_cap_usd = to_float(detail.get("marketCapUsd"))
        cap_source = str(detail.get("capSource") or "")
        cap_source_detail = str(detail.get("capSourceDetail") or "")
        if (
            price_krw is not None
            and circulating_supply is not None
            and (
                market_cap_krw is None
                or is_upbit_base_date_stale(cap_source_detail)
            )
        ):
            stale_detail = cap_source_detail
            market_cap_krw = price_krw * circulating_supply
            market_cap_usd = safe_div(market_cap_krw, FX_USD_KRW)
            cap_source = "upbit_live_price_supply"
            cap_source_detail = (
                f"upbit_krw_ticker|circulating_supply:{detail.get('supplyDetail') or 'unknown'}"
                f"|replaced_stale:{stale_detail or 'missing'}"
            )
        fdv_usd = compute_fdv_usd(
            fdv_usd=None,
            price_usd=price_usd,
            total_supply=total_supply,
            market_cap_usd=market_cap_usd,
            circulating_supply=circulating_supply,
        )
        fdv_krw = fdv_usd * FX_USD_KRW if fdv_usd is not None else None
        circulating_ratio = compute_circulating_ratio(circulating_supply, total_supply)
        merged = {
            **row,
            **detail,
            "compareSymbol": compare_symbol,
            "symbolAliasOf": symbol_alias_of,
            "marketCapKrw": market_cap_krw,
            "marketCapUsd": market_cap_usd,
            "capSource": cap_source,
            "capSourceDetail": cap_source_detail,
            "status": "ok" if market_cap_krw is not None else "missing",
            "priceKrw": price_krw,
            "priceUsd": price_usd,
            "priceSource": "upbit_krw_ticker" if price_krw is not None else "upbit_price_missing",
            "circulatingSupply": circulating_supply,
            "totalSupply": total_supply,
            "fdvUsd": fdv_usd,
            "fdvKrw": fdv_krw,
            "circulatingRatio": circulating_ratio,
            "nativeCurrency": "KRW",
            "marketCapRank": None,
            "nameKeys": list(build_name_keys(row["name"], row["englishName"], row["koreanName"])),
        }
        rows.append(merged)
        lookup.setdefault(row["symbol"].lower(), []).append(merged)

    return rows, lookup


def fetch_bithumb_prices(symbols: list[str]) -> dict[str, float]:
    prices: dict[str, float] = {}
    unique_symbols = list(dict.fromkeys(str(symbol or "").strip().upper() for symbol in symbols if symbol))
    for start in range(0, len(unique_symbols), BITHUMB_TICKER_BATCH_SIZE):
        chunk = unique_symbols[start : start + BITHUMB_TICKER_BATCH_SIZE]
        query = urllib.parse.urlencode({"markets": ",".join(f"KRW-{symbol}" for symbol in chunk)})
        payload = fetch_json(f"https://api.bithumb.com/v1/ticker?{query}")
        if not isinstance(payload, list):
            continue
        for item in payload:
            if not isinstance(item, dict):
                continue
            market = str(item.get("market") or "").upper()
            if not market.startswith("KRW-"):
                continue
            symbol = market.replace("KRW-", "")
            price_krw = to_float(item.get("trade_price")) or to_float(item.get("prev_closing_price"))
            if price_krw is not None:
                prices[symbol] = price_krw
    return prices


def parse_bithumb_supply_quantity(value: object) -> float | None:
    if isinstance(value, str) and value.strip() == "-":
        return None
    return to_float(value)


def fetch_bithumb_basic_info_map(coin_types: list[str]) -> dict[str, dict]:
    unique_coin_types = [
        coin_type
        for coin_type in dict.fromkeys(str(coin_type or "").strip() for coin_type in coin_types)
        if coin_type
    ]
    if not unique_coin_types:
        return {}

    def fetch_one(coin_type: str) -> tuple[str, dict | None]:
        query = urllib.parse.urlencode({"lang": "korean"})
        url = (
            "https://gw.bithumb.com/exchange/v2/trade/info-coin/"
            f"{urllib.parse.quote(coin_type)}-C0100?{query}"
        )
        try:
            payload = fetch_json(url, retries=2, pause=0.5)
        except Exception:  # noqa: BLE001
            return coin_type, None
        if not isinstance(payload, dict) or payload.get("status") != 200:
            return coin_type, None
        data = payload.get("data")
        if not isinstance(data, dict):
            return coin_type, None
        return coin_type, data

    basic_info_by_coin_type: dict[str, dict] = {}
    with ThreadPoolExecutor(max_workers=BITHUMB_BASIC_INFO_WORKERS) as executor:
        futures = {executor.submit(fetch_one, coin_type): coin_type for coin_type in unique_coin_types}
        for future in as_completed(futures):
            coin_type, data = future.result()
            if data:
                basic_info_by_coin_type[coin_type] = data
    return basic_info_by_coin_type


def fetch_bithumb() -> list[dict]:
    cap_payload = fetch_json("https://gw.bithumb.com/exchange/v1/trade/coinmarketcap")
    cap_map = (cap_payload.get("data") or {}) if isinstance(cap_payload, dict) else {}
    payload = fetch_json("https://gw.bithumb.com/exchange/v1/comn/intro")
    data = payload.get("data") or {}  # type: ignore[union-attr]
    krw_market = (data.get("coinsOnMarketList") or {}).get("C0100") or []
    try:
        market_details_payload = fetch_json("https://api.bithumb.com/v1/market/all?isDetails=true")
        market_warning_by_symbol = {
            str(detail.get("market") or "").replace("KRW-", "").upper(): str(
                detail.get("market_warning") or ""
            ).upper()
            for detail in market_details_payload
            if isinstance(detail, dict)
            and str(detail.get("market") or "").startswith("KRW-")
        }
    except Exception:  # noqa: BLE001
        market_warning_by_symbol = {}
    try:
        bithumb_prices = fetch_bithumb_prices(
            [str(item.get("coinSymbol") or "") for item in krw_market if isinstance(item, dict)]
        )
    except Exception:  # noqa: BLE001
        bithumb_prices = {}
    basic_info_by_coin_type = fetch_bithumb_basic_info_map(
        [str(item.get("coinType") or "") for item in krw_market if isinstance(item, dict)]
    )
    rows: list[dict] = []
    for item in krw_market:
        coin_type = item.get("coinType") or ""
        market_cap_krw = cap_map.get(coin_type)
        symbol = str(item.get("coinSymbol") or "").upper()
        risk_flags = scheduled_delisting_flags("bithumb", symbol)
        if market_warning_by_symbol.get(symbol) == "CAUTION":
            risk_flags.append(
                make_risk_flag(
                    "warning",
                    "유의",
                    "빗썸 거래 유의 종목",
                    "bithumb_market_warning",
                    "https://feed.bithumb.com/notice?category=5&page=1",
                )
            )
        price_krw = bithumb_prices.get(symbol)
        price_usd = safe_div(price_krw, FX_USD_KRW)
        basic_info = basic_info_by_coin_type.get(str(coin_type), {})
        circulating_supply = parse_bithumb_supply_quantity(basic_info.get("marketAvailableSupply"))
        total_supply = parse_bithumb_supply_quantity(basic_info.get("totalIssueQty"))
        fdv_usd = compute_fdv_usd(
            fdv_usd=None,
            price_usd=price_usd,
            total_supply=total_supply,
            market_cap_usd=float(market_cap_krw) / FX_USD_KRW if market_cap_krw is not None else None,
            circulating_supply=circulating_supply,
        )
        supply_sources = []
        if circulating_supply is not None:
            supply_sources.append("marketAvailableSupply")
        if total_supply is not None:
            supply_sources.append("totalIssueQty")
        row = {
                "coinType": coin_type,
                "symbol": symbol,
                "pair": f"{symbol}/KRW",
                "name": item.get("coinName") or symbol,
                "englishName": item.get("coinNameEn") or symbol,
                "koreanName": item.get("coinName") or symbol,
                "marketCapUsd": (
                    float(market_cap_krw) / FX_USD_KRW if market_cap_krw is not None else None
                ),
                "marketCapKrw": float(market_cap_krw) if market_cap_krw is not None else None,
                "priceKrw": price_krw,
                "priceUsd": price_usd,
                "priceSource": "bithumb_public_ticker" if price_krw is not None else "bithumb_price_missing",
                "circulatingSupply": circulating_supply,
                "totalSupply": total_supply,
                "fdvUsd": fdv_usd,
                "fdvKrw": fdv_usd * FX_USD_KRW if fdv_usd is not None else None,
                "circulatingRatio": compute_circulating_ratio(circulating_supply, total_supply),
                "nativeCurrency": "KRW",
                "marketCapRank": None,
                "capSource": "bithumb_coinmarketcap" if market_cap_krw is not None else "bithumb_missing",
                "capSourceDetail": "bithumb_main_today_price",
                "supplyDetail": (
                    "bithumb_basic_info:" + "|".join(supply_sources)
                    if supply_sources
                    else "bithumb_basic_info_missing"
                ),
                "status": "ok" if market_cap_krw is not None else "missing",
                "riskFlags": risk_flags,
                "info": collect_bithumb_coin_info(basic_info),
                "nameKeys": list(
                    build_name_keys(
                        item.get("coinName") or "",
                        item.get("coinNameEn") or "",
                        item.get("coinName") or "",
                    )
                ),
        }
        if is_gensyn_identity(row):
            apply_gensyn_supply_override(row, source_detail="known_gensyn_tokenomics|bithumb_identity")
        rows.append(row)
    return rows


def fetch_coinbase_usd_price_map() -> dict[str, float]:
    price_map: dict[str, float] = {}
    payload = fetch_json(COINBASE_PRODUCT_STATS_ENDPOINT, retries=2, pause=1.0)
    if isinstance(payload, dict):
        for product_id, stats in payload.items():
            product_id_text = str(product_id or "").upper().strip()
            if not product_id_text.endswith("-USD") or not isinstance(stats, dict):
                continue
            stats_24h = stats.get("stats_24hour")
            if not isinstance(stats_24h, dict):
                continue
            price = to_float(stats_24h.get("last"))
            if price is not None:
                price_map[product_id_text] = price
    return price_map


def fetch_coinbase() -> list[dict]:
    payload = fetch_json("https://api.exchange.coinbase.com/products")
    if not isinstance(payload, list):
        return []
    try:
        price_map = fetch_coinbase_usd_price_map()
    except Exception:  # noqa: BLE001
        price_map = {}
    try:
        currencies_payload = fetch_json(COINBASE_CURRENCIES_ENDPOINT, retries=2, pause=1.0)
        currency_name_map = (
            {
                str(currency.get("id") or "").upper().strip(): str(
                    currency.get("name") or ""
                ).strip()
                for currency in currencies_payload
                if isinstance(currency, dict)
                and str(currency.get("id") or "").strip()
                and str(currency.get("name") or "").strip()
            }
            if isinstance(currencies_payload, list)
            else {}
        )
    except Exception:  # noqa: BLE001
        currency_name_map = {}

    products = payload
    if not isinstance(products, list):
        return []

    rows: list[dict] = []
    seen_symbols: set[str] = set()
    for item in products:
        if not isinstance(item, dict):
            continue

        quote_currency = str(item.get("quote_currency") or "").upper().strip()
        base_currency = str(item.get("base_currency") or "").upper().strip()
        status = str(item.get("status") or "").lower().strip()
        trading_disabled = bool(item.get("trading_disabled"))

        if quote_currency != "USD":
            continue
        if not base_currency:
            continue
        if base_currency in COINBASE_EXCLUDED_SYMBOLS:
            continue
        if status != "online" or trading_disabled:
            continue
        if base_currency in seen_symbols:
            continue
        seen_symbols.add(base_currency)
        compare_symbol = COINBASE_COMPARE_SYMBOL_MAP.get(base_currency, base_currency)
        symbol_alias_of = compare_symbol if compare_symbol != base_currency else None
        price_usd = to_float(price_map.get(f"{base_currency}-USD"))
        price_krw = price_usd * FX_USD_KRW if price_usd is not None else None
        display_name = "Gensyn" if base_currency == GENSYN_SYMBOL else base_currency
        currency_name = currency_name_map.get(base_currency, display_name)
        risk_flags = scheduled_delisting_flags("coinbase", base_currency)

        row = {
                "symbol": base_currency,
                "pair": f"{base_currency}/USD",
                "compareSymbol": compare_symbol,
                "symbolAliasOf": symbol_alias_of,
                "name": display_name,
                "englishName": display_name,
                "koreanName": "젠신" if base_currency == GENSYN_SYMBOL else base_currency,
                "marketCapUsd": None,
                "marketCapKrw": None,
                "priceUsd": price_usd,
                "priceKrw": price_krw,
                "priceSource": "coinbase_market_products" if price_usd is not None else "coinbase_market_products_missing",
                "circulatingSupply": None,
                "totalSupply": None,
                "fdvUsd": None,
                "fdvKrw": None,
                "circulatingRatio": None,
                "nativeCurrency": "USD",
                "marketCapRank": None,
                "capSource": "coinbase_usd_list",
                "capSourceDetail": "coinbase_exchange_markets",
                "status": "missing",
                "riskFlags": risk_flags,
                "nameKeys": list(
                    build_name_keys(
                        display_name,
                        currency_name,
                        "젠신" if base_currency == GENSYN_SYMBOL else compare_symbol,
                    )
                ),
        }
        if base_currency == GENSYN_SYMBOL:
            apply_gensyn_supply_override(row, source_detail="known_gensyn_tokenomics|coinbase_identity")
        rows.append(
            row
        )
    return rows


def pick_first_candidate_with_market_signal(candidate_rows: list[dict]) -> dict | None:
    for candidate in candidate_rows:
        has_market_cap = to_float(candidate.get("marketCapUsd")) is not None or to_float(candidate.get("marketCapKrw")) is not None
        has_price = to_float(candidate.get("priceUsd")) is not None or to_float(candidate.get("priceKrw")) is not None
        if has_market_cap or has_price:
            return candidate
    return None


def derive_circulating_supply(
    *,
    market_cap_usd: float | None,
    market_cap_krw: float | None,
    price_usd: float | None,
    price_krw: float | None,
) -> float | None:
    if market_cap_usd is not None and price_usd is not None:
        return safe_div(market_cap_usd, price_usd)
    if market_cap_krw is not None and price_krw is not None:
        return safe_div(market_cap_krw, price_krw)
    return None


def pick_reference_market_candidate(target_row: dict, candidate_rows: list[dict]) -> dict | None:
    symbol = str(target_row.get("compareSymbol") or target_row.get("symbol") or "").upper()
    if symbol in AMBIGUOUS_SYMBOLS_REQUIRE_NAME_OVERLAP:
        return next(
            (
                candidate
                for candidate in candidate_rows
                if has_name_key_overlap(target_row, candidate)
                and (
                    to_float(candidate.get("marketCapUsd")) is not None
                    or to_float(candidate.get("marketCapKrw")) is not None
                    or to_float(candidate.get("priceUsd")) is not None
                    or to_float(candidate.get("priceKrw")) is not None
                )
            ),
            None,
        )
    return pick_first_candidate_with_market_signal(candidate_rows)


def pick_reference_supply_candidate(target_row: dict, candidate_rows: list[dict]) -> dict | None:
    symbol = str(target_row.get("compareSymbol") or target_row.get("symbol") or "").upper()
    if symbol in AMBIGUOUS_SYMBOLS_REQUIRE_NAME_OVERLAP:
        return pick_supply_fill_candidate(target_row, candidate_rows)
    return pick_first_candidate_with_supply(candidate_rows)


def copy_positive_numbers(target_row: dict, source_row: dict, keys: tuple[str, ...]) -> bool:
    changed = False
    for key in keys:
        number = to_float(source_row.get(key))
        if number is not None:
            if target_row.get(key) != number:
                changed = True
            target_row[key] = number
    return changed


def apply_coinbase_reference_fills(
    coinbase_rows: list[dict],
    binance_rows: list[dict],
    upbit_rows: list[dict],
    bithumb_rows: list[dict],
) -> None:
    binance_by_symbol = build_rows_by_symbol(binance_rows)
    upbit_by_symbol = build_rows_by_symbol(upbit_rows)
    bithumb_by_symbol = build_rows_by_symbol(bithumb_rows)
    reference_sources = (
        ("binance_symbol_list", binance_by_symbol),
        ("upbit_info_tab_cmc_first", upbit_by_symbol),
        ("bithumb_main_today_price", bithumb_by_symbol),
    )

    for coinbase_row in coinbase_rows:
        symbol = str(coinbase_row.get("compareSymbol") or coinbase_row.get("symbol") or "").upper()
        if not symbol:
            continue

        market_candidate = None
        market_source_detail = ""
        for source_detail, rows_by_symbol in reference_sources:
            market_candidate = pick_reference_market_candidate(coinbase_row, rows_by_symbol.get(symbol, []))
            if market_candidate is not None:
                market_source_detail = source_detail
                break

        supply_candidate = None
        supply_source_detail = ""
        for source_detail, rows_by_symbol in reference_sources:
            supply_candidate = pick_reference_supply_candidate(coinbase_row, rows_by_symbol.get(symbol, []))
            if supply_candidate is not None:
                supply_source_detail = source_detail
                break

        if market_candidate is None and supply_candidate is None:
            continue

        has_coinbase_price = (
            to_float(coinbase_row.get("priceUsd")) is not None
            and str(coinbase_row.get("priceSource") or "").startswith("coinbase_market_products")
        )
        if market_candidate is not None:
            copy_positive_numbers(
                coinbase_row,
                market_candidate,
                ("marketCapUsd", "marketCapKrw") if has_coinbase_price else ("marketCapUsd", "marketCapKrw", "priceUsd", "priceKrw"),
            )
            if not has_coinbase_price:
                coinbase_row["priceSource"] = str(market_candidate.get("priceSource") or coinbase_row.get("priceSource") or "")

        if supply_candidate is not None:
            supply_changed = copy_positive_numbers(
                coinbase_row,
                supply_candidate,
                ("circulatingSupply", "totalSupply"),
            )
            ratio = supply_candidate.get("circulatingRatio")
            if isinstance(ratio, (int, float)) and ratio >= 0:
                coinbase_row["circulatingRatio"] = float(ratio)
            else:
                coinbase_row["circulatingRatio"] = compute_circulating_ratio(
                    to_float(coinbase_row.get("circulatingSupply")),
                    to_float(coinbase_row.get("totalSupply")),
                )
            coinbase_row["supplyDetail"] = f"coinbase_supply_fill:{supply_source_detail}"
            if supply_changed:
                coinbase_row["fdvUsd"] = None
                coinbase_row["fdvKrw"] = None

        coinbase_row["capSource"] = "coinbase_fill_same_symbol"
        coinbase_row["capSourceDetail"] = f"coinbase_exchange_markets|{market_source_detail or supply_source_detail}"
        price_usd = to_float(coinbase_row.get("priceUsd"))
        circulating_supply = to_float(coinbase_row.get("circulatingSupply"))
        if has_coinbase_price and price_usd is not None and circulating_supply is not None:
            coinbase_row["marketCapUsd"] = price_usd * circulating_supply
            coinbase_row["marketCapKrw"] = coinbase_row["marketCapUsd"] * FX_USD_KRW
            coinbase_row["capSource"] = "coinbase_market_products"
            coinbase_row["capSourceDetail"] = f"coinbase_price|supply:{supply_source_detail or market_source_detail}"
        if to_float(coinbase_row.get("marketCapUsd")) is not None or to_float(coinbase_row.get("marketCapKrw")) is not None:
            coinbase_row["status"] = "ok"


def apply_upbit_targeted_fills(upbit_rows: list[dict], bithumb_rows: list[dict]) -> None:
    bithumb_by_symbol = {row.get("symbol"): row for row in bithumb_rows}
    for row in upbit_rows:
        if row.get("symbol") != "ZETA":
            continue
        if row.get("marketCapKrw") is not None or row.get("marketCapUsd") is not None:
            continue
        source = bithumb_by_symbol.get("ZETA")
        if not source:
            continue
        row["marketCapKrw"] = source.get("marketCapKrw")
        row["marketCapUsd"] = source.get("marketCapUsd")
        row["capSource"] = "upbit_fill_from_bithumb"
        row["capSourceDetail"] = "zeta_same_symbol_fill"
        row["status"] = "ok"


def parse_base_date(value: str | None) -> datetime | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    for fmt in ("%Y-%m-%d", "%Y.%m.%d"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def is_upbit_base_date_stale(value: str | None, *, max_age_days: int = 2) -> bool:
    base_dt = parse_base_date(value)
    if base_dt is None:
        return False
    now_kst = datetime.now(timezone(timedelta(hours=9))).date()
    base_date = base_dt.date()
    age_days = (now_kst - base_date).days
    # Treat the threshold day as stale as well (>=) so 2-day-old upbit base data
    # can be refreshed from live exchange references.
    return age_days >= max_age_days


def has_name_key_overlap(row_a: dict, row_b: dict) -> bool:
    keys_a = set(row_a.get("nameKeys") or [])
    keys_b = set(row_b.get("nameKeys") or [])
    if not keys_a or not keys_b:
        return False
    return bool(keys_a & keys_b)


def build_rows_by_symbol(rows: list[dict]) -> dict[str, list[dict]]:
    indexed: dict[str, list[dict]] = {}
    for row in rows:
        symbols = {
            str(row.get("symbol") or "").upper(),
            str(row.get("compareSymbol") or "").upper(),
        }
        for symbol in symbols:
            if not symbol:
                continue
            indexed.setdefault(symbol, []).append(row)
    return indexed


def apply_binance_korean_name_fills(binance_rows: list[dict], upbit_rows: list[dict], bithumb_rows: list[dict]) -> None:
    upbit_by_symbol = build_rows_by_symbol(upbit_rows)
    bithumb_by_symbol = build_rows_by_symbol(bithumb_rows)

    for row in binance_rows:
        symbol = str(row.get("compareSymbol") or row.get("symbol") or "").upper()
        if not symbol:
            continue

        reference_candidates = bithumb_by_symbol.get(symbol, []) + upbit_by_symbol.get(symbol, [])
        korean_name = next(
            (
                str(candidate.get("koreanName") or candidate.get("name") or "").strip()
                for candidate in reference_candidates
                if has_hangul(str(candidate.get("koreanName") or candidate.get("name") or ""))
            ),
            "",
        )
        if not korean_name:
            continue

        row["name"] = korean_name
        row["koreanName"] = korean_name
        row["nameKeys"] = list(
            build_name_keys(
                korean_name,
                str(row.get("englishName") or row.get("symbol") or ""),
                korean_name,
            )
        )


def pick_live_fill_candidate(upbit_row: dict, candidate_rows: list[dict]) -> dict | None:
    for candidate in candidate_rows:
        if to_float(candidate.get("marketCapUsd")) is None:
            continue
        if not has_name_key_overlap(upbit_row, candidate):
            continue
        return candidate
    return None


def pick_first_candidate_with_cap(candidate_rows: list[dict]) -> dict | None:
    for candidate in candidate_rows:
        if to_float(candidate.get("marketCapUsd")) is not None:
            return candidate
    return None


def apply_supply_from_reference(
    target_row: dict,
    candidate: dict,
    *,
    source_detail: str,
    stale_source_detail: str,
) -> bool:
    candidate_circulating_supply = to_float(candidate.get("circulatingSupply"))
    candidate_total_supply = to_float(candidate.get("totalSupply"))
    target_circulating_supply = to_float(target_row.get("circulatingSupply"))
    target_total_supply = to_float(target_row.get("totalSupply"))
    if candidate_circulating_supply is None and candidate_total_supply is None:
        return False

    circulating_supply = candidate_circulating_supply or target_circulating_supply
    # A stale Upbit market cap can be refreshed from another exchange, but the
    # replacement exchange may expose current issued supply instead of Upbit's
    # maximum issuance limit. Preserve the original limit when it is available.
    total_supply = target_total_supply or candidate_total_supply
    target_row["circulatingSupply"] = circulating_supply
    target_row["totalSupply"] = total_supply
    target_row["circulatingRatio"] = compute_circulating_ratio(circulating_supply, total_supply)
    target_row["fdvUsd"] = None
    target_row["fdvKrw"] = None
    target_row["supplyDetail"] = (
        f"stale_upbit_supply_date:{stale_source_detail}|"
        f"{source_detail}|{candidate.get('supplyDetail') or 'supply_reference'}"
    )
    return True


def pick_first_candidate_with_supply(candidate_rows: list[dict]) -> dict | None:
    for candidate in candidate_rows:
        if to_float(candidate.get("circulatingSupply")) is not None or to_float(candidate.get("totalSupply")) is not None:
            return candidate
    return None


def pick_supply_fill_candidate(target_row: dict, candidate_rows: list[dict]) -> dict | None:
    for candidate in candidate_rows:
        circulating_supply = to_float(candidate.get("circulatingSupply"))
        total_supply = to_float(candidate.get("totalSupply"))
        if circulating_supply is None and total_supply is None:
            continue
        if not has_name_key_overlap(target_row, candidate):
            continue
        return candidate
    return None


def row_has_complete_supply(row: dict) -> bool:
    return (
        to_float(row.get("circulatingSupply")) is not None
        and to_float(row.get("totalSupply")) is not None
    )


def row_symbols(row: dict) -> set[str]:
    return {
        symbol
        for symbol in {
            str(row.get("symbol") or "").upper(),
            str(row.get("compareSymbol") or "").upper(),
        }
        if symbol
    }


def make_coingecko_market_candidate(item: dict) -> dict | None:
    symbol = str(item.get("symbol") or "").upper()
    if not symbol:
        return None

    circulating_supply = to_float(item.get("circulating_supply"))
    total_supply = to_float(item.get("max_supply")) or to_float(item.get("total_supply"))
    gecko_id = str(item.get("id") or "")
    name = str(item.get("name") or symbol)
    fdv_usd = to_float(item.get("fully_diluted_valuation"))
    return {
        "symbol": symbol,
        "name": name,
        "englishName": name,
        "koreanName": name,
        "circulatingSupply": circulating_supply,
        "totalSupply": total_supply,
        "circulatingRatio": compute_circulating_ratio(circulating_supply, total_supply),
        "fdvUsd": fdv_usd,
        "fdvKrw": fdv_usd * FX_USD_KRW if fdv_usd is not None else None,
        "marketCapUsd": to_float(item.get("market_cap")),
        "priceUsd": to_float(item.get("current_price")),
        "marketCapRank": item.get("market_cap_rank"),
        "supplyDetail": f"coingecko_markets:{gecko_id}",
        "coingeckoId": gecko_id,
        "sourceId": gecko_id,
        "nameKeys": list(
            {
                key
                for key in {
                    normalize_text(symbol),
                    normalize_text(name),
                    normalize_text(gecko_id),
                }
                if key
            }
        ),
    }


def append_coingecko_candidates(
    candidates: dict[str, list[dict]],
    payload: object,
    target_symbols: set[str],
) -> None:
    if not isinstance(payload, list):
        return

    known_ids = {
        str(candidate.get("coingeckoId") or candidate.get("supplyDetail") or "")
        for rows in candidates.values()
        for candidate in rows
    }
    for item in payload:
        if not isinstance(item, dict):
            continue
        candidate = make_coingecko_market_candidate(item)
        if candidate is None or candidate["symbol"] not in target_symbols:
            continue
        candidate_id = str(candidate.get("coingeckoId") or candidate.get("supplyDetail") or "")
        if candidate_id in known_ids:
            continue
        candidates.setdefault(candidate["symbol"], []).append(candidate)
        known_ids.add(candidate_id)


def fetch_coingecko_supply_candidates(target_symbols: set[str]) -> dict[str, list[dict]]:
    if not target_symbols:
        return {}

    candidates: dict[str, list[dict]] = {}
    sorted_symbols = sorted(target_symbols)
    for offset in range(0, len(sorted_symbols), COINGECKO_SYMBOL_BATCH_SIZE):
        symbol_batch = sorted_symbols[offset : offset + COINGECKO_SYMBOL_BATCH_SIZE]
        query = urllib.parse.urlencode(
            {
                "vs_currency": "usd",
                "symbols": ",".join(symbol.lower() for symbol in symbol_batch),
                "include_tokens": "all",
                "order": "market_cap_desc",
                "per_page": COINGECKO_MARKETS_PAGE_SIZE,
                "page": 1,
                "sparkline": "false",
            }
        )
        payload = fetch_json(f"{COINGECKO_MARKETS_ENDPOINT}?{query}", retries=5, pause=8.0)
        append_coingecko_candidates(candidates, payload, target_symbols)
        if offset + COINGECKO_SYMBOL_BATCH_SIZE < len(sorted_symbols):
            time.sleep(6.0)

    return candidates


def fetch_coinmarketcap_market_candidates(target_symbols: set[str]) -> dict[str, list[dict]]:
    if not target_symbols:
        return {}

    query = urllib.parse.urlencode(
        {
            "symbol": ",".join(sorted(target_symbols)),
            "convert": "USD",
            "skip_invalid": "true",
        }
    )
    payload = fetch_json(f"{COINMARKETCAP_QUOTES_ENDPOINT}?{query}", retries=4, pause=3.0)
    items = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(items, list):
        return {}

    candidates: dict[str, list[dict]] = {}
    for item in items:
        if not isinstance(item, dict):
            continue
        symbol = str(item.get("symbol") or "").upper()
        if symbol not in target_symbols:
            continue

        quotes = item.get("quote")
        if isinstance(quotes, dict):
            quote = quotes.get("USD") if isinstance(quotes.get("USD"), dict) else None
        elif isinstance(quotes, list):
            quote = next(
                (
                    quote_item
                    for quote_item in quotes
                    if isinstance(quote_item, dict)
                    and str(quote_item.get("symbol") or "").upper() == "USD"
                ),
                None,
            )
        else:
            quote = None
        if not isinstance(quote, dict):
            continue

        market_cap_usd = to_float(quote.get("market_cap"))
        if market_cap_usd is None:
            continue

        circulating_supply = to_float(item.get("circulating_supply"))
        total_supply = to_float(item.get("max_supply")) or to_float(item.get("total_supply"))
        fdv_usd = to_float(quote.get("fully_diluted_market_cap"))
        cmc_id = str(item.get("id") or "")
        name = str(item.get("name") or symbol)
        candidate = {
            "symbol": symbol,
            "name": name,
            "englishName": name,
            "koreanName": name,
            "circulatingSupply": circulating_supply,
            "totalSupply": total_supply,
            "circulatingRatio": compute_circulating_ratio(circulating_supply, total_supply),
            "fdvUsd": fdv_usd,
            "fdvKrw": fdv_usd * FX_USD_KRW if fdv_usd is not None else None,
            "marketCapUsd": market_cap_usd,
            "priceUsd": to_float(quote.get("price")),
            "marketCapRank": item.get("cmc_rank"),
            "supplyDetail": f"coinmarketcap_quotes:{cmc_id}",
            "sourceId": cmc_id,
            "nameKeys": list(build_name_keys(symbol, name, name)),
        }
        candidates.setdefault(symbol, []).append(candidate)

    return candidates


def pick_coingecko_supply_candidate(target_row: dict, candidate_rows: list[dict]) -> dict | None:
    if not candidate_rows:
        return None

    symbols = row_symbols(target_row)
    symbol_keys = {normalize_text(symbol) for symbol in symbols}
    target_keys = set(target_row.get("nameKeys") or [])
    non_symbol_keys = target_keys - symbol_keys

    for candidate in candidate_rows:
        candidate_keys = set(candidate.get("nameKeys") or [])
        if non_symbol_keys and (non_symbol_keys & candidate_keys):
            return candidate

    if len(candidate_rows) == 1:
        symbol = next(iter(symbols), "")
        if symbol not in AMBIGUOUS_SYMBOLS_REQUIRE_NAME_OVERLAP:
            return candidate_rows[0]

    return None


def apply_coingecko_supply_fills(board_name: str, rows: list[dict], candidates_by_symbol: dict[str, list[dict]]) -> None:
    for row in rows:
        if row_has_complete_supply(row):
            continue

        candidate = None
        for symbol in row_symbols(row):
            candidate = pick_coingecko_supply_candidate(row, candidates_by_symbol.get(symbol, []))
            if candidate is not None:
                break
        if candidate is None:
            continue

        current_circulating_supply = to_float(row.get("circulatingSupply"))
        current_total_supply = to_float(row.get("totalSupply"))
        candidate_circulating_supply = to_float(candidate.get("circulatingSupply"))
        candidate_total_supply = to_float(candidate.get("totalSupply"))
        circulating_supply = current_circulating_supply or candidate_circulating_supply
        total_supply = current_total_supply or candidate_total_supply
        if circulating_supply is None and total_supply is None:
            continue

        fdv_usd = to_float(candidate.get("fdvUsd"))

        row["circulatingSupply"] = circulating_supply
        row["totalSupply"] = total_supply
        row["circulatingRatio"] = compute_circulating_ratio(circulating_supply, total_supply)
        row["supplyDetail"] = f"{board_name}_supply_fill:{candidate.get('supplyDetail')}"
        if fdv_usd is not None:
            row["fdvUsd"] = fdv_usd
            row["fdvKrw"] = fdv_usd * FX_USD_KRW


def pick_largest_market_candidate(candidate_rows: list[dict]) -> dict | None:
    ranked_candidates = [
        candidate
        for candidate in candidate_rows
        if to_float(candidate.get("marketCapUsd")) is not None
    ]
    if not ranked_candidates:
        return None
    return max(
        ranked_candidates,
        key=lambda candidate: to_float(candidate.get("marketCapUsd")) or 0.0,
    )


def pick_name_matched_market_candidate(target_row: dict, candidate_rows: list[dict]) -> dict | None:
    symbol_keys = {normalize_text(symbol) for symbol in row_symbols(target_row)}
    target_name_keys = set(target_row.get("nameKeys") or []) - symbol_keys
    if not target_name_keys:
        return None

    matched_candidates = [
        candidate
        for candidate in candidate_rows
        if to_float(candidate.get("marketCapUsd")) is not None
        and target_name_keys.intersection(set(candidate.get("nameKeys") or []))
    ]
    return pick_largest_market_candidate(matched_candidates)


def apply_external_market_cap_fills(
    board_name: str,
    rows: list[dict],
    candidates_by_symbol: dict[str, list[dict]],
    *,
    cap_source: str,
    detail_prefix: str,
    preferred_source_ids: dict[str, str] | None = None,
) -> None:
    for row in rows:
        if to_float(row.get("marketCapUsd")) is not None or to_float(row.get("marketCapKrw")) is not None:
            continue

        candidate_rows = [
            candidate_row
            for symbol in row_symbols(row)
            for candidate_row in candidates_by_symbol.get(symbol, [])
        ]
        preferred_source_id = (preferred_source_ids or {}).get(str(row.get("symbol") or "").upper())
        candidate = next(
            (
                candidate_row
                for candidate_row in candidate_rows
                if preferred_source_id
                and str(candidate_row.get("sourceId") or "") == preferred_source_id
                and to_float(candidate_row.get("marketCapUsd")) is not None
            ),
            None,
        )
        if candidate is None:
            candidate = pick_name_matched_market_candidate(row, candidate_rows)
        if candidate is None:
            candidate = pick_largest_market_candidate(candidate_rows)
        if candidate is None:
            continue
        matched_symbol = str(candidate.get("symbol") or "")

        market_cap_usd = to_float(candidate.get("marketCapUsd"))
        if market_cap_usd is None:
            continue

        circulating_supply = (
            to_float(row.get("circulatingSupply"))
            or to_float(candidate.get("circulatingSupply"))
        )
        total_supply = (
            to_float(row.get("totalSupply"))
            or to_float(candidate.get("totalSupply"))
        )
        fdv_usd = to_float(candidate.get("fdvUsd"))

        row["marketCapUsd"] = market_cap_usd
        row["marketCapKrw"] = market_cap_usd * FX_USD_KRW
        row["circulatingSupply"] = circulating_supply
        row["totalSupply"] = total_supply
        row["circulatingRatio"] = compute_circulating_ratio(circulating_supply, total_supply)
        row["marketCapRank"] = candidate.get("marketCapRank")
        row["fdvUsd"] = fdv_usd
        row["fdvKrw"] = fdv_usd * FX_USD_KRW if fdv_usd is not None else None
        row["capSource"] = cap_source
        row["capSourceDetail"] = (
            f"{detail_prefix}:{matched_symbol}:"
            f"{candidate.get('sourceId') or candidate.get('supplyDetail') or ''}"
        )
        row["supplyDetail"] = f"{board_name}_supply_fill:{candidate.get('supplyDetail') or ''}"
        row["status"] = "ok"


def fetch_erc20_total_supply(address: str) -> float | None:
    calls = [
        {
            "jsonrpc": "2.0",
            "id": "decimals",
            "method": "eth_call",
            "params": [{"to": address, "data": ERC20_DECIMALS_SELECTOR}, "latest"],
        },
        {
            "jsonrpc": "2.0",
            "id": "totalSupply",
            "method": "eth_call",
            "params": [{"to": address, "data": ERC20_TOTAL_SUPPLY_SELECTOR}, "latest"],
        },
    ]
    payload = fetch_json_post(ETHEREUM_RPC_ENDPOINT, calls, retries=2, pause=1.0)
    if not isinstance(payload, list):
        return None

    result_map = {
        str(item.get("id")): item.get("result")
        for item in payload
        if isinstance(item, dict) and item.get("result")
    }
    try:
        decimals = int(str(result_map.get("decimals") or "0"), 16)
        raw_total_supply = int(str(result_map.get("totalSupply") or "0"), 16)
    except ValueError:
        return None
    if decimals < 0 or decimals > 36 or raw_total_supply <= 0:
        return None
    return raw_total_supply / (10**decimals)


def fetch_coinbase_contract_supply_candidates(target_rows: list[dict]) -> dict[str, list[dict]]:
    target_symbols = {
        symbol
        for row in target_rows
        if not row_has_complete_supply(row)
        for symbol in row_symbols(row)
    }
    if not target_symbols:
        return {}

    payload = fetch_json(COINBASE_CURRENCIES_ENDPOINT, retries=2, pause=1.5)
    if not isinstance(payload, list):
        return {}

    refs: list[dict] = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        symbol = str(item.get("id") or "").upper()
        if symbol not in target_symbols:
            continue
        supported_networks = item.get("supported_networks") or []
        if not isinstance(supported_networks, list):
            continue
        eth_network = next(
            (
                network
                for network in supported_networks
                if isinstance(network, dict)
                and str(network.get("id") or "").lower() == "ethereum"
                and str(network.get("contract_address") or "").startswith("0x")
            ),
            None,
        )
        if not eth_network:
            continue
        name = str(item.get("name") or item.get("display_name") or symbol)
        refs.append(
            {
                "symbol": symbol,
                "name": name,
                "englishName": name,
                "koreanName": name,
                "contractAddress": str(eth_network.get("contract_address")),
                "supplyDetail": f"coinbase_erc20_total_supply:{eth_network.get('contract_address')}",
                "nameKeys": list(
                    {
                        key
                        for key in {
                            normalize_text(symbol),
                            normalize_text(name),
                            normalize_text(item.get("display_name") or ""),
                        }
                        if key
                    }
                ),
            }
        )

    refs_by_symbol: dict[str, list[dict]] = {}
    for ref in refs:
        refs_by_symbol.setdefault(str(ref.get("symbol") or ""), []).append(ref)

    selected_refs: dict[str, dict] = {}
    for row in target_rows:
        if row_has_complete_supply(row):
            continue
        for symbol in row_symbols(row):
            ref = pick_coingecko_supply_candidate(row, refs_by_symbol.get(symbol, []))
            if ref is not None:
                selected_refs[str(ref["contractAddress"]).lower()] = ref
                break

    candidates_by_symbol: dict[str, list[dict]] = {}

    def fetch_contract_ref(ref: dict) -> tuple[dict, float | None]:
        try:
            return ref, fetch_erc20_total_supply(str(ref["contractAddress"]))
        except Exception:  # noqa: BLE001
            return ref, None

    with ThreadPoolExecutor(max_workers=CONTRACT_SUPPLY_WORKERS) as executor:
        futures = {
            executor.submit(fetch_contract_ref, ref): ref
            for ref in list(selected_refs.values())[:CONTRACT_SUPPLY_MAX_REQUESTS]
        }
        for future in as_completed(futures):
            ref, total_supply = future.result()
            if total_supply is None:
                continue
            symbol = str(ref.get("symbol") or "").upper()
            candidate = {
                **ref,
                "totalSupply": total_supply,
                "circulatingSupply": None,
                "circulatingRatio": None,
            }
            candidates_by_symbol.setdefault(symbol, []).append(candidate)

    return candidates_by_symbol


def apply_contract_total_supply_fills(
    board_name: str,
    rows: list[dict],
    candidates_by_symbol: dict[str, list[dict]],
) -> None:
    for row in rows:
        if to_float(row.get("totalSupply")) is not None:
            continue

        candidate = None
        for symbol in row_symbols(row):
            candidate = pick_coingecko_supply_candidate(row, candidates_by_symbol.get(symbol, []))
            if candidate is not None:
                break
        if candidate is None:
            continue

        total_supply = to_float(candidate.get("totalSupply"))
        if total_supply is None:
            continue

        circulating_supply = to_float(row.get("circulatingSupply"))
        row["totalSupply"] = total_supply
        row["circulatingRatio"] = compute_circulating_ratio(circulating_supply, total_supply)
        row["supplyDetail"] = f"{board_name}_supply_fill:{candidate.get('supplyDetail')}"


def apply_implied_circulating_supply_fills(board_name: str, rows: list[dict]) -> None:
    for row in rows:
        if to_float(row.get("circulatingSupply")) is not None:
            continue

        circulating_supply = derive_circulating_supply(
            market_cap_usd=to_float(row.get("marketCapUsd")),
            market_cap_krw=to_float(row.get("marketCapKrw")),
            price_usd=to_float(row.get("priceUsd")),
            price_krw=to_float(row.get("priceKrw")),
        )
        if circulating_supply is None:
            continue

        row["circulatingSupply"] = circulating_supply
        row["circulatingRatio"] = compute_circulating_ratio(
            circulating_supply,
            to_float(row.get("totalSupply")),
        )
        row["supplyDetail"] = f"{board_name}_supply_fill:implied_market_cap_price"


def apply_bithumb_supply_fills(
    bithumb_rows: list[dict], upbit_rows: list[dict], binance_rows: list[dict]
) -> None:
    upbit_by_symbol = build_rows_by_symbol(upbit_rows)
    binance_by_symbol = build_rows_by_symbol(binance_rows)

    for bithumb_row in bithumb_rows:
        current_circulating_supply = to_float(bithumb_row.get("circulatingSupply"))
        current_total_supply = to_float(bithumb_row.get("totalSupply"))
        if current_circulating_supply is not None and current_total_supply is not None:
            continue

        symbol = str(bithumb_row.get("symbol") or "").upper()
        if not symbol:
            continue

        # Same-symbol is the most stable primary key between Binance and Bithumb here.
        candidate = None
        if symbol not in AMBIGUOUS_SYMBOLS_REQUIRE_NAME_OVERLAP:
            candidate = pick_first_candidate_with_supply(binance_by_symbol.get(symbol, []))
        source_detail = "binance_symbol_list|same_symbol"

        if candidate is None:
            preferred_upbit_symbol = BITHUMB_SUPPLY_PREFER_UPBIT_SYMBOL_MAP.get(symbol)
            if preferred_upbit_symbol:
                candidate = pick_first_candidate_with_supply(upbit_by_symbol.get(preferred_upbit_symbol, []))
                source_detail = f"upbit_info_tab_cmc_first|preferred:{preferred_upbit_symbol}"
            else:
                source_detail = ""

        if candidate is None:
            candidate = pick_supply_fill_candidate(bithumb_row, upbit_by_symbol.get(symbol, []))
            source_detail = "upbit_info_tab_cmc_first"
        if candidate is None:
            candidate = pick_supply_fill_candidate(bithumb_row, binance_by_symbol.get(symbol, []))
            source_detail = "binance_symbol_list|name_key_overlap"

        if candidate is None:
            continue

        candidate_circulating_supply = to_float(candidate.get("circulatingSupply"))
        candidate_total_supply = to_float(candidate.get("totalSupply"))
        circulating_supply = current_circulating_supply or candidate_circulating_supply
        total_supply = current_total_supply or candidate_total_supply
        if circulating_supply is None and total_supply is None:
            continue

        price_usd = to_float(bithumb_row.get("priceUsd")) or to_float(candidate.get("priceUsd"))
        market_cap_usd = to_float(bithumb_row.get("marketCapUsd")) or to_float(candidate.get("marketCapUsd"))
        fdv_usd = compute_fdv_usd(
            fdv_usd=to_float(candidate.get("fdvUsd")),
            price_usd=price_usd,
            total_supply=total_supply,
            market_cap_usd=market_cap_usd,
            circulating_supply=circulating_supply,
        )

        bithumb_row["circulatingSupply"] = circulating_supply
        bithumb_row["totalSupply"] = total_supply
        bithumb_row["circulatingRatio"] = compute_circulating_ratio(circulating_supply, total_supply)
        bithumb_row["fdvUsd"] = fdv_usd
        bithumb_row["fdvKrw"] = fdv_usd * FX_USD_KRW if fdv_usd is not None else None
        previous_detail = str(bithumb_row.get("supplyDetail") or "").strip()
        detail_prefix = f"{previous_detail}|" if previous_detail else ""
        bithumb_row["supplyDetail"] = f"{detail_prefix}bithumb_supply_fill:{source_detail}"


def apply_upbit_live_fills(
    upbit_rows: list[dict], binance_rows: list[dict], bithumb_rows: list[dict]
) -> None:
    binance_by_symbol = build_rows_by_symbol(binance_rows)
    bithumb_by_symbol = build_rows_by_symbol(bithumb_rows)

    for upbit_row in upbit_rows:
        source_label = str(upbit_row.get("capSource") or "")
        base_date_text = str(upbit_row.get("capSourceDetail") or "")
        if source_label not in {"upbit_cmc", "upbit_coingecko", "upbit_project"}:
            continue
        if not is_upbit_base_date_stale(base_date_text):
            continue

        symbol = str(upbit_row.get("symbol") or "").upper()
        if not symbol:
            continue

        preferred_bithumb_symbol = UPBIT_PREFER_BITHUMB_FILL_SYMBOL_MAP.get(symbol)
        if preferred_bithumb_symbol:
            preferred_candidate = pick_first_candidate_with_cap(
                bithumb_by_symbol.get(preferred_bithumb_symbol, [])
            )
            if preferred_candidate is not None:
                market_cap_usd = to_float(preferred_candidate.get("marketCapUsd"))
                if market_cap_usd is not None:
                    upbit_row["marketCapUsd"] = market_cap_usd
                    upbit_row["marketCapKrw"] = market_cap_usd * FX_USD_KRW
                    upbit_row["capSource"] = "upbit_fill_from_bithumb_live"
                    upbit_row["capSourceDetail"] = (
                        f"stale_upbit_base_date:{base_date_text}|"
                        f"bithumb_main_today_price|preferred:{preferred_bithumb_symbol}"
                    )
                    apply_supply_from_reference(
                        upbit_row,
                        preferred_candidate,
                        source_detail=f"bithumb_basic_info|preferred:{preferred_bithumb_symbol}",
                        stale_source_detail=str(upbit_row.get("supplyDetail") or base_date_text),
                    )
                    upbit_row["status"] = "ok"
                    continue

        # For KRW upbit stale caps, prefer KRW bithumb live reference first.
        candidate = pick_live_fill_candidate(upbit_row, bithumb_by_symbol.get(symbol, []))
        candidate_source = "upbit_fill_from_bithumb_live"
        source_detail = "bithumb_main_today_price"

        if candidate is None:
            candidate = pick_live_fill_candidate(upbit_row, binance_by_symbol.get(symbol, []))
            candidate_source = "upbit_fill_from_binance_live"
            source_detail = "binance_symbol_list"

        if candidate is None:
            continue

        market_cap_usd = to_float(candidate.get("marketCapUsd"))
        if market_cap_usd is None:
            continue

        upbit_row["marketCapUsd"] = market_cap_usd
        upbit_row["marketCapKrw"] = market_cap_usd * FX_USD_KRW
        upbit_row["capSource"] = candidate_source
        upbit_row["capSourceDetail"] = f"stale_upbit_base_date:{base_date_text}|{source_detail}"
        apply_supply_from_reference(
            upbit_row,
            candidate,
            source_detail=(
                "bithumb_basic_info"
                if candidate_source == "upbit_fill_from_bithumb_live"
                else source_detail
            ),
            stale_source_detail=str(upbit_row.get("supplyDetail") or base_date_text),
        )
        upbit_row["status"] = "ok"


def finalize_rows(rows: list[dict]) -> list[dict]:
    for row in rows:
        market_cap_usd = to_float(row.get("marketCapUsd"))
        market_cap_krw = to_float(row.get("marketCapKrw"))
        price_usd = to_float(row.get("priceUsd"))
        price_krw = to_float(row.get("priceKrw"))
        circulating_supply = to_float(row.get("circulatingSupply"))
        total_supply = to_float(row.get("totalSupply"))
        fdv_usd = to_float(row.get("fdvUsd"))

        if price_usd is None and price_krw is not None:
            price_usd = safe_div(price_krw, FX_USD_KRW)
        if price_krw is None and price_usd is not None:
            price_krw = price_usd * FX_USD_KRW

        fdv_usd = compute_fdv_usd(
            fdv_usd=fdv_usd,
            price_usd=price_usd,
            total_supply=total_supply,
            market_cap_usd=market_cap_usd,
            circulating_supply=circulating_supply,
        )
        fdv_krw = fdv_usd * FX_USD_KRW if fdv_usd is not None else None
        circulating_ratio = compute_circulating_ratio(circulating_supply, total_supply)

        row["marketCapUsd"] = market_cap_usd
        row["marketCapKrw"] = market_cap_krw
        row["priceUsd"] = price_usd
        row["priceKrw"] = price_krw
        row["circulatingSupply"] = circulating_supply
        row["totalSupply"] = total_supply
        row["fdvUsd"] = fdv_usd
        row["fdvKrw"] = fdv_krw
        row["circulatingRatio"] = circulating_ratio
        row["sortCapUsd"] = (
            market_cap_usd
            if market_cap_usd is not None
            else (market_cap_krw / FX_USD_KRW if market_cap_krw is not None else None)
        )

    rows.sort(
        key=lambda row: (
            row["sortCapUsd"] is None,
            -(row["sortCapUsd"] or 0),
            row["symbol"],
        )
    )
    return rows


def ensure_listing_coverage(board_name: str, expected_pairs: set[str], rows: list[dict]) -> None:
    actual_pairs = {str(row.get("pair") or "").strip() for row in rows}
    missing_pairs = sorted(pair for pair in expected_pairs if pair and pair not in actual_pairs)
    if missing_pairs:
        preview = ", ".join(missing_pairs[:10])
        raise RuntimeError(f"{board_name}_listing_rows_missing:{preview}")


def serialize_change_row(row: dict) -> dict:
    return {
        "symbol": row.get("symbol"),
        "pair": row.get("pair"),
        "name": row.get("name"),
        "sortCapUsd": row.get("sortCapUsd"),
    }


def build_change_block(current_rows: list[dict], previous_rows: list[dict]) -> dict:
    current_map = {str(row.get("symbol") or "").upper(): row for row in current_rows}
    previous_map = {str(row.get("symbol") or "").upper(): row for row in previous_rows}

    added_symbols = sorted(set(current_map) - set(previous_map))
    removed_symbols = sorted(set(previous_map) - set(current_map))

    added = [serialize_change_row(current_map[symbol]) for symbol in added_symbols]
    removed = [serialize_change_row(previous_map[symbol]) for symbol in removed_symbols]

    added.sort(key=lambda row: ((row.get("sortCapUsd") is None), -(row.get("sortCapUsd") or 0), row.get("symbol") or ""))
    removed.sort(key=lambda row: ((row.get("sortCapUsd") is None), -(row.get("sortCapUsd") or 0), row.get("symbol") or ""))

    return {
        "addedCount": len(added),
        "removedCount": len(removed),
        "added": added,
        "removed": removed,
    }


def build_changes(boards: dict[str, list[dict]], previous_payload: dict | None) -> dict[str, dict]:
    previous_boards = (previous_payload or {}).get("boards") or {}
    return {
        board_name: build_change_block(rows, previous_boards.get(board_name) or [])
        for board_name, rows in boards.items()
    }


def get_row_compare_symbol(row: dict) -> str:
    return str(row.get("compareSymbol") or row.get("symbol") or "").upper().strip()


def first_text(*values: object) -> str:
    for value in values:
        text = keep_info_text(value)
        if text:
            return text
    return ""


def exchange_listing_url(board_name: str, row: dict) -> str:
    symbol = str(row.get("symbol") or "").upper().strip()
    if not symbol:
        return ""
    if board_name == "binance":
        return f"https://www.binance.com/en/trade/{urllib.parse.quote(symbol)}_USDT"
    if board_name == "upbit":
        return f"https://upbit.com/exchange?code=CRIX.UPBIT.KRW-{urllib.parse.quote(symbol)}"
    if board_name == "bithumb":
        return f"https://www.bithumb.com/trade/order/{urllib.parse.quote(symbol)}_KRW"
    if board_name == "coinbase":
        return f"https://exchange.coinbase.com/trade/{urllib.parse.quote(symbol)}-USD"
    return ""


def clone_json_value(value: object) -> object:
    try:
        return json.loads(json.dumps(value, ensure_ascii=False))
    except (TypeError, ValueError):
        return value


def has_coin_info_value(value: object) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(keep_info_text(value))
    if isinstance(value, list):
        return bool(value)
    if isinstance(value, dict):
        return bool(value)
    return True


def merge_coin_info_links(current_links: object, previous_links: object) -> list[dict]:
    merged: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for source_links in (current_links, previous_links):
        if not isinstance(source_links, list):
            continue
        for link in source_links:
            if not isinstance(link, dict):
                continue
            label = keep_info_text(link.get("label")) or "링크"
            url = keep_info_text(link.get("url"))
            if not url.startswith(("http://", "https://")):
                continue
            key = (label, url)
            if key in seen:
                continue
            seen.add(key)
            merged.append({"label": label, "url": url})
    return merged


def coin_info_link_keys(links: object) -> set[tuple[str, str]]:
    keys: set[tuple[str, str]] = set()
    if not isinstance(links, list):
        return keys
    for link in links:
        if not isinstance(link, dict):
            continue
        label = keep_info_text(link.get("label")) or "링크"
        url = keep_info_text(link.get("url"))
        if url.startswith(("http://", "https://")):
            keys.add((label, url))
    return keys


def merge_coin_source_info(current_info: object, previous_info: object, previous_generated_at: object = None) -> dict:
    current = clone_json_value(current_info) if isinstance(current_info, dict) else {}
    previous = previous_info if isinstance(previous_info, dict) else {}
    if not isinstance(current, dict):
        current = {}
    preserved_fields: set[str] = set()
    for key, previous_value in previous.items():
        if str(key).startswith("_"):
            continue
        if key == "links":
            current_link_keys = coin_info_link_keys(current.get("links"))
            previous_link_keys = coin_info_link_keys(previous_value)
            links = merge_coin_info_links(current.get("links"), previous_value)
            if links:
                current["links"] = links
            if previous_link_keys - current_link_keys:
                preserved_fields.add("links")
            continue
        if not has_coin_info_value(current.get(key)) and has_coin_info_value(previous_value):
            current[key] = clone_json_value(previous_value)
            preserved_fields.add(str(key))
    if preserved_fields:
        snapshot = {
            "preserved": True,
            "fields": sorted(preserved_fields),
        }
        if has_coin_info_value(previous_generated_at):
            snapshot["fromGeneratedAt"] = clone_json_value(previous_generated_at)
        current["_snapshot"] = snapshot
    return current


def merge_previous_coin_info_snapshot(coin_info: dict[str, dict], previous_payload: dict | None) -> dict[str, dict]:
    previous_coin_info = (previous_payload or {}).get("coinInfo")
    if not isinstance(previous_coin_info, dict):
        return coin_info
    previous_generated_at = (previous_payload or {}).get("generatedAt")

    for symbol, entry in coin_info.items():
        previous_entry = previous_coin_info.get(symbol)
        if not isinstance(previous_entry, dict):
            continue

        if not entry.get("koreanName") and has_coin_info_value(previous_entry.get("koreanName")):
            entry["koreanName"] = clone_json_value(previous_entry.get("koreanName"))
        if not entry.get("englishName") and has_coin_info_value(previous_entry.get("englishName")):
            entry["englishName"] = clone_json_value(previous_entry.get("englishName"))

        previous_sources = previous_entry.get("sources")
        if not isinstance(previous_sources, dict):
            continue
        sources = entry.setdefault("sources", {})
        if not isinstance(sources, dict):
            sources = {}
            entry["sources"] = sources
        for source_name, previous_source_info in previous_sources.items():
            source_key = str(source_name or "").strip()
            if not source_key:
                continue
            merged_source = merge_coin_source_info(sources.get(source_key), previous_source_info, previous_generated_at)
            if merged_source:
                sources[source_key] = merged_source

    return coin_info


def build_coin_info(boards: dict[str, list[dict]], previous_payload: dict | None = None) -> dict[str, dict]:
    coin_info: dict[str, dict] = {}
    for board_name, rows in boards.items():
        for row in rows:
            symbol = get_row_compare_symbol(row)
            if not symbol:
                continue
            entry = coin_info.setdefault(
                symbol,
                {
                    "symbol": symbol,
                    "koreanName": "",
                    "englishName": "",
                    "sources": {},
                    "listings": {},
                },
            )
            korean_name = first_text(row.get("koreanName"), row.get("name"))
            if korean_name and (has_hangul(korean_name) or not entry.get("koreanName")):
                entry["koreanName"] = korean_name
            english_name = first_text(row.get("englishName"), row.get("name"))
            if english_name and not entry.get("englishName"):
                entry["englishName"] = english_name

            url = exchange_listing_url(board_name, row)
            entry["listings"][board_name] = {
                "label": {
                    "binance": "바이낸스",
                    "upbit": "업비트",
                    "bithumb": "빗썸",
                    "coinbase": "코인베이스",
                }.get(board_name, board_name),
                "pair": row.get("pair") or "",
                "url": url,
            }

            source_info = row.get("info")
            if isinstance(source_info, dict) and source_info:
                entry["sources"][board_name] = source_info

    merge_previous_coin_info_snapshot(coin_info, previous_payload)

    for symbol, entry in list(coin_info.items()):
        if not entry.get("koreanName"):
            entry["koreanName"] = symbol
        if not entry.get("englishName"):
            entry["englishName"] = symbol
        if not entry.get("sources") and not entry.get("listings"):
            del coin_info[symbol]
    return dict(sorted(coin_info.items()))


def build_listed_coin_index(boards: dict[str, list[dict]]) -> dict[str, dict]:
    listed: dict[str, dict] = {}
    for board_name in ("upbit", "bithumb", "binance", "coinbase"):
        for row in boards.get(board_name, []):
            symbol = str(
                row.get("compareSymbol")
                or row.get("symbolAliasOf")
                or row.get("symbol")
                or ""
            ).strip().upper()
            if not symbol:
                continue
            entry = listed.setdefault(
                symbol,
                {
                    "symbol": symbol,
                    "name": "",
                    "englishName": "",
                    "exchanges": [],
                    "marketCapUsd": 0.0,
                    "marketCapKrw": 0.0,
                    "marketCapRank": None,
                },
            )
            if board_name not in entry["exchanges"]:
                entry["exchanges"].append(board_name)
            if not entry["name"]:
                entry["name"] = first_text(
                    row.get("koreanName"),
                    row.get("name"),
                    row.get("englishName"),
                    symbol,
                )
            if not entry["englishName"]:
                entry["englishName"] = first_text(
                    row.get("englishName"),
                    row.get("name"),
                    symbol,
                )
            candidate_market_cap_usd = to_float(
                row.get("marketCapUsd") or row.get("sortCapUsd")
            )
            candidate_market_cap_krw = to_float(row.get("marketCapKrw"))
            candidate_market_cap_rank = to_float(row.get("marketCapRank"))
            if candidate_market_cap_rank is not None and candidate_market_cap_rank <= 0:
                candidate_market_cap_rank = None
            current_market_cap_usd = to_float(entry.get("marketCapUsd")) or 0.0
            should_replace_market_cap = (
                candidate_market_cap_usd is not None
                and candidate_market_cap_usd > 0
                and (
                    current_market_cap_usd <= 0
                    or (
                        entry.get("marketCapRank") is None
                        and candidate_market_cap_rank is not None
                    )
                )
            )
            if should_replace_market_cap:
                entry["marketCapUsd"] = candidate_market_cap_usd
                entry["marketCapKrw"] = candidate_market_cap_krw or 0.0
                entry["marketCapRank"] = (
                    int(candidate_market_cap_rank)
                    if candidate_market_cap_rank is not None
                    else None
                )
    return listed


def defillama_protocol_symbols(protocol: dict, listed_symbols: set[str]) -> list[str]:
    raw_symbol = str(protocol.get("symbol") or "").strip().upper()
    if not raw_symbol or raw_symbol == "-":
        return []
    symbols: list[str] = []
    for candidate in re.split(r"[,/|;\s]+", raw_symbol):
        symbol = candidate.strip()
        if symbol in listed_symbols and symbol not in symbols:
            symbols.append(symbol)
    return symbols


def make_defillama_ranking_row(
    symbol: str,
    listed_coin: dict,
    protocol: dict,
    metric_source: dict,
    metric_key: str,
) -> dict:
    slug = str(metric_source.get("slug") or protocol.get("slug") or "").strip()
    chains = metric_source.get("chains") or protocol.get("chains") or []
    if not isinstance(chains, list):
        chains = []
    row = {
        "symbol": symbol,
        "name": listed_coin.get("name") or symbol,
        "englishName": listed_coin.get("englishName") or symbol,
        "protocol": first_text(
            metric_source.get("displayName"),
            metric_source.get("name"),
            protocol.get("name"),
            symbol,
        ),
        "category": first_text(
            metric_source.get("category"),
            protocol.get("category"),
        ),
        "valueUsd": to_float(metric_source.get(metric_key)) or 0.0,
        "total24hUsd": to_float(metric_source.get("total24h")),
        "total7dUsd": to_float(metric_source.get("total7d")),
        "total30dUsd": to_float(metric_source.get("total30d")),
        "change1d": to_float(metric_source.get("change_1d")),
        "chains": [str(chain) for chain in chains[:6] if str(chain).strip()],
        "exchanges": list(listed_coin.get("exchanges") or []),
        "marketCapUsd": to_float(listed_coin.get("marketCapUsd")) or 0.0,
        "marketCapKrw": to_float(listed_coin.get("marketCapKrw")) or 0.0,
        "marketCapRank": listed_coin.get("marketCapRank"),
        "slug": slug,
    }
    if slug:
        row["url"] = (
            "https://defillama.com/protocol/"
            f"{urllib.parse.quote(slug, safe='+-')}"
        )
    return row


def build_defillama_category(
    *,
    listed: dict[str, dict],
    protocols: list[dict],
    metric_key: str,
    metric_rows: list[dict] | None = None,
    category: str | None = None,
    excluded_categories: set[str] | None = None,
) -> list[dict]:
    listed_symbols = set(listed)
    protocols_by_id = {
        str(protocol.get("id")): protocol
        for protocol in protocols
        if isinstance(protocol, dict) and protocol.get("id") is not None
    }
    source_rows = metric_rows if metric_rows is not None else protocols
    best_by_symbol: dict[str, dict] = {}
    for metric_source in source_rows:
        if not isinstance(metric_source, dict):
            continue
        protocol = (
            protocols_by_id.get(str(metric_source.get("defillamaId")))
            if metric_rows is not None
            else metric_source
        ) or {}
        protocol_category = str(
            protocol.get("category") or metric_source.get("category") or ""
        ).strip()
        if category and protocol_category.casefold() != category.casefold():
            continue
        if (
            excluded_categories
            and protocol_category.casefold() in excluded_categories
        ):
            continue
        value_usd = to_float(metric_source.get(metric_key))
        if value_usd is None or value_usd <= 0:
            continue
        for symbol in defillama_protocol_symbols(protocol, listed_symbols):
            current = best_by_symbol.get(symbol)
            if current and (to_float(current.get("valueUsd")) or 0) >= value_usd:
                continue
            best_by_symbol[symbol] = make_defillama_ranking_row(
                symbol,
                listed[symbol],
                protocol,
                metric_source,
                metric_key,
            )
    rows = sorted(
        best_by_symbol.values(),
        key=lambda item: to_float(item.get("valueUsd")) or 0,
        reverse=True,
    )
    for rank, row in enumerate(rows, start=1):
        row["rank"] = rank
    return rows


def build_defillama_rankings(
    boards: dict[str, list[dict]],
    previous_payload: dict | None,
    refresh_issues: dict[str, str],
) -> dict:
    previous = (previous_payload or {}).get("defillamaRankings")
    previous = previous if isinstance(previous, dict) else {}
    try:
        protocols_payload = fetch_json(DEFILLAMA_PROTOCOLS_ENDPOINT)
        protocols = protocols_payload if isinstance(protocols_payload, list) else []
        if not protocols:
            raise RuntimeError("empty_protocols")
    except Exception as error:  # noqa: BLE001
        refresh_issues["defillama"] = f"fallback_previous_payload:{error}"
        return clone_json_value(previous) if previous else {
            "generatedAt": 0,
            "source": "DefiLlama",
            "status": "unavailable",
            "categories": {},
        }

    listed = build_listed_coin_index(boards)
    categories = {
        "tvl": build_defillama_category(
            listed=listed,
            protocols=protocols,
            metric_key="tvl",
            excluded_categories={"cex", "chain"},
        ),
        "rwa": build_defillama_category(
            listed=listed,
            protocols=protocols,
            metric_key="tvl",
            category="RWA",
        ),
    }
    for category_key, endpoint in (
        ("dexVolume", DEFILLAMA_DEX_VOLUME_ENDPOINT),
        ("fees", DEFILLAMA_FEES_ENDPOINT),
        ("perpOpenInterest", DEFILLAMA_OPEN_INTEREST_ENDPOINT),
    ):
        try:
            payload = fetch_json(endpoint)
            metric_rows = payload.get("protocols") if isinstance(payload, dict) else []
            if not isinstance(metric_rows, list) or not metric_rows:
                raise RuntimeError("empty_metrics")
            categories[category_key] = build_defillama_category(
                listed=listed,
                protocols=protocols,
                metric_rows=metric_rows,
                metric_key="total24h",
            )
        except Exception as error:  # noqa: BLE001
            previous_rows = (previous.get("categories") or {}).get(category_key)
            categories[category_key] = (
                clone_json_value(previous_rows)
                if isinstance(previous_rows, list)
                else []
            )
            refresh_issues[f"defillama_{category_key}"] = (
                f"fallback_previous_payload:{error}"
            )

    return {
        "generatedAt": int(time.time()),
        "source": "DefiLlama",
        "sourceUrl": "https://defillama.com/",
        "status": "ok",
        "listedCoinCount": len(listed),
        "methodology": (
            "Upbit, Bithumb, Binance, Coinbase listed symbols matched exactly "
            "to DefiLlama protocol token symbols; the largest protocol metric "
            "is used once per coin."
        ),
        "perpVolumeNote": (
            "DefiLlama moved derivatives volume to its paid API, so the free "
            "open-interest ranking is shown separately instead of substituting "
            "an unofficial volume value."
        ),
        "categories": categories,
    }


def make_payload(previous_payload: dict | None = None) -> dict:
    refresh_fx_usd_krw(previous_payload)
    refresh_issues: dict[str, str] = {}

    try:
        binance_rows, _binance_lookup = fetch_binance()
    except Exception as error:  # noqa: BLE001
        cached_rows = clone_previous_board_rows(previous_payload, "binance")
        if not cached_rows:
            raise
        binance_rows = normalize_previous_board_rows(
            cached_rows,
            board_name="binance",
            error_text=str(error),
        )
        _binance_lookup = build_rows_by_symbol(binance_rows)
        refresh_issues["binance"] = f"fallback_previous_payload:{error}"
    guard_rows, guard_reason = apply_suspicious_drop_guard("binance", binance_rows, previous_payload)
    if guard_reason:
        binance_rows = guard_rows
        _binance_lookup = build_rows_by_symbol(binance_rows)
        refresh_issues["binance"] = f"fallback_previous_payload:{guard_reason}"

    try:
        upbit_rows, _upbit_lookup = fetch_upbit()
    except Exception as error:  # noqa: BLE001
        cached_rows = clone_previous_board_rows(previous_payload, "upbit")
        if not cached_rows:
            raise
        upbit_rows = normalize_previous_board_rows(
            cached_rows,
            board_name="upbit",
            error_text=str(error),
        )
        _upbit_lookup = build_rows_by_symbol(upbit_rows)
        refresh_issues["upbit"] = f"fallback_previous_payload:{error}"
    guard_rows, guard_reason = apply_suspicious_drop_guard("upbit", upbit_rows, previous_payload)
    if guard_reason:
        upbit_rows = guard_rows
        _upbit_lookup = build_rows_by_symbol(upbit_rows)
        refresh_issues["upbit"] = f"fallback_previous_payload:{guard_reason}"

    try:
        bithumb_rows = fetch_bithumb()
    except Exception as error:  # noqa: BLE001
        cached_rows = clone_previous_board_rows(previous_payload, "bithumb")
        if not cached_rows:
            raise
        bithumb_rows = normalize_previous_board_rows(
            cached_rows,
            board_name="bithumb",
            error_text=str(error),
        )
        refresh_issues["bithumb"] = f"fallback_previous_payload:{error}"
    guard_rows, guard_reason = apply_suspicious_drop_guard("bithumb", bithumb_rows, previous_payload)
    if guard_reason:
        bithumb_rows = guard_rows
        refresh_issues["bithumb"] = f"fallback_previous_payload:{guard_reason}"

    try:
        coinbase_rows = fetch_coinbase()
    except Exception as error:  # noqa: BLE001
        cached_rows = clone_previous_board_rows(previous_payload, "coinbase")
        if not cached_rows:
            raise
        coinbase_rows = normalize_previous_board_rows(
            cached_rows,
            board_name="coinbase",
            error_text=str(error),
        )
        refresh_issues["coinbase"] = f"fallback_previous_payload:{error}"
    guard_rows, guard_reason = apply_suspicious_drop_guard("coinbase", coinbase_rows, previous_payload)
    if guard_reason:
        coinbase_rows = guard_rows
        refresh_issues["coinbase"] = f"fallback_previous_payload:{guard_reason}"

    news_payload = make_protected_news_payload()
    apply_upbit_live_fills(upbit_rows, binance_rows, bithumb_rows)
    apply_upbit_targeted_fills(upbit_rows, bithumb_rows)
    apply_bithumb_supply_fills(bithumb_rows, upbit_rows, binance_rows)

    all_supply_rows = binance_rows + upbit_rows + bithumb_rows + coinbase_rows
    supply_target_symbols = set()
    for rows in (binance_rows, upbit_rows, bithumb_rows, coinbase_rows):
        for row in rows:
            if not row_has_complete_supply(row):
                supply_target_symbols.update(row_symbols(row))
    for row in coinbase_rows:
        if to_float(row.get("marketCapUsd")) is None and to_float(row.get("marketCapKrw")) is None:
            supply_target_symbols.update(row_symbols(row))

    coingecko_supply_candidates = {}
    try:
        coingecko_supply_candidates = fetch_coingecko_supply_candidates(supply_target_symbols)
    except Exception as error:  # noqa: BLE001
        coingecko_supply_candidates = {}
        refresh_issues["coingecko"] = f"fetch_failed:{error}"

    coinbase_contract_supply_candidates = {}
    try:
        coinbase_contract_supply_candidates = fetch_coinbase_contract_supply_candidates(all_supply_rows)
    except Exception as error:  # noqa: BLE001
        refresh_issues["coinbase_contract_supply"] = f"fetch_failed:{error}"

    for board_name, rows in (
        ("binance", binance_rows),
        ("upbit", upbit_rows),
        ("bithumb", bithumb_rows),
    ):
        apply_coingecko_supply_fills(board_name, rows, coingecko_supply_candidates)
        apply_contract_total_supply_fills(board_name, rows, coinbase_contract_supply_candidates)
        apply_implied_circulating_supply_fills(board_name, rows)

    apply_external_market_cap_fills(
        "bithumb",
        bithumb_rows,
        coingecko_supply_candidates,
        cap_source="bithumb_coingecko_market_cap",
        detail_prefix="coingecko_market_cap",
    )
    bithumb_missing_cap_symbols = {
        symbol
        for row in bithumb_rows
        if to_float(row.get("marketCapUsd")) is None
        and to_float(row.get("marketCapKrw")) is None
        for symbol in row_symbols(row)
    }
    if bithumb_missing_cap_symbols:
        try:
            coinmarketcap_candidates = fetch_coinmarketcap_market_candidates(
                bithumb_missing_cap_symbols
            )
            apply_external_market_cap_fills(
                "bithumb",
                bithumb_rows,
                coinmarketcap_candidates,
                cap_source="bithumb_coinmarketcap_highest_market_cap",
                detail_prefix="coinmarketcap_highest_market_cap",
            )
        except Exception as error:  # noqa: BLE001
            refresh_issues["bithumb_coinmarketcap"] = f"fetch_failed:{error}"

    apply_coinbase_reference_fills(coinbase_rows, binance_rows, upbit_rows, bithumb_rows)
    apply_coingecko_supply_fills("coinbase", coinbase_rows, coingecko_supply_candidates)
    apply_external_market_cap_fills(
        "coinbase",
        coinbase_rows,
        coingecko_supply_candidates,
        cap_source="coinbase_coingecko_market_cap",
        detail_prefix="coingecko_market_cap",
        preferred_source_ids=COINBASE_COINGECKO_ID_MAP,
    )
    coinbase_missing_cap_symbols = {
        symbol
        for row in coinbase_rows
        if to_float(row.get("marketCapUsd")) is None
        and to_float(row.get("marketCapKrw")) is None
        for symbol in row_symbols(row)
    }
    if coinbase_missing_cap_symbols:
        try:
            coinmarketcap_candidates = fetch_coinmarketcap_market_candidates(
                coinbase_missing_cap_symbols
            )
            apply_external_market_cap_fills(
                "coinbase",
                coinbase_rows,
                coinmarketcap_candidates,
                cap_source="coinbase_coinmarketcap_highest_market_cap",
                detail_prefix="coinmarketcap_highest_market_cap",
            )
        except Exception as error:  # noqa: BLE001
            refresh_issues["coinbase_coinmarketcap"] = f"fetch_failed:{error}"
    apply_contract_total_supply_fills("coinbase", coinbase_rows, coinbase_contract_supply_candidates)
    apply_implied_circulating_supply_fills("coinbase", coinbase_rows)
    apply_binance_korean_name_fills(binance_rows, upbit_rows, bithumb_rows)

    expected_pairs = {
        "binance": {str(row.get("pair") or "").strip() for row in binance_rows},
        "upbit": {str(row.get("pair") or "").strip() for row in upbit_rows},
        "bithumb": {str(row.get("pair") or "").strip() for row in bithumb_rows},
        "coinbase": {str(row.get("pair") or "").strip() for row in coinbase_rows},
    }
    boards = {
        "binance": finalize_rows(binance_rows),
        "upbit": finalize_rows(upbit_rows),
        "bithumb": finalize_rows(bithumb_rows),
        "coinbase": finalize_rows(coinbase_rows),
    }
    for board_name, rows in boards.items():
        ensure_listing_coverage(board_name, expected_pairs[board_name], rows)
    coin_info = build_coin_info(boards, previous_payload)
    defillama_rankings = build_defillama_rankings(
        boards,
        previous_payload,
        refresh_issues,
    )
    for rows in boards.values():
        for row in rows:
            row.pop("info", None)

    stats = {}
    for board_name, rows in boards.items():
        with_cap = sum(1 for row in rows if row.get("sortCapUsd") is not None)
        stats[board_name] = {"total": len(rows), "withCap": with_cap}

    generated_at = int(time.time())
    return {
        "generatedAt": generated_at,
        "previousGeneratedAt": (previous_payload or {}).get("generatedAt"),
        "autoRefreshMinutes": AUTO_REFRESH_MINUTES,
        "fxUsdKrw": FX_USD_KRW,
        "fxSource": FX_SOURCE,
        "boards": boards,
        "coinInfo": coin_info,
        "defillamaRankings": defillama_rankings,
        "news": news_payload,
        "stats": stats,
        "changes": build_changes(boards, previous_payload),
        "notes": {
            "binance": "binance_exact_market_cap",
            "upbit": "upbit_info_tab_cmc_first",
            "bithumb": "bithumb_main_coinmarketcap_feed",
            "coinbase": "coinbase_exchange_usd_pairs",
        },
        "refreshIssues": refresh_issues,
    }


def main() -> None:
    previous_payload = load_previous_payload()
    payload = make_payload(previous_payload)
    DATA_JS_PATH.write_text("window.BOARD_DATA = " + json.dumps(payload, ensure_ascii=False) + ";\n", encoding="utf-8")
    SNAPSHOT_JSON_PATH.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"Saved {DATA_JS_PATH}")
    print(
        "Rows:",
        len(payload["boards"]["binance"]),
        len(payload["boards"]["upbit"]),
        len(payload["boards"]["bithumb"]),
        len(payload["boards"]["coinbase"]),
    )
    print(
        "With cap:",
        payload["stats"]["binance"]["withCap"],
        payload["stats"]["upbit"]["withCap"],
        payload["stats"]["bithumb"]["withCap"],
        payload["stats"]["coinbase"]["withCap"],
    )


if __name__ == "__main__":
    main()
