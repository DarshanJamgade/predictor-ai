from typing import Any, Optional


def classify_time_horizon(
    adx: float, atr_pct: float, rsi: float, suggestion: str
) -> str:
    if atr_pct > 4 and adx >= 25:
        return "Intraday"
    if atr_pct > 2.5 or (35 <= rsi <= 65 and adx >= 20):
        return "Swing"
    if suggestion in ("STRONG BUY", "STRONG SELL") and adx >= 25:
        return "Positional"
    return "Long-term"


def build_reasoning(
    suggestion: str,
    indicators: dict[str, Any],
    trend: dict[str, Any],
    patterns: dict[str, Any],
    sentiment: Optional[dict[str, Any]],
    fundamentals_score: Optional[dict[str, Any]],
    prob_up: float,
    invalidation: list[str],
) -> tuple[list[str], list[str]]:
    reasons: list[str] = []
    risks: list[str] = []

    rsi = indicators.get("RSI", 50)
    macd = indicators.get("MACD", 0)
    macd_signal = indicators.get("MACD_Signal", 0)
    price_context = trend.get("direction", "Neutral")

    if prob_up > 0.6:
        reasons.append(f"ML model assigns {prob_up * 100:.0f}% bullish probability over 5 sessions.")
    elif prob_up < 0.4:
        reasons.append(f"ML model assigns {(1 - prob_up) * 100:.0f}% bearish probability over 5 sessions.")

    if rsi < 30:
        reasons.append("RSI indicates oversold conditions — potential mean reversion.")
    elif rsi > 70:
        reasons.append("RSI indicates overbought conditions — upside may be limited.")
        risks.append("Overbought RSI increases pullback risk.")

    if macd > macd_signal:
        reasons.append("MACD bullish crossover supports upward momentum.")
    elif macd < macd_signal:
        reasons.append("MACD bearish crossover signals weakening momentum.")

    if price_context == "Bullish":
        reasons.append("Price structure is bullish (above SMA 50 and SMA 200).")
    elif price_context == "Bearish":
        reasons.append("Price structure is bearish (below SMA 50 and SMA 200).")
        risks.append("Bearish trend structure — counter-trend trades carry higher risk.")

    if trend.get("strength") == "Strong":
        reasons.append(f"Trend strength is strong (ADX {trend.get('adx', 0)}).")

    for pattern in patterns.get("all", [])[:4]:
        reasons.append(f"Pattern detected: {pattern}.")

    if sentiment:
        label = sentiment.get("label", "Neutral")
        score = sentiment.get("score", 0)
        if label == "Positive":
            reasons.append(f"News sentiment is positive (score {score}).")
        elif label == "Negative":
            reasons.append(f"News sentiment is negative (score {score}).")
            risks.append("Negative news sentiment may pressure price action.")

    if fundamentals_score:
        val_label = fundamentals_score.get("valuation_label")
        f_score = fundamentals_score.get("fundamental_score", 50)
        reasons.append(f"Fundamental score {f_score}/100 — classified as {val_label}.")
        if val_label == "Overvalued" and "BUY" in suggestion:
            risks.append("Overvalued fundamentals may limit upside.")

    if suggestion == "AVOID":
        risks.append("Conflicting signals or poor risk/reward — setup not actionable.")
    if suggestion == "HOLD":
        risks.append("No clear edge — waiting for better confirmation is prudent.")

    if not invalidation:
        invalidation = ["Break below key support invalidates bullish setup."]
    risks.extend(invalidation[:3])

    if not reasons:
        reasons.append("Mixed signals — no dominant directional edge detected.")

    return reasons[:8], risks[:5]


