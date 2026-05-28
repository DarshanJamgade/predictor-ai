from typing import Any, Optional


def score_fundamentals(fundamentals: dict[str, Any]) -> dict[str, Any]:
    """Score fundamentals and classify valuation."""

    def safe(val: Optional[float], default: float = 0) -> float:
        if val is None:
            return default
        try:
            return float(val)
        except (TypeError, ValueError):
            return default

    pe = safe(fundamentals.get("pe_ratio"))
    pb = safe(fundamentals.get("pb_ratio"))
    revenue_growth = safe(fundamentals.get("revenue_growth"))
    earnings_growth = safe(fundamentals.get("earnings_growth"))
    profit_margin = safe(fundamentals.get("profit_margin"))
    debt_to_equity = safe(fundamentals.get("debt_to_equity"))
    roe = safe(fundamentals.get("roe"))
    institutional = safe(fundamentals.get("institutional_holding"))

    growth_score = 50
    if revenue_growth > 0.15:
        growth_score += 20
    elif revenue_growth > 0.05:
        growth_score += 10
    elif revenue_growth < 0:
        growth_score -= 15

    if earnings_growth > 0.15:
        growth_score += 15
    elif earnings_growth < 0:
        growth_score -= 10
    growth_score = max(0, min(100, growth_score))

    valuation_score = 50
    if 0 < pe < 15:
        valuation_score += 20
    elif pe > 35:
        valuation_score -= 20
    if 0 < pb < 2:
        valuation_score += 10
    elif pb > 5:
        valuation_score -= 10
    valuation_score = max(0, min(100, valuation_score))

    health_score = 50
    if profit_margin > 0.15:
        health_score += 15
    elif profit_margin < 0.05:
        health_score -= 10
    if debt_to_equity < 50:
        health_score += 10
    elif debt_to_equity > 150:
        health_score -= 15
    if roe > 0.15:
        health_score += 10
    elif roe < 0.05:
        health_score -= 10
    health_score = max(0, min(100, health_score))

    if institutional > 0.4:
        health_score += 5

    fundamental_score = round((growth_score + valuation_score + health_score) / 3, 1)

    if valuation_score >= 65 and growth_score >= 55:
        valuation_label = "Undervalued"
    elif valuation_score <= 35 or (pe > 40 and growth_score < 45):
        valuation_label = "Overvalued"
    else:
        valuation_label = "Fairly Valued"

    return {
        "fundamental_score": fundamental_score,
        "growth_score": round(growth_score, 1),
        "valuation_score": round(valuation_score, 1),
        "financial_health_score": round(health_score, 1),
        "valuation_label": valuation_label,
    }
