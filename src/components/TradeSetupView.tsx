import React, { useState } from 'react';
import { TradeSetup, IndicatorData, Candle } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Sparkles,
  Zap,
  Copy,
  Check,
  Search,
  Activity,
  Award,
  ArrowRight,
  Send,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface TradeSetupViewProps {
  setup: TradeSetup | null;
  indicators: IndicatorData | null;
  candles: Candle[];
  isLoading: boolean;
  onAnalyze: (symbol: string, timeframe: '15m' | '1h' | '4h' | '1d', query?: string) => void;
  selectedSymbol: string;
  selectedTimeframe: '15m' | '1h' | '4h' | '1d';
  onOpenDiagnostics?: () => void;
}

export const TradeSetupView: React.FC<TradeSetupViewProps> = ({
  setup,
  indicators,
  candles,
  isLoading,
  onAnalyze,
  selectedSymbol,
  selectedTimeframe,
  onOpenDiagnostics,
}) => {
  const [queryInput, setQueryInput] = useState('');
  const [customSearch, setCustomSearch] = useState(selectedSymbol);
  const [copied, setCopied] = useState(false);

  const quickSymbols = [
    { label: '🥇 Gold (XAU/USD)', val: 'XAUUSD' },
    { label: '₿ Bitcoin (BTC)', val: 'BTCUSDT' },
    { label: '⟠ Ethereum (ETH)', val: 'ETHUSDT' },
    { label: '🚀 Solana (SOL)', val: 'SOLUSDT' },
    { label: '💧 XRP', val: 'XRPUSDT' },
    { label: '🐕 DOGE', val: 'DOGEUSDT' },
  ];

  const timeframes: Array<'15m' | '1h' | '4h' | '1d'> = ['15m', '1h', '4h', '1d'];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSearch.trim()) {
      onAnalyze(customSearch.trim(), selectedTimeframe, queryInput.trim() || undefined);
    }
  };

  const handleCopyCard = () => {
    if (setup?.telegramFormattedCard) {
      navigator.clipboard.writeText(setup.telegramFormattedCard);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Prepare chart data
  const chartData = candles.map((c, i) => {
    const date = new Date(c.time);
    const timeLabel = selectedTimeframe === '1d' ? `${date.getMonth() + 1}/${date.getDate()}` : `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    return {
      time: timeLabel,
      price: c.close,
      high: c.high,
      low: c.low,
      open: c.open,
    };
  });

  const isLong = setup?.action === 'LONG';
  const isShort = setup?.action === 'SHORT';

  return (
    <div className="space-y-6">
      {/* Search & Query Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-col lg:flex-row items-center gap-3">
            {/* Symbol input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search symbol (e.g. Gold, XAUUSD, BTC, SOL, ETH)..."
                value={customSearch}
                onChange={(e) => setCustomSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
              />
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-700/80 w-full lg:w-auto justify-center">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => onAnalyze(customSearch, tf, queryInput || undefined)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                    selectedTimeframe === tf
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Analyze Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full lg:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>{isLoading ? 'Calculating...' : 'Generate Setup'}</span>
            </button>
          </div>

          {/* Quick Natural Language Prompt Bar */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              type="text"
              placeholder="Ask anything (e.g. 'Give me a good gold usdt setup', 'Is it safe to long BTC 1h?')..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="flex-1 bg-transparent text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {/* Quick select pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Popular:</span>
            {quickSymbols.map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => {
                  setCustomSearch(item.val);
                  onAnalyze(item.val, selectedTimeframe);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  customSearch.toUpperCase().includes(item.val)
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Main Signal Display */}
      {setup && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Signal Card & Live Chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Signal Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-extrabold text-white tracking-tight">
                      {setup.symbol}
                    </h2>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono font-medium">
                      {setup.timeframe.toUpperCase()}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase flex items-center space-x-1 ${
                        isLong
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isShort
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isLong ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : isShort ? <TrendingDown className="w-3.5 h-3.5 mr-1" /> : null}
                      <span>{setup.action} ORDER</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{setup.aiExplanation.headline}</p>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Diagnostics Button */}
                  {onOpenDiagnostics && (
                    <button
                      type="button"
                      onClick={onOpenDiagnostics}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                      title="Inspect Quantitative Formulas, Raw Inputs & Live Feeds"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Diagnostics & Math Proof</span>
                    </button>
                  )}

                  {/* Confluence Rating */}
                  <div className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span className="text-lg font-black text-amber-400">{setup.confluenceScore}/10</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {setup.probabilityRating.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Core Trade Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-medium block">Current Price</span>
                  <span className="text-base font-bold font-mono text-white mt-0.5 block">
                    ${setup.currentPrice.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-medium block">Entry Zone</span>
                  <span className="text-sm font-bold font-mono text-amber-400 mt-0.5 block">
                    ${setup.entryZone[0].toLocaleString()} - ${setup.entryZone[1].toLocaleString()}
                  </span>
                </div>

                <div className="bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20">
                  <span className="text-[11px] text-rose-300 font-medium block">Stop-Loss (SL)</span>
                  <span className="text-base font-bold font-mono text-rose-400 mt-0.5 block">
                    ${setup.stopLoss.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-rose-400/80">-{setup.riskPercent}% Risk</span>
                </div>

                <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
                  <span className="text-[11px] text-emerald-300 font-medium block">Risk-to-Reward</span>
                  <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
                    {setup.riskRewardRatio}
                  </span>
                  <span className="text-[10px] text-emerald-400/80">Institutional Edge</span>
                </div>
              </div>

              {/* Take-Profit Targets */}
              <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>Precision Take-Profit Targets</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>TP 1 (50% Close)</span>
                      <span className="text-emerald-400 font-bold">+1.5R</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-emerald-300 mt-1 block">
                      ${setup.takeProfit1.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">Move SL to Break-Even</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>TP 2 (30% Close)</span>
                      <span className="text-emerald-400 font-bold">+2.6R</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-emerald-300 mt-1 block">
                      ${setup.takeProfit2.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">Lock Majority Profit</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>TP 3 (20% Runner)</span>
                      <span className="text-emerald-400 font-bold">+3.8R</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-emerald-300 mt-1 block">
                      ${setup.takeProfit3.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">Trailing Moonbag Target</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Interactive Price Chart with Setup Reference Lines */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Price Action & Target Levels</h3>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center space-x-1 text-rose-400">
                    <span className="w-2.5 h-0.5 bg-rose-500 inline-block"></span>
                    <span>Stop-Loss (${setup.stopLoss})</span>
                  </span>
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <span className="w-2.5 h-0.5 bg-emerald-500 inline-block"></span>
                    <span>TP2 (${setup.takeProfit2})</span>
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                    <YAxis
                      domain={['dataMin - 10', 'dataMax + 10']}
                      stroke="#475569"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#priceGradient)" />
                    {/* Setup Reference Lines */}
                    <ReferenceLine y={setup.stopLoss} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'SL', fill: '#f43f5e', fontSize: 10 }} />
                    <ReferenceLine y={setup.entryZone[0]} stroke="#38bdf8" strokeDasharray="2 2" label={{ value: 'Entry', fill: '#38bdf8', fontSize: 10 }} />
                    <ReferenceLine y={setup.takeProfit1} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'TP1', fill: '#10b981', fontSize: 10 }} />
                    <ReferenceLine y={setup.takeProfit2} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'TP2', fill: '#10b981', fontSize: 10 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Technical Indicator Indicators strip */}
              {indicators && (
                <div className="space-y-3 pt-4 mt-2 border-t border-slate-800">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">RSI (14)</span>
                      <span className="font-semibold text-slate-200">{indicators.rsi14.toFixed(1)} ({indicators.rsiSignal})</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">EMA Trend</span>
                      <span className="font-semibold text-slate-200">{indicators.emaTrend.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">MACD</span>
                      <span className="font-semibold text-slate-200">{indicators.macd.crossover.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">ATR Volatility</span>
                      <span className="font-semibold text-slate-200">${indicators.atr14.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Smart Money Concepts (SMC) Section */}
                  {indicators.smc && (
                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" /> Smart Money Concepts (SMC) Intelligence
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
                          Bias: {indicators.smc.marketStructure.structuralBias}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                        <div className="bg-slate-900/90 p-2 rounded border border-slate-800/60">
                          <span className="text-slate-400 block text-[10px] font-sans">Active Order Blocks:</span>
                          <span className="text-emerald-400 font-bold">
                            {indicators.smc.orderBlocks.filter(o => !o.mitigated).length} Fresh OBs
                          </span>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded border border-slate-800/60">
                          <span className="text-slate-400 block text-[10px] font-sans">Fair Value Gaps (FVG):</span>
                          <span className="text-amber-300 font-bold">
                            {indicators.smc.fairValueGaps.filter(f => !f.mitigated).length} Open Gaps
                          </span>
                        </div>
                        <div className="bg-slate-900/90 p-2 rounded border border-slate-800/60">
                          <span className="text-slate-400 block text-[10px] font-sans">Liquidity Pools:</span>
                          <span className="text-sky-300 font-bold">
                            {indicators.smc.liquidityPools.length} Identified Levels
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right 1 Column: Gemini AI Analysis & Telegram Card */}
          <div className="space-y-6">
            {/* AI Explanation Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Gemini AI Synthesis</h3>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Core Rationale</span>
                <p className="text-xs text-slate-200 leading-relaxed mt-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {setup.aiExplanation.simpleRationale}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Execution Steps</span>
                <ul className="mt-1.5 space-y-1.5">
                  {setup.aiExplanation.stepByStepPlan.map((step, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
                      <span className="text-amber-400 font-bold shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                <span className="text-xs font-semibold text-rose-300 flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Invalidation Condition</span>
                </span>
                <p className="text-xs text-rose-200/90 mt-1 leading-normal">
                  {setup.aiExplanation.invalidationTrigger}
                </p>
              </div>

              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                <span className="text-xs font-semibold text-amber-300">🛡️ Capital Preservation Tip</span>
                <p className="text-xs text-amber-200/90 mt-1 leading-normal">
                  {setup.aiExplanation.riskManagementTip}
                </p>
              </div>
            </div>

            {/* Telegram Message Live Preview & Copy */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  <span>Telegram Message Preview</span>
                </span>
                <button
                  onClick={handleCopyCard}
                  className="inline-flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-y-auto max-h-56 scrollbar-thin whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: setup.telegramFormattedCard
                    .replace(/<b>/g, '<strong class="text-white font-bold">')
                    .replace(/<\/b>/g, '</strong>')
                    .replace(/<code>/g, '<span class="text-amber-400 font-semibold">')
                    .replace(/<\/code>/g, '</span>'),
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
