import math
from typing import Any


def to_json_safe(value: Any) -> Any:
    """Convert numpy scalars, NaN, and inf to JSON-serializable Python types."""
    if value is None:
        return None

    if isinstance(value, dict):
        return {key: to_json_safe(item) for key, item in value.items()}

    if isinstance(value, (list, tuple)):
        return [to_json_safe(item) for item in value]

    if hasattr(value, "item") and callable(value.item):
        try:
            value = value.item()
        except Exception:
            pass

    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return value

    if isinstance(value, int):
        return value

    if isinstance(value, str):
        return value

    try:
        number = float(value)
        if math.isnan(number) or math.isinf(number):
            return None
        return number
    except (TypeError, ValueError):
        return value
