import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MarketTickerBar } from './components/MarketTickerBar';
import { BotStatusCard } from './components/BotStatusCard';
import { TradeSetupView } from './components/TradeSetupView';
import { QuantMacroHub } from './components/QuantMacroHub';
import { MarketScanner } from './components/MarketScanner';
import { RiskCalculator } from './components/RiskCalculator';
import { TelegramSimulator } from './components/TelegramSimulator';
import { ActivityLogs } from './components/ActivityLogs';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { BotStatusInfo, MarketTicker, TradeSetup, IndicatorData, Candle, TelegramLog } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'macro' | 'scanner' | 'calculator' | 'simulator' | 'logs'>('analyzer');
  const [botStatus, setBotStatus] = useState<BotStatusInfo | null>(null);
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAUUSD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'15m' | '1h' | '4h' | '1d'>('1h');
  const [currentSetup, setCurrentSetup] = useState<TradeSetup | null>(null);
  const [indicators, setIndicators] = useState<IndicatorData | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [logs, setLogs] = useState<TelegramLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);

  // 1. Fetch initial status and data
  const fetchBotStatus = async () => {
    try {
      const res = await fetch('/api/bot/status');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.bot) setBotStatus(data.bot);
      }
    } catch {
      // Ignore network glitch
    }
  };

  const fetchTickers = async () => {
    try {
      const res = await fetch('/api/trading/overview');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.overview) setTickers(data.overview);
      }
    } catch {
      // Ignore network glitch
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/bot/logs');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.logs) setLogs(data.logs);
      }
    } catch {
      // Ignore network glitch
    }
  };

  const fetchScans = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/trading/scan');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.scans) setScans(data.scans);
      }
    } catch {
      // Ignore network glitch
    } finally {
      setIsScanning(false);
    }
  };

  // 2. Run analysis for a symbol
  const handleAnalyze = async (symbol: string, timeframe: '15m' | '1h' | '4h' | '1d', query?: string, retryCount = 0) => {
    setIsLoading(true);
    setSelectedSymbol(symbol);
    setSelectedTimeframe(timeframe);

    try {
      const res = await fetch('/api/trading/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe, query }),
      });

      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.setup) {
          setCurrentSetup(data.setup);
          setIndicators(data.indicators);
          setCandles(data.candles || []);
        }
      } else if (retryCount < 2) {
        // If server was still initialising, retry once after a short delay
        setTimeout(() => handleAnalyze(symbol, timeframe, query, retryCount + 1), 1200);
      }
    } catch (e: any) {
      if (retryCount < 2) {
        setTimeout(() => handleAnalyze(symbol, timeframe, query, retryCount + 1), 1200);
      } else {
        console.warn('Analysis notice:', e?.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateToken = async (token: string) => {
    try {
      const res = await fetch('/api/bot/update-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.bot) setBotStatus(data.bot);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchBotStatus();
    fetchTickers();
    fetchLogs();
    fetchScans();
    handleAnalyze('XAUUSD', '1h');

    // Interval poll for live data & logs
    const interval = setInterval(() => {
      fetchTickers();
      fetchBotStatus();
      fetchLogs();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 pb-16">
      {/* Top Navbar */}
      <Navbar
        botStatus={botStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
      />

      {/* Live Market Feeds Bar */}
      <MarketTickerBar
        tickers={tickers}
        onSelectSymbol={(sym) => {
          handleAnalyze(sym, selectedTimeframe);
          setActiveTab('analyzer');
        }}
        selectedSymbol={selectedSymbol}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Telegram Bot Live Status Banner */}
        <BotStatusCard
          status={botStatus}
          onRefresh={() => {
            fetchBotStatus();
            fetchLogs();
          }}
          onUpdateToken={handleUpdateToken}
        />

        {/* Tab Views */}
        {activeTab === 'analyzer' && (
          <TradeSetupView
            setup={currentSetup}
            indicators={indicators}
            candles={candles}
            isLoading={isLoading}
            onAnalyze={handleAnalyze}
            selectedSymbol={selectedSymbol}
            selectedTimeframe={selectedTimeframe}
            onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          />
        )}

        {activeTab === 'macro' && <QuantMacroHub currentSymbol={selectedSymbol} />}

        {activeTab === 'scanner' && (
          <MarketScanner
            scans={scans}
            isLoading={isScanning}
            onRescan={fetchScans}
            onSelectSetup={(sym) => {
              handleAnalyze(sym, '1h');
              setActiveTab('analyzer');
            }}
          />
        )}

        {activeTab === 'calculator' && <RiskCalculator />}

        {activeTab === 'simulator' && <TelegramSimulator />}

        {activeTab === 'logs' && <ActivityLogs logs={logs} onRefresh={fetchLogs} />}
      </main>

      {/* Live Quantitative Math Diagnostics Modal */}
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        symbol={selectedSymbol}
        timeframe={selectedTimeframe}
      />
    </div>
  );
}
