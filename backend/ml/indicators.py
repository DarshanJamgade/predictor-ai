import pandas as pd
import pandas_ta as ta
from typing import Any, Optional


def calculate_indicators(df: pd.DataFrame) -> Optional[pd.DataFrame]:
    """Calculate comprehensive technical indicators."""
    try:
        work = df.copy()

        work["SMA_20"] = ta.sma(work["Close"], length=20)
        work["SMA_50"] = ta.sma(work["Close"], length=50)
        work["SMA_200"] = ta.sma(work["Close"], length=200)
        work["EMA_12"] = ta.ema(work["Close"], length=12)
        work["EMA_26"] = ta.ema(work["Close"], length=26)
        work["EMA_50"] = ta.ema(work["Close"], length=50)
        work["RSI"] = ta.rsi(work["Close"], length=14)

        macd = ta.macd(work["Close"])
        if macd is not None and not macd.empty:
            work["MACD"] = macd.iloc[:, 0]
            work["MACD_Signal"] = macd.iloc[:, 1]
            work["MACD_Hist"] = macd.iloc[:, 2] if macd.shape[1] > 2 else 0
        else:
            work["MACD"] = 0
            work["MACD_Signal"] = 0
            work["MACD_Hist"] = 0

        bbands = ta.bbands(work["Close"], length=20)
        if bbands is not None and not bbands.empty:
            work["BB_Lower"] = bbands.iloc[:, 0]
            work["BB_Mid"] = bbands.iloc[:, 1]
            work["BB_Upper"] = bbands.iloc[:, 2]
        else:
            work["BB_Lower"] = work["Close"]
            work["BB_Mid"] = work["Close"]
            work["BB_Upper"] = work["Close"]

        work["ATR"] = ta.atr(work["High"], work["Low"], work["Close"], length=14)

        adx = ta.adx(work["High"], work["Low"], work["Close"], length=14)
        if adx is not None and not adx.empty:
            work["ADX"] = adx.iloc[:, 0]
        else:
            work["ADX"] = 0

        stoch = ta.stochrsi(work["Close"], length=14)
        if stoch is not None and not stoch.empty:
            work["STOCH_RSI"] = stoch.iloc[:, 0]
        else:
            work["STOCH_RSI"] = 50

        if "Volume" in work.columns:
            work["VWAP"] = ta.vwap(work["High"], work["Low"], work["Close"], work["Volume"])
        else:
            work["VWAP"] = work["Close"]

        supertrend = ta.supertrend(work["High"], work["Low"], work["Close"], length=10, multiplier=3)
        if supertrend is not None and not supertrend.empty:
            work["SUPERTREND"] = supertrend.iloc[:, 0]
            work["SUPERTREND_DIR"] = supertrend.iloc[:, 1] if supertrend.shape[1] > 1 else 0
        else:
            work["SUPERTREND"] = work["Close"]
            work["SUPERTREND_DIR"] = 0

        work["Support"] = work["Low"].rolling(window=20).min()
        work["Resistance"] = work["High"].rolling(window=20).max()

        ichimoku = ta.ichimoku(work["High"], work["Low"], work["Close"])
        if ichimoku is not None and isinstance(ichimoku, tuple) and len(ichimoku) > 0:
            ichi_df = ichimoku[0]
            if ichi_df is not None and not ichi_df.empty:
                work["ICHIMOKU_A"] = ichi_df.iloc[:, 0]
                work["ICHIMOKU_B"] = ichi_df.iloc[:, 1] if ichi_df.shape[1] > 1 else work["Close"]
            else:
                work["ICHIMOKU_A"] = work["Close"]
                work["ICHIMOKU_B"] = work["Close"]
        else:
            work["ICHIMOKU_A"] = work["Close"]
            work["ICHIMOKU_B"] = work["Close"]

        return work.dropna()
    except Exception as exc:
        print(f"Error in calculate_indicators: {exc}")
        return None


def get_indicator_snapshot(latest: pd.Series) -> dict[str, Any]:
    return {
        "RSI": round(float(latest.get("RSI", 50)), 2),
        "MACD": round(float(latest.get("MACD", 0)), 2),
        "MACD_Signal": round(float(latest.get("MACD_Signal", 0)), 2),
        "MACD_Hist": round(float(latest.get("MACD_Hist", 0)), 2),
        "SMA_20": round(float(latest.get("SMA_20", latest["Close"])), 2),
        "SMA_50": round(float(latest.get("SMA_50", latest["Close"])), 2),
        "SMA_200": round(float(latest.get("SMA_200", latest["Close"])), 2),
        "EMA_12": round(float(latest.get("EMA_12", latest["Close"])), 2),
        "EMA_26": round(float(latest.get("EMA_26", latest["Close"])), 2),
        "EMA_50": round(float(latest.get("EMA_50", latest["Close"])), 2),
        "ATR": round(float(latest.get("ATR", 0)), 2),
        "ADX": round(float(latest.get("ADX", 0)), 2),
        "STOCH_RSI": round(float(latest.get("STOCH_RSI", 50)), 2),
        "VWAP": round(float(latest.get("VWAP", latest["Close"])), 2),
        "BB_Upper": round(float(latest.get("BB_Upper", latest["Close"])), 2),
        "BB_Lower": round(float(latest.get("BB_Lower", latest["Close"])), 2),
        "SUPERTREND": round(float(latest.get("SUPERTREND", latest["Close"])), 2),
        "Support": round(float(latest.get("Support", latest["Close"])), 2),
        "Resistance": round(float(latest.get("Resistance", latest["Close"])), 2),
    }


def compute_trend_strength(latest: pd.Series) -> dict[str, Any]:
    adx = float(latest.get("ADX", 0))
    price = float(latest["Close"])
    sma50 = float(latest.get("SMA_50", price))
    sma200 = float(latest.get("SMA_200", price))

    direction = "Neutral"
    if price > sma50 > sma200:
        direction = "Bullish"
    elif price < sma50 < sma200:
        direction = "Bearish"

    if adx >= 30:
        strength = "Strong"
    elif adx >= 20:
        strength = "Moderate"
    else:
        strength = "Weak"

    return {"direction": direction, "strength": strength, "adx": round(adx, 2)}
