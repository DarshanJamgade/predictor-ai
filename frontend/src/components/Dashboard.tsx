import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Loader2,
  BarChart2,
  Briefcase,
  Star,
  StarOff,
  AlertTriangle,
  Info,
  Globe,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { fetchStockData, searchTickers, formatPrice, type StockData, type SearchResult } from '../api/stockApi';
import StockChart from './StockChart';
import PredictionCard from './PredictionCard';
import SentimentPanel from './SentimentPanel';
import FundamentalsGrid from './FundamentalsGrid';
import IndicatorsPanel from './IndicatorsPanel';

const Dashboard: React.FC = () => {
  const [ticker, setTicker] = useState('AAPL');
  const [input, setInput] = useState('AAPL');
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('watchlist');
    return saved ? JSON.parse(saved) : ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'];
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async (symbol: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    try {
      const result = await fetchStockData(symbol, controller.signal);
      if (!controller.signal.aborted) {
        setData(result);
        setTicker(symbol);
        setInput(symbol);
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'Failed to fetch stock data. Please check the ticker symbol.');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData(ticker);
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (input.length >= 2 && input !== ticker) {
        try {
          const results = await searchTickers(input);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [input, ticker]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      loadData(input.toUpperCase());
    }
  };

  const toggleWatchlist = (symbol: string) => {
    if (watchlist.includes(symbol)) {
      setWatchlist(watchlist.filter((s) => s !== symbol));
    } else {
      setWatchlist([...watchlist, symbol]);
    }
  };

  const dayChange = data?.dayChange;
  const isPositive = (dayChange?.change ?? 0) >= 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <BarChart2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none">PREDICTOR AI</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
                Institutional Trading Copilot
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-[400px]" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => input.length >= 2 && setShowSuggestions(true)}
                placeholder="Search (e.g. RELIANCE, TCS, AAPL)"
                aria-label="Search stock ticker"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {loading ? (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                ) : (
                  <div className="group relative">
                    <Info className="w-4 h-4 text-slate-600 cursor-help hover:text-slate-400" />
                    <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-[10px] text-slate-400 leading-relaxed">
                      <p className="font-bold text-slate-200 mb-1">Advanced Search</p>
                      <p>• For NSE: Just type TCS or TCS.NS</p>
                      <p>• For BSE: Type TCS.BO</p>
                      <p>• For US Stocks: Type AAPL or NVDA</p>
                    </div>
                  </div>
                )}
              </div>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50" role="listbox">
                {suggestions.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => loadData(result.symbol)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{result.symbol}</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{result.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-600 uppercase bg-slate-800 px-2 py-0.5 rounded">{result.exchange}</span>
                      <Globe className="w-3 h-3 text-slate-700 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <aside className="lg:col-span-1 space-y-8">
            <div className="bg-slate-900/40 rounded-3xl border border-slate-800/50 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <h3 className="font-bold text-slate-300">Watchlist</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{watchlist.length} Tickers</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {watchlist.map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => loadData(symbol)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      ticker === symbol
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-3xl border border-blue-500/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-slate-200">AI Copilot</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Multi-factor engine combining technical analysis, sentiment, fundamentals, pattern detection, and risk-adjusted trade levels.
              </p>
            </div>
          </aside>

          <main className="lg:col-span-3 space-y-10">
            {error ? (
              <div className="p-12 bg-rose-500/5 border border-rose-500/20 rounded-3xl text-center shadow-2xl shadow-rose-500/5">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-rose-400 mb-2">Analysis Failed</h3>
                <p className="text-slate-400 max-w-sm mx-auto text-sm leading-relaxed mb-6">{error}</p>
                <button
                  onClick={() => loadData('AAPL')}
                  className="px-6 py-2 bg-slate-800 rounded-full text-xs font-bold hover:bg-slate-700 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : data ? (
              <>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800/50">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <h2 className="text-5xl font-black text-white tracking-tight">{data.displayTicker || data.ticker}</h2>
                      <button
                        onClick={() => toggleWatchlist(data.ticker)}
                        aria-label={watchlist.includes(data.ticker) ? 'Remove from watchlist' : 'Add to watchlist'}
                        className="p-2 hover:bg-slate-800/50 rounded-xl transition-all"
                      >
                        {watchlist.includes(data.ticker) ? (
                          <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
                        ) : (
                          <StarOff className="w-7 h-7 text-slate-700" />
                        )}
                      </button>
                    </div>
                    <p className="text-xl text-slate-400 font-semibold tracking-tight">{data.name}</p>
                  </div>
                  <div className="text-left md:text-right space-y-2">
                    <p className="text-4xl font-mono font-black text-white">
                      {formatPrice(data.currentPrice, data.currencySymbol)}
                    </p>
                    {dayChange && (
                      <div className={`flex items-center md:justify-end gap-2 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="font-mono font-bold text-sm">
                          {isPositive ? '+' : ''}{dayChange.change.toFixed(2)} ({isPositive ? '+' : ''}{dayChange.change_percent}%)
                        </span>
                      </div>
                    )}
                    <div className="flex items-center md:justify-end gap-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {data.exchange} • {data.currency}
                      </span>
                      <button
                        onClick={() => loadData(data.ticker)}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-blue-400 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Refresh
                      </button>
                    </div>
                    {data.meta?.lastUpdated && (
                      <p className="text-[10px] text-slate-600">
                        Updated {new Date(data.meta.lastUpdated).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                  <div className="xl:col-span-2 space-y-10">
                    <StockChart
                      data={data.history}
                      ticker={data.ticker}
                      currencySymbol={data.currencySymbol}
                      tradeLevels={
                        data.prediction
                          ? {
                              entry: data.prediction.prices.entry,
                              stop_loss: data.prediction.prices.stop_loss,
                              target_short: data.prediction.prices.target_short,
                            }
                          : undefined
                      }
                    />
                    {data.prediction && (
                      <IndicatorsPanel
                        indicators={data.prediction.indicators}
                        patterns={data.prediction.patterns}
                      />
                    )}
                    <FundamentalsGrid
                      fundamentals={data.fundamentals}
                      currencySymbol={data.currencySymbol}
                      scores={data.prediction?.fundamentals_score}
                    />
                    <div className="bg-slate-900/30 p-8 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Company Overview</h4>
                      <p className="text-sm text-slate-400 leading-relaxed font-medium">{data.summary || 'No company summary available.'}</p>
                    </div>
                  </div>

                  <div className="xl:col-span-1 space-y-10">
                    {data.prediction ? (
                      <PredictionCard prediction={data.prediction} currencySymbol={data.currencySymbol} />
                    ) : (
                      <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl text-center space-y-4">
                        <AlertTriangle className="w-10 h-10 text-amber-500/50 mx-auto" />
                        <div>
                          <p className="text-slate-200 font-bold">No AI Analysis</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Not enough historical data available to generate a reliable trade setup for this ticker.
                          </p>
                        </div>
                      </div>
                    )}
                    <SentimentPanel sentiment={data.sentiment} />
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center text-slate-500">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                  <Loader2 className="w-16 h-16 animate-spin text-blue-500 relative z-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-300 mb-1">Generating AI Analysis</h3>
                <p className="text-sm font-medium opacity-50 italic">Aggregating market signals and sentiment...</p>
              </div>
            )}

            <footer className="mt-20 pt-10 border-t border-slate-800/50 text-center space-y-4 pb-12">
              <div className="flex items-center justify-center gap-2 text-rose-500/60">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Regulatory Disclaimer</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-2xl mx-auto uppercase tracking-tighter font-bold">
                The analysis and recommendations provided by Predictor AI are for informational purposes only. This is not financial advice. Investing involves risk. Past performance does not guarantee future results.
              </p>
              <p className="text-[10px] text-slate-700 font-bold">© 2026 PREDICTOR AI TECHNOLOGIES. ALL RIGHTS RESERVED.</p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
