from sklearn.ensemble import RandomForestClassifier
from typing import Any, Optional

from core.config import get_settings
from ml.fundamentals import score_fundamentals
from ml.indicators import calculate_indicators, compute_trend_strength, get_indicator_snapshot
from ml.patterns import collect_pattern_analysis
from ml.recommendation import generate_recommendation
from ml.trade_levels import compute_trade_levels
from services.data_service import download_history


ML_FEATURES = [
    "RSI",
    "MACD",
    "MACD_Signal",
    "SMA_50",
    "SMA_200",
    "BB_Upper",
    "BB_Lower",
    "ATR",
    "ADX",
    "STOCH_RSI",
]


def _train_probability(df) -> Optional[float]:
    for feature in ML_FEATURES:
        if feature not in df.columns:
            return None

    df = df.copy()
    df["Target_Dir"] = (df["Close"].shift(-5) > df["Close"]).astype(int)
    train_df = df.dropna().copy()

    if len(train_df) < 50:
        return None

    split_idx = int(len(train_df) * 0.8)
    train = train_df.iloc[:split_idx]
    if len(train) < 30:
        return None

    model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=8)
    model.fit(train[ML_FEATURES], train["Target_Dir"])

    latest = df[ML_FEATURES].tail(1)
    proba = model.predict_proba(latest)
    if proba.shape[1] < 2:
        return 0.5
    return float(proba[0][1])


def get_prediction(
    ticker: str,
    sentiment: Optional[dict[str, Any]] = None,
    fundamentals: Optional[dict[str, Any]] = None,
) -> Optional[dict[str, Any]]:
    """Advanced AI prediction with multi-factor recommendation engine."""
    try:
        settings = get_settings()
        df = download_history(ticker, period="2y", interval="1d")

        if df.empty or len(df) < 80:
            print(f"Not enough data for {ticker}")
            return None

        df = calculate_indicators(df)
        if df is None or df.empty:
            print(f"Indicators calculation failed for {ticker}")
            return None

        prob_up = _train_probability(df)
        if prob_up is None:
            print(f"ML training failed for {ticker}")
            return None

        latest = df.tail(1).iloc[0]
        price = float(latest["Close"])
        atr = float(latest.get("ATR", price * 0.02))
        atr_pct = (atr / price) * 100 if price else 0

        indicators = get_indicator_snapshot(latest)
        indicators["_price"] = price
        trend = compute_trend_strength(latest)
        patterns = collect_pattern_analysis(df)

        fundamentals_score = score_fundamentals(fundamentals or {}) if fundamentals else None

        preliminary_suggestion = "HOLD"
        if prob_up > 0.62:
            preliminary_suggestion = "BUY"
        elif prob_up < 0.38:
            preliminary_suggestion = "SELL"

        trade_levels = compute_trade_levels(
            price=price,
            atr=atr,
            support=float(latest.get("Support", price * 0.95)),
            resistance=float(latest.get("Resistance", price * 1.05)),
            suggestion=preliminary_suggestion,
            min_risk_reward=settings["min_risk_reward"],
        )

        recommendation = generate_recommendation(
            prob_up=prob_up,
            indicators=indicators,
            trend=trend,
            patterns=patterns,
            sentiment=sentiment,
            fundamentals_score=fundamentals_score,
            trade_levels=trade_levels,
            atr_pct=atr_pct,
        )

        suggestion = recommendation["suggestion"]
        if suggestion in ("SELL", "STRONG SELL"):
            trade_levels = compute_trade_levels(
                price=price,
                atr=atr,
                support=float(latest.get("Support", price * 0.95)),
                resistance=float(latest.get("Resistance", price * 1.05)),
                suggestion=suggestion,
                min_risk_reward=settings["min_risk_reward"],
            )

        risk_score = min(10, max(1, int(atr_pct * 1.5)))

        return {
            "suggestion": suggestion,
            "confidence": recommendation["confidence"],
            "composite_score": recommendation["composite_score"],
            "bullish_probability": recommendation["bullish_probability"],
            "bearish_probability": recommendation["bearish_probability"],
            "time_horizon": recommendation["time_horizon"],
            "trend_strength": recommendation["trend"]["strength"],
            "trend_direction": recommendation["trend"]["direction"],
            "volatility_level": recommendation["volatility_level"],
            "prices": {
                "entry": trade_levels["entry"],
                "entry_zones": trade_levels["entry_zones"],
                "target_short": trade_levels["targets"]["target_short"],
                "target_medium": trade_levels["targets"]["target_medium"],
                "target_long": trade_levels["targets"]["target_long"],
                "targets": trade_levels["targets"],
                "stop_loss": trade_levels["stop_loss"],
                "atr_stop_loss": trade_levels["atr_stop_loss"],
                "trailing_stop": trade_levels["trailing_stop"],
            },
            "risk_reward": trade_levels["risk_reward"],
            "position_size_pct": trade_levels["position_size_pct"],
            "trade_valid": trade_levels["trade_valid"],
            "rejection_reason": trade_levels["rejection_reason"],
            "risk": {
                "score": risk_score,
                "level": recommendation["risk_level"],
                "volatility": round(atr_pct, 2),
            },
            "indicators": indicators,
            "patterns": patterns,
            "reasoning": recommendation["reasoning"],
            "risks": recommendation["risks"],
            "invalidation": recommendation["invalidation"],
            "fundamentals_score": fundamentals_score,
        }
    except Exception as exc:
        print(f"Error in get_prediction for {ticker}: {exc}")
        import traceback

        traceback.print_exc()
        return None
