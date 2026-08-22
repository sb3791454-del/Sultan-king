import React from 'react';
import { TradeSetup, IndicatorData } from '../types';
import { Zap, TrendingUp, TrendingDown, ArrowRight, Award, Shield, RefreshCw } from 'lucide-react';

interface ScanItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  setup: TradeSetup;
  ind: IndicatorData;
}

interface MarketScannerProps {
  scans: ScanItem[];
  isLoading: boolean;
  onRescan: () => void;
  onSelectSetup: (symbol: string) => void;
}

export const MarketScanner: React.FC<MarketScannerProps> = ({ scans, isLoading, onRescan, onSelectSetup }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Multi-Asset Confluence Scanner</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Quantitative engine scans 1H structure, EMA trends, RSI divergence, and MACD momentum in real time.
          </p>
        </div>

        <button
          onClick={onRescan}
          disabled={isLoading}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Scanning Markets...' : 'Rescan Live Markets'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scans.map((item) => {
          const isLong = item.setup.action === 'LONG';
          const isShort = item.setup.action === 'SHORT';

          return (
            <div
              key={item.symbol}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4.5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.name}</h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-xs font-mono text-slate-200">${item.price.toLocaleString()}</span>
                      <span className={`text-[11px] font-mono ${item.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase flex items-center space-x-1 ${
                        isLong
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isShort
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <span>{item.setup.action}</span>
                    </span>
                    <div className="text-[10px] font-bold text-amber-400 mt-1">
                      Score: {item.setup.confluenceScore}/10
                    </div>
                  </div>
                </div>

                {/* Strategy Details */}
                <div className="space-y-2 py-3 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Optimal Entry:</span>
                    <span className="font-mono font-semibold text-slate-200">
                      ${item.setup.entryZone[0]} - ${item.setup.entryZone[1]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Stop-Loss:</span>
                    <span className="font-mono font-semibold text-rose-400">${item.setup.stopLoss}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Take Profit 1 / 2:</span>
                    <span className="font-mono font-semibold text-emerald-400">
                      ${item.setup.takeProfit1} / ${item.setup.takeProfit2}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Risk-to-Reward:</span>
                    <span className="font-mono font-bold text-amber-400">{item.setup.riskRewardRatio}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => onSelectSetup(item.symbol)}
                className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-800 flex items-center justify-center space-x-1.5 transition-all"
              >
                <span>Open Full Breakdown</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
