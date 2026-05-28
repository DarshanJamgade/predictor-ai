# Predictor AI

An AI-powered trading copilot that combines technical analysis, fundamental scoring, news sentiment, and risk-adjusted trade levels to help traders and investors make better decisions.

**Backend:** http://localhost:8080  
**Frontend:** http://localhost:5173

---

## Features

### AI Recommendation Engine
- **Signals:** Strong Buy, Buy, Hold, Sell, Strong Sell, and Avoid
- **Multi-factor scoring:** Technicals, ML probability, sentiment, and fundamentals combined
- **Confidence score** with bullish/bearish probability
- **Time horizon:** Intraday, Swing, Positional, or Long-term
- **AI reasoning:** Explains why a setup is bullish or bearish
- **Risk warnings** and **invalidation conditions** for each trade idea
- **Trade rejection** when risk/reward is below the minimum threshold (1.5:1)

### Trade Execution Recommendations
- Ideal entry, safe entry zone, and aggressive entry zone
- Stop loss, ATR-based stop, and trailing stop
- Three profit targets (T1, T2, T3)
- Risk/reward ratio and suggested position size (% of capital)
- Chart overlays for entry, stop loss, and target levels

### Technical Analysis
- **Indicators:** RSI, MACD, EMA, SMA, VWAP, Bollinger Bands, Supertrend, ADX, Ichimoku, ATR, Stochastic RSI
- **Pattern detection:** Breakouts, double top/bottom, trend continuation, and more
- **Candlestick patterns:** Hammer, Doji, Engulfing, Morning Star, Harami, and others
- **Volume signals:** Unusual volume spike detection

### Fundamentals
- P/E, P/B, EPS, ROE, revenue growth, profit margin, debt/equity, institutional holding
- **Scores:** Overall, Growth, Valuation, and Financial Health
- **Valuation label:** Undervalued, Fairly Valued, or Overvalued

### Sentiment & Market Data
- FinBERT-powered news sentiment from latest headlines
- Smart ticker search with NSE/BSE auto-resolution (e.g. type `TCS` or `RELIANCE`)
- Localized currency (INR / USD)
- Day change and last-updated timestamp
- Persistent watchlist (browser localStorage)

### Dashboard
- Price chart with trade level overlays
- Technical indicators panel with detected patterns
- AI recommendation card with full trade parameters
- Sentiment panel and fundamentals grid

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Backend** | FastAPI, uvicorn, yfinance, pandas, pandas-ta, scikit-learn, transformers (FinBERT), PyTorch |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Recharts, Axios, Lucide React |

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm

---

## Quick Start

### Option 1 — One command (recommended)

From the **project root**:

```bash
# First time only — install everything
npm install
npm run install:all

# Start backend + frontend together
npm run dev
```

| Script | Description |
|--------|-------------|
| `npm run dev` | Start backend (port 8080) and frontend (port 5173) together |
| `npm run backend` | Start backend only |
| `npm run frontend` | Start frontend only |
| `npm run install:all` | Create Python venv, install pip + npm dependencies |

Then open **http://localhost:5173** in your browser.

> First startup may take longer while FinBERT downloads (~400MB). Subsequent API responses are cached for 5 minutes.

---

### Option 2 — Manual (two terminals)

**Install (first time only)**

```bash
cd backend
python -m venv venv
./venv/Scripts/activate    # Windows Git Bash
pip install -r requirements.txt

cd ../frontend
npm install
```

**Run**

Terminal 1 — Backend:

```bash
cd backend
./venv/Scripts/activate
python main.py
```

Terminal 2 — Frontend:

```bash
cd frontend
npm run dev
```

---

## Environment Variables

Optional settings for the backend (defaults shown):

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed frontend origins |
| `CACHE_TTL_SECONDS` | `300` | API response cache duration |
| `MIN_RISK_REWARD` | `1.5` | Minimum R:R to approve a trade setup |
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `8080` | Server port |

