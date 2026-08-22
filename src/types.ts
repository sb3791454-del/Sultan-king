export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SmartMoneyConcepts {
  orderBlocks: {
    type: 'BULLISH_OB' | 'BEARISH_OB';
    top: number;
    bottom: number;
    mitigated: boolean;
    candleIndex: number;
  }[];
  fairValueGaps: {
    type: 'BULLISH_FVG' | 'BEARISH_FVG';
    top: number;
    bottom: number;
    midpoint: number;
    mitigated: boolean;
    candleIndex: number;
  }[];
  liquidityPools: {
    type: 'BUY_SIDE_LIQUIDITY' | 'SELL_SIDE_LIQUIDITY';
    price: number;
    strength: number; // 1-5 touches
    swept: boolean;
  }[];
  marketStructure: {
    trend: 'BULLISH_BOS' | 'BEARISH_BOS' | 'CHOUCH_BULLISH' | 'CHOUCH_BEARISH' | 'RANGING';
    lastSwingHigh: number;
    lastSwingLow: number;
    structuralBias: string;
  };
}

export interface FearAndGreedData {
  score: number; // 0 - 100
  rating: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  historical7Days: { date: string; value: number; rating: string }[];
  contrarianVerdict: string;
  updatedAt: string;
}

export interface FundingRateData {
  symbol: string;
  fundingRate: number;
  fundingRatePercent: string;
  predictedRate: number;
  openInterestUSD: number;
  squeezeRisk: 'HIGH_SHORT_SQUEEZE' | 'HIGH_LONG_SQUEEZE' | 'BALANCED';
  longShortRatio: number;
  nextFundingTime: string;
}

export interface EconomicEvent {
  id: string;
  title: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'ALL';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  date: string;
  timeUTC: string;
  forecast?: string;
  previous?: string;
  affectedAssets: string[];
}

export interface BacktestResult {
  symbol: string;
  strategyName: string;
  timeframe: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePercent: number;
  profitFactor: number;
  netReturnPercent: number;
  maxDrawdownPercent: number;
  averageRiskReward: number;
  tradeLog: {
    type: 'BUY' | 'SELL';
    entryTime: string;
    entryPrice: number;
    exitPrice: number;
    pnlPercent: number;
    result: 'WIN' | 'LOSS';
  }[];
}

export interface MTFMatrixData {
  symbol: string;
  timeframes: {
    tf: '15m' | '1h' | '4h' | '1d';
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    rsi: number;
    macd: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    score: number; // 1-10
  }[];
  overallBias: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confluenceRatio: string; // e.g. "4/4 Aligned"
}

export interface PriceAlert {
  id: string;
  chatId: number | string;
  username?: string;
  symbol: string;
  targetPrice: number;
  direction: 'ABOVE' | 'BELOW';
  createdAt: string;
  triggered: boolean;
}

export interface IndicatorData {
  currentPrice: number;
  rsi14: number;
  rsiSignal: 'OVERSOLD' | 'OVERBOUGHT' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ema20: number;
  ema50: number;
  ema200: number;
  emaTrend: 'STRONG_BULLISH' | 'BULLISH' | 'BEARISH' | 'STRONG_BEARISH' | 'NEUTRAL';
  macd: {
    line: number;
    signal: number;
    histogram: number;
    crossover: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'BULLISH_EXPANDING' | 'BEARISH_EXPANDING' | 'NEUTRAL';
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    position: 'ABOVE_UPPER' | 'UPPER_HALF' | 'LOWER_HALF' | 'BELOW_LOWER' | 'SQUEEZE';
  };
  atr14: number;
  supportLevels: number[];
  resistanceLevels: number[];
  swingHigh: number;
  swingLow: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  smc?: SmartMoneyConcepts;
}

export type SetupState = 'ACTIVE_SETUP' | 'WATCHLIST' | 'STANDBY_NEUTRAL' | 'INVALIDATED';

