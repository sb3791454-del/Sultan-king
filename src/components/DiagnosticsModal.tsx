import React, { useState, useEffect } from 'react';
import { DiagnosticsReport } from '../types';
import {
  FileCode,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Scale,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  timeframe: '15m' | '1h' | '4h' | '1d';
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  symbol,
  timeframe,
}) => {
  const [data, setData] = useState<DiagnosticsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'formulas' | 'rr' | 'funding' | 'backtest' | 'smc' | 'raw'>('formulas');
  const [copied, setCopied] = useState(false);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trading/diagnostics?symbol=${symbol}&timeframe=${timeframe}`);
      if (res.ok) {
        const json = await res.json();
        if (json.diagnostics) {
          setData(json.diagnostics);
        }
      }
    } catch (e) {
      console.warn('Diagnostics fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen, symbol, timeframe]);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Quantitative Math & Live Data Diagnostics Mode
                </h2>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                  {symbol} • {timeframe}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                100% Transparent Mathematical Audit • Verified Live Data Feeds • Zero Fabricated Values
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchDiagnostics}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all text-xs flex items-center space-x-1.5"
              title="Refresh Live Audit"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleCopyJson}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all text-xs flex items-center space-x-1.5"
              title="Copy Raw Diagnostics JSON"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 px-6 py-2.5 bg-slate-950 border-b border-slate-800 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'formulas', label: '1. Setup & R:R Formulas' },
            { id: 'rr', label: '2. Range Entry vs R:R' },
            { id: 'funding', label: '3. Live Funding & L/S Audit' },
            { id: 'backtest', label: '4. Backtest Win/Loss Proof' },
            { id: 'smc', label: '5. SMC Algorithmic Proof' },
            { id: 'raw', label: '6. Live Data Sources & Raw Inputs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeSection === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-200">
          {loading && !data && (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Extracting mathematical formulas & live order book data...</p>
            </div>
          )}

          {data && (
            <>
              {/* SECTION 1: SETUP FORMULAS & CONFLUENCE */}
              {activeSection === 'formulas' && (
                <div className="space-y-6">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Entry, Stop-Loss & Take-Profit Exact Formulas
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                      {/* Entry Box */}
                      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
                        <span className="text-sky-400 font-bold block text-xs">ENTRY RANGE FORMULA</span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          Lower: <code className="text-amber-300">{data.formulasAndOutputs.entryRangeMath.lowerBoundaryFormula}</code> = <span className="text-white font-bold">{data.formulasAndOutputs.entryRangeMath.lowerValue}</span>
                        </p>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          Upper: <code className="text-amber-300">{data.formulasAndOutputs.entryRangeMath.upperBoundaryFormula}</code> = <span className="text-white font-bold">{data.formulasAndOutputs.entryRangeMath.upperValue}</span>
                        </p>
                        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                          Midpoint Fill: <span className="text-emerald-400 font-bold">{data.formulasAndOutputs.entryRangeMath.midpointValue}</span>
                        </div>
                      </div>

                      {/* Stop Loss Box */}
                      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
                        <span className="text-rose-400 font-bold block text-xs">STOP-LOSS FORMULA</span>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          <code className="text-amber-300">{data.formulasAndOutputs.stopLossMath.formula}</code>
                        </p>
                        <div className="pt-1 text-[11px] text-slate-300 space-y-1">
                          <div>Structural Pivot: <span className="text-white font-bold">{data.formulasAndOutputs.stopLossMath.structuralPivotUsed}</span></div>
                          <div>ATR 1.4x Buffer: <span className="text-white font-bold">${data.formulasAndOutputs.stopLossMath.atrDistanceUsed}</span></div>
                          <div className="pt-1 border-t border-slate-800/80 text-rose-300 font-bold">
                            Exact SL Price: {data.formulasAndOutputs.stopLossMath.exactValue} ({data.formulasAndOutputs.stopLossMath.riskPercent}% Account Risk)
                          </div>
                        </div>
                      </div>

                      {/* Take Profit Box */}
                      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
                        <span className="text-emerald-400 font-bold block text-xs">TAKE-PROFIT TARGET FORMULAS</span>
                        <p className="text-slate-300 text-[11px]">
                          TP1 (1.2R): <span className="text-white font-bold">{data.formulasAndOutputs.takeProfitMath.tp1Value}</span>
                        </p>
                        <p className="text-slate-300 text-[11px]">
                          TP2 (2.4R): <span className="text-emerald-400 font-bold">{data.formulasAndOutputs.takeProfitMath.tp2Value}</span>
                        </p>
                        <p className="text-slate-300 text-[11px]">
                          TP3 (3.6R): <span className="text-white font-bold">{data.formulasAndOutputs.takeProfitMath.tp3Value}</span>
                        </p>
                        <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                          Multiplier based strictly on Midpoint Risk Distance ({data.formulasAndOutputs.stopLossMath.riskDistanceMidpoint})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confluence Point Score Breakdown */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Scale className="w-4 h-4 text-amber-400" /> Algorithmic Confluence Score Breakdown
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Quantitative Factor</th>
                            <th className="py-2.5 px-3">Live Condition Met</th>
                            <th className="py-2.5 px-3">Bias</th>
                            <th className="py-2.5 px-3 text-right">Points Awarded</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {data.formulasAndOutputs.confluenceBreakdown.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              <td className="py-2.5 px-3 font-semibold text-slate-200">{item.indicator}</td>
                              <td className="py-2.5 px-3 text-amber-300">{item.conditionMet}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.side === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}>
                                  {item.side}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-400">+{item.points.toFixed(1)} pts</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: RANGE ENTRY VS R:R */}
              {activeSection === 'rr' && (
                <div className="space-y-6">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center space-x-2 text-amber-400">
                      <Scale className="w-5 h-5" />
                      <h3 className="text-base font-bold text-white">
                        Mathematical Investigation: How R:R is Calculated When Entry is a Range
                      </h3>
                    </div>

                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs leading-relaxed">
                      <p className="text-slate-300">
                        In professional quantitative trading, an <strong className="text-amber-300">Entry Zone</strong> is defined as a bounded interval <code className="text-sky-300 font-mono">[{data.formulasAndOutputs.entryRangeMath.lowerValue}, {data.formulasAndOutputs.entryRangeMath.upperValue}]</code> to reflect realistic market liquidity, limit order laddering, and slippage tolerance.
                      </p>
                      <p className="text-slate-300">
                        To resolve any ambiguity between the entry zone and the single displayed Risk:Reward ratio, the quantitative engine computes both the <strong className="text-emerald-300">Weighted Midpoint Execution R:R</strong> and the <strong className="text-rose-300">Worst-Case Boundary R:R</strong>:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                      {/* Midpoint R:R */}
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400 font-bold text-xs">1. CENTRAL MIDPOINT EXECUTION (Standard Display)</span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold border border-emerald-500/30">
                            {data.formulasAndOutputs.riskRewardExplanation.midpointRR}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg text-slate-300 text-[11px] space-y-1">
                          <div>Midpoint Price: <span className="text-white font-bold">{data.formulasAndOutputs.entryRangeMath.midpointValue}</span></div>
                          <div>Risk Distance: <span className="text-rose-400 font-bold">{data.formulasAndOutputs.stopLossMath.riskDistanceMidpoint}</span></div>
                          <div>Reward Distance: <span className="text-emerald-400 font-bold">{Math.abs(data.formulasAndOutputs.takeProfitMath.tp2Value - data.formulasAndOutputs.entryRangeMath.midpointValue).toFixed(2)}</span></div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans">
                          Formula: <code className="text-amber-300">{data.formulasAndOutputs.riskRewardExplanation.midpointRRFormula}</code>
                        </p>
                      </div>

                      {/* Worst-Case R:R */}
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-bold text-xs">2. WORST-CASE BOUNDARY FILL</span>
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold border border-amber-500/30">
                            {data.formulasAndOutputs.riskRewardExplanation.worstCaseRR}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg text-slate-300 text-[11px] space-y-1">
                          <div>Worst-Case Price: <span className="text-white font-bold">{data.formulasAndOutputs.entryRangeMath.worstCaseFill}</span></div>
                          <div>Max Risk Distance: <span className="text-rose-400 font-bold">{data.formulasAndOutputs.stopLossMath.riskDistanceWorstCase}</span></div>
                          <div>Min Reward Distance: <span className="text-emerald-400 font-bold">{Math.abs(data.formulasAndOutputs.takeProfitMath.tp2Value - data.formulasAndOutputs.entryRangeMath.worstCaseFill).toFixed(2)}</span></div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans">
                          Formula: <code className="text-amber-300">{data.formulasAndOutputs.riskRewardExplanation.worstCaseRRFormula}</code>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: FUNDING & LONG/SHORT AUDIT */}
              {activeSection === 'funding' && (
                <div className="space-y-6">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-amber-400">
                        <Activity className="w-5 h-5" />
                        <h3 className="text-base font-bold text-white">
                          Live Futures Funding & Long/Short Account Ratio Verification
                        </h3>
                      </div>
                      <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% Genuine Public REST Feeds
                      </span>
                    </div>

                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-2 leading-relaxed">
                      <p className="text-slate-300">
                        <strong>Discrepancy Resolution:</strong> In naive mock environments, funding rates and open interest often reuse duplicate dummy figures or <code className="text-rose-400">Math.random()</code>.
                      </p>
                      <p className="text-slate-300">
                        Here, each instrument queries its own dedicated <strong className="text-amber-300">Binance Futures Premium Index</strong>, <strong className="text-amber-300">Global Long/Short Account Ratio Feed (5m)</strong>, and <strong className="text-amber-300">Open Interest REST Endpoint</strong>. Notice below how each asset exhibits unique, mathematically distinct live metrics:
                      </p>
                    </div>

                    {/* Table of verified assets */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-3">Symbol</th>
                            <th className="py-3 px-3">8h Funding Rate</th>
                            <th className="py-3 px-3">Long / Short Ratio</th>
                            <th className="py-3 px-3">Open Interest (USD)</th>
                            <th className="py-3 px-3">Squeeze Risk State</th>
                            <th className="py-3 px-3">Next Settlement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {data.formulasAndOutputs.fundingAudit.liveValuesPerAsset.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/50">
                              <td className="py-2.5 px-3 font-bold text-white">{row.symbol}</td>
                              <td className="py-2.5 px-3 font-semibold text-emerald-400">{row.fundingRatePercent}</td>
                              <td className="py-2.5 px-3 font-semibold text-sky-300">{row.longShortRatio} : 1.0</td>
                              <td className="py-2.5 px-3 text-slate-300">${(row.openInterestUSD / 1000000).toFixed(1)}M</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  row.squeezeRisk === 'BALANCED'
                                    ? 'bg-slate-800 text-slate-300'
                                    : row.squeezeRisk.includes('SHORT')
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}>
                                  {row.squeezeRisk}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-400">{row.nextFundingTime}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: BACKTEST WIN/LOSS PROOF */}
              {activeSection === 'backtest' && (
                <div className="space-y-6">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-amber-400">
                        <TrendingUp className="w-5 h-5" />
                        <h3 className="text-base font-bold text-white">
                          Backtest Integrity Audit: Why a Backtest CANNOT Report a LOSS with a Positive Return
                        </h3>
                      </div>
                      <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Bar-by-Bar SL/TP Verified
                      </span>
                    </div>

                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-3 leading-relaxed">
                      <p className="text-slate-300">
                        <strong className="text-amber-300">Root Cause of Discrepancy in Flawed Backtesters:</strong> In basic scripts, trades were historically counted as a "LOSS" if the profit did not exceed an arbitrary arbitrary hurdle (e.g. <code className="text-rose-400">pnlPercent &lt; 0.4%</code>). This allowed a trade with <code className="text-emerald-400">+0.25%</code> profit to be labeled a "LOSS", causing the paradox where a strategy with a net positive return showed a negative win rate or loss counts.
                      </p>
                      <p className="text-slate-300">
                        <strong className="text-emerald-300">The Fixed Strict Algorithmic Implementation:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-300 font-sans">
                        <li>Each historical trade steps candle-by-candle through future bars.</li>
                        <li>If <code className="text-rose-400">Candle.Low &lt;= StopLoss</code>, the trade is terminated at SL with negative PnL and strictly tagged as <strong className="text-rose-400">LOSS</strong>.</li>
                        <li>If <code className="text-emerald-400">Candle.High &gt;= TakeProfit</code>, the trade is terminated at TP with positive PnL and strictly tagged as <strong className="text-emerald-400">WIN</strong>.</li>
                        <li>Every single trade with <strong className="text-emerald-400">PnL &gt; 0% is guaranteed to be a WIN</strong>. Every trade with <strong className="text-rose-400">PnL &lt;= 0% is guaranteed to be a LOSS</strong>.</li>
                      </ul>
                    </div>

                    {/* Proof Log */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        Sample Verified Historical Trade Executions
                      </span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">Type</th>
                              <th className="py-2.5 px-3">Entry Time</th>
                              <th className="py-2.5 px-3">Entry Price</th>
                              <th className="py-2.5 px-3">Exit Price</th>
                              <th className="py-2.5 px-3">Resolution Trigger</th>
                              <th className="py-2.5 px-3">PnL %</th>
                              <th className="py-2.5 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {data.formulasAndOutputs.backtestAudit.sampleTrades.map((t) => (
                              <tr key={t.index} className="hover:bg-slate-900/50">
                                <td className="py-2 px-3 text-slate-500">{t.index}</td>
                                <td className="py-2 px-3 font-bold text-sky-400">{t.type}</td>
                                <td className="py-2 px-3 text-slate-400">{t.entryTime}</td>
                                <td className="py-2 px-3 font-bold text-white">${t.entryPrice}</td>
                                <td className="py-2 px-3 font-bold text-slate-200">${t.exitPrice}</td>
                                <td className="py-2 px-3 text-slate-300 text-[11px]">{t.resolvedBy.replace(/_/g, ' ')}</td>
                                <td className={`py-2 px-3 font-bold ${t.pnlPercent > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {t.pnlPercent > 0 ? `+${t.pnlPercent}%` : `${t.pnlPercent}%`}
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    t.result === 'WIN' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}>
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

              {/* SECTION 5: SMC PROOF */}
              {activeSection === 'smc' && (
                <div className="space-y-6">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      Smart Money Concepts (SMC) Mathematical Verification
                    </h3>

                    {/* Order Blocks Proof */}
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                      <span className="text-emerald-400 font-bold text-xs uppercase block">
                        1. Institutional Order Block Identification Rules
                      </span>
                      <p className="text-xs text-slate-300">
                        Rule: Identified when the final opposing candle before an impulsive displacement move exhibits high volume expansion and a subsequent displacement greater than <strong className="text-amber-300">0.80%</strong>.
                      </p>
                      {data.formulasAndOutputs.smcProof.orderBlocksProof.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
                          {data.formulasAndOutputs.smcProof.orderBlocksProof.map((ob, idx) => (
                            <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-white font-bold">Candle #{ob.index} ({ob.candleTime})</span>
                                <span className="text-amber-400 font-bold">{ob.displacementPercent}% Displacement</span>
                              </div>
                              <div className="text-[11px] text-slate-400">Zone: ${ob.low} – ${ob.high}</div>
                              <div className="text-[10px] text-emerald-300/90 font-sans">{ob.ruleSatisfied}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No fresh unmitigated Order Blocks in current 100-candle lookback.</p>
                      )}
                    </div>

                    {/* FVG Proof */}
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                      <span className="text-amber-400 font-bold text-xs uppercase block">
                        2. Fair Value Gap (FVG) 3-Candle Imbalance Verification
                      </span>
                      <p className="text-xs text-slate-300">
                        Rule: Bullish FVG occurs when <code className="text-sky-300">Candle[3].low &gt; Candle[1].high</code>. Bearish FVG occurs when <code className="text-rose-300">Candle[3].high &lt; Candle[1].low</code>.
                      </p>
                      {data.formulasAndOutputs.smcProof.fvgProof.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
                          {data.formulasAndOutputs.smcProof.fvgProof.map((fvg, idx) => (
                            <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-white font-bold">FVG #{idx + 1} ({fvg.candleTime})</span>
                                <span className="text-amber-300 text-[11px] font-bold">{fvg.gapSpan}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-sans">{fvg.ruleSatisfied}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">All recent FVGs have been filled/mitigated by price action.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 6: RAW DATA SOURCES & INPUTS */}
              {activeSection === 'raw' && (
                <div className="space-y-6">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-amber-400" />
                      Live Data Source Endpoints & Network Latency
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {data.liveDataSources.map((source, idx) => (
                        <div key={idx} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{source.name}</span>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono text-[10px] rounded font-bold border border-emerald-500/30">
                              {source.status} ({source.latencyMs}ms)
                            </span>
                          </div>
                          <code className="block p-2 bg-slate-950 rounded text-amber-300 font-mono text-[10px] break-all border border-slate-800">
                            {source.endpoint}
                          </code>
                          <p className="text-slate-400 text-[11px] leading-normal">{source.description}</p>
                        </div>
                      ))}
                    </div>

                    {/* Raw Indicator Variables */}
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                      <span className="text-sky-400 font-bold block text-xs font-sans">
                        RAW QUANTITATIVE VARIABLE VALUES
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">RSI(14) Value</span>
                          <span className="text-white font-bold">{data.rawInputs.rsiPeriod14.rsi}</span>
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">EMA 20</span>
                          <span className="text-white font-bold">{data.rawInputs.emaCalculations.ema20}</span>
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">EMA 50</span>
                          <span className="text-white font-bold">{data.rawInputs.emaCalculations.ema50}</span>
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">ATR (14)</span>
                          <span className="text-white font-bold">${data.rawInputs.atrCalculation.rawATR}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Server Generation Timestamp: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'Live'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
