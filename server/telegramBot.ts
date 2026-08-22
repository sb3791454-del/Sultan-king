import { TradingEngine } from './tradingEngine';
import { GeminiTradingAssistant } from './geminiService';
import { BotStatusInfo, TelegramLog, TradeSetup } from '../src/types';

export class TelegramBotService {
  private static botToken: string = process.env.TELEGRAM_BOT_TOKEN || '8821939207:AAFzBm04GBF-uVzdnfCbvZmjEmpkApFdUvs';
  private static botInfo: { id: number; username: string; first_name: string } | null = null;
  private static logs: TelegramLog[] = [];
  private static isPolling = false;
  private static lastUpdateId = 0;
  private static totalMessagesCount = 0;
  private static priceAlerts: Array<{ id: string; chatId: number; symbol: string; targetPrice: number; condition: 'ABOVE' | 'BELOW'; createdAt: string }> = [];
  private static alertsLoopStarted = false;

  /**
   * Initializes the Telegram bot, checks credentials, and starts direct long-polling
   */
  public static async init(_appUrl?: string): Promise<void> {
    const token = this.getToken();
    if (!token) {
      console.warn('⚠️ No TELEGRAM_BOT_TOKEN provided. Telegram Bot service is idle.');
      return;
    }

    try {
      // 1. Verify Bot Token
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await res.json();

      if (data.ok && data.result) {
        this.botInfo = {
          id: data.result.id,
          username: data.result.username,
          first_name: data.result.first_name,
        };
        console.log(`🤖 Telegram Bot connected: @${this.botInfo.username} (${this.botInfo.first_name})`);

        // 2. Set Bot Commands Menu in Telegram
        await this.setBotCommands();

        // 3. Clear any stuck Webhooks so Telegram immediately delivers all pending & new updates via getUpdates
        try {
          const delRes = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);
          const delData = await delRes.json();
          console.log('📡 Telegram Webhook cleared for Direct Long-Polling:', delData.description || delData.ok);
        } catch (delErr: any) {
          console.warn('Telegram deleteWebhook warning:', delErr?.message);
        }

        // 4. Start active long-polling listener
        this.startPolling();

        // 5. Start real-time price alerts monitor loop
        this.startPriceAlertsMonitor();
      } else {
        console.error('❌ Invalid Telegram Bot Token:', data.description);
      }
    } catch (e: any) {
      console.error('Telegram bot init error:', e?.message);
    }
  }

  public static getToken(): string {
    return process.env.TELEGRAM_BOT_TOKEN || this.botToken;
  }

  public static setToken(token: string): void {
    this.botToken = token.trim();
    this.isPolling = false;
    this.init().catch(console.error);
  }

  public static getStatus(): BotStatusInfo {
    return {
      isConfigured: !!this.botInfo,
      botUsername: this.botInfo?.username,
      botFirstName: this.botInfo?.first_name,
      botId: this.botInfo?.id,
      webhookUrl: undefined,
      mode: 'polling',
      lastActivity: this.logs.length > 0 ? this.logs[0].timestamp : undefined,
      totalMessagesHandled: this.totalMessagesCount,
      activeSignalsCount: this.logs.filter((l) => l.signalGenerated).length,
    };
  }

  public static getLogs(): TelegramLog[] {
    return this.logs.slice(0, 50);
  }

  /**
   * Sets the Telegram native commands list
   */
  private static async setBotCommands(): Promise<void> {
    const token = this.getToken();
    const commands = [
      { command: 'start', description: '🚀 Open Advanced Trading Menu' },
      { command: 'gold', description: '🥇 Instant Gold (XAU/USD) Setup' },
      { command: 'setup', description: '🎯 Precision Setup: /setup <symbol> [15m|1h|4h]' },
      { command: 'smc', description: '🏦 Smart Money Concepts: /smc <symbol>' },
      { command: 'sentiment', description: '😱 Live Fear & Greed Index' },
      { command: 'funding', description: '⚡ Futures Funding Rates & Squeeze Risk' },
      { command: 'mtf', description: '📶 Multi-Timeframe Matrix: /mtf <symbol>' },
      { command: 'backtest', description: '🧪 Algorithmic Strategy Backtest' },
      { command: 'calendar', description: '📅 Global Macro Economic Calendar' },
      { command: 'alert', description: '🔔 Price Alert: /alert BTC 98000' },
      { command: 'alerts', description: '📋 View Active Price Alerts' },
      { command: 'scan', description: '📡 Scan Top Markets for High Confluence' },
      { command: 'crypto', description: '₿ Live Crypto Market Overview' },
      { command: 'riskcalc', description: '🧮 Position Size & Risk Calculator' },
      { command: 'help', description: '💡 How to use this bot' },
    ];

    try {
      await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands }),
      });
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Main incoming update handler (invoked by webhook POST or polling loop)
   */
  public static async handleUpdate(update: any): Promise<void> {
    try {
      if (update.message) {
        await this.processIncomingMessage(update.message);
      } else if (update.callback_query) {
        await this.processCallbackQuery(update.callback_query);
      }
    } catch (err: any) {
      console.error('Error handling Telegram update:', err?.message);
    }
  }

  /**
   * Processes a text message from a Telegram user
   */
  private static async processIncomingMessage(message: any): Promise<void> {
    const chatId = message.chat?.id;
    const text: string = (message.text || '').trim();
    const fromUser = message.from?.first_name || message.from?.username || 'User';

    if (!chatId || !text) return;

    this.totalMessagesCount++;
    console.log(`📩 Telegram message from ${fromUser} (${chatId}): "${text}"`);

    // Send "Typing..." action to Telegram
    this.sendChatAction(chatId, 'typing').catch(() => {});

    let replyText = '';
    let replyMarkup: any = null;
    let isSignal = false;

    // 1. /start or /help
    if (text.startsWith('/start') || text.startsWith('/help')) {
      replyText = `👋 <b>Welcome to your Advanced Quantitative AI Trading Assistant, ${fromUser}!</b>

I am a 24/7 institutional-grade trading engine powered by live multi-asset feeds, Smart Money Concepts (SMC), and Gemini AI synthesis.

🚀 <b>Instant Signal Commands:</b>
• <code>/gold</code> or <code>/xauusd</code> — Instant Gold precision setup
• <code>/setup BTC 1h</code> — Custom asset & timeframe (15m, 1h, 4h, 1d)
• <code>/scan</code> — Scan top assets for high-confluence setups
• <code>/crypto</code> — Live 24h market metrics

🏦 <b>Smart Money & Quantitative Tools:</b>
• <code>/smc BTC</code> — Order blocks, Fair Value Gaps (FVG), Liquidity sweeps
• <code>/mtf SOL</code> — Multi-Timeframe Confluence Matrix (15m / 1h / 4h / 1d)
• <code>/sentiment</code> — Live Fear & Greed Index + Contrarian Regime
• <code>/funding</code> — Futures Funding Rates & Long/Short Squeeze Risk
• <code>/backtest BTC</code> — Algorithmic strategy backtest win-rate
• <code>/calendar</code> — Global Macro High-Impact Economic Events

🔔 <b>24/7 Live Price Alerts:</b>
• <code>/alert BTC 98000</code> — Alert when price crosses $98,000
• <code>/alerts</code> — List and manage your active alerts
• <code>/riskcalc 2950 2920 10000</code> — Exact position size & risk limit

💡 <b>Natural Language Supported:</b>
<i>"Give me a good gold usdt setup"</i>
<i>"Is SOL overleveraged or ready to squeeze?"</i>
<i>"What is the market structure on BTC?"</i>

Tap any button below to launch an instant analysis:`;

      replyMarkup = {
        inline_keyboard: [
          [
            { text: '🥇 Gold Setup', callback_data: 'setup:XAUUSD:1h' },
            { text: '₿ Bitcoin Setup', callback_data: 'setup:BTCUSDT:1h' },
          ],
          [
            { text: '🏦 BTC SMC Analysis', callback_data: 'smc:BTCUSDT' },
            { text: '📶 BTC Multi-TF Matrix', callback_data: 'mtf:BTCUSDT' },
          ],
          [
            { text: '😱 Fear & Greed Index', callback_data: 'sentiment' },
            { text: '⚡ Futures Funding & Squeeze', callback_data: 'funding' },
          ],
          [
            { text: '📅 Macro Calendar', callback_data: 'calendar' },
            { text: '📡 Scan Top Markets', callback_data: 'scan' },
          ],
        ],
      };
    }
    // 2. /gold or /xauusd
    else if (text.startsWith('/gold') || text.startsWith('/xauusd')) {
      isSignal = true;
      const setup = await this.generateSetupForSymbol('XAUUSD', '1h');
      replyText = setup.telegramFormattedCard;
      replyMarkup = this.buildSetupKeyboard('XAUUSD', '1h');
    }
    // 3. /crypto or /market
    else if (text.startsWith('/crypto') || text.startsWith('/market')) {
      replyText = await this.generateMarketOverviewText();
      replyMarkup = {
        inline_keyboard: [
          [
            { text: '🥇 Gold Setup', callback_data: 'setup:XAUUSD:1h' },
            { text: '₿ BTC Setup', callback_data: 'setup:BTCUSDT:1h' },
          ],
          [{ text: '🔄 Refresh Market Overview', callback_data: 'market' }],
        ],
      };
    }
    // 4. /scan
    else if (text.startsWith('/scan')) {
      replyText = await this.generateScannerText();
      replyMarkup = {
        inline_keyboard: [
          [
            { text: '🥇 Gold', callback_data: 'setup:XAUUSD:1h' },
            { text: '₿ BTC', callback_data: 'setup:BTCUSDT:1h' },
            { text: '🚀 SOL', callback_data: 'setup:SOLUSDT:1h' },
          ],
          [{ text: '🔄 Rescan Markets', callback_data: 'scan' }],
        ],
      };
    }
    // 5. /smc <symbol>
    else if (text.startsWith('/smc')) {
      const parts = text.split(/\s+/).slice(1);
      const symbolInput = parts[0] || 'BTC';
      replyText = await this.generateSMCText(symbolInput);
      replyMarkup = {
        inline_keyboard: [
          [
            { text: `🎯 Setup for ${symbolInput.toUpperCase()}`, callback_data: `setup:${symbolInput}:1h` },
            { text: `📶 Multi-TF Matrix`, callback_data: `mtf:${symbolInput}` },
          ],
        ],
      };
    }
    // 6. /sentiment or /fng
    else if (text.startsWith('/sentiment') || text.startsWith('/fng')) {
      replyText = await this.generateSentimentText();
      replyMarkup = {
        inline_keyboard: [
          [
            { text: '⚡ Check Funding Rates', callback_data: 'funding' },
            { text: '📡 Scan Markets', callback_data: 'scan' },
          ],
        ],
      };
    }
    // 7. /funding or /squeeze
    else if (text.startsWith('/funding') || text.startsWith('/squeeze')) {
      replyText = await this.generateFundingText();
      replyMarkup = {
        inline_keyboard: [
          [
            { text: '😱 Fear & Greed', callback_data: 'sentiment' },
            { text: '📡 Scan Markets', callback_data: 'scan' },
          ],
        ],
      };
    }
    // 8. /mtf <symbol>
    else if (text.startsWith('/mtf')) {
      const parts = text.split(/\s+/).slice(1);
      const symbolInput = parts[0] || 'BTC';
      replyText = await this.generateMTFText(symbolInput);
      replyMarkup = {
        inline_keyboard: [
          [
            { text: `🎯 Setup for ${symbolInput.toUpperCase()}`, callback_data: `setup:${symbolInput}:1h` },
            { text: `🏦 SMC Structure`, callback_data: `smc:${symbolInput}` },
          ],
        ],
      };
    }
    // 9. /backtest <symbol> [strategy]
    else if (text.startsWith('/backtest')) {
      const parts = text.split(/\s+/).slice(1);
      const symbolInput = parts[0] || 'BTC';
      replyText = await this.generateBacktestText(symbolInput);
      replyMarkup = {
        inline_keyboard: [
          [
            { text: `🎯 Get Live Setup`, callback_data: `setup:${symbolInput}:1h` },
            { text: `🏦 SMC Analysis`, callback_data: `smc:${symbolInput}` },
          ],
        ],
      };
    }
    // 10. /calendar
    else if (text.startsWith('/calendar')) {
      replyText = this.generateCalendarText();
      replyMarkup = {
        inline_keyboard: [
          [
            { text: '🥇 Gold Setup', callback_data: 'setup:XAUUSD:1h' },
            { text: '₿ BTC Setup', callback_data: 'setup:BTCUSDT:1h' },
          ],
        ],
      };
    }
    // 11. /alert <symbol> <targetPrice> [above|below]
    else if (text.startsWith('/alert') && !text.startsWith('/alerts')) {
      replyText = await this.handleAddAlert(chatId, text);
    }
    // 12. /alerts (list active alerts)
    else if (text.startsWith('/alerts')) {
      replyText = this.handleListAlerts(chatId);
    }
    // 13. /riskcalc <entry> <sl> <capital> [risk%]
    else if (text.startsWith('/riskcalc')) {
      replyText = this.calculateRisk(text);
    }
    // 14. /setup <symbol> [timeframe]
    else if (text.startsWith('/setup')) {
      const parts = text.split(/\s+/).slice(1);
      const symbolInput = parts[0] || 'BTC';
      const tfInput = (parts[1] || '1h').toLowerCase() as '15m' | '1h' | '4h' | '1d';
      const validTf = ['15m', '1h', '4h', '1d'].includes(tfInput) ? tfInput : '1h';

      isSignal = true;
      const setup = await this.generateSetupForSymbol(symbolInput, validTf);
      replyText = setup.telegramFormattedCard;
      replyMarkup = this.buildSetupKeyboard(setup.symbol, validTf);
    }
    // 15. Natural Language query handling
    else {
      // Check if user is asking for a setup or analysis in natural language
      const lower = text.toLowerCase();
      let extractedSymbol = '';
      if (lower.includes('gold') || lower.includes('xau')) extractedSymbol = 'XAUUSD';
      else if (lower.includes('btc') || lower.includes('bitcoin')) extractedSymbol = 'BTCUSDT';
      else if (lower.includes('eth') || lower.includes('ether')) extractedSymbol = 'ETHUSDT';
      else if (lower.includes('sol') || lower.includes('solana')) extractedSymbol = 'SOLUSDT';
      else if (lower.includes('xrp') || lower.includes('ripple')) extractedSymbol = 'XRPUSDT';
      else if (lower.includes('bnb')) extractedSymbol = 'BNBUSDT';
      else if (lower.includes('doge')) extractedSymbol = 'DOGEUSDT';
      else if (lower.includes('near')) extractedSymbol = 'NEARUSDT';
      else if (lower.includes('sui')) extractedSymbol = 'SUIUSDT';

      let extractedTf: '15m' | '1h' | '4h' | '1d' = '1h';
      if (lower.includes('15m') || lower.includes('15 min') || lower.includes('scalp')) extractedTf = '15m';
      else if (lower.includes('4h') || lower.includes('4 hour') || lower.includes('swing')) extractedTf = '4h';
      else if (lower.includes('1d') || lower.includes('daily')) extractedTf = '1d';

      if (extractedSymbol || lower.includes('setup') || lower.includes('trade') || lower.includes('signal') || lower.includes('buy') || lower.includes('sell')) {
        const sym = extractedSymbol || 'XAUUSD';
        isSignal = true;
        const setup = await this.generateSetupForSymbol(sym, extractedTf, text);
        replyText = setup.telegramFormattedCard;
        replyMarkup = this.buildSetupKeyboard(setup.symbol, extractedTf);
      } else if (lower.includes('smc') || lower.includes('order block') || lower.includes('fvg')) {
        replyText = await this.generateSMCText(extractedSymbol || 'BTCUSDT');
      } else if (lower.includes('sentiment') || lower.includes('fear') || lower.includes('greed')) {
        replyText = await this.generateSentimentText();
      } else if (lower.includes('funding') || lower.includes('squeeze')) {
        replyText = await this.generateFundingText();
      } else {
        // General trading Q&A with Gemini
        replyText = await GeminiTradingAssistant.answerGeneralTradingQuery(text);
      }
    }

    // Send the reply back to the Telegram chat
    await this.sendMessage(chatId, replyText, replyMarkup);

    // Save to in-memory log
    this.logs.unshift({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      from: fromUser,
      chatId,
      messageText: text,
      replyText: replyText.substring(0, 150) + (replyText.length > 150 ? '...' : ''),
      signalGenerated: isSignal,
    });
  }

  /**
   * Handles button clicks from Telegram inline keyboards
   */
  private static async processCallbackQuery(callbackQuery: any): Promise<void> {
    const callbackId = callbackQuery.id;
    const chatId = callbackQuery.message?.chat?.id;
    const messageId = callbackQuery.message?.message_id;
    const data: string = callbackQuery.data || '';

    // Acknowledge callback immediately
    this.answerCallbackQuery(callbackId).catch(() => {});

    if (!chatId || !data) return;

    if (data.startsWith('setup:')) {
      const [, sym, tf] = data.split(':');
      const validTf = (tf as '15m' | '1h' | '4h' | '1d') || '1h';
      const setup = await this.generateSetupForSymbol(sym, validTf);
      await this.sendMessage(chatId, setup.telegramFormattedCard, this.buildSetupKeyboard(setup.symbol, validTf));
    } else if (data.startsWith('smc:')) {
      const [, sym] = data.split(':');
      const smcText = await this.generateSMCText(sym || 'BTCUSDT');
      await this.sendMessage(chatId, smcText, {
        inline_keyboard: [
          [
            { text: `🎯 Get Setup for ${sym}`, callback_data: `setup:${sym}:1h` },
            { text: `📶 Multi-TF Matrix`, callback_data: `mtf:${sym}` },
          ],
        ],
      });
    } else if (data.startsWith('mtf:')) {
      const [, sym] = data.split(':');
      const mtfText = await this.generateMTFText(sym || 'BTCUSDT');
      await this.sendMessage(chatId, mtfText, {
        inline_keyboard: [
          [
            { text: `🎯 Setup for ${sym}`, callback_data: `setup:${sym}:1h` },
            { text: `🏦 SMC Analysis`, callback_data: `smc:${sym}` },
          ],
        ],
      });
    } else if (data === 'sentiment') {
      const sentText = await this.generateSentimentText();
      await this.sendMessage(chatId, sentText, {
        inline_keyboard: [
          [
            { text: '⚡ Check Funding Rates', callback_data: 'funding' },
            { text: '📡 Scan Markets', callback_data: 'scan' },
          ],
        ],
      });
    } else if (data === 'funding') {
      const fundText = await this.generateFundingText();
      await this.sendMessage(chatId, fundText, {
        inline_keyboard: [
          [
            { text: '😱 Fear & Greed', callback_data: 'sentiment' },
            { text: '📡 Scan Markets', callback_data: 'scan' },
          ],
        ],
      });
    } else if (data === 'calendar') {
      const calText = this.generateCalendarText();
      await this.sendMessage(chatId, calText, {
        inline_keyboard: [
          [
            { text: '🥇 Gold Setup', callback_data: 'setup:XAUUSD:1h' },
            { text: '₿ BTC Setup', callback_data: 'setup:BTCUSDT:1h' },
          ],
        ],
      });
    } else if (data === 'scan') {
      const scanText = await this.generateScannerText();
      await this.sendMessage(chatId, scanText, {
        inline_keyboard: [
          [
            { text: '🥇 Gold Setup', callback_data: 'setup:XAUUSD:1h' },
            { text: '₿ BTC Setup', callback_data: 'setup:BTCUSDT:1h' },
            { text: '🚀 SOL Setup', callback_data: 'setup:SOLUSDT:1h' },
          ],
          [{ text: '🔄 Rescan Markets', callback_data: 'scan' }],
        ],
      });
    } else if (data === 'market') {
      const marketText = await this.generateMarketOverviewText();
      await this.sendMessage(chatId, marketText, {
        inline_keyboard: [
          [
            { text: '🥇 Gold Setup', callback_data: 'setup:XAUUSD:1h' },
            { text: '₿ BTC Setup', callback_data: 'setup:BTCUSDT:1h' },
          ],
          [{ text: '🔄 Refresh Market Overview', callback_data: 'market' }],
        ],
      });
    }
  }

  /**
   * Generates Smart Money Concepts (SMC) Telegram Card
   */
  private static async generateSMCText(rawSymbol: string): Promise<string> {
    const normalized = TradingEngine.normalizeSymbol(rawSymbol);
    const candles = await TradingEngine.fetchCandles(normalized.binancePair, '1h', 100);
    const smc = TradingEngine.calculateSMC(candles);
    const lastPrice = candles[candles.length - 1]?.close || 0;

    let text = `🏦 <b>SMART MONEY CONCEPTS (SMC) REPORT</b>
<b>Asset:</b> ${normalized.name} (${normalized.symbolKey}) • <code>$${lastPrice.toLocaleString()}</code>
━━━━━━━━━━━━━━━━━━━━

🏗️ <b>MARKET STRUCTURE:</b>
• <b>Structural Bias:</b> <code>${smc.marketStructure.structuralBias}</code>
• <b>Recent Swing High:</b> $${smc.marketStructure.lastSwingHigh.toLocaleString()}
• <b>Recent Swing Low:</b> $${smc.marketStructure.lastSwingLow.toLocaleString()}

📦 <b>INSTITUTIONAL ORDER BLOCKS (OB):</b>\n`;

    if (smc.orderBlocks.length === 0) {
      text += `• No fresh unmitigated Order Blocks on 1H\n`;
    } else {
      smc.orderBlocks.forEach((ob) => {
        const typeEmoji = ob.type === 'BULLISH_OB' ? '🟢 Bullish Demand OB' : '🔴 Bearish Supply OB';
        const mit = ob.mitigated ? '<i>(Mitigated)</i>' : '<b>(FRESH / ACTIVE)</b>';
        text += `• ${typeEmoji}: <code>$${ob.bottom} - $${ob.top}</code> ${mit}\n`;
      });
    }

    text += `\n⚡ <b>FAIR VALUE GAPS (FVG / IMBALANCE):</b>\n`;
    if (smc.fairValueGaps.length === 0) {
      text += `• No open 1H Fair Value Gaps\n`;
    } else {
      smc.fairValueGaps.forEach((fvg) => {
        const typeEmoji = fvg.type === 'BULLISH_FVG' ? '🟢 Bullish FVG' : '🔴 Bearish FVG';
        const mit = fvg.mitigated ? '<i>(Filled)</i>' : '<b>(OPEN TARGET)</b>';
        text += `• ${typeEmoji}: <code>$${fvg.bottom} - $${fvg.top}</code> ${mit}\n`;
      });
    }

    text += `\n🎯 <b>LIQUIDITY POOLS:</b>\n`;
    smc.liquidityPools.forEach((pool) => {
      const sweptEmoji = pool.swept ? '✅ Swept' : '⏳ Resting Liquidity';
      const label = pool.type === 'BUY_SIDE_LIQUIDITY' ? 'Buy-Side (Stop-Loss Runs)' : 'Sell-Side (Liquidity Grab)';
      text += `• <b>${label}:</b> $${pool.price.toLocaleString()} (${sweptEmoji})\n`;
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━\n💡 <i>Institutions hunt liquidity pools before initiating large displacement moves.</i>`;
    return text;
  }

  /**
   * Generates Live Fear & Greed Sentiment Card
   */
  private static async generateSentimentText(): Promise<string> {
    const data = await TradingEngine.fetchFearAndGreed();
    const meterEmoji = data.score >= 75 ? '🔥 Extreme Greed' : data.score >= 55 ? '🟢 Greed' : data.score <= 25 ? '🥶 Extreme Fear' : data.score <= 45 ? '🔴 Fear' : '⚖️ Neutral';

    let text = `😱 <b>GLOBAL MARKET SENTIMENT & MACRO REGIME</b>
━━━━━━━━━━━━━━━━━━━━

📊 <b>Fear & Greed Score:</b> <code>${data.score} / 100</code>
🧭 <b>Sentiment State:</b> <b>${meterEmoji}</b>

📈 <b>7-Day Trend:</b>\n`;

    data.historical7Days.forEach((day) => {
      text += `• <b>${day.date}:</b> <code>${day.value}</code> (${day.rating})\n`;
    });

    text += `\n🧠 <b>CONTRARIAN INSTITUTIONAL STRATEGY:</b>
<i>${data.contrarianVerdict}</i>

━━━━━━━━━━━━━━━━━━━━
💡 <i>"Be fearful when others are greedy, and greedy when others are fearful."</i>`;
    return text;
  }

  /**
   * Generates Live Futures Funding Rates & Squeeze Risk Card
   */
  private static async generateFundingText(): Promise<string> {
    const list = await TradingEngine.fetchFundingRates();
    let text = `⚡ <b>FUTURES FUNDING RATES & SQUEEZE WARNING</b>
━━━━━━━━━━━━━━━━━━━━\n\n`;

    list.forEach((item) => {
      const squeezeIcon = item.squeezeRisk === 'HIGH_LONG_SQUEEZE' ? '⚠️ High Long Squeeze Risk (Overleveraged Longs)' : item.squeezeRisk === 'HIGH_SHORT_SQUEEZE' ? '🚀 High Short Squeeze Risk (Short Trap Active!)' : '✅ Balanced Funding';
      text += `<b>${item.symbol}</b>\n`;
      text += `• <b>Funding Rate:</b> <code>${item.fundingRatePercent}</code> (Next in: ${item.nextFundingTime})\n`;
      text += `• <b>Long/Short Ratio:</b> <code>${item.longShortRatio}x</code>\n`;
      text += `• <b>Squeeze Regime:</b> ${squeezeIcon}\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━\n💡 <i>Negative funding rates with rising volume indicate massive short squeeze potential.</i>`;
    return text;
  }

  /**
   * Generates Live Multi-Timeframe Matrix Card
   */
  private static async generateMTFText(rawSymbol: string): Promise<string> {
    const mtf = await TradingEngine.getMTFMatrix(rawSymbol);
    const biasEmoji = mtf.overallBias.includes('BUY') ? '🟢 ' + mtf.overallBias : mtf.overallBias.includes('SELL') ? '🔴 ' + mtf.overallBias : '🟡 ' + mtf.overallBias;

    let text = `📶 <b>MULTI-TIMEFRAME CONFLUENCE MATRIX</b>
<b>Asset:</b> ${mtf.symbol} • <b>Overall Bias:</b> <b>${biasEmoji}</b>
<b>Confluence Alignment:</b> <code>${mtf.confluenceRatio}</code>
━━━━━━━━━━━━━━━━━━━━\n\n`;

    mtf.timeframes.forEach((tf) => {
      const trendIcon = tf.trend === 'BULLISH' ? '🟢 Bullish' : tf.trend === 'BEARISH' ? '🔴 Bearish' : '🟡 Neutral';
      text += `⏱️ <b>Timeframe [${tf.tf.toUpperCase()}]:</b>\n`;
      text += `• <b>Trend:</b> ${trendIcon} | <b>Score:</b> ${tf.score}/10\n`;
      text += `• <b>RSI(14):</b> ${tf.rsi} | <b>MACD:</b> ${tf.macd}\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━\n💡 <i>Trades taken when 3 or more timeframes align in confluence have the highest statistical probability.</i>`;
    return text;
  }

  /**
   * Generates Algorithmic Strategy Backtest Card
   */
  private static async generateBacktestText(rawSymbol: string): Promise<string> {
    const result = await TradingEngine.runBacktest(rawSymbol, 'EMA_SMC_CONFLUENCE', '1h');
    const winRateEmoji = result.winRatePercent >= 65 ? '🏆' : '📊';

    let text = `🧪 <b>QUANTITATIVE STRATEGY BACKTEST RESULTS</b>
━━━━━━━━━━━━━━━━━━━━
<b>Asset:</b> ${result.symbol} (1H Timeframe)
<b>Strategy:</b> <code>${result.strategyName}</code>

${winRateEmoji} <b>Win Rate:</b> <code>${result.winRatePercent}%</code> (${result.winningTrades} Wins / ${result.losingTrades} Losses)
📈 <b>Simulated Net Return:</b> <code>+${result.netReturnPercent}%</code>
⚡ <b>Profit Factor:</b> <code>${result.profitFactor}x</code>
🛡️ <b>Max Drawdown:</b> <code>-${result.maxDrawdownPercent}%</code>
📐 <b>Avg Risk/Reward:</b> <code>1:${result.averageRiskReward}</code>

📋 <b>Recent Simulated Trades:</b>\n`;

    result.tradeLog.slice(-5).forEach((trade) => {
      const resEmoji = trade.result === 'WIN' ? '✅ WIN' : '❌ LOSS';
      const typeEmoji = trade.type === 'BUY' ? '🟢 LONG' : '🔴 SHORT';
      text += `• ${trade.entryTime}: ${typeEmoji} Entry $${trade.entryPrice} ➔ Exit $${trade.exitPrice} (${resEmoji} ${trade.pnlPercent > 0 ? '+' : ''}${trade.pnlPercent}%)\n`;
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━\n💡 <i>Backtested over historical candles using strict 1:2.4 R:R management.</i>`;
    return text;
  }

  /**
   * Generates Global Economic Macro Calendar Card
   */
  private static generateCalendarText(): string {
    const events = TradingEngine.getEconomicCalendar();
    let text = `📅 <b>GLOBAL MACRO & ECONOMIC CALENDAR</b>
━━━━━━━━━━━━━━━━━━━━\n\n`;

    events.forEach((ev) => {
      const impEmoji = ev.impact === 'HIGH' ? '🔴 HIGH IMPACT' : '🟡 MEDIUM IMPACT';
      text += `📌 <b>${ev.title} (${ev.currency})</b>\n`;
      text += `• <b>Schedule:</b> ${ev.date} at ${ev.timeUTC} [${impEmoji}]\n`;
      text += `• <b>Forecast / Prev:</b> ${ev.forecast} (Prior: ${ev.previous})\n`;
      text += `• <b>Affected Assets:</b> ${ev.affectedAssets.join(', ')}\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━\n⚠️ <i>Exercise caution and widen stop-losses 15 minutes before High-Impact events!</i>`;
    return text;
  }

  /**
   * Sets up a real-time price alert for a user
   */
  private static async handleAddAlert(chatId: number, rawText: string): Promise<string> {
    const parts = rawText.split(/\s+/).slice(1);
    if (parts.length < 2) {
      return `🔔 <b>Set a Real-Time Price Alert</b>\n\nUsage: <code>/alert &lt;Symbol&gt; &lt;TargetPrice&gt; [above|below]</code>\n\nExample:\n<code>/alert BTC 98000</code>\n<code>/alert GOLD 2950</code>`;
    }

    const symbolInput = parts[0];
    const targetPrice = parseFloat(parts[1]);
    const normalized = TradingEngine.normalizeSymbol(symbolInput);

    if (isNaN(targetPrice) || targetPrice <= 0) {
      return `❌ Invalid price target. Please enter a valid number.`;
    }

    const candles = await TradingEngine.fetchCandles(normalized.binancePair, '1h', 5);
    const currentPrice = candles[candles.length - 1]?.close || targetPrice;
    const condition: 'ABOVE' | 'BELOW' = targetPrice >= currentPrice ? 'ABOVE' : 'BELOW';

    const alertItem = {
      id: Math.random().toString(36).substring(2, 9),
      chatId,
      symbol: normalized.symbolKey,
      targetPrice,
      condition,
      createdAt: new Date().toLocaleTimeString(),
    };

    this.priceAlerts.push(alertItem);

    return `🔔 <b>PRICE ALERT SET SUCCESSFULLY!</b>
━━━━━━━━━━━━━━━━━━━━
🎯 <b>Asset:</b> ${normalized.name} (${normalized.symbolKey})
📍 <b>Current Price:</b> <code>$${currentPrice.toLocaleString()}</code>
🎯 <b>Alert Target:</b> <code>$${targetPrice.toLocaleString()}</code>
⚡ <b>Condition:</b> Trigger when price crosses ${condition === 'ABOVE' ? '📈 Above' : '📉 Below'} $${targetPrice.toLocaleString()}

<i>I will notify you in this private chat the exact second this price is reached! 🚀</i>`;
  }

  /**
   * Lists active alerts for a user
   */
  private static handleListAlerts(chatId: number): string {
    const userAlerts = this.priceAlerts.filter((a) => a.chatId === chatId);
    if (userAlerts.length === 0) {
      return `📋 <b>Your Active Price Alerts</b>\n\nYou currently have no active alerts.\nSet one instantly with <code>/alert BTC 98000</code>!`;
    }

    let text = `📋 <b>YOUR ACTIVE PRICE ALERTS (${userAlerts.length})</b>\n━━━━━━━━━━━━━━━━━━━━\n\n`;
    userAlerts.forEach((a, i) => {
      text += `${i + 1}. <b>${a.symbol}</b> ➔ <code>$${a.targetPrice.toLocaleString()}</code> (${a.condition} | Set at ${a.createdAt})\n`;
    });
    text += `\n━━━━━━━━━━━━━━━━━━━━\n<i>Alerts trigger automatically 24/7 when market prices cross targets.</i>`;
    return text;
  }

  /**
   * Background 24/7 monitor that periodically checks prices against user alerts
   */
  private static startPriceAlertsMonitor(): void {
    if (this.alertsLoopStarted) return;
    this.alertsLoopStarted = true;

    setInterval(async () => {
      if (this.priceAlerts.length === 0) return;

      const active = [...this.priceAlerts];
      for (const alert of active) {
        try {
          const normalized = TradingEngine.normalizeSymbol(alert.symbol);
          const candles = await TradingEngine.fetchCandles(normalized.binancePair, '15m', 5);
          const currentPrice = candles[candles.length - 1]?.close;

          if (!currentPrice) continue;

          let triggered = false;
          if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) {
            triggered = true;
          } else if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) {
            triggered = true;
          }

          if (triggered) {
            // Remove from active alerts
            this.priceAlerts = this.priceAlerts.filter((a) => a.id !== alert.id);

            // Send trigger notification to user
            const alertMsg = `🚨 <b>PRICE ALERT TRIGGERED!</b> 🚨
━━━━━━━━━━━━━━━━━━━━
🎯 <b>Asset:</b> <b>${normalized.name} (${alert.symbol})</b>
📍 <b>Target Price:</b> <code>$${alert.targetPrice.toLocaleString()}</code>
⚡ <b>Current Price:</b> <code>$${currentPrice.toLocaleString()}</code>
🕒 <b>Time:</b> ${new Date().toLocaleTimeString()}

<i>Generate an instant precision setup for this move:</i>`;

            await this.sendMessage(alert.chatId, alertMsg, {
              inline_keyboard: [
                [
                  { text: `🎯 Get Setup for ${alert.symbol}`, callback_data: `setup:${alert.symbol}:1h` },
                  { text: `🏦 SMC Analysis`, callback_data: `smc:${alert.symbol}` },
                ],
              ],
            });
          }
        } catch (e: any) {
          // Ignore individual alert fetch errors
        }
      }
    }, 20000); // Check every 20 seconds
  }

  /**
   * Generates a full quantitative + Gemini trade setup for a given symbol
   */
  public static async generateSetupForSymbol(rawSymbol: string, timeframe: '15m' | '1h' | '4h' | '1d' = '1h', customQuery?: string): Promise<TradeSetup> {
    const normalized = TradingEngine.normalizeSymbol(rawSymbol);
    const candles = await TradingEngine.fetchCandles(normalized.binancePair, timeframe, 100);
    const tickerStats = await TradingEngine.fetch24hTicker(normalized.binancePair);
    const indicators = TradingEngine.calculateIndicators(candles, tickerStats);
    const rawSetup = TradingEngine.generateQuantitativeSetup(normalized.symbolKey, normalized.assetType, timeframe, indicators, normalized.decimals);

    return await GeminiTradingAssistant.synthesizeTradeSetup(rawSetup, indicators, customQuery);
  }

  private static buildSetupKeyboard(symbol: string, currentTf: string) {
    const timeframes = ['15m', '1h', '4h', '1d'];
    const tfButtons = timeframes
      .filter((tf) => tf !== currentTf)
      .map((tf) => ({
        text: `Switch ${tf.toUpperCase()}`,
        callback_data: `setup:${symbol}:${tf}`,
      }));

    return {
      inline_keyboard: [
        tfButtons.slice(0, 3),
        [
          { text: '🔄 Refresh Setup', callback_data: `setup:${symbol}:${currentTf}` },
          { text: '📡 Scan Markets', callback_data: 'scan' },
        ],
      ],
    };
  }

  private static async generateScannerText(): Promise<string> {
    const assets = [
      { sym: 'XAUUSD', name: 'Gold (XAU/USD)' },
      { sym: 'BTCUSDT', name: 'Bitcoin (BTC)' },
      { sym: 'ETHUSDT', name: 'Ethereum (ETH)' },
      { sym: 'SOLUSDT', name: 'Solana (SOL)' },
      { sym: 'XRPUSDT', name: 'XRP' },
      { sym: 'NEARUSDT', name: 'NEAR Protocol' },
    ];

    const results = await Promise.all(
      assets.map(async (a) => {
        try {
          const candles = await TradingEngine.fetchCandles(a.sym === 'XAUUSD' ? 'PAXGUSDT' : a.sym, '1h', 70);
          const ind = TradingEngine.calculateIndicators(candles);
          const setup = TradingEngine.generateQuantitativeSetup(a.sym, a.sym === 'XAUUSD' ? 'COMMODITY' : 'CRYPTO', '1h', ind);
          return { ...a, setup, ind };
        } catch {
          return null;
        }
      })
    );

    const valid = results.filter(Boolean).sort((a: any, b: any) => b.setup.confluenceScore - a.setup.confluenceScore);

    let text = `📡 <b>MULTI-ASSET MARKET SCANNER (1H TIMEFRAME)</b>\n━━━━━━━━━━━━━━━━━━━━\n\n`;

    valid.forEach((item: any) => {
      const { setup, name } = item;
      const emoji = setup.action === 'LONG' ? '🟢 LONG' : setup.action === 'SHORT' ? '🔴 SHORT' : '🟡 NEUTRAL';
      text += `<b>${name}</b> • $${setup.currentPrice.toLocaleString()}\n`;
      text += `• <b>Action:</b> ${emoji} | <b>Confluence:</b> ${setup.confluenceScore}/10 (${setup.riskRewardRatio} R:R)\n`;
      text += `• <b>Entry:</b> $${setup.entryZone[0]} - $${setup.entryZone[1]} | <b>SL:</b> $${setup.stopLoss}\n`;
      text += `• <b>TP1:</b> $${setup.takeProfit1} | <b>TP2:</b> $${setup.takeProfit2}\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━\n<i>Tap a button below for full analysis & AI breakdown:</i>`;
    return text;
  }

  private static async generateMarketOverviewText(): Promise<string> {
    const list = await TradingEngine.getMarketOverview();
    let text = `📊 <b>LIVE 24H MARKET OVERVIEW</b>\n━━━━━━━━━━━━━━━━━━━━\n\n`;

    list.forEach((item) => {
      const changeEmoji = item.change24h >= 0 ? '🟢 +' : '🔴 ';
      text += `<b>${item.name} (${item.symbol})</b>\n`;
      text += `• <b>Price:</b> <code>$${item.price.toLocaleString()}</code>\n`;
      text += `• <b>24h Change:</b> ${changeEmoji}${item.change24h.toFixed(2)}%\n`;
      text += `• <b>24h Range:</b> $${item.low24h.toLocaleString()} - $${item.high24h.toLocaleString()}\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━\n<i>Select an asset to generate a precision entry setup:</i>`;
    return text;
  }

  private static calculateRisk(rawText: string): string {
    const parts = rawText.split(/\s+/).slice(1).map(Number).filter((n) => !isNaN(n));
    if (parts.length < 3) {
      return `🧮 <b>Risk & Position Size Calculator</b>\n\nUsage: <code>/riskcalc &lt;Entry&gt; &lt;StopLoss&gt; &lt;AccountCapital&gt; [RiskPercent]</code>\n\nExample for Gold:\n<code>/riskcalc 2950 2925 10000 1.5</code>\n(Entry: $2950, SL: $2925, Capital: $10,000, Risk: 1.5%)`;
    }

    const [entry, sl, capital, riskPctInput] = parts;
    const riskPct = riskPctInput || 1.5;
    const dollarRisk = (capital * riskPct) / 100;
    const riskPerUnit = Math.abs(entry - sl);

    if (riskPerUnit === 0) {
      return `❌ Stop-Loss cannot be equal to Entry Price.`;
    }

    const units = dollarRisk / riskPerUnit;
    const positionValue = units * entry;

    return `🧮 <b>POSITION SIZING & RISK CALCULATION</b>
━━━━━━━━━━━━━━━━━━━━
💰 <b>Account Capital:</b> <code>$${capital.toLocaleString()}</code>
⚠️ <b>Risk Limit:</b> <code>${riskPct}%</code> ($${dollarRisk.toFixed(2)} max loss)

📥 <b>Entry Price:</b> <code>$${entry.toLocaleString()}</code>
🛑 <b>Stop-Loss:</b> <code>$${sl.toLocaleString()}</code>
📏 <b>Risk per Unit:</b> <code>$${riskPerUnit.toFixed(2)}</code>

🎯 <b>RECOMMENDED POSITION SIZE:</b>
• <b>Units / Contracts:</b> <code>${units.toFixed(4)} units</code>
• <b>Total Position Value:</b> <code>$${positionValue.toFixed(2)}</code>
• <b>Leverage Equivalent (if margin):</b> <code>${(positionValue / capital).toFixed(1)}x</code>

🛡️ <i>If price hits your Stop-Loss, you will lose exactly $${dollarRisk.toFixed(2)} (${riskPct}%), preserving 98.5% of your capital!</i>`;
  }

  /**
   * Helper: sends a message to a Telegram chat using Telegram Bot API
   */
  public static async sendMessage(chatId: number | string, text: string, replyMarkup?: any): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const body: any = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      };
      if (replyMarkup) {
        body.reply_markup = replyMarkup;
      }

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.ok) {
        console.warn(`Telegram HTML delivery note (${data.description}), retrying with sanitized plain text...`);
        // Fallback: strip tags and send as plain text so user always gets the response
        const cleanText = text.replace(/<[^>]*>?/gm, '');
        const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: cleanText,
            reply_markup: replyMarkup,
          }),
        });
        const retryData = await retryRes.json();
        return !!retryData.ok;
      }
      return true;
    } catch (e: any) {
      console.error(`Failed to send Telegram message to ${chatId}:`, e?.message);
      return false;
    }
  }

  private static async sendChatAction(chatId: number | string, action: string): Promise<void> {
    const token = this.getToken();
    if (!token) return;
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action }),
      });
    } catch {
      // Ignore
    }
  }

  private static async answerCallbackQuery(callbackQueryId: string): Promise<void> {
    const token = this.getToken();
    if (!token) return;
    try {
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId }),
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Direct high-speed long-polling engine
   */
  private static startPolling(): void {
    if (this.isPolling) return;
    this.isPolling = true;
    console.log('🔄 Telegram Bot live long-polling started');

    const poll = async () => {
      if (!this.isPolling) return;
      const token = this.getToken();
      if (!token) {
        setTimeout(poll, 3000);
        return;
      }

      let hadUpdates = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=15`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json();

        if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
          hadUpdates = true;
          for (const update of data.result) {
            this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
            await this.handleUpdate(update);
          }
        }
      } catch (e: any) {
        // Transient network or timeout, continue
      }

      // If updates were received, poll immediately; otherwise wait 500ms
      setTimeout(poll, hadUpdates ? 100 : 800);
    };

    poll();
  }
}
