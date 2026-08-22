import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { TelegramBotService } from './server/telegramBot';
import { TradingEngine } from './server/tradingEngine';
import { GeminiTradingAssistant } from './server/geminiService';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware
  app.use(express.json());

  // Non-blocking Telegram Bot startup
  const appUrl = process.env.APP_URL;
  TelegramBotService.init(appUrl).catch((err) => {
    console.warn('Telegram bot initialization in background:', err?.message);
  });

  // --- TELEGRAM WEBHOOK ENDPOINT ---
  app.post('/api/telegram-webhook', async (req, res) => {
    try {
      if (req.body) {
        // Asynchronously process Telegram update
        TelegramBotService.handleUpdate(req.body);
      }
      res.status(200).json({ ok: true });
    } catch (e: any) {
      console.error('Webhook error:', e?.message);
      res.status(200).json({ ok: true }); // Always return 200 to Telegram
    }
  });

  // --- BOT MANAGEMENT API ---
  app.get('/api/bot/status', (req, res) => {
    res.json({
      status: 'ok',
      bot: TelegramBotService.getStatus(),
    });
  });

  app.get('/api/bot/logs', (req, res) => {
    res.json({
      status: 'ok',
      logs: TelegramBotService.getLogs(),
    });
  });

  app.post('/api/bot/update-token', async (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    TelegramBotService.setToken(token);
    await TelegramBotService.init(process.env.APP_URL);
    res.json({ status: 'ok', bot: TelegramBotService.getStatus() });
  });

  // --- TRADING ENGINE API ---
  app.get('/api/trading/overview', async (req, res) => {
    try {
      const overview = await TradingEngine.getMarketOverview();
      res.json({ status: 'ok', overview });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  app.get('/api/trading/candles', async (req, res) => {
    try {
      const symbol = (req.query.symbol as string) || 'BTCUSDT';
      const timeframe = ((req.query.timeframe as string) || '1h') as '15m' | '1h' | '4h' | '1d';
      const normalized = TradingEngine.normalizeSymbol(symbol);
      const candles = await TradingEngine.fetchCandles(normalized.binancePair, timeframe, 100);
      res.json({ status: 'ok', symbol: normalized.symbolKey, timeframe, candles });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  app.post('/api/trading/analyze', async (req, res) => {
    try {
      const { symbol = 'XAUUSD', timeframe = '1h', query } = req.body;
      const setup = await TelegramBotService.generateSetupForSymbol(symbol, timeframe, query);
      const normalized = TradingEngine.normalizeSymbol(symbol);
      const candles = await TradingEngine.fetchCandles(normalized.binancePair, timeframe, 100);
      const tickerStats = await TradingEngine.fetch24hTicker(normalized.binancePair);
      const indicators = TradingEngine.calculateIndicators(candles, tickerStats);

      res.json({
        status: 'ok',
        setup,
        indicators,
        candles: candles.slice(-50),
      });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  app.get('/api/trading/scan', async (req, res) => {
    try {
      const assets = ['XAUUSD', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'NEARUSDT'];
      const scans = await Promise.all(
        assets.map(async (sym) => {
          try {
            const normalized = TradingEngine.normalizeSymbol(sym);
            const candles = await TradingEngine.fetchCandles(normalized.binancePair, '1h', 70);
            const ticker = await TradingEngine.fetch24hTicker(normalized.binancePair);
            const ind = TradingEngine.calculateIndicators(candles, ticker);
            const setup = TradingEngine.generateQuantitativeSetup(normalized.symbolKey, normalized.assetType, '1h', ind, normalized.decimals);
            return { symbol: sym, name: normalized.name, price: ticker.price, change24h: ticker.change24h, setup, ind };
          } catch {
            return null;
          }
        })
      );

      res.json({
        status: 'ok',
        scans: scans.filter(Boolean),
      });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  // --- ADVANCED QUANT & SMC API ENDPOINTS ---
  app.get('/api/trading/smc', async (req, res) => {
    try {
      const symbol = (req.query.symbol as string) || 'BTCUSDT';
      const timeframe = ((req.query.timeframe as string) || '1h') as '15m' | '1h' | '4h' | '1d';
      const normalized = TradingEngine.normalizeSymbol(symbol);
      const candles = await TradingEngine.fetchCandles(normalized.binancePair, timeframe, 100);
      const smc = TradingEngine.calculateSMC(candles);
      res.json({ status: 'ok', symbol: normalized.symbolKey, timeframe, smc });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  app.get('/api/trading/sentiment', async (req, res) => {
    try {
      const sentiment = await TradingEngine.fetchFearAndGreed();
      res.json({ status: 'ok', sentiment });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  app.get('/api/trading/funding', async (req, res) => {
    try {
      const funding = await TradingEngine.fetchFundingRates();
      res.json({ status: 'ok', funding });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  app.get('/api/trading/calendar', (req, res) => {
    try {
      const calendar = TradingEngine.getEconomicCalendar();
      res.json({ status: 'ok', calendar });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  app.get('/api/trading/backtest', async (req, res) => {
    try {
      const symbol = (req.query.symbol as string) || 'BTCUSDT';
      const strategy = (req.query.strategy as string) || 'EMA_SMC_CONFLUENCE';
      const timeframe = ((req.query.timeframe as string) || '1h') as '15m' | '1h' | '4h' | '1d';
      const backtest = await TradingEngine.runBacktest(symbol, strategy, timeframe);
      res.json({ status: 'ok', backtest });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  app.get('/api/trading/mtf', async (req, res) => {
    try {
      const symbol = (req.query.symbol as string) || 'BTCUSDT';
      const mtf = await TradingEngine.getMTFMatrix(symbol);
      res.json({ status: 'ok', mtf });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  app.get('/api/trading/diagnostics', async (req, res) => {
    try {
      const symbol = (req.query.symbol as string) || 'BTCUSDT';
      const timeframe = ((req.query.timeframe as string) || '1h') as '15m' | '1h' | '4h' | '1d';
      const diagnostics = await TradingEngine.generateDiagnosticsReport(symbol, timeframe);
      res.json({ status: 'ok', diagnostics });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  // --- DOCUMENTATION DOWNLOAD ENDPOINT ---
  app.get('/api/download-spec', (req, res) => {
    try {
      const format = (req.query.format as string) === 'md' ? 'md' : 'doc';
      const filename = format === 'md' ? 'AI_TRADING_BOT_SYSTEM_DOCUMENTATION.md' : 'AI_TRADING_BOT_SYSTEM_DOCUMENTATION.doc';
      const filePath = path.join(process.cwd(), 'public', filename);
      const mimeType = format === 'md' ? 'text/markdown' : 'application/msword';

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', mimeType);
      res.sendFile(filePath);
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  // Web UI Telegram Simulator (Allows testing prompts directly without opening Telegram app)
  app.post('/api/bot/simulate-chat', async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: 'Message is required' });

      // Run internal bot processing logic
      const fakeChatId = 999999;
      await TelegramBotService.handleUpdate({
        message: {
          chat: { id: fakeChatId },
          from: { first_name: 'Web Tester', username: 'web_tester' },
          text: message,
        },
      });

      const logs = TelegramBotService.getLogs();
      const latest = logs.find((l) => l.chatId === fakeChatId);

      res.json({
        status: 'ok',
        response: latest?.replyText || 'Response processed',
      });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Trading Assistant Bot Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
