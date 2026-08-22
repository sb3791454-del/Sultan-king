import React from 'react';
import { MarketTicker } from '../types';
import { TrendingUp, TrendingDown, Coins } from 'lucide-react';

interface MarketTickerBarProps {
  tickers: MarketTicker[];
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string;
}

export const MarketTickerBar: React.FC<MarketTickerBarProps> = ({ tickers, onSelectSymbol, selectedSymbol }) => {
  return (
    <div className="bg-slate-950/80 border-b border-slate-800/80 py-2 px-4 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto flex items-center space-x-3 min-w-max">
        <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium mr-2">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>Live Feeds:</span>
        </div>

        {tickers.map((t) => {
          const isSelected = selectedSymbol.toUpperCase().includes(t.symbol.toUpperCase()) || t.symbol.toUpperCase().includes(selectedSymbol.toUpperCase());
          const isPos = t.change24h >= 0;

          return (
            <button
              key={t.symbol}
              onClick={() => onSelectSymbol(t.symbol)}
              className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs transition-all border ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
              }`}
            >
              <span className="font-semibold">{t.symbol === 'PAXGUSDT' ? 'XAU/USD' : t.name.split('/')[0].trim()}</span>
              <span className="text-slate-100 font-mono">${t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`flex items-center font-mono text-[11px] ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPos ? <TrendingUp className="w-3 h-3 mr-0.5 inline" /> : <TrendingDown className="w-3 h-3 mr-0.5 inline" />}
                {isPos ? '+' : ''}{t.change24h.toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
