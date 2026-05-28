from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from ml.engine import get_prediction
from ml.sentiment import get_sentiment
from services.cache import TTLCache
from services.data_service import (
    compute_day_change,
    fetch_chart_history,
    get_currency_meta,
    map_fundamentals,
    resolve_ticker,
)

settings = get_settings()
app = FastAPI(title="AI Stock Predictor API", version="2.0.0")
cache = TTLCache(ttl_seconds=settings["cache_ttl_seconds"])
executor = ThreadPoolExecutor(max_workers=4)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings["cors_origins"],
    allow_origin_regex=settings["cors_origin_regex"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _build_stock_payload(ticker: str) -> dict:
    info, final_ticker = resolve_ticker(ticker)
    if not info or not final_ticker:
        raise HTTPException(
            status_code=404,
            detail=f"Ticker '{ticker}' not found on NSE, BSE, or Global markets.",
        )

    history = fetch_chart_history(final_ticker, period="1y")
    if not history:
        raise HTTPException(status_code=404, detail=f"No historical data found for {final_ticker}")

    fundamentals = map_fundamentals(info)
    sentiment = get_sentiment(final_ticker)
    prediction = get_prediction(final_ticker, sentiment=sentiment, fundamentals=fundamentals)

    currency, currency_symbol, exchange = get_currency_meta(info, final_ticker)
    current_price = (
        info.get("currentPrice")
        or info.get("regularMarketPrice")
        or (history[-1]["close"] if history else 0)
    )
    day_change = compute_day_change(history, float(current_price))

    return {
        "ticker": final_ticker,
        "displayTicker": ticker.upper(),
        "exchange": exchange,
        "name": info.get("longName", ticker),
        "currentPrice": current_price,
        "currency": currency,
        "currencySymbol": currency_symbol,
        "dayChange": day_change,
        "summary": info.get("longBusinessSummary", ""),
        "history": history,
        "prediction": prediction,
        "sentiment": sentiment,
        "fundamentals": fundamentals,
        "meta": {
            "lastUpdated": datetime.now(timezone.utc).isoformat(),
            "dataSource": "yfinance",
            "disclaimer": "For informational purposes only. Not financial advice.",
        },
    }


@app.get("/")
async def health_check():
    return {
        "status": "healthy",
        "message": "Stock Predictor API is running",
        "version": "2.0.0",
    }


@app.get("/search/{query}")
async def search_tickers(query: str):
    import yfinance as yf

    try:
        if not query or len(query) < 2:
            return []

        search = yf.Search(query, max_results=8)
        quotes = search.quotes

        results = []
        for quote in quotes:
            results.append(
                {
                    "symbol": quote.get("symbol"),
                    "name": quote.get("shortname") or quote.get("longname") or quote.get("symbol"),
                    "exchange": quote.get("exchDisp"),
                    "type": quote.get("quoteType"),
                }
            )
        return results
    except Exception as exc:
        print(f"Error in search: {exc}")
        return []


@app.get("/stock/{ticker}")
async def get_stock_data(ticker: str):
    cache_key = f"stock:{ticker.upper()}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        import asyncio

        loop = asyncio.get_event_loop()
        payload = await loop.run_in_executor(executor, _build_stock_payload, ticker)
        cache.set(cache_key, payload)
        return payload
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Critical error fetching {ticker}: {exc}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error while processing request.")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings["host"], port=settings["port"])
