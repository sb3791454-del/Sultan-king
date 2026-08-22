import { Candle } from '../src/types';

export enum MarketErrorType {
  DATA_UNAVAILABLE = 'DATA_UNAVAILABLE',
  MARKET_DATA_TIMEOUT = 'MARKET_DATA_TIMEOUT',
  UPSTREAM_RATE_LIMIT = 'UPSTREAM_RATE_LIMIT',
  INVALID_SYMBOL = 'INVALID_SYMBOL',
  STALE_MARKET_DATA = 'STALE_MARKET_DATA',
  MALFORMED_RESPONSE = 'MALFORMED_RESPONSE',
}

export class MarketDataError extends Error {
  public readonly errorType: MarketErrorType;
  public readonly symbol?: string;
  public readonly provider?: string;

  constructor(errorType: MarketErrorType, message: string, symbol?: string, provider?: string) {
    super(message);
    this.name = 'MarketDataError';
    this.errorType = errorType;
    this.symbol = symbol;
    this.provider = provider;
  }
}

export interface VerifiedMarketSnapshot<T> {
  data: T;
  source: string;
  provider: string;
  fetchTimestamp: number;
  latestCandleTimestamp: number;
  latencyMs: number;
  isStale: boolean;
}

export interface IMarketDataProvider {
  readonly name: string;
  readonly baseUrl: string;
  fetchCandles(pair: string, interval: '15m' | '1h' | '4h' | '1d', limit: number, timeoutMs: number): Promise<Candle[]>;
  fetch24hTicker(pair: string, timeoutMs: number): Promise<{ price: number; change24h: number; high24h: number; low24h: number; volume24h: number }>;
}

/**
 * Validates candle data against structural and quantitative integrity invariants:
 * 1. Array is not empty and has minimum required bars
 * 2. All values are finite numbers > 0
 * 3. High >= Low, High >= Open, High >= Close, Low <= Open, Low <= Close
 * 4. Chronological ascending timestamps
 * 5. Timestamps not in the distant future (> 60s ahead)
 */
export function validateCandleIntegrity(candles: Candle[], minLength = 5): void {
  if (!Array.isArray(candles) || candles.length < minLength) {
    throw new MarketDataError(
      MarketErrorType.MALFORMED_RESPONSE,
      `Insufficient candle data: received ${candles?.length || 0} bars, minimum required is ${minLength}`
    );
  }

  const now = Date.now();
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    if (
      typeof c.time !== 'number' || isNaN(c.time) || c.time <= 0 ||
      typeof c.open !== 'number' || isNaN(c.open) || c.open <= 0 ||
      typeof c.high !== 'number' || isNaN(c.high) || c.high <= 0 ||
      typeof c.low !== 'number' || isNaN(c.low) || c.low <= 0 ||
      typeof c.close !== 'number' || isNaN(c.close) || c.close <= 0 ||
      typeof c.volume !== 'number' || isNaN(c.volume) || c.volume < 0
    ) {
      throw new MarketDataError(
        MarketErrorType.MALFORMED_RESPONSE,
        `Corrupt or non-numeric candle at bar index ${i}`
      );
    }

    if (c.high < c.low || c.high < c.open || c.high < c.close || c.low > c.open || c.low > c.close) {
      throw new MarketDataError(
        MarketErrorType.MALFORMED_RESPONSE,
        `Violated OHLC geometric bounds at bar index ${i}: [O:${c.open}, H:${c.high}, L:${c.low}, C:${c.close}]`
      );
    }

    if (i > 0 && c.time <= candles[i - 1].time) {
      throw new MarketDataError(
        MarketErrorType.MALFORMED_RESPONSE,
        `Non-chronological candle timestamps at index ${i}`
      );
    }

    if (c.time > now + 60000) {
      throw new MarketDataError(
        MarketErrorType.MALFORMED_RESPONSE,
        `Candle timestamp in the future: ${new Date(c.time).toISOString()}`
      );
    }
  }
}

/**
 * Checks if candlestick dataset is stale based on timeframe
 */
export function checkCandleStaleness(latestCandleTime: number, interval: '15m' | '1h' | '4h' | '1d'): boolean {
  const maxStalenessMsMap: Record<string, number> = {
    '15m': 3 * 60 * 60 * 1000,    // 3 hours
    '1h': 8 * 60 * 60 * 1000,     // 8 hours
    '4h': 24 * 60 * 60 * 1000,    // 24 hours
    '1d': 72 * 60 * 60 * 1000,    // 72 hours
  };
  const threshold = maxStalenessMsMap[interval] || 8 * 60 * 60 * 1000;
  return (Date.now() - latestCandleTime) > threshold;
}

/**
 * Primary Binance Public REST Provider
 */
export class BinancePrimaryProvider implements IMarketDataProvider {
  public readonly name = 'Binance Public REST (Primary)';
  public readonly baseUrl = 'https://api.binance.com';

