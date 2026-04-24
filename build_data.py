from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
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
UPBIT_PREFER_BITHUMB_FILL_SYMBOL_MAP = {
    "1INCH": "1INCH",
    "MIRA": "MIRA",
    "MET2": "MET",
    "ORDER": "ORDER",
    "ORDI": "ORDI",
}
BITHUMB_SUPPLY_PREFER_UPBIT_SYMBOL_MAP = {
    "ORDER": "ORDER",
}


def normalize_text(value: str | None) -> str:
    text = str(value or "").strip().lower()
    return "".join(char for char in text if char.isalnum())


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
    payload = fetch_json("https://api.bithumb.com/public/ticker/USDT_KRW")
    if not isinstance(payload, dict):
        return None
    data = payload.get("data") or {}
    return to_float(data.get("closing_price"))


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

    title = str(entry.get("title") or "").strip()
    content = str(entry.get("content") or "").strip()
    source_text = f"{title} {content}".strip()
    exchange = detect_exchange(source_text)
    symbol, pair = extract_symbol_and_pair(entry, source_text)
    event_type = detect_event_type(source_text)
    headline, summary = make_news_summary(
        publish_at=publish_at,
        exchange=exchange,
        event_type=event_type,
        symbol=symbol,
        pair=pair,
        title=title,
        content=content,
        source_text=source_text,
    )

    return {
        "id": news_id,
        "publishAt": publish_at,
        "publishAtTs": publish_at_ts,
        "headline": headline,
        "summary": summary,
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
                normalized.append(
                    {
                        "id": int(raw.get("id") or 0),
                        "publishAt": str(raw.get("publishAt") or ""),
                        "publishAtTs": published_ts,
                        "headline": str(raw.get("headline") or ""),
                        "summary": str(raw.get("summary") or ""),
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


def fetch_binance() -> tuple[list[dict], dict[str, list[dict]]]:
    payload = fetch_json("https://www.binance.com/bapi/apex/v1/public/apex/marketing/symbol/list")
    rows: list[dict] = []
    lookup: dict[str, list[dict]] = {}
    for item in payload.get("data", []):  # type: ignore[union-attr]
        if item.get("quoteAsset") != "USDT":
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
            "nameKeys": list(
                build_name_keys(
                    item.get("fullName") or symbol,
                    item.get("fullName") or symbol,
                    item.get("localFullName") or "",
                )
            ),
        }
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
        base_rows.append(
            {
                "symbol": symbol,
                "pair": f"{symbol}/KRW",
                "name": item.get("korean_name") or symbol,
                "englishName": item.get("english_name") or symbol,
                "koreanName": item.get("korean_name") or symbol,
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
        price_krw = upbit_prices.get(row["symbol"])
        price_usd = safe_div(price_krw, FX_USD_KRW)
        circulating_supply = to_float(detail.get("circulatingSupply"))
        total_supply = to_float(detail.get("totalSupply"))
        fdv_usd = compute_fdv_usd(
            fdv_usd=None,
            price_usd=price_usd,
            total_supply=total_supply,
            market_cap_usd=to_float(detail.get("marketCapUsd")),
            circulating_supply=circulating_supply,
        )
        fdv_krw = fdv_usd * FX_USD_KRW if fdv_usd is not None else None
        circulating_ratio = compute_circulating_ratio(circulating_supply, total_supply)
        merged = {
            **row,
            **detail,
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


def fetch_bithumb_prices() -> dict[str, float]:
    payload = fetch_json("https://api.bithumb.com/public/ticker/ALL_KRW")
    if not isinstance(payload, dict):
        return {}
    data = payload.get("data") or {}
    if not isinstance(data, dict):
        return {}

    prices: dict[str, float] = {}
    for symbol, item in data.items():
        symbol_text = str(symbol or "").upper()
        if not symbol_text or symbol_text == "DATE" or not isinstance(item, dict):
            continue
        price_krw = to_float(item.get("closing_price"))
        if price_krw is not None:
            prices[symbol_text] = price_krw
    return prices


def fetch_bithumb() -> list[dict]:
    cap_payload = fetch_json("https://gw.bithumb.com/exchange/v1/trade/coinmarketcap")
    cap_map = (cap_payload.get("data") or {}) if isinstance(cap_payload, dict) else {}
    try:
        bithumb_prices = fetch_bithumb_prices()
    except Exception:  # noqa: BLE001
        bithumb_prices = {}
    payload = fetch_json("https://gw.bithumb.com/exchange/v1/comn/intro")
    data = payload.get("data") or {}  # type: ignore[union-attr]
    krw_market = (data.get("coinsOnMarketList") or {}).get("C0100") or []
    rows: list[dict] = []
    for item in krw_market:
        coin_type = item.get("coinType") or ""
        market_cap_krw = cap_map.get(coin_type)
        symbol = str(item.get("coinSymbol") or "").upper()
        price_krw = bithumb_prices.get(symbol)
        price_usd = safe_div(price_krw, FX_USD_KRW)
        rows.append(
            {
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
                "circulatingSupply": None,
                "totalSupply": None,
                "fdvUsd": None,
                "fdvKrw": None,
                "circulatingRatio": None,
                "nativeCurrency": "KRW",
                "marketCapRank": None,
                "capSource": "bithumb_coinmarketcap" if market_cap_krw is not None else "bithumb_missing",
                "capSourceDetail": "bithumb_main_today_price",
                "status": "ok" if market_cap_krw is not None else "missing",
                "nameKeys": list(
                    build_name_keys(
                        item.get("coinName") or "",
                        item.get("coinNameEn") or "",
                        item.get("coinName") or "",
                    )
                ),
            }
        )
    return rows


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
    return age_days > max_age_days


def has_name_key_overlap(row_a: dict, row_b: dict) -> bool:
    keys_a = set(row_a.get("nameKeys") or [])
    keys_b = set(row_b.get("nameKeys") or [])
    if not keys_a or not keys_b:
        return False
    return bool(keys_a & keys_b)


def build_rows_by_symbol(rows: list[dict]) -> dict[str, list[dict]]:
    indexed: dict[str, list[dict]] = {}
    for row in rows:
        symbol = str(row.get("symbol") or "").upper()
        if not symbol:
            continue
        indexed.setdefault(symbol, []).append(row)
    return indexed


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


def apply_bithumb_supply_fills(
    bithumb_rows: list[dict], upbit_rows: list[dict], binance_rows: list[dict]
) -> None:
    upbit_by_symbol = build_rows_by_symbol(upbit_rows)
    binance_by_symbol = build_rows_by_symbol(binance_rows)

    for bithumb_row in bithumb_rows:
        if to_float(bithumb_row.get("circulatingSupply")) is not None or to_float(
            bithumb_row.get("totalSupply")
        ) is not None:
            continue

        symbol = str(bithumb_row.get("symbol") or "").upper()
        if not symbol:
            continue

        # Same-symbol is the most stable primary key between Binance and Bithumb here.
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

        circulating_supply = to_float(candidate.get("circulatingSupply"))
        total_supply = to_float(candidate.get("totalSupply"))
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
        bithumb_row["supplyDetail"] = f"bithumb_supply_fill:{source_detail}"


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
                    upbit_row["status"] = "ok"
                    continue

        candidate = pick_live_fill_candidate(upbit_row, binance_by_symbol.get(symbol, []))
        candidate_source = "upbit_fill_from_binance_live"
        source_detail = "binance_symbol_list"

        if candidate is None:
            candidate = pick_live_fill_candidate(upbit_row, bithumb_by_symbol.get(symbol, []))
            candidate_source = "upbit_fill_from_bithumb_live"
            source_detail = "bithumb_main_today_price"

        if candidate is None:
            continue

        market_cap_usd = to_float(candidate.get("marketCapUsd"))
        if market_cap_usd is None:
            continue

        upbit_row["marketCapUsd"] = market_cap_usd
        upbit_row["marketCapKrw"] = market_cap_usd * FX_USD_KRW
        upbit_row["capSource"] = candidate_source
        upbit_row["capSourceDetail"] = f"stale_upbit_base_date:{base_date_text}|{source_detail}"
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

    news_payload = fetch_coinness_news((previous_payload or {}).get("news"))
    apply_upbit_live_fills(upbit_rows, binance_rows, bithumb_rows)
    apply_upbit_targeted_fills(upbit_rows, bithumb_rows)
    apply_bithumb_supply_fills(bithumb_rows, upbit_rows, binance_rows)

    boards = {
        "binance": finalize_rows(binance_rows),
        "upbit": finalize_rows(upbit_rows),
        "bithumb": finalize_rows(bithumb_rows),
    }

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
        "news": news_payload,
        "stats": stats,
        "changes": build_changes(boards, previous_payload),
        "notes": {
            "binance": "binance_exact_market_cap",
            "upbit": "upbit_info_tab_cmc_first",
            "bithumb": "bithumb_main_coinmarketcap_feed",
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
    )


if __name__ == "__main__":
    main()
