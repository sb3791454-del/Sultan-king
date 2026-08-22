import React, { useState, useEffect } from 'react';
import { FearAndGreedData, FundingRateData, EconomicEvent, BacktestResult, MTFMatrixData } from '../types';
import { Activity, Gauge, Zap, TrendingUp, Calendar, FlaskConical, AlertTriangle, ShieldCheck, RefreshCw, BarChart3, ChevronRight } from 'lucide-react';

interface QuantMacroHubProps {
  currentSymbol: string;
}

export const QuantMacroHub: React.FC<QuantMacroHubProps> = ({ currentSymbol }) => {
  const [activeSubTab, setActiveSubTab] = useState<'mtf' | 'sentiment' | 'funding' | 'backtest' | 'calendar'>('mtf');
  
  const [fngData, setFngData] = useState<FearAndGreedData | null>(null);
  const [fundingData, setFundingData] = useState<FundingRateData[]>([]);
  const [calendarData, setCalendarData] = useState<EconomicEvent[]>([]);
  const [mtfData, setMtfData] = useState<MTFMatrixData | null>(null);
  const [backtestData, setBacktestData] = useState<BacktestResult | null>(null);
  
  const [selectedAsset, setSelectedAsset] = useState<string>(currentSymbol || 'BTC');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('EMA_SMC_CONFLUENCE');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchMacroData = async () => {
    setIsLoading(true);
    try {
      const [fngRes, fundRes, calRes, mtfRes, btRes] = await Promise.all([
        fetch('/api/trading/sentiment').then((r) => r.json()),
        fetch('/api/trading/funding').then((r) => r.json()),
        fetch('/api/trading/calendar').then((r) => r.json()),
        fetch(`/api/trading/mtf?symbol=${selectedAsset}`).then((r) => r.json()),
        fetch(`/api/trading/backtest?symbol=${selectedAsset}&strategy=${selectedStrategy}`).then((r) => r.json()),
      ]);

      if (fngRes.sentiment) setFngData(fngRes.sentiment);
      if (fundRes.funding) setFundingData(fundRes.funding);
      if (calRes.calendar) setCalendarData(calRes.calendar);
      if (mtfRes.mtf) setMtfData(mtfRes.mtf);
      if (btRes.backtest) setBacktestData(btRes.backtest);
    } catch (e) {
      console.warn('Macro Hub fetch note:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMacroData();
  }, [selectedAsset, selectedStrategy]);

  return (
    <div id="quant-macro-hub" className="space-y-6">
      {/* Top Controls & Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-amber-400" />
            Institutional Quantitative & Macro Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time algorithmic confluences, Smart Money heatmaps, funding squeezes, and macro calendars
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            id="macro-asset-select"
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-amber-500 outline-none"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="SOL">Solana (SOL)</option>
            <option value="XAUUSD">Gold (XAU/USD)</option>
            <option value="XRP">XRP (Ripple)</option>
            <option value="NEAR">NEAR Protocol</option>
          </select>

          <button
            id="refresh-macro-btn"
            onClick={fetchMacroData}
            disabled={isLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all disabled:opacity-50"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'mtf', label: 'Multi-TF Matrix', icon: BarChart3 },
          { id: 'sentiment', label: 'Fear & Greed Index', icon: Gauge },
          { id: 'funding', label: 'Funding & Squeeze Risk', icon: Zap },
          { id: 'backtest', label: 'Strategy Backtester', icon: FlaskConical },
          { id: 'calendar', label: 'Economic Calendar', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Multi-Timeframe Heatmap Matrix */}
      {activeSubTab === 'mtf' && (
        <div id="view-mtf" className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-3">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Algorithmic Confluence Heatmap</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedAsset} Multi-Timeframe Alignment</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Overall Bias:</span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  mtfData?.overallBias.includes('BUY') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  mtfData?.overallBias.includes('SELL') ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {mtfData?.overallBias.replace('_', ' ') || 'CALCULATING...'}
                </span>
                <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {mtfData?.confluenceRatio}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mtfData?.timeframes.map((tf) => {
                const isBull = tf.trend === 'BULLISH';
                const isBear = tf.trend === 'BEARISH';
                return (
                  <div
                    key={tf.tf}
                    className={`p-5 rounded-xl border transition-all ${
                      isBull
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                        : isBear
                        ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                        : 'bg-slate-950/50 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-black font-mono px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-white">
                        {tf.tf.toUpperCase()}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isBull ? 'bg-emerald-500/20 text-emerald-400' : isBear ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tf.trend}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Confluence Score:</span>
                        <span className="font-bold font-mono">{tf.score}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">RSI(14):</span>
                        <span className="font-mono">{tf.rsi}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">MACD Histogram:</span>
                        <span className="font-mono">{tf.macd}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Sentiment & Fear and Greed */}
      {activeSubTab === 'sentiment' && fngData && (
        <div id="view-sentiment" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Live Market Psychology</span>
            <div className="relative w-40 h-40 flex items-center justify-center my-4">
              <div className="w-36 h-36 rounded-full border-8 border-slate-800 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-4xl font-black text-white font-mono">{fngData.score}</span>
                  <p className="text-xs text-slate-400 uppercase font-semibold mt-1">{fngData.rating}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-xs">
              Updated: {new Date(fngData.updatedAt).toLocaleTimeString()}
            </p>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Contrarian Institutional Strategy
            </h3>
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
              {fngData.contrarianVerdict}
            </div>

            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">7-Day Historical Trajectory</h4>
            <div className="grid grid-cols-7 gap-2">
              {fngData.historical7Days.map((day, idx) => (
                <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-center">
                  <p className="text-[10px] text-slate-400 truncate">{day.date}</p>
                  <p className="text-sm font-bold text-white font-mono mt-1">{day.value}</p>
                  <p className="text-[10px] text-amber-400/80 truncate mt-0.5">{day.rating}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Futures Funding Rates & Squeeze Risk */}
      {activeSubTab === 'funding' && (
        <div id="view-funding" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="mb-5">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Leverage & Liquidation Intelligence</span>
            <h3 className="text-lg font-bold text-white mt-0.5">Live Futures Funding Rates & Squeeze Monitor</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">8h Funding Rate</th>
                  <th className="py-3 px-4">Predicted Rate</th>
                  <th className="py-3 px-4">Long / Short Ratio</th>
                  <th className="py-3 px-4">Squeeze Potential</th>
                  <th className="py-3 px-4">Next Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {fundingData.map((item) => (
                  <tr key={item.symbol} className="hover:bg-slate-800/30 transition-all">
                    <td className="py-3.5 px-4 font-bold text-white">{item.symbol}</td>
                    <td className={`py-3.5 px-4 font-bold ${item.fundingRate > 0.0002 ? 'text-amber-400' : item.fundingRate < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {item.fundingRatePercent}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{(item.predictedRate * 100).toFixed(4)}%</td>
                    <td className="py-3.5 px-4 text-slate-200">{item.longShortRatio}x</td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        item.squeezeRisk === 'HIGH_LONG_SQUEEZE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        item.squeezeRisk === 'HIGH_SHORT_SQUEEZE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {item.squeezeRisk.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{item.nextFundingTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Strategy Backtester */}
      {activeSubTab === 'backtest' && backtestData && (
        <div id="view-backtest" className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800 mb-6">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Algorithmic Validation</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{backtestData.strategyName}</h3>
                <p className="text-xs text-slate-400">Tested on {backtestData.symbol} ({backtestData.timeframe}) across historical bars</p>
              </div>

              <select
                id="strategy-select"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
              >
                <option value="EMA_SMC_CONFLUENCE">EMA + SMC Momentum Confluence</option>
                <option value="FVG_SMC">SMC Fair Value Gap Retracement</option>
                <option value="RSI_REVERSION">RSI Mean Reversion + Liquidity Grab</option>
              </select>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">Win Rate</p>
                <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{backtestData.winRatePercent}%</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{backtestData.winningTrades}W / {backtestData.losingTrades}L</p>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">Simulated Net Return</p>
                <p className="text-2xl font-black text-white font-mono mt-1">+{backtestData.netReturnPercent}%</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Compounded</p>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">Profit Factor</p>
                <p className="text-2xl font-black text-amber-400 font-mono mt-1">{backtestData.profitFactor}x</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Gross Win / Gross Loss</p>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">Max Drawdown</p>
                <p className="text-2xl font-black text-rose-400 font-mono mt-1">-{backtestData.maxDrawdownPercent}%</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Controlled Risk</p>
              </div>
            </div>

            {/* Trade Log */}
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Simulated Historical Trades</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Entry Time</th>
                      <th className="py-2.5 px-3">Entry Price</th>
                      <th className="py-2.5 px-3">Exit Price</th>
                      <th className="py-2.5 px-3">P&L (%)</th>
                      <th className="py-2.5 px-3">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {backtestData.tradeLog.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20">
                        <td className={`py-2 px-3 font-bold ${t.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.type}</td>
                        <td className="py-2 px-3 text-slate-400">{t.entryTime}</td>
                        <td className="py-2 px-3 text-slate-200">${t.entryPrice}</td>
                        <td className="py-2 px-3 text-slate-200">${t.exitPrice}</td>
                        <td className={`py-2 px-3 font-bold ${t.pnlPercent > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.pnlPercent > 0 ? '+' : ''}{t.pnlPercent}%
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.result === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {t.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Macro Economic Calendar */}
      {activeSubTab === 'calendar' && (
        <div id="view-calendar" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="mb-5">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">High-Volatility Events</span>
            <h3 className="text-lg font-bold text-white mt-0.5">Global Macro & Economic Catalyst Schedule</h3>
          </div>

          <div className="space-y-3">
            {calendarData.map((ev) => (
              <div key={ev.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-800 font-mono font-bold text-white text-[11px] rounded">
                      {ev.currency}
                    </span>
                    <span className="text-sm font-bold text-white">{ev.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ev.impact === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400'}`}>
                      {ev.impact} IMPACT
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Affected Assets: <span className="text-slate-300 font-medium">{ev.affectedAssets.join(', ')}</span>
                  </p>
                </div>

                <div className="text-right font-mono text-xs text-slate-300">
                  <p className="text-amber-400 font-semibold">{ev.date} • {ev.timeUTC}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Forecast: {ev.forecast} | Prior: {ev.previous}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
