# QUANTITATIVE AI TRADING ASSISTANT & TELEGRAM BOT
## Full Technical Specification & Architecture Manual for ChatGPT / AI Reviewers

---

### 1. Executive Summary & Overview
This project is an **Institutional-Grade Quantitative Trading Engine & 24/7 Telegram Assistant** built on a full-stack architecture (**React 18 + Vite + Tailwind CSS + Node.js Express Backend**). It is powered by live market feeds from Binance public futures/spot Web APIs, alternative.me sentiment feeds, Smart Money Concepts (SMC) pattern detectors, quantitative multi-timeframe algorithms, and the **Google Gemini AI SDK (`@google/genai`)** for natural language trade analysis and institutional reasoning.

The application operates in two synchronized modes:
1. **24/7 Headless Telegram Bot**: Interacts with traders via direct Telegram messages, inline buttons, and slash commands. Features background price alert loops, live setup generation, and natural-language Q&A.
2. **Web Control Dashboard**: A real-time terminal UI with live price tickers, custom TradingView-style interactive chart overlays (Order Blocks, Fair Value Gaps, EMAs), Multi-Timeframe Alignment Matrices, Strategy Backtesters, Risk Calculators, and an in-browser Telegram bot simulator.

---

### 2. Core Architecture & Tech Stack

```
+-----------------------------------------------------------------------------+
|                                CLIENT LAYER                                 |
|  React 18 + Tailwind CSS + Lucide Icons + Vite SPA                         |
|  - Precision Signal Analyzer & Dynamic TradingView-style Candlestick Chart  |
|  - Quant & Macro Hub (MTF Matrix, Fear & Greed, Funding Squeeze, Backtest)  |
|  - Market Scanner (Multi-Asset Auto-Confluence Ranking)                     |
|  - Position Size & Risk Calculator (ATR-based Volatility Sizing)            |
|  - Live Telegram Simulator & 24/7 Diagnostics Log Stream                    |
+-----------------------------------------------------------------------------+
                                      |  HTTP & REST APIs
+-----------------------------------------------------------------------------+
|                                SERVER LAYER                                 |
|  Express.js (Node.js) on Port 3000                                          |
|  - /api/trading/overview, /api/trading/setup, /api/trading/smc              |
|  - /api/trading/sentiment, /api/trading/funding, /api/trading/backtest      |
|  - /api/trading/calendar, /api/trading/mtf                                  |
|  - /api/bot/status, /api/bot/logs, /api/bot/simulate-chat                   |
+-----------------------------------------------------------------------------+
         |                                       |                     |
+-------------------+                   +------------------+   +--------------+
|  QUANT TRADING    |                   | TELEGRAM BOT     |   | GEMINI AI    |
|  ENGINE           |                   | SERVICE          |   | ASSISTANT    |
|  (tradingEngine)  |                   | (telegramBot.ts) |   | (gemini.ts)  |
|  - SMC Detection  |                   | - Long Polling   |   | - Synthesis  |
|  - MTF Matrix     |                   | - Inline Buttons |   | - Trade R:R  |
|  - Backtesting    |                   | - 24/7 Alerts    |   | - Contextual |
|  - EMA/RSI/MACD   |                   | - Webhook Supp.  |   |   Reasoning  |
+-------------------+                   +------------------+   +--------------+
         |                                       |
+-----------------------------------------------------------------------------+
|                         EXTERNAL DATA SOURCES                               |
|  - Binance Public REST (Real-time Gold/Crypto/Forex OHLCV Bars)             |
|  - Binance Futures Premium Index (Real-time Funding & Long/Short)           |
|  - Alternative.me API (Live Crypto Fear & Greed Index)                      |
|  - Global Macro Economic Feeds (FOMC, CPI, NFP, GDP, Central Banks)         |
+-----------------------------------------------------------------------------+
```

---

### 3. Telegram Bot Capabilities & Command Catalog

The bot supports rich HTML cards with interactive inline button keyboards:

| Command | Description | Functionality |
| :--- | :--- | :--- |
| `/start` | Bot Main Menu | Displays feature catalog, quick access buttons, and operational status. |
| `/gold` or `/xauusd` | Instant Gold Setup | Generates a 1H precision setup on Gold (XAU/USD) with Entry, SL, TP1, TP2, TP3. |
| `/setup <SYM> [TF]` | Custom Trade Signal | Analyzes specified symbol (e.g. `BTC`, `ETH`, `SOL`) on `15m`, `1h`, `4h`, or `1d`. |
| `/smc <SYM>` | Smart Money Report | Maps Market Structure, Swing High/Lows, Order Blocks, FVGs, and Liquidity Pools. |
| `/mtf <SYM>` | Multi-Timeframe Matrix | Confluence scoring across 15m, 1h, 4h, and 1D timeframes. |
| `/sentiment` | Fear & Greed Index | Real-time score (0–100), 7-day trend, and contrarian institutional advice. |
| `/funding` | Futures Funding Rates | 8h funding rates, predicted rates, Long/Short ratios, and Squeeze risk alarms. |
| `/backtest <SYM>` | Quantitative Backtest | Simulates historical strategy returns, win rates, profit factor, and max drawdown. |
| `/calendar` | Macro Economic Events | High-impact upcoming catalysts (FOMC, CPI, NFP) with forecast vs prior data. |
| `/alert <SYM> <PRICE>`| 24/7 Price Alert | Sets an autonomous background alert that notifies user when price is hit. |
| `/alerts` | List Active Alerts | Lists active alerts with price triggers. |
| `/riskcalc <E> <SL> <C>`| Position Size Calc | Calculates exact lot size/units and total dollar risk for disciplined trading. |
| `/scan` | Top Market Scanner | Scans all major markets and highlights high-confluence setups. |
| `/crypto` | Market Overview | Summary of top crypto pairs with 24h changes and price action. |

