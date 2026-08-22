import { validateCandleIntegrity, checkCandleStaleness, MarketDataError, MarketErrorType } from '../server/marketDataProvider';
import { TradingEngine } from '../server/tradingEngine';
import { Candle } from '../src/types';
import fs from 'fs';
import path from 'path';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runTests() {
  console.log('\n🔒 SULTAN-KING PHASE 1 — AUTOMATED PRODUCTION SAFETY & INTEGRITY TEST SUITE\n');

  // ==========================================
  // SUITE 1: SECRET HARDENING & LEAK AUDIT
  // ==========================================
  console.log('--- SUITE 1: SECRET HARDENING & CREDENTIALS AUDIT ---');
  
  const botCode = fs.readFileSync(path.join(process.cwd(), 'server/telegramBot.ts'), 'utf-8');
  assert(!botCode.includes('8821939207:'), 'No hardcoded Telegram token literal in server/telegramBot.ts');
  assert(!botCode.includes('AIzaSy'), 'No hardcoded Google API key in server/telegramBot.ts');

  const geminiCode = fs.readFileSync(path.join(process.cwd(), 'server/geminiService.ts'), 'utf-8');
  assert(!geminiCode.includes('AIzaSy'), 'No hardcoded Google API key in server/geminiService.ts');

  const envExample = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf-8');
  assert(envExample.includes('TELEGRAM_BOT_TOKEN=""'), '.env.example has blank TELEGRAM_BOT_TOKEN template');
  assert(envExample.includes('GEMINI_API_KEY=""'), '.env.example has blank GEMINI_API_KEY template');

  // ==========================================
  // SUITE 2: CANDLE INTEGRITY & REJECTION AUDIT
  // ==========================================
  console.log('\n--- SUITE 2: MARKET DATA & CANDLE INTEGRITY VALIDATION ---');

  const validCandles: Candle[] = [
    { time: Date.now() - 500000, open: 100, high: 105, low: 95, close: 102, volume: 1000 },
    { time: Date.now() - 400000, open: 102, high: 108, low: 100, close: 106, volume: 1200 },
    { time: Date.now() - 300000, open: 106, high: 107, low: 99, close: 101, volume: 900 },
    { time: Date.now() - 200000, open: 101, high: 110, low: 100, close: 108, volume: 1500 },
    { time: Date.now() - 100000, open: 108, high: 112, low: 106, close: 111, volume: 1800 },
  ];

  let validThrew = false;
  try {
    validateCandleIntegrity(validCandles, 5);
  } catch {
    validThrew = true;
  }
  assert(!validThrew, 'Valid OHLC candlestick series accepted without error');

  // Test 1: Inverted High/Low
  const corruptedHighLow: Candle[] = [
    ...validCandles.slice(0, 4),
    { time: Date.now(), open: 100, high: 90, low: 110, close: 105, volume: 1000 }, // Corrupted: High < Low
  ];
  let highLowThrew = false;
  try {
    validateCandleIntegrity(corruptedHighLow, 5);
  } catch (e: any) {
    if (e instanceof MarketDataError && e.errorType === MarketErrorType.MALFORMED_RESPONSE) {
      highLowThrew = true;
    }
  }
  assert(highLowThrew, 'Corrupt inverted High/Low candle strictly rejected with MALFORMED_RESPONSE');

  // Test 2: Non-chronological timestamps
  const nonChronological: Candle[] = [
    { time: 500, open: 100, high: 105, low: 95, close: 102, volume: 1000 },
    { time: 400, open: 102, high: 108, low: 100, close: 106, volume: 1200 }, // Out of order
    { time: 600, open: 106, high: 107, low: 99, close: 101, volume: 900 },
    { time: 700, open: 101, high: 110, low: 100, close: 108, volume: 1500 },
    { time: 800, open: 108, high: 112, low: 106, close: 111, volume: 1800 },
  ];
  let timeThrew = false;
  try {
    validateCandleIntegrity(nonChronological, 5);
  } catch (e: any) {
    if (e instanceof MarketDataError) timeThrew = true;
  }
  assert(timeThrew, 'Non-chronological candle series strictly rejected');

  // Test 3: Staleness check
  const staleTimestamp = Date.now() - (24 * 60 * 60 * 1000); // 24 hours old
  const is15mStale = checkCandleStaleness(staleTimestamp, '15m');
  assert(is15mStale === true, 'Candle older than 3 hours correctly flagged as STALE for 15m timeframe');

  // ==========================================
  // SUITE 3: DETERMINISTIC QUANTITATIVE MATH
  // ==========================================
  console.log('\n--- SUITE 3: QUANTITATIVE INDICATORS & RISK MATH AUDIT ---');

  const sampleCandles: Candle[] = [];
  let basePrice = 2000;
  for (let i = 0; i < 60; i++) {
    const delta = (i % 2 === 0 ? 1 : -0.6) * 5;
    basePrice += delta;
    sampleCandles.push({
      time: Date.now() - (60 - i) * 60000,
      open: basePrice - 2,
      high: basePrice + 4,
      low: basePrice - 4,
      close: basePrice,
      volume: 1000 + i * 10,
    });
  }

  const indicators = TradingEngine.calculateIndicators(sampleCandles);
  assert(indicators.currentPrice > 0, 'Current price is calculated and > 0');
  assert(indicators.rsi14 >= 0 && indicators.rsi14 <= 100, 'RSI(14) is bounded in [0, 100]');
  assert(indicators.atr14 > 0, 'ATR(14) is strictly positive');

  // Test BUY setup geometry
  const longSetup = TradingEngine.generateQuantitativeSetup('BTCUSDT', 'CRYPTO', '1h', {
    ...indicators,
    emaTrend: 'STRONG_BULLISH',
    rsiSignal: 'BULLISH',
    rsi14: 58,
    macd: { line: 2, signal: 1, histogram: 1, crossover: 'BULLISH_CROSS' },
  });

  assert(longSetup.action === 'LONG', 'Strong bullish indicators resolve to LONG action');
  assert(longSetup.stopLoss < longSetup.entryZone[0], 'LONG Stop-Loss is strictly below entry zone');
  assert(longSetup.takeProfit1 > longSetup.entryZone[1], 'LONG TP1 is strictly above entry zone');
  assert(longSetup.takeProfit2 > longSetup.takeProfit1, 'LONG TP2 is strictly above TP1');
  assert(longSetup.takeProfit3 > longSetup.takeProfit2, 'LONG TP3 is strictly above TP2');
  assert(longSetup.confluenceScore >= 7, 'Confluence score reflects high bullish confluence');

  // ==========================================
  // SUITE 4: BACKTEST WIN/LOSS INTEGRITY & SINGLE-CANDLE RESOLUTION
  // ==========================================
  console.log('\n--- SUITE 4: BACKTEST INTEGRITY & AMBIGUOUS BAR RESOLUTION ---');

  // Verify that a strategy backtest runs without generating negative profit factors or inverted PnL logic
  const backtest = await TradingEngine.runBacktest('BTCUSDT', 'EMA_SMC_CONFLUENCE', '1h');
  assert(backtest.totalTrades === backtest.winningTrades + backtest.losingTrades, 'Total trades equals winningTrades + losingTrades');
  assert(backtest.winRatePercent >= 0 && backtest.winRatePercent <= 100, 'Win rate percent bounded in [0, 100]');
  
  for (const trade of backtest.tradeLog) {
    if (trade.result === 'WIN') {
      assert(trade.pnlPercent > 0, `WIN trade has strictly positive PnL: ${trade.pnlPercent}%`);
    } else {
      assert(trade.pnlPercent <= 0, `LOSS trade has strictly <= 0 PnL: ${trade.pnlPercent}%`);
    }
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log(`\n==========================================`);
  console.log(`🏁 ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% SUCCESS RATE!`);
  console.log(`==========================================\n`);
}

runTests().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