def generate_recommendation(
    prob_up: float,
    indicators: dict[str, Any],
    trend: dict[str, Any],
    patterns: dict[str, Any],
    sentiment: Optional[dict[str, Any]],
    fundamentals_score: Optional[dict[str, Any]],
    trade_levels: dict[str, Any],
    atr_pct: float,
) -> dict[str, Any]:
    """Multi-factor recommendation engine."""

    rsi = indicators.get("RSI", 50)
    adx = indicators.get("ADX", 0)
    price = indicators.get("_price", 0)
    sma50 = indicators.get("SMA_50", price)
    sma200 = indicators.get("SMA_200", price)

    technical_score = 50.0
    if prob_up > 0.55:
        technical_score += (prob_up - 0.5) * 80
    else:
        technical_score -= (0.5 - prob_up) * 80

    if price > sma50:
        technical_score += 8
    if price > sma200:
        technical_score += 8
    if rsi < 35:
        technical_score += 5
    if rsi > 70:
        technical_score -= 8
    if indicators.get("MACD", 0) > indicators.get("MACD_Signal", 0):
        technical_score += 6

    technical_score = max(0, min(100, technical_score))

    sentiment_score = 50.0
    if sentiment:
        sent = sentiment.get("score", 0)
        sentiment_score += sent * 30
        if sentiment.get("label") == "Positive":
            sentiment_score += 10
        elif sentiment.get("label") == "Negative":
            sentiment_score -= 10
    sentiment_score = max(0, min(100, sentiment_score))

    fundamental_component = 50.0
    if fundamentals_score:
        fundamental_component = fundamentals_score.get("fundamental_score", 50)

    composite = (
        technical_score * 0.45
        + sentiment_score * 0.20
        + fundamental_component * 0.20
        + prob_up * 100 * 0.15
    )

    bullish_patterns = sum(
        1
        for p in patterns.get("all", [])
        if any(k in p.lower() for k in ("bullish", "breakout", "double bottom", "hammer", "morning", "uptrend"))
    )
    bearish_patterns = sum(
        1
        for p in patterns.get("all", [])
        if any(k in p.lower() for k in ("bearish", "double top", "downtrend", "evening", "engulfing"))
    )
    composite += bullish_patterns * 3
    composite -= bearish_patterns * 3
    composite = max(0, min(100, composite))

    suggestion = "HOLD"
    if composite >= 78 and prob_up >= 0.62 and trade_levels.get("trade_valid", True):
        suggestion = "STRONG BUY"
    elif composite >= 62 and prob_up >= 0.52:
        suggestion = "BUY"
    elif composite <= 22 and prob_up <= 0.35:
        suggestion = "STRONG SELL"
    elif composite <= 38 and prob_up <= 0.45:
        suggestion = "SELL"
    elif not trade_levels.get("trade_valid", True) and composite >= 55:
        suggestion = "AVOID"
    elif atr_pct > 8 and composite < 55:
        suggestion = "AVOID"

    if suggestion in ("BUY", "STRONG BUY") and not trade_levels.get("trade_valid", True):
        suggestion = "AVOID"

    confidence = composite if suggestion in ("BUY", "STRONG BUY", "HOLD") else 100 - composite
    if suggestion in ("SELL", "STRONG SELL"):
        confidence = max(confidence, (1 - prob_up) * 100)

    bullish_prob = round(prob_up * 100, 2)
    bearish_prob = round((1 - prob_up) * 100, 2)

    if atr_pct > 5:
        volatility = "High"
    elif atr_pct > 2.5:
        volatility = "Medium"
    else:
        volatility = "Low"

    risk_score = min(10, max(1, int(atr_pct * 1.5)))
    risk_level = "High" if risk_score > 7 else "Medium" if risk_score > 4 else "Low"

    invalidation: list[str] = []
    support = indicators.get("Support", price)
    if suggestion in ("BUY", "STRONG BUY"):
        invalidation.append(f"Close below support ({support}) invalidates bullish thesis.")
    elif suggestion in ("SELL", "STRONG SELL"):
        invalidation.append(f"Close above resistance ({indicators.get('Resistance', price)}) invalidates bearish thesis.")

    time_horizon = classify_time_horizon(adx, atr_pct, rsi, suggestion)
    reasons, risks = build_reasoning(
        suggestion,
        indicators,
        trend,
        patterns,
        sentiment,
        fundamentals_score,
        prob_up,
        invalidation,
    )

    return {
        "suggestion": suggestion,
        "confidence": round(confidence, 2),
        "composite_score": round(composite, 2),
        "bullish_probability": bullish_prob,
        "bearish_probability": bearish_prob,
        "trend": trend,
        "volatility_level": volatility,
        "risk_level": risk_level,
        "time_horizon": time_horizon,
        "reasoning": reasons,
        "risks": risks,
        "invalidation": invalidation,
    }
