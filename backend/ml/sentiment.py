"""News sentiment from yfinance headlines."""

from __future__ import annotations

import os
from typing import Any

import yfinance as yf

_vader_analyzer = None
_finbert_pipeline = None
_finbert_failed = False


def _sentiment_backend() -> str:
    return os.getenv("SENTIMENT_BACKEND", "vader").lower()


def _get_vader():
    global _vader_analyzer
    if _vader_analyzer is None:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

        _vader_analyzer = SentimentIntensityAnalyzer()
    return _vader_analyzer


def _get_finbert():
    global _finbert_pipeline, _finbert_failed
    if _finbert_failed:
        return None
    if _finbert_pipeline is None:
        try:
            from transformers import pipeline
            import torch

            _finbert_pipeline = pipeline(
                "sentiment-analysis",
                model="ProsusAI/finbert",
                device=0 if torch.cuda.is_available() else -1,
            )
        except Exception as exc:
            print(f"Warning: Could not load FinBERT model: {exc}")
            _finbert_failed = True
            return None
    return _finbert_pipeline


def _extract_headlines(ticker: str) -> list[str]:
    stock = yf.Ticker(ticker)
    news = stock.news[:5]
    headlines: list[str] = []
    for item in news:
        title = item.get("title") or item.get("text") or ""
        if title:
            headlines.append(title)
    return headlines


def _label_from_score(score: float) -> str:
    if score > 0.2:
        return "Positive"
    if score < -0.2:
        return "Negative"
    return "Neutral"


def _analyze_vader(headlines: list[str]) -> dict[str, Any]:
    analyzer = _get_vader()
    scores = [analyzer.polarity_scores(headline)["compound"] for headline in headlines]
    score = sum(scores) / len(scores) if scores else 0.0
    return {
        "score": round(score, 2),
        "label": _label_from_score(score),
        "headlines": headlines,
    }


def _analyze_finbert(headlines: list[str]) -> dict[str, Any]:
    pipeline = _get_finbert()
    if pipeline is None:
        return _analyze_vader(headlines)

    results = pipeline(headlines)
    pos_count = sum(1 for result in results if result["label"] == "positive")
    neg_count = sum(1 for result in results if result["label"] == "negative")
    total = len(results)
    score = (pos_count - neg_count) / total if total > 0 else 0
    return {
        "score": round(score, 2),
        "label": _label_from_score(score),
        "headlines": headlines,
    }


def get_sentiment(ticker: str) -> dict[str, Any]:
    """Fetch news and analyze sentiment using VADER (default) or FinBERT."""
    try:
        headlines = _extract_headlines(ticker)
        if not headlines:
            return {"score": 0, "label": "Neutral", "headlines": []}

        if _sentiment_backend() == "finbert":
            return _analyze_finbert(headlines)
        return _analyze_vader(headlines)
    except Exception as exc:
        print(f"Error in sentiment analysis for {ticker}: {exc}")
        return {"score": 0, "label": "Neutral", "headlines": []}
