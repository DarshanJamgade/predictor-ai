import os
from functools import lru_cache


@lru_cache
def get_settings():
    return {
        "cors_origins": os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
        "cache_ttl_seconds": int(os.getenv("CACHE_TTL_SECONDS", "300")),
        "min_risk_reward": float(os.getenv("MIN_RISK_REWARD", "1.5")),
        "host": os.getenv("HOST", "0.0.0.0"),
        "port": int(os.getenv("PORT", "8080")),
    }
