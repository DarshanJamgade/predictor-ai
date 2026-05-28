import React from 'react';
import { Newspaper, MessageSquare } from 'lucide-react';

interface SentimentPanelProps {
  sentiment: {
    score: number;
    label: string;
    headlines: string[];
  };
}

const SentimentPanel: React.FC<SentimentPanelProps> = ({ sentiment }) => {
  const getLabelColor = () => {
    switch (sentiment.label) {
      case 'Positive': return 'bg-emerald-500/20 text-emerald-400';
      case 'Negative': return 'bg-rose-500/20 text-rose-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-slate-200">Market Sentiment</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getLabelColor()}`}>
          {sentiment.label}
        </span>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          AI-analyzed aggregate score: <span className="text-slate-200 font-mono">{sentiment.score}</span>
        </p>
        
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Newspaper className="w-3 h-3" /> Latest Headlines
          </p>
          {sentiment.headlines.length > 0 ? (
            sentiment.headlines.map((headline, idx) => (
              <div key={idx} className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 text-sm text-slate-300">
                {headline}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 italic">No recent news found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SentimentPanel;