  public async fetchCandles(pair: string, interval: '15m' | '1h' | '4h' | '1d', limit: number, timeoutMs = 4000): Promise<Candle[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.baseUrl}/api/v3/klines?symbol=${encodeURIComponent(pair)}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url, { signal: controller.signal });

      if (response.status === 429) {
        throw new MarketDataError(MarketErrorType.UPSTREAM_RATE_LIMIT, 'Binance API rate limit reached', pair, this.name);
      }
      if (response.status === 400) {
        throw new MarketDataError(MarketErrorType.INVALID_SYMBOL, `Invalid market symbol pair: ${pair}`, pair, this.name);
      }
      if (!response.ok) {
        throw new MarketDataError(MarketErrorType.DATA_UNAVAILABLE, `Binance HTTP ${response.status}`, pair, this.name);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new MarketDataError(MarketErrorType.MALFORMED_RESPONSE, 'Binance returned non-JSON response', pair, this.name);
      }

      const rawData = await response.json();
      if (!Array.isArray(rawData)) {
        throw new MarketDataError(MarketErrorType.MALFORMED_RESPONSE, 'Expected klines array from Binance', pair, this.name);
      }

      const candles: Candle[] = rawData.map((item: any[]) => ({
        time: Number(item[0]),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
      }));

      validateCandleIntegrity(candles, Math.min(10, limit));
      return candles;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new MarketDataError(MarketErrorType.MARKET_DATA_TIMEOUT, `Timeout (${timeoutMs}ms) fetching candles for ${pair}`, pair, this.name);
      }
      if (err instanceof MarketDataError) throw err;
      throw new MarketDataError(MarketErrorType.DATA_UNAVAILABLE, err?.message || 'Unknown network error', pair, this.name);
    } finally {
      clearTimeout(timeout);
    }
  }

  public async fetch24hTicker(pair: string, timeoutMs = 4000): Promise<{ price: number; change24h: number; high24h: number; low24h: number; volume24h: number }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.baseUrl}/api/v3/ticker/24hr?symbol=${encodeURIComponent(pair)}`;
      const response = await fetch(url, { signal: controller.signal });

      if (response.status === 429) {
        throw new MarketDataError(MarketErrorType.UPSTREAM_RATE_LIMIT, 'Binance API rate limit reached', pair, this.name);
      }
      if (response.status === 400) {
        throw new MarketDataError(MarketErrorType.INVALID_SYMBOL, `Invalid market symbol pair: ${pair}`, pair, this.name);
      }
      if (!response.ok) {
        throw new MarketDataError(MarketErrorType.DATA_UNAVAILABLE, `Binance HTTP ${response.status}`, pair, this.name);
      }

      const data = await response.json();
      const price = parseFloat(data.lastPrice);
      const change24h = parseFloat(data.priceChangePercent);
      const high24h = parseFloat(data.highPrice);
      const low24h = parseFloat(data.lowPrice);
      const volume24h = parseFloat(data.quoteVolume);

      if (isNaN(price) || price <= 0 || isNaN(change24h)) {
        throw new MarketDataError(MarketErrorType.MALFORMED_RESPONSE, `Invalid ticker numbers for ${pair}`, pair, this.name);
      }

      return { price, change24h, high24h, low24h, volume24h };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new MarketDataError(MarketErrorType.MARKET_DATA_TIMEOUT, `Timeout fetching 24h ticker for ${pair}`, pair, this.name);
      }
      if (err instanceof MarketDataError) throw err;
      throw new MarketDataError(MarketErrorType.DATA_UNAVAILABLE, err?.message || 'Ticker unavailable', pair, this.name);
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Secondary Binance Vision Public Read-Only Fallback Cluster
 */
export class BinanceVisionFallbackProvider implements IMarketDataProvider {
  public readonly name = 'Binance Vision (Secondary Cluster)';
  public readonly baseUrl = 'https://data-api.binance.vision';

  public async fetchCandles(pair: string, interval: '15m' | '1h' | '4h' | '1d', limit: number, timeoutMs = 4500): Promise<Candle[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.baseUrl}/api/v3/klines?symbol=${encodeURIComponent(pair)}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new MarketDataError(MarketErrorType.DATA_UNAVAILABLE, `Binance Vision HTTP ${response.status}`, pair, this.name);
      }

      const rawData = await response.json();
      if (!Array.isArray(rawData)) {
        throw new MarketDataError(MarketErrorType.MALFORMED_RESPONSE, 'Expected klines array from Binance Vision', pair, this.name);
      }

      const candles: Candle[] = rawData.map((item: any[]) => ({
        time: Number(item[0]),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
      }));

      validateCandleIntegrity(candles, Math.min(10, limit));
      return candles;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new MarketDataError(MarketErrorType.MARKET_DATA_TIMEOUT, `Timeout on fallback provider for ${pair}`, pair, this.name);
      }
      if (err instanceof MarketDataError) throw err;
      throw new MarketDataError(MarketErrorType.DATA_UNAVAILABLE, err?.message || 'Fallback feed error', pair, this.name);
    } finally {
      clearTimeout(timeout);
    }
  }

  public async fetch24hTicker(pair: string, timeoutMs = 4500): Promise<{ price: number; change24h: number; high24h: number; low24h: number; volume24h: number }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.baseUrl}/api/v3/ticker/24hr?symbol=${encodeURIComponent(pair)}`;
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new MarketDataError(MarketErrorType.DATA_UNAVAILABLE, `Binance Vision HTTP ${response.status}`, pair, this.name);
      }

      const data = await response.json();
      const price = parseFloat(data.lastPrice);
      const change24h = parseFloat(data.priceChangePercent);
      const high24h = parseFloat(data.highPrice);
      const low24h = parseFloat(data.lowPrice);
      const volume24h = parseFloat(data.quoteVolume);

      if (isNaN(price) || price <= 0) {
        throw new MarketDataError(MarketErrorType.MALFORMED_RESPONSE, `Invalid ticker from Binance Vision for ${pair}`, pair, this.name);
      }

      return { price, change24h, high24h, low24h, volume24h };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new MarketDataError(MarketErrorType.MARKET_DATA_TIMEOUT, `Timeout fetching fallback ticker for ${pair}`, pair, this.name);
      }
      if (err instanceof MarketDataError) throw err;
      throw new MarketDataError(MarketErrorType.DATA_UNAVAILABLE, err?.message || 'Fallback ticker error', pair, this.name);
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Resilient Orchestrator enforcing:
 * 1. Primary -> Fallback execution pipeline
 * 2. Strict validation & rejection of corrupt data
 * 3. Zero synthetic/fabricated data in real trading mode
 * 4. Deterministic fail-closed behavior (DATA_UNAVAILABLE)
 */
