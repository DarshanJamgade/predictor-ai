import pandas as pd
from typing import Any


def detect_candlestick_patterns(df: pd.DataFrame) -> list[str]:
    if len(df) < 3:
        return []

    patterns: list[str] = []
    c0, c1, c2 = df.iloc[-1], df.iloc[-2], df.iloc[-3]

    body0 = abs(c0["Close"] - c0["Open"])
    range0 = c0["High"] - c0["Low"]
    lower_wick = min(c0["Open"], c0["Close"]) - c0["Low"]
    upper_wick = c0["High"] - max(c0["Open"], c0["Close"])

    if range0 > 0 and lower_wick > body0 * 2 and upper_wick < body0 * 0.5:
        patterns.append("Hammer")

    if range0 > 0 and body0 / range0 < 0.1:
        patterns.append("Doji")

    if c1["Close"] < c1["Open"] and c0["Close"] > c0["Open"]:
        if c0["Close"] > c1["Open"] and c0["Open"] < c1["Close"]:
            patterns.append("Bullish Engulfing")

    if c1["Close"] > c1["Open"] and c0["Close"] < c0["Open"]:
        if c0["Open"] > c1["Close"] and c0["Close"] < c1["Open"]:
            patterns.append("Bearish Engulfing")

    if c2["Close"] < c2["Open"] and abs(c1["Close"] - c1["Open"]) < body0 * 0.3 and c0["Close"] > c0["Open"]:
        if c0["Close"] > (c2["Open"] + c2["Close"]) / 2:
            patterns.append("Morning Star")

    if c2["Close"] > c2["Open"] and abs(c1["Close"] - c1["Open"]) < body0 * 0.3 and c0["Close"] < c0["Open"]:
        if c0["Close"] < (c2["Open"] + c2["Close"]) / 2:
            patterns.append("Evening Star")

    if abs(c0["Close"] - c0["Open"]) < abs(c1["Close"] - c1["Open"]) * 0.5:
        if c0["High"] < c1["High"] and c0["Low"] > c1["Low"]:
            patterns.append("Harami")

    return patterns


def detect_chart_patterns(df: pd.DataFrame) -> list[str]:
    if len(df) < 30:
        return []

    patterns: list[str] = []
    recent = df.tail(30)
    highs = recent["High"]
    lows = recent["Low"]
    price = float(df.iloc[-1]["Close"])
    resistance = float(recent["High"].max())
    support = float(recent["Low"].min())

    if price >= resistance * 0.98:
        patterns.append("Breakout above resistance")

    if price <= support * 1.02:
        patterns.append("Near support zone")

    peak_idx = highs.nlargest(2).index
    if len(peak_idx) >= 2:
        p1, p2 = highs.loc[peak_idx[0]], highs.loc[peak_idx[1]]
        if abs(p1 - p2) / max(p1, p2) < 0.02:
            patterns.append("Double Top")

    trough_idx = lows.nsmallest(2).index
    if len(trough_idx) >= 2:
        t1, t2 = lows.loc[trough_idx[0]], lows.loc[trough_idx[1]]
        if abs(t1 - t2) / max(t1, t2) < 0.02:
            patterns.append("Double Bottom")

    sma20 = df["Close"].rolling(20).mean()
    if len(sma20.dropna()) >= 10:
        slope = float(sma20.iloc[-1] - sma20.iloc[-10])
        if slope > 0 and price > float(sma20.iloc[-1]):
            patterns.append("Uptrend continuation")
        elif slope < 0 and price < float(sma20.iloc[-1]):
            patterns.append("Downtrend continuation")

    return patterns


def detect_volume_signals(df: pd.DataFrame) -> list[str]:
    if "Volume" not in df.columns or len(df) < 21:
        return []

    signals: list[str] = []
    avg_vol = df["Volume"].tail(21).mean()
    latest_vol = df.iloc[-1]["Volume"]
    if avg_vol > 0 and latest_vol > avg_vol * 2:
        signals.append("Unusual volume spike")

    return signals


def collect_pattern_analysis(df: pd.DataFrame) -> dict[str, Any]:
    candlesticks = detect_candlestick_patterns(df)
    chart_patterns = detect_chart_patterns(df)
    volume_signals = detect_volume_signals(df)
    return {
        "candlesticks": candlesticks,
        "chart_patterns": chart_patterns,
        "volume_signals": volume_signals,
        "all": candlesticks + chart_patterns + volume_signals,
    }