**Frontend**

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8080` | Backend API base URL |

Create `frontend/.env` to override:

```env
VITE_API_URL=http://localhost:8080
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/search/{query}` | Ticker autocomplete (min 2 characters) |
| `GET` | `/stock/{ticker}` | Full analysis: price, chart, prediction, sentiment, fundamentals |

**Example**

```bash
curl http://localhost:8080/stock/AAPL
curl http://localhost:8080/stock/RELIANCE
curl http://localhost:8080/search/TCS
```

---

## Project Structure

```text
Predictor/
├── package.json                # Root scripts (npm run dev)
├── backend/
│   ├── core/
│   │   └── config.py           # Environment settings
│   ├── services/
│   │   ├── cache.py            # TTL response cache
│   │   └── data_service.py     # yfinance data layer
│   ├── ml/
│   │   ├── engine.py           # ML + orchestration
│   │   ├── indicators.py       # Technical indicators
│   │   ├── patterns.py         # Chart & candlestick patterns
│   │   ├── fundamentals.py     # Fundamental scoring
│   │   ├── trade_levels.py     # Entry, SL, targets, R:R
│   │   ├── recommendation.py   # Multi-factor signal engine
│   │   └── sentiment.py        # FinBERT news sentiment
│   ├── main.py                 # FastAPI app (v2.0)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── stockApi.ts     # API client & types
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── StockChart.tsx
│   │   │   ├── PredictionCard.tsx
│   │   │   ├── IndicatorsPanel.tsx
│   │   │   ├── FundamentalsGrid.tsx
│   │   │   └── SentimentPanel.tsx
│   │   └── App.tsx
│   └── package.json
└── README.md
```

---

## How the AI Works

1. **Fetch** market data, news, and fundamentals from yfinance
2. **Calculate** 15+ technical indicators and detect chart/candlestick patterns
3. **Train** a Random Forest model (temporal split) for 5-day direction probability
4. **Score** sentiment (FinBERT) and fundamentals independently
5. **Combine** all signals into a composite recommendation
6. **Compute** entry zones, stop loss, targets, and risk/reward
7. **Reject** setups with poor R:R or conflicting high-volatility signals (Avoid)
8. **Return** reasoning, risks, and invalidation rules with every signal

---

## Deployment (Vercel + VM)

**Frontend** → [Vercel](https://vercel.com) (free)  
**Backend** → Oracle Cloud / GCP / any Linux VM (free tiers work)

### 1. Deploy backend on a VM

On an Ubuntu VM (SSH in after creating the instance):

```bash
git clone https://github.com/YOUR_USER/Predictor.git
cd Predictor
cp backend/.env.example backend/.env
# Edit backend/.env — set CORS_ORIGINS to your Vercel URL
sudo bash deploy/setup-vm.sh
```

Verify:

```bash
curl http://YOUR_VM_IP:8080/
```

Open **port 8080** in your cloud firewall (Oracle security list / GCP firewall rules).

Optional HTTPS: use `deploy/nginx-api.conf.example` + [Let's Encrypt](https://certbot.eff.org).

### 2. Deploy frontend on Vercel

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → Import repo.
3. Set **Root Directory** to `frontend`.
4. Add environment variable:

   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | `http://YOUR_VM_IP:8080` or `https://api.yourdomain.com` |

5. Deploy.

Vercel auto-detects Vite via `frontend/vercel.json`. After deploy, confirm `CORS_ORIGINS` in `backend/.env` matches your Vercel URL (e.g. `https://predictor-ai.vercel.app`), then restart the API:

```bash
sudo systemctl restart predictor-api
```

> First API request after VM boot may take 30–90s while FinBERT loads (~400MB).

---

## Roadmap

| Phase | Status |
|-------|--------|
| Multi-factor AI recommendation engine | Done |
| Entry/exit/stop-loss system | Done |
| Advanced technical analysis & patterns | Done |
| Fundamental scoring | Done |
| UI/UX upgrade (indicators, R:R, currency) | Done |
| Production deployment (Vercel + VM) | Done |
| Multi-timeframe analysis | Planned |
| Portfolio & risk management | Planned |
| Market scanners & alerts | Planned |
| Backtesting engine | Planned |
| AI market copilot (chat) | Planned |
| Authentication | Planned |

---

## Disclaimer

**This is not financial advice.** The analysis and recommendations provided by Predictor AI are for informational purposes only. Investing in the stock market involves risk of loss. Always consult a qualified financial advisor before making investment decisions. Past performance does not guarantee future results. No guaranteed profits are promised.

---

© 2026 Predictor AI Technologies. All rights reserved.