export interface ConfluenceFactor {
  indicator: string;
  conditionMet: string;
  pointsAwarded: number;
  maxPoints: number;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface TradeSetup {
  symbol: string;
  name: string;
  assetType: 'CRYPTO' | 'COMMODITY' | 'FOREX';
  timeframe: '15m' | '1h' | '4h' | '1d';
  action: 'LONG' | 'SHORT' | 'NEUTRAL';
  setupState: SetupState;
  confluenceScore: number; // 1 to 10
  probabilityRating: 'HIGH_PROBABILITY' | 'MEDIUM_PROBABILITY' | 'LOW_PROBABILITY' | 'CHOPPY_AVOID';
  currentPrice: number;
  entryZone: [number, number]; // [min, max]
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: string; // e.g. "1:2.8"
  riskPercent: number; // Stop-loss price distance percentage (legacy compatibility)
  stopDistancePercent: number; // Distance in % from entry midpoint to SL
  stopDistanceAbsolute: number; // Absolute price difference from entry midpoint to SL
  suggestedRiskBudgetPercent: number; // Standard account capital risk recommendation (e.g., 1.5%)
  positionSizeExample?: {
    accountCapital: number;
    riskBudgetUsd: number;
    units: number;
    positionValueUsd: number;
    effectiveLeverage: number;
  };
  structuralWarnings?: string[];
  confluenceBreakdown?: ConfluenceFactor[];
  technicalSummary: {
    trend: string;
    rsiStatus: string;
    macdStatus: string;
    volatilityStatus: string;
    support: number;
    resistance: number;
    smcStructure?: string;
  };
  aiExplanation: {
    headline: string;
    simpleRationale: string;
    stepByStepPlan: string[];
    invalidationTrigger: string;
    riskManagementTip: string;
  };
  telegramFormattedCard: string;
  generatedAt: string;
}

export interface MarketTicker {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  assetType: 'CRYPTO' | 'COMMODITY' | 'FOREX';
  category: string;
}

export interface BotStatusInfo {
  isConfigured: boolean;
  botUsername?: string;
  botFirstName?: string;
  botId?: number;
  webhookUrl?: string;
  mode: 'webhook' | 'polling' | 'standby';
  lastActivity?: string;
  totalMessagesHandled: number;
  activeSignalsCount: number;
  activeAlertsCount?: number;
}

export interface TelegramLog {
  id: string;
  timestamp: string;
  from: string;
  chatId: number | string;
  messageText: string;
  replyText: string;
  signalGenerated?: boolean;
}

export interface DiagnosticsReport {
  timestamp: string;
  symbol: string;
  timeframe: string;
  liveDataSources: {
    name: string;
    endpoint: string;
    status: 'ONLINE' | 'FALLBACK';
    latencyMs: number;
    description: string;
  }[];
  rawInputs: {
    currentPrice: number;
    latestCandle: Candle;
    recentCandlesSample: Candle[];
    rsiPeriod14: { avgGain: number; avgLoss: number; rs: number; rsi: number };
    emaCalculations: { ema20: number; ema50: number; ema200: number; k20: number; k50: number };
    macdCalculations: { ema12: number; ema26: number; macdLine: number; signalLine: number; histogram: number };
    atrCalculation: { period: number; trValues: number[]; rawATR: number; multiplierUsed: number; bufferValue: number };
  };
  formulasAndOutputs: {
    entryRangeMath: {
      lowerBoundaryFormula: string;
      lowerValue: number;
      upperBoundaryFormula: string;
      upperValue: number;
      midpointValue: number;
      worstCaseFill: number;
    };
    stopLossMath: {
      structuralPivotUsed: number;
      atrDistanceUsed: number;
      formula: string;
      exactValue: number;
      riskDistanceMidpoint: number;
      riskDistanceWorstCase: number;
      riskPercent: number;
    };
    takeProfitMath: {
      tp1Formula: string;
      tp1Value: number;
      tp1RR: number;
      tp2Formula: string;
      tp2Value: number;
      tp2RR: number;
      tp3Formula: string;
      tp3Value: number;
      tp3RR: number;
    };
    riskRewardExplanation: {
      rangeDefinition: string;
      midpointRRFormula: string;
      midpointRR: string;
      worstCaseRRFormula: string;
      worstCaseRR: string;
      displayedRR: string;
    };
    confluenceBreakdown: {
      indicator: string;
      conditionMet: string;
      points: number;
      side: 'BULLISH' | 'BEARISH';
    }[];
    smcProof: {
      orderBlocksProof: { index: number; candleTime: string; high: number; low: number; nextClose: number; displacementPercent: number; ruleSatisfied: string }[];
      fvgProof: { index: number; candleTime: string; c1HighLow: number; c3HighLow: number; gapSpan: string; ruleSatisfied: string }[];
      liquidityPoolProof: { type: string; priceLevel: number; touchesOrExtremum: string; sweptStatus: boolean }[];
    };
    fundingAudit: {
      sources: string[];
      rawFundingRate: number;
      rawLongShortRatio: number;
      rawOpenInterestUSD: number;
      squeezeRiskFormula: string;
      liveValuesPerAsset: FundingRateData[];
    };
    sentimentAudit: {
      source: string;
      rawScore: number;
      rating: string;
      historicalRawData: { date: string; value: number; rating: string }[];
    };
    backtestAudit: {
      strategyTested: string;
      totalBarsTested: number;
      tradeExecutionLogic: string;
      winLossResolutionFormula: string;
      proofOfStrictWinLossIntegrity: string;
      sampleTrades: {
        index: number;
        type: 'BUY' | 'SELL';
        entryTime: string;
        entryPrice: number;
        exitPrice: number;
        pnlPercent: number;
        resolvedBy: 'TAKE_PROFIT_TRIGGER' | 'STOP_LOSS_TRIGGER' | 'PERIOD_EXPIRATION';
        result: 'WIN' | 'LOSS';
      }[];
    };
  };
}

