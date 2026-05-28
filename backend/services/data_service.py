import yfinance as yf
import pandas as pd
from typing import Any, Optional


def resolve_ticker(search_ticker: str) -> tuple[Optional[dict], Optional[str]]:
    """Resolve ticker across NSE, BSE, and global markets."""
    variants = [search_ticker.upper()]
    if "." not in search_ticker:
        variants.extend([f"{search_ticker.upper()}.NS", f"{search_ticker.upper()}.BO"])

    for variant in variants:
        try:
            stock = yf.Ticker(variant)
            info = stock.info
            if info and (
                "regularMarketPrice" in info
                or "currentPrice" in info
                or "longName" in info
            ):
                return info, variant
        except Exception:
            continue
    return None, None


def download_history(ticker: str, period: str = "2y", interval: str = "1d") -> pd.DataFrame:
    df = yf.download(ticker, period=period, interval=interval, progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    return df


def fetch_chart_history(ticker: str, period: str = "1y") -> list[dict[str, Any]]:
    stock = yf.Ticker(ticker)
    history = stock.history(period=period)
    if history.empty:
        return []

    if isinstance(history.columns, pd.MultiIndex):
        history.columns = history.columns.get_level_values(0)

    records = []
    for date, row in history.iterrows():
        records.append(
            {
                "date": date.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]) if pd.notna(row["Volume"]) else 0,
                "price": round(float(row["Close"]), 2),
            }
        )
    return records


def compute_day_change(history: list[dict[str, Any]], current_price: float) -> dict[str, Any]:
    if len(history) < 2:
        return {"change": 0, "change_percent": 0, "previous_close": current_price}

    prev_close = history[-2].get("close") or history[-2].get("price", current_price)
    change = round(current_price - prev_close, 2)
    change_pct = round((change / prev_close) * 100, 2) if prev_close else 0
    return {
        "change": change,
        "change_percent": change_pct,
        "previous_close": round(prev_close, 2),
    }


def map_fundamentals(info: dict) -> dict[str, Any]:
    return {
        "pe_ratio": info.get("forwardPE") or info.get("trailingPE"),
        "pb_ratio": info.get("priceToBook"),
        "eps": info.get("forwardEps") or info.get("trailingEps"),
        "revenue_growth": info.get("revenueGrowth"),
        "profit_margin": info.get("profitMargins"),
        "market_cap": info.get("marketCap"),
        "dividend_yield": info.get("dividendYield"),
        "debt_to_equity": info.get("debtToEquity"),
        "roe": info.get("returnOnEquity"),
        "roce": None,
        "free_cash_flow": info.get("freeCashflow"),
        "institutional_holding": info.get("heldPercentInstitutions"),
        "promoter_holding": info.get("heldPercentInsiders"),
        "operating_margin": info.get("operatingMargins"),
        "earnings_growth": info.get("earningsGrowth"),
    }


def get_currency_meta(info: dict, ticker: str) -> tuple[str, str, str]:
    currency = info.get("currency", "USD")
    currency_symbol = "₹" if currency == "INR" else "$"
    exchange = "NSE" if ".NS" in ticker else "BSE" if ".BO" in ticker else "Global"
    return currency, currency_symbol, exchange
