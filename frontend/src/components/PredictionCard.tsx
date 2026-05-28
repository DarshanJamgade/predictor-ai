import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  ShieldAlert,
  Zap,
  AlertTriangle,
  Clock,
  Scale,
  Ban,
} from 'lucide-react';
import { type Prediction, formatPrice } from '../api/stockApi';

interface PredictionCardProps {
  prediction: Prediction | null;
  currencySymbol?: string;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, currencySymbol = '$' }) => {
  if (!prediction) return null;

  const { suggestion, confidence, prices, risk, reasoning, risks, invalidation } = prediction;
  const fmt = (v: number) => formatPrice(v, currencySymbol);

  const getColor = () => {
    if (suggestion === 'AVOID') return 'text-slate-300 border-slate-500/30 bg-slate-500/10';
    if (suggestion.includes('BUY')) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (suggestion.includes('SELL')) return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  };

  const getIcon = () => {
    if (suggestion === 'AVOID') return <Ban className="w-8 h-8" />;
    if (suggestion.includes('BUY')) return <TrendingUp className="w-8 h-8" />;
    if (suggestion.includes('SELL')) return <TrendingDown className="w-8 h-8" />;
    return <Minus className="w-8 h-8" />;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className={`p-6 rounded-2xl border ${getColor()} flex items-center justify-between shadow-lg shadow-black/20`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">AI Recommendation</p>
          <h2 className="text-3xl font-black tracking-tight">{suggestion}</h2>
          {prediction.time_horizon && (
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {prediction.time_horizon}
            </p>
          )}
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Confidence</p>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-black tracking-tight">{confidence}%</h2>
            {getIcon()}
          </div>
        </div>
      </div>

      {(prediction.bullish_probability !== undefined || prediction.risk_reward !== undefined) && (
        <div className="grid grid-cols-2 gap-3">
          {prediction.bullish_probability !== undefined && (
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <p className="text-[10px] font-bold text-emerald-500/60 uppercase">Bullish Prob.</p>
              <p className="text-xl font-black text-emerald-400">{prediction.bullish_probability}%</p>
            </div>
          )}
          {prediction.bearish_probability !== undefined && (
            <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
              <p className="text-[10px] font-bold text-rose-500/60 uppercase">Bearish Prob.</p>
              <p className="text-xl font-black text-rose-400">{prediction.bearish_probability}%</p>
            </div>
          )}
          {prediction.risk_reward !== undefined && (
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl col-span-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-400" />
                <p className="text-xs font-bold text-blue-400 uppercase">Risk / Reward</p>
              </div>
              <p className="text-xl font-black text-blue-300">1 : {prediction.risk_reward}</p>
            </div>
          )}
        </div>
      )}

      {prediction.trade_valid === false && prediction.rejection_reason && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-400">Trade Rejected</p>
            <p className="text-xs text-slate-400 mt-1">{prediction.rejection_reason}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-900/80 rounded-2xl border border-slate-700 p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-slate-200">Trade Parameters</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 text-sm font-medium">Ideal Entry</span>
            <span className="text-slate-100 font-mono font-bold">{fmt(prices.entry)}</span>
          </div>

          {prices.entry_zones && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 font-bold uppercase text-[10px] mb-1">Safe Zone</p>
                <p className="font-mono text-slate-300">{fmt(prices.entry_zones.safe.low)} – {fmt(prices.entry_zones.safe.high)}</p>
              </div>
              <div className="p-2 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <p className="text-slate-500 font-bold uppercase text-[10px] mb-1">Aggressive</p>
                <p className="font-mono text-slate-300">{fmt(prices.entry_zones.aggressive)}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
              <span>Targets</span>
              <Target className="w-3 h-3" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'T1', value: prices.target_short },
                { label: 'T2', value: prices.target_medium },
                { label: 'T3', value: prices.target_long },
              ].map((t) => (
                <div key={t.label} className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-center">
                  <p className="text-[10px] text-emerald-500/60 font-bold mb-1">{t.label}</p>
                  <p className="text-emerald-400 font-mono font-bold text-sm">{fmt(t.value)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex justify-between items-center">
              <span className="text-rose-400 text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Stop Loss
              </span>
              <span className="text-rose-400 font-mono font-bold">{fmt(prices.stop_loss)}</span>
            </div>
            {prices.trailing_stop && (
              <div className="p-2 bg-slate-800/30 rounded-lg flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">Trailing Stop</span>
                <span className="font-mono text-slate-300">{fmt(prices.trailing_stop)}</span>
              </div>
            )}
          </div>

          {prediction.position_size_pct && (
            <div className="p-2 bg-indigo-500/5 border border-indigo-500/20 rounded-lg text-xs flex justify-between">
              <span className="text-indigo-400 font-bold">Suggested Position Size</span>
              <span className="font-mono text-indigo-300">{prediction.position_size_pct}% of capital</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900/80 rounded-2xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-200">Risk Analysis</h3>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              risk.level === 'Low'
                ? 'bg-emerald-500/20 text-emerald-400'
                : risk.level === 'Medium'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {risk.level} Risk • {prediction.volatility_level ?? 'Medium'} Vol
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4">
          <div
            className={`h-1.5 rounded-full ${
              risk.score < 4 ? 'bg-emerald-500' : risk.score < 7 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${risk.score * 10}%` }}
          />
        </div>

        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">AI Reasoning</p>
        <div className="space-y-2 mb-4">
          {reasoning.map((reason, idx) => (
            <div key={idx} className="flex gap-2 text-xs text-slate-400 leading-relaxed">
              <span className="text-blue-400 mt-0.5">•</span>
              {reason}
            </div>
          ))}
        </div>

        {risks && risks.length > 0 && (
          <>
            <p className="text-[10px] font-bold text-rose-500/60 uppercase tracking-widest mb-2">Key Risks</p>
            <div className="space-y-2 mb-4">
              {risks.map((riskItem, idx) => (
                <div key={idx} className="flex gap-2 text-xs text-slate-500 leading-relaxed">
                  <span className="text-rose-400 mt-0.5">!</span>
                  {riskItem}
                </div>
              ))}
            </div>
          </>
        )}

        {invalidation && invalidation.length > 0 && (
          <>
            <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest mb-2">Invalidation</p>
            <div className="space-y-2">
              {invalidation.map((item, idx) => (
                <div key={idx} className="flex gap-2 text-xs text-slate-500 leading-relaxed">
                  <span className="text-amber-400 mt-0.5">×</span>
                  {item}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PredictionCard;
