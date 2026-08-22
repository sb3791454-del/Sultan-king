import React from 'react';
import { TelegramLog } from '../types';
import { History, MessageSquare, Zap, RefreshCw, Send } from 'lucide-react';

interface ActivityLogsProps {
  logs: TelegramLog[];
  onRefresh: () => void;
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({ logs, onRefresh }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Live Telegram Activity Stream</h2>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs flex items-center space-x-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
          No messages received yet. Send a message to your Telegram bot or use the simulator above!
        </div>
      ) : (
        <div className="divide-y divide-slate-800/80 max-h-[500px] overflow-y-auto scrollbar-thin">
          {logs.map((log) => (
            <div key={log.id} className="py-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-200">{log.from}</span>
                  <span className="font-mono text-slate-500">ID: {log.chatId}</span>
                  {log.signalGenerated && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                      ⚡ Signal Generated
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500">{log.timestamp}</span>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg font-mono">
                <strong className="text-amber-400">User:</strong> {log.messageText}
              </div>
              <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg font-mono line-clamp-2">
                <strong className="text-sky-400">Bot:</strong> {log.replyText}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
