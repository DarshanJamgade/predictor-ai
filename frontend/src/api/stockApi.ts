import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface StockHistory {
  date: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface DayChange {
  change: number;
  change_percent: number;
  previous_close: number;
}

export interface EntryZones {
  ideal: number;
  safe: { low: number; high: number };
  aggressive: number;
}

export interface Prediction {
  suggestion: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG SELL' | 'AVOID';
  confidence: number;
  composite_score?: number;
  bullish_probability?: number;
  bearish_probability?: number;
  time_horizon?: 'Intraday' | 'Swing' | 'Positional' | 'Long-term';
  trend_strength?: string;
  trend_direction?: string;
  volatility_level?: string;
  risk_reward?: number;
  position_size_pct?: number;
  trade_valid?: boolean;
  rejection_reason?: string | null;
  prices: {
    entry: number;
    entry_zones?: EntryZones;
    target_short: number;
    target_medium: number;
    target_long: number;
    targets?: {
      target_1: number;
      target_2: number;
      target_3: number;
    };
    stop_loss: number;
    atr_stop_loss?: number;
    trailing_stop?: number;
  };
  risk: {
    score: number;
    level: 'Low' | 'Medium' | 'High';
    volatility: number;
  };
  indicators: Record<string, number>;
  patterns?: {
    candlesticks: string[];
    chart_patterns: string[];
    volume_signals: string[];
    all: string[];
  };
  reasoning: string[];
  risks?: string[];
  invalidation?: string[];
  fundamentals_score?: {
    fundamental_score: number;
    growth_score: number;
    valuation_score: number;
    financial_health_score: number;
    valuation_label: string;
  };
}

export interface StockData {
  ticker: string;
  displayTicker: string;
  exchange: string;
  name: string;
  currentPrice: number;
  currency: string;
  currencySymbol: string;
  dayChange?: DayChange;
  summary: string;
  history: StockHistory[];
  prediction: Prediction | null;
  sentiment: {
    score: number;
    label: string;
    headlines: string[];
  };
  fundamentals: {
    pe_ratio: number | null;
    pb_ratio?: number | null;
    eps: number | null;
    revenue_growth: number | null;
    profit_margin: number | null;
    market_cap: number | null;
    dividend_yield: number | null;
    debt_to_equity: number | null;
    roe?: number | null;
    institutional_holding?: number | null;
    promoter_holding?: number | null;
    earnings_growth?: number | null;
  };
  meta?: {
    lastUpdated: string;
    dataSource: string;
    disclaimer: string;
  };
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export const fetchStockData = async (ticker: string, signal?: AbortSignal): Promise<StockData> => {
  const response = await axios.get(`${API_BASE_URL}/stock/${ticker}`, { signal, timeout: 120000 });
  return response.data;
};

export const searchTickers = async (query: string, signal?: AbortSignal): Promise<SearchResult[]> => {
  if (!query || query.length < 2) return [];
  const response = await axios.get(`${API_BASE_URL}/search/${query}`, { signal, timeout: 15000 });
  return response.data;
};

export const formatPrice = (value: number, symbol: string = '$') =>
  `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