export class MarketDataProviderService {
  private static primaryProvider: IMarketDataProvider = new BinancePrimaryProvider();
  private static fallbackProvider: IMarketDataProvider = new BinanceVisionFallbackProvider();

  public static async getVerifiedCandles(
    pair: string,
    interval: '15m' | '1h' | '4h' | '1d' = '1h',
    limit = 100
  ): Promise<VerifiedMarketSnapshot<Candle[]>> {
    const startTime = Date.now();
    let lastError: any = null;

    // 1. Try Primary Provider
    try {
      const candles = await this.primaryProvider.fetchCandles(pair, interval, limit, 3500);
      const latestCandleTime = candles[candles.length - 1].time;
      const isStale = checkCandleStaleness(latestCandleTime, interval);

      return {
        data: candles,
        source: this.primaryProvider.baseUrl,
        provider: this.primaryProvider.name,
        fetchTimestamp: Date.now(),
        latestCandleTimestamp: latestCandleTime,
        latencyMs: Date.now() - startTime,
        isStale,
      };
    } catch (err: any) {
      lastError = err;
      // Do not log tokens or sensitive data
      console.warn(`Primary provider [${this.primaryProvider.name}] failed for ${pair}: ${err?.message}. Attempting fallback...`);
    }

    // 2. Try Fallback Provider
    try {
      const candles = await this.fallbackProvider.fetchCandles(pair, interval, limit, 4000);
      const latestCandleTime = candles[candles.length - 1].time;
      const isStale = checkCandleStaleness(latestCandleTime, interval);

      return {
        data: candles,
        source: this.fallbackProvider.baseUrl,
        provider: this.fallbackProvider.name,
        fetchTimestamp: Date.now(),
        latestCandleTimestamp: latestCandleTime,
        latencyMs: Date.now() - startTime,
        isStale,
      };
    } catch (fallbackErr: any) {
      console.error(`All market data providers failed for ${pair}: Primary (${lastError?.message}), Fallback (${fallbackErr?.message})`);
      throw new MarketDataError(
        MarketErrorType.DATA_UNAVAILABLE,
        `All verified market data providers are currently unavailable for ${pair}. No synthetic trade data will be generated.`,
        pair
      );
    }
  }

  public static async getVerified24hTicker(
    pair: string
  ): Promise<VerifiedMarketSnapshot<{ price: number; change24h: number; high24h: number; low24h: number; volume24h: number }>> {
    const startTime = Date.now();
    let lastError: any = null;

    // 1. Try Primary Provider
    try {
      const ticker = await this.primaryProvider.fetch24hTicker(pair, 3500);
      return {
        data: ticker,
        source: this.primaryProvider.baseUrl,
        provider: this.primaryProvider.name,
        fetchTimestamp: Date.now(),
        latestCandleTimestamp: Date.now(),
        latencyMs: Date.now() - startTime,
        isStale: false,
      };
    } catch (err: any) {
      lastError = err;
    }

    // 2. Try Fallback Provider
    try {
      const ticker = await this.fallbackProvider.fetch24hTicker(pair, 4000);
      return {
        data: ticker,
        source: this.fallbackProvider.baseUrl,
        provider: this.fallbackProvider.name,
        fetchTimestamp: Date.now(),
        latestCandleTimestamp: Date.now(),
        latencyMs: Date.now() - startTime,
        isStale: false,
      };
    } catch (fallbackErr: any) {
      throw new MarketDataError(
        MarketErrorType.DATA_UNAVAILABLE,
        `24h Ticker data unavailable for ${pair}: ${lastError?.message || fallbackErr?.message}`,
        pair
      );
    }
  }
}
