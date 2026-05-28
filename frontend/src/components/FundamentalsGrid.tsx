import React from 'react';
import { Landmark, Activity, TrendingUp } from 'lucide-react';
import { formatPrice } from '../api/stockApi';

interface FundamentalsGridProps {
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
    earnings_growth?: number | null;
  };
  currencySymbol?: string;
  scores?: {
    fundamental_score: number;
    growth_score: number;
    valuation_score: number;
    financial_health_score: number;
    valuation_label: string;
  };
}

const FundamentalsGrid: React.FC<FundamentalsGridProps> = ({
  fundamentals,
  currencySymbol = '$',
  scores,
}) => {
  const formatValue = (
    val: number | null,
    type: 'number' | 'percent' | 'currency' | 'ratio' = 'number'
  ) => {
    if (val === null || val === undefined) return 'N/A';

    switch (type) {
      case 'percent':
        return `${(val * 100).toFixed(2)}%`;
      case 'currency':
        if (val >= 1e12) return `${currencySymbol}${(val / 1e12).toFixed(2)}T`;
        if (val >= 1e9) return `${currencySymbol}${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e6) return `${currencySymbol}${(val / 1e6).toFixed(2)}M`;
        return formatPrice(val, currencySymbol);
      case 'ratio':
        return val.toFixed(2);
      default:
        return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
  };

  const valuationColor =
    scores?.valuation_label === 'Undervalued'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : scores?.valuation_label === 'Overvalued'
        ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
        : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-slate-200">Fundamental Analysis</h3>
        </div>
        {scores && (
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${valuationColor}`}>
            {scores.valuation_label}
          </span>
        )}
      </div>

      {scores && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Overall', value: scores.fundamental_score },
            { label: 'Growth', value: scores.growth_score },
            { label: 'Valuation', value: scores.valuation_score },
            { label: 'Health', value: scores.financial_health_score },
          ].map((s) => (
            <div key={s.label} className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-center">
              <p className="text-[10px] font-bold text-indigo-400/60 uppercase">{s.label}</p>
              <p className="text-xl font-black text-indigo-300">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">P/E Ratio</p>
          <p className="text-lg font-mono font-bold text-slate-200">{formatValue(fundamentals.pe_ratio, 'ratio')}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">P/B Ratio</p>
          <p className="text-lg font-mono font-bold text-slate-200">{formatValue(fundamentals.pb_ratio ?? null, 'ratio')}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">EPS</p>
          <p className="text-lg font-mono font-bold text-slate-200">{formatValue(fundamentals.eps)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ROE</p>
          <p className="text-lg font-mono font-bold text-slate-200">{formatValue(fundamentals.roe ?? null, 'percent')}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Profit Margin</p>
          <p className="text-lg font-mono font-bold text-slate-200">{formatValue(fundamentals.profit_margin, 'percent')}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Revenue Growth</p>
          <p className="text-lg font-mono font-bold text-slate-200">{formatValue(fundamentals.revenue_growth, 'percent')}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Market Cap</p>
          <p className="text-lg font-mono font-bold text-slate-200">{formatValue(fundamentals.market_cap, 'currency')}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Institutional Hold</p>
          <p className="text-lg font-mono font-bold text-slate-200">{formatValue(fundamentals.institutional_holding ?? null, 'percent')}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Dividend Yield</p>
          <p className="text-lg font-mono font-bold text-slate-200">{formatValue(fundamentals.dividend_yield, 'percent')}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Debt to Equity</p>
          <p className="text-lg font-mono font-bold text-slate-200">{formatValue(fundamentals.debt_to_equity, 'ratio')}</p>
        </div>
        <div className="flex items-center gap-2 text-indigo-400/50 col-span-2">
          <TrendingUp className="w-4 h-4" />
          <Activity className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Fundamental Metrics</span>
        </div>
      </div>
    </div>
  );
};

export default FundamentalsGrid;