---

### 4. Algorithmic Trading Logic & Indicators

#### A. Smart Money Concepts (SMC)
- **Fair Value Gaps (FVG)**: Identifies 3-candle price displacement imbalances where low of bar 3 > high of bar 1 (Bullish FVG) or high of bar 3 < low of bar 1 (Bearish FVG).
- **Order Blocks (OB)**: Locates the last opposing candle before a strong displacement move (>0.8% price move with high volume).
- **Liquidity Pools**: Automatically identifies buy-side (resting stop-loss clusters above swing highs) and sell-side liquidity (below swing lows) and tracks whether they have been swept.
- **Market Structure Shift (BOS & CHoCH)**: Tracks changes in character and breaks of structure to determine if market is Bullish, Bearish, or Ranging.

#### B. Technical Indicators
- **Exponential Moving Averages (EMA)**: EMA(20), EMA(50), EMA(200) for trend alignment and golden/death crosses.
- **Relative Strength Index (RSI 14)**: Momentum oscillator with overbought (>70), oversold (<30), and divergence detection.
- **Moving Average Convergence Divergence (MACD)**: Fast 12, Slow 26, Signal 9 for momentum crossover confirmation.
- **Average True Range (ATR 14)**: Used for mathematical stop-loss distance calculation (`1.5 * ATR`) to prevent getting stopped out by normal market noise.
- **Bollinger Bands**: 20-period with 2 standard deviations for volatility expansion/contraction (Bandwidth %).

#### C. Risk Management System
- Risk/Reward ratio strictly enforced between **1:2.0 and 1:3.5**.
- **Three Dynamic Take-Profit Targets**:
  - `TP1`: 1.2x Risk (recommended to take 50% partial profit and move SL to breakeven).
  - `TP2`: 2.0x Risk (major structural target / liquidity pool).
  - `TP3`: 3.0x+ Risk (runner target for extended trend expansion).

---

### 5. Backend Service Implementation (`/server`)

- **`tradingEngine.ts`**:
  - Normalizes symbols (`XAUUSD`, `PAXGUSDT`, `BTCUSDT`, `SOLUSDT`, `EURUSDT`).
  - Fetches live Kline bars from Binance Public API with synthetic fallback.
  - Implements `calculateIndicators()`, `calculateSMC()`, `fetchFearAndGreed()`, `fetchFundingRates()`, `getMTFMatrix()`, and `runBacktest()`.
- **`telegramBot.ts`**:
  - Direct HTTP long-polling loop with `getUpdates` (no public HTTPS webhook required for development/container usage).
  - Supports inline callback queries (`callback_data`) for instantaneous 1-click signal buttons.
  - Manages background price alert loop checking prices every 20 seconds.
- **`geminiService.ts`**:
  - Connects to `@google/genai` using `gemini-2.5-flash`.
  - Ingests quantitative metrics into structured system prompts for contextual institutional narrative synthesis.
- **`server.ts`**:
  - Express server hosting REST endpoints, serving Vite frontend assets, and proxying Telegram bot commands.

---

### 6. Frontend Architecture (`/src`)

- **`Navbar.tsx`**: Header with live bot status badge, active connection indicators, and main navigation tabs.
- **`TradeSetupView.tsx`**: Interactive terminal displaying live market quotes, candlestick charts with indicator overlays (SMC, EMAs, RSI, MACD), trade cards, and 1-click Telegram broadcast triggers.
- **`QuantMacroHub.tsx`**: Specialized hub containing:
  1. Multi-Timeframe Alignment Matrix
  2. Fear & Greed Index with 7-day trajectory & contrarian advice
  3. Futures Funding Rate & Squeeze Risk table
  4. Algorithmic Strategy Backtester with simulated trade logs
  5. Global Macro High-Impact Economic Calendar
- **`MarketScanner.tsx`**: Grid of all monitored assets with real-time confluence scores.
- **`RiskCalculator.tsx`**: Position sizing tool matching account capital to volatility.
- **`TelegramSimulator.tsx`**: Full in-browser Telegram chat simulator allowing full testing of bot commands and conversational queries without needing an active Telegram app.
- **`ActivityLogs.tsx`**: Real-time log stream showing telegram interactions, webhook calls, and execution timestamps.

---

### 7. How to Explain or Hand Off to ChatGPT
When chatting with ChatGPT or another AI developer, you can provide this document and instruct:

> *"Here is the complete technical architecture and specification of my Quantitative AI Trading Assistant & Telegram Bot. Review this document to understand the codebase structure, trading algorithms (SMC, MTF Matrix, Funding Squeeze), API endpoints, and Telegram bot implementation."*
