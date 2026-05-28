from typing import Any


def compute_trade_levels(
    price: float,
    atr: float,
    support: float,
    resistance: float,
    suggestion: str,
    min_risk_reward: float = 1.5,
) -> dict[str, Any]:
    """Professional entry, exit, and stop-loss recommendations."""

    entry = round(price, 2)
    safe_entry_low = round(max(support, price - 0.5 * atr), 2)
    safe_entry_high = round(price, 2)
    aggressive_entry = round(price + 0.25 * atr, 2)

    atr_stop = round(price - 2.0 * atr, 2)
    support_stop = round(support - 0.25 * atr, 2)
    stop_loss = round(max(atr_stop, support_stop), 2)

    target_1 = round(min(resistance, price + 1.5 * atr), 2)
    target_2 = round(price + 3.0 * atr, 2)
    target_3 = round(max(resistance, price * 1.12), 2)

    risk = max(entry - stop_loss, 0.01)
    reward = max(target_1 - entry, 0)
    risk_reward = round(reward / risk, 2) if risk > 0 else 0

    trailing_stop = round(price - 1.5 * atr, 2)

    trade_valid = risk_reward >= min_risk_reward and stop_loss < entry
    if suggestion in ("BUY", "STRONG BUY") and not trade_valid:
        trade_valid = False

    position_size_pct = 2.0
    if risk_reward >= 3:
        position_size_pct = 3.0
    elif risk_reward < 2:
        position_size_pct = 1.0

    return {
        "entry": entry,
        "entry_zones": {
            "ideal": entry,
            "safe": {"low": safe_entry_low, "high": safe_entry_high},
            "aggressive": aggressive_entry,
        },
        "stop_loss": stop_loss,
        "atr_stop_loss": atr_stop,
        "trailing_stop": trailing_stop,
        "targets": {
            "target_1": target_1,
            "target_2": target_2,
            "target_3": target_3,
            "target_short": target_1,
            "target_medium": target_2,
            "target_long": target_3,
        },
        "risk_reward": risk_reward,
        "risk_amount_per_share": round(risk, 2),
        "reward_amount_per_share": round(reward, 2),
        "position_size_pct": position_size_pct,
        "trade_valid": trade_valid,
        "rejection_reason": None
        if trade_valid
        else f"Risk/reward {risk_reward}:1 below minimum {min_risk_reward}:1",
    }
