import React, { useState } from 'react';
import { BotStatusInfo } from '../types';
import { Bot, Shield, CheckCircle2, RefreshCw, Send, Copy, Key, ArrowUpRight } from 'lucide-react';

interface BotStatusCardProps {
  status: BotStatusInfo | null;
  onRefresh: () => void;
  onUpdateToken: (token: string) => Promise<void>;
}

export const BotStatusCard: React.FC<BotStatusCardProps> = ({ status, onRefresh, onUpdateToken }) => {
  const [copied, setCopied] = useState(false);
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const telegramLink = status?.botUsername ? `https://t.me/${status.botUsername}` : null;

  const handleCopyLink = () => {
    if (telegramLink) {
      navigator.clipboard.writeText(telegramLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setIsSaving(true);
    try {
      await onUpdateToken(tokenInput.trim());
      setIsEditingToken(false);
      setTokenInput('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Bot Identity */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">
                {status?.botFirstName || 'Trading Assistant'}
              </h3>
              {status?.botUsername && (
                <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                  @{status.botUsername}
                </span>
              )}
              <span className="flex items-center space-x-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>Live Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Mode: <span className="text-slate-200 uppercase font-semibold">{status?.mode || 'Webhook'}</span> •{' '}
              Messages: <span className="text-amber-400 font-semibold">{status?.totalMessagesHandled ?? 0}</span> •{' '}
              Signals Sent: <span className="text-emerald-400 font-semibold">{status?.activeSignalsCount ?? 0}</span>
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {telegramLink && (
            <a
              id="bot-telegram-link"
              href={telegramLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Start in Telegram</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all"
            title="Copy Telegram Link"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isEditingToken && (
        <form onSubmit={handleSaveToken} className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Paste Telegram Bot Token from @BotFather..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
          />
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {isSaving ? 'Connecting...' : 'Save Token'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditingToken(false)}
            className="px-3 py-2 bg-slate-800 text-slate-400 hover:text-white text-xs rounded-xl"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};
