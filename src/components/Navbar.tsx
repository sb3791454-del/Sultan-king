import React, { useState } from 'react';
import { BotStatusInfo } from '../types';
import { Bot, ShieldCheck, Activity, Send, ExternalLink, Zap, FileDown, ChevronDown } from 'lucide-react';

interface NavbarProps {
  botStatus: BotStatusInfo | null;
  activeTab: 'analyzer' | 'macro' | 'scanner' | 'calculator' | 'simulator' | 'logs';
  setActiveTab: (tab: 'analyzer' | 'macro' | 'scanner' | 'calculator' | 'simulator' | 'logs') => void;
  onOpenDiagnostics?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ botStatus, activeTab, setActiveTab, onOpenDiagnostics }) => {
  const telegramBotLink = botStatus?.botUsername ? `https://t.me/${botStatus.botUsername}` : 'https://t.me';
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);

  return (
    <header id="app-header" className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-white tracking-tight">AI Trading Assistant</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                  Telegram Bot
                </span>
              </div>
              <p className="text-xs text-slate-400">Quantitative Engine + Gemini AI</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              id="nav-analyzer-btn"
              onClick={() => setActiveTab('analyzer')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'analyzer'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Signal Analyzer
            </button>
            <button
              id="nav-macro-btn"
              onClick={() => setActiveTab('macro')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'macro'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Quant & Macro Hub
            </button>
            <button
              id="nav-scanner-btn"
              onClick={() => setActiveTab('scanner')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'scanner'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Market Scanner
            </button>
            <button
              id="nav-calculator-btn"
              onClick={() => setActiveTab('calculator')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'calculator'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Risk Calculator
            </button>
            <button
              id="nav-simulator-btn"
              onClick={() => setActiveTab('simulator')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'simulator'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Telegram Chat Tester
            </button>
            <button
              id="nav-logs-btn"
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'logs'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Live Logs
            </button>
          </nav>

          {/* Right Action: Diagnostics, Download Spec, Bot Status & Link */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Diagnostics Mode Trigger */}
            {onOpenDiagnostics && (
              <button
                id="open-diagnostics-btn"
                onClick={onOpenDiagnostics}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/30 transition-all shadow-sm"
                title="View Transparent Quant Math & Live Feed Diagnostics"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Quant Diagnostics</span>
              </button>
            )}

            {/* Download Spec Dropdown */}
            <div className="relative">
              <button
                id="download-doc-dropdown-btn"
                onClick={() => setDocDropdownOpen(!docDropdownOpen)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-all shadow-sm"
                title="Download full specification document for ChatGPT or documentation"
              >
                <FileDown className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Download Doc</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {docDropdownOpen && (
                <div
                  id="doc-dropdown-menu"
                  className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in"
                  onClick={() => setDocDropdownOpen(false)}
                >
                  <a
                    href="/api/download-spec?format=doc"
                    download="AI_TRADING_BOT_SYSTEM_DOCUMENTATION.doc"
                    className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-200 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                  >
                    <FileDown className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="font-bold">Download as Word (.doc)</p>
                      <p className="text-[10px] opacity-75">Opens in Word, Google Docs, Pages</p>
                    </div>
                  </a>
                  <a
                    href="/api/download-spec?format=md"
                    download="AI_TRADING_BOT_SYSTEM_DOCUMENTATION.md"
                    className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-200 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                  >
                    <FileDown className="w-4 h-4 text-sky-400" />
                    <div>
                      <p className="font-bold">Download as Markdown (.md)</p>
                      <p className="text-[10px] opacity-75">Raw markdown for LLM context</p>
                    </div>
                  </a>
                </div>
              )}
            </div>

            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300">
                {botStatus?.botUsername ? `@${botStatus.botUsername}` : 'Bot Connected'}
              </span>
            </div>

            <a
              id="open-telegram-btn"
              href={telegramBotLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs shadow-md shadow-sky-500/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Telegram</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
