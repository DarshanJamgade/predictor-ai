import os
from functools import lru_cache


@lru_cache
def get_settings():
    default_origins = "http://localhost:5173,http://127.0.0.1:5173"
    cors_origins = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", default_origins).split(",")
        if origin.strip()
    ]
    return {
        "cors_origins": cors_origins,
        "cors_origin_regex": os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app"),
        "cache_ttl_seconds": int(os.getenv("CACHE_TTL_SECONDS", "300")),
        "min_risk_reward": float(os.getenv("MIN_RISK_REWARD", "1.5")),
        "host": os.getenv("HOST", "0.0.0.0"),
        "port": int(os.getenv("PORT", "8080")),
    }
