export interface CoinData {
  address: string;
  symbol: string;
  name: string;
  createdAt: Date;
  priceUsd: number;
  marketCapUsd: number;
  volume24h: number;
  priceHistory: PricePoint[];
}

export interface PricePoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ATHData {
  price: number;
  timestamp: Date;
  drawdownPercent: number;
}

export interface MomentumData {
  rsi: number;
  macdSignal: 'bullish' | 'bearish' | 'neutral';
  volumeIncrease: number;
  priceVelocity: number;
}

export interface MacroData {
  btcPrice: number;
  btcChange24h: number;
  ethPrice: number;
  ethChange24h: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface OpportunityScore {
  coinAddress: string;
  symbol: string;
  name: string;
  totalScore: number;
  probability: number;
  factors: {
    technicalScore: number;
    momentumScore: number;
    macroScore: number;
    riskScore: number;
  };
  reasoning: string[];
}

export interface TradingOpportunity extends OpportunityScore {
  currentPrice: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  athDrawdown: number;
  recentPump: number;
}

export interface BotConfig {
  telegramToken: string;
  chatId: string;
  allowedUserIds: number[];
  checkIntervalMinutes: number;
  minProbabilityThreshold: number;
}
