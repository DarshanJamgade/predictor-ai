import React from 'react';
import { Activity, Gauge } from 'lucide-react';
import { type Prediction } from '../api/stockApi';

interface IndicatorsPanelProps {
  indicators: Prediction['indicators'];
  patterns?: Prediction['patterns'];
}

const IndicatorsPanel: React.FC<IndicatorsPanelProps> = ({ indicators, patterns }) => {
  const rows = [
    { label: 'RSI (14)', value: indicators.RSI, signal: indicators.RSI < 30 ? 'Oversold' : indicators.RSI > 70 ? 'Overbought' : 'Neutral' },
    { label: 'MACD', value: indicators.MACD, signal: indicators.MACD > (indicators.MACD_Signal ?? 0) ? 'Bullish' : 'Bearish' },
    { label: 'ADX', value: indicators.ADX, signal: (indicators.ADX ?? 0) >= 25 ? 'Strong Trend' : 'Weak Trend' },
    { label: 'Stoch RSI', value: indicators.STOCH_RSI, signal: (indicators.STOCH_RSI ?? 50) < 20 ? 'Oversold' : (indicators.STOCH_RSI ?? 50) > 80 ? 'Overbought' : 'Neutral' },
    { label: 'SMA 50', value: indicators.SMA_50, signal: 'Support/Resistance' },
    { label: 'SMA 200', value: indicators.SMA_200, signal: 'Long-term Trend' },
    { label: 'ATR', value: indicators.ATR, signal: 'Volatility' },
    { label: 'VWAP', value: indicators.VWAP, signal: 'Institutional Level' },
  ];

  const signalColor = (signal: string) => {
    if (['Bullish', 'Oversold', 'Strong Trend'].includes(signal)) return 'text-emerald-400';
    if (['Bearish', 'Overbought'].includes(signal)) return 'text-rose-400';
    return 'text-slate-400';
  };

  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
      <div className="flex items-center gap-2 mb-6">
        <Gauge className="w-5 h-5 text-cyan-400" />
        <h3 className="font-bold text-slate-200">Technical Indicators</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {rows.map((row) => (
          <div key={row.label} className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{row.label}</p>
            <p className="text-lg font-mono font-bold text-slate-100">{row.value?.toFixed(2) ?? 'N/A'}</p>
            <p className={`text-[10px] font-bold mt-1 ${signalColor(row.signal)}`}>{row.signal}</p>
          </div>
        ))}
      </div>

      {patterns && patterns.all.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-violet-400" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detected Patterns</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {patterns.all.map((pattern) => (
              <span key={pattern} className="px-3 py-1 text-[10px] font-bold uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-full">
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IndicatorsPanel;
