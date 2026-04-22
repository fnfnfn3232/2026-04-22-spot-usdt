from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATA_JS_PATH = ROOT / "data.js"
SNAPSHOT_JSON_PATH = ROOT / "board_snapshot.json"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"
)
FX_USD_KRW = 1350.0
AUTO_REFRESH_MINUTES = 60


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
        market_cap_usd = item.get("marketCap")
        market_cap_krw = market_cap_usd * FX_USD_KRW if market_cap_usd is not None else None
        row = {
            "symbol": symbol,
            "pair": f"{symbol}/USDT",
            "name": item.get("localFullName") or item.get("fullName") or item.get("name") or symbol,
            "englishName": item.get("fullName") or item.get("name") or symbol,
            "koreanName": item.get("localFullName") or item.get("fullName") or symbol,
            "marketCapUsd": market_cap_usd,
            "marketCapKrw": market_cap_krw,
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
                raw_value = str((entry or {}).get("content") or "").replace(",", "").strip()
                if raw_value.isdigit():
                    return float(raw_value), provider_label, str((entry or {}).get("baseDate") or "")
    return None, "upbit_missing", ""


def fetch_upbit_details(symbol: str) -> dict:
    query = urllib.parse.urlencode({"currency": symbol, "language": "ko"})
    payload = fetch_json(f"https://ccx.upbit.com/coin-infos/api/v1/digital-assets?{query}")
    document = payload.get("document") or {}  # type: ignore[union-attr]
    market_cap_krw, source_label, base_date = extract_upbit_market_cap(document)
    market_cap_usd = market_cap_krw / FX_USD_KRW if market_cap_krw is not None else None
    return {
        "marketCapKrw": market_cap_krw,
        "marketCapUsd": market_cap_usd,
        "capSource": source_label,
        "capSourceDetail": base_date,
        "status": "ok" if market_cap_krw is not None else "missing",
    }


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

    rows: list[dict] = []
    lookup: dict[str, list[dict]] = {}
    for row in base_rows:
        detail = details[row["symbol"]]
        merged = {
            **row,
            **detail,
            "nativeCurrency": "KRW",
            "marketCapRank": None,
            "nameKeys": list(build_name_keys(row["name"], row["englishName"], row["koreanName"])),
        }
        rows.append(merged)
        lookup.setdefault(row["symbol"].lower(), []).append(merged)

    return rows, lookup


def fetch_bithumb() -> list[dict]:
    cap_payload = fetch_json("https://gw.bithumb.com/exchange/v1/trade/coinmarketcap")
    cap_map = (cap_payload.get("data") or {}) if isinstance(cap_payload, dict) else {}
    payload = fetch_json("https://gw.bithumb.com/exchange/v1/comn/intro")
    data = payload.get("data") or {}  # type: ignore[union-attr]
    krw_market = (data.get("coinsOnMarketList") or {}).get("C0100") or []
    rows: list[dict] = []
    for item in krw_market:
        coin_type = item.get("coinType") or ""
        market_cap_krw = cap_map.get(coin_type)
        rows.append(
            {
                "coinType": coin_type,
                "symbol": item.get("coinSymbol") or "",
                "pair": f'{item.get("coinSymbol")}/KRW',
                "name": item.get("coinName") or item.get("coinSymbol") or "",
                "englishName": item.get("coinNameEn") or item.get("coinSymbol") or "",
                "koreanName": item.get("coinName") or item.get("coinSymbol") or "",
                "marketCapUsd": (
                    float(market_cap_krw) / FX_USD_KRW if market_cap_krw is not None else None
                ),
                "marketCapKrw": float(market_cap_krw) if market_cap_krw is not None else None,
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


def finalize_rows(rows: list[dict]) -> list[dict]:
    for row in rows:
        market_cap_usd = row.get("marketCapUsd")
        market_cap_krw = row.get("marketCapKrw")
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
    binance_rows, _binance_lookup = fetch_binance()
    upbit_rows, _upbit_lookup = fetch_upbit()
    bithumb_rows = fetch_bithumb()
    apply_upbit_targeted_fills(upbit_rows, bithumb_rows)

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
        "boards": boards,
        "stats": stats,
        "changes": build_changes(boards, previous_payload),
        "notes": {
            "binance": "binance_exact_market_cap",
            "upbit": "upbit_info_tab_cmc_first",
            "bithumb": "bithumb_main_coinmarketcap_feed",
        },
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
