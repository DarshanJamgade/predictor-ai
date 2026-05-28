import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { type StockHistory } from '../api/stockApi';

interface TradeLevels {
  entry?: number;
  stop_loss?: number;
  target_short?: number;
}

interface StockChartProps {
  data: StockHistory[];
  ticker: string;
  currencySymbol?: string;
  tradeLevels?: TradeLevels;
}

const StockChart: React.FC<StockChartProps> = ({
  data,
  ticker,
  currencySymbol = '$',
  tradeLevels,
}) => {
  const gradientId = useMemo(() => `priceGradient-${ticker.replace(/[^a-zA-Z0-9]/g, '')}`, [ticker]);

  if (!data.length) {
    return (
      <div className="h-[400px] w-full bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex items-center justify-center">
        <p className="text-slate-500 text-sm">No chart data available</p>
      </div>
    );
  }

  const fmt = (value: number) =>
    `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="h-[420px] w-full bg-slate-900/50 p-4 rounded-xl border border-slate-700">
      <h3 className="text-slate-400 text-sm font-medium mb-4">{ticker} Price History (1Y)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
            }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(value) => fmt(value)}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
            itemStyle={{ color: '#3b82f6' }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value) => [fmt(Number(value)), 'Close']}
          />
          {tradeLevels?.stop_loss && (
            <ReferenceLine y={tradeLevels.stop_loss} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'SL', fill: '#f43f5e', fontSize: 10 }} />
          )}
          {tradeLevels?.entry && (
            <ReferenceLine y={tradeLevels.entry} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Entry', fill: '#22c55e', fontSize: 10 }} />
          )}
          {tradeLevels?.target_short && (
            <ReferenceLine y={tradeLevels.target_short} stroke="#38bdf8" strokeDasharray="4 4" label={{ value: 'T1', fill: '#38bdf8', fontSize: 10 }} />
          )}
          <Area
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
