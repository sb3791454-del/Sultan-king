import React, { useState } from 'react';
import { Calculator, ShieldCheck, AlertTriangle, CheckCircle2, DollarSign, Percent } from 'lucide-react';

export const RiskCalculator: React.FC = () => {
  const [capital, setCapital] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const [entryPrice, setEntryPrice] = useState<number>(2950);
  const [stopLoss, setStopLoss] = useState<number>(2925);
  const [takeProfit, setTakeProfit] = useState<number>(3020);

  const dollarRisk = (capital * riskPercent) / 100;
  const riskPerUnit = Math.abs(entryPrice - stopLoss);
  const units = riskPerUnit > 0 ? dollarRisk / riskPerUnit : 0;
  const positionValue = units * entryPrice;
  const potentialReward = Math.abs(takeProfit - entryPrice) * units;
  const riskReward = riskPerUnit > 0 ? (Math.abs(takeProfit - entryPrice) / riskPerUnit).toFixed(2) : '0';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Institutional Position Size & Risk Calculator</h2>
          <p className="text-xs text-slate-400">
            Enforce the 1-2% golden capital preservation rule. Never blow an account on a single trade.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4 bg-slate-950/70 p-5 rounded-xl border border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Total Account Capital ($ USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value) || 0)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Risk Tolerance per Trade (%)
            </label>
            <div className="flex items-center space-x-2">
              {[1, 1.5, 2, 3].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setRiskPercent(pct)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    riskPercent === pct
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Entry Price ($)</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-300 mb-1">Stop-Loss Price ($)</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-900 border border-rose-900/60 rounded-lg text-sm text-rose-300 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-300 mb-1">Take-Profit Target ($)</label>
            <input
              type="number"
              step="any"
              value={takeProfit}
              onChange={(e) => setTakeProfit(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-900 border border-emerald-900/60 rounded-lg text-sm text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Calculated Results */}
        <div className="space-y-4">
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Position Sizing Output</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-3 rounded-lg">
                <span className="text-[11px] text-slate-400 block">Max Dollar Risk</span>
                <span className="text-base font-bold font-mono text-rose-400 mt-0.5 block">
                  ${dollarRisk.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400">{riskPercent}% of account</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg">
                <span className="text-[11px] text-slate-400 block">Position Size (Units)</span>
                <span className="text-base font-bold font-mono text-amber-300 mt-0.5 block">
                  {units.toFixed(4)} units
                </span>
                <span className="text-[10px] text-slate-400">Contracts / Coins</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg">
                <span className="text-[11px] text-slate-400 block">Total Position Value</span>
                <span className="text-base font-bold font-mono text-white mt-0.5 block">
                  ${positionValue.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400">Leverage: {(positionValue / (capital || 1)).toFixed(1)}x</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg">
                <span className="text-[11px] text-slate-400 block">Target Profit</span>
                <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
                  +${potentialReward.toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-400/80">R:R Ratio 1:{riskReward}</span>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-xs text-emerald-300 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Capital Protected:</strong> If the price hits your Stop-Loss at ${stopLoss}, you lose strictly ${dollarRisk.toFixed(2)}, leaving <strong>${(capital - dollarRisk).toFixed(2)}</strong> ({(100 - riskPercent).toFixed(1)}% of your portfolio) intact.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
