import { PricePoint, MomentumData } from '../types';

export class MomentumAnalyzer {
  /**
   * Calculate RSI (Relative Strength Index)
   */
  calculateRSI(priceHistory: PricePoint[], period: number = 14): number {
    if (priceHistory.length < period + 1) {
      return 50; // Neutral if not enough data
    }

    const changes: number[] = [];
    for (let i = 1; i < priceHistory.length; i++) {
      changes.push(priceHistory[i].close - priceHistory[i - 1].close);
    }

    const recentChanges = changes.slice(-period);
    const gains = recentChanges.filter(c => c > 0);
    const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));

    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  }

  /**
   * Calculate MACD signal
   */
  calculateMACD(priceHistory: PricePoint[]): 'bullish' | 'bearish' | 'neutral' {
    if (priceHistory.length < 26) return 'neutral';

    const prices = priceHistory.map(p => p.close);

    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;

    const macdHistory = [macdLine]; // Simplified - would need historical MACD values
    const signalLine = this.calculateEMA(macdHistory, 9);

    if (macdLine > signalLine && macdLine > 0) return 'bullish';
    if (macdLine < signalLine && macdLine < 0) return 'bearish';
    return 'neutral';
  }

  /**
   * Calculate Exponential Moving Average
   */
  private calculateEMA(values: number[], period: number): number {
    if (values.length < period) {
      return values.reduce((a, b) => a + b, 0) / values.length;
    }

    const multiplier = 2 / (period + 1);
    let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < values.length; i++) {
      ema = (values[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  /**
   * Calculate volume increase percentage
   */
  calculateVolumeIncrease(priceHistory: PricePoint[]): number {
    if (priceHistory.length < 2) return 0;

    const recentVolume = priceHistory[priceHistory.length - 1].volume;
    const avgVolume = priceHistory
      .slice(0, -1)
      .reduce((sum, p) => sum + p.volume, 0) / (priceHistory.length - 1);

    if (avgVolume === 0) return 0;
    return ((recentVolume - avgVolume) / avgVolume) * 100;
  }

  /**
   * Calculate price velocity (rate of price change)
   */
  calculatePriceVelocity(priceHistory: PricePoint[]): number {
    if (priceHistory.length < 3) return 0;

    const recent = priceHistory.slice(-3);
    const priceChanges = [];

    for (let i = 1; i < recent.length; i++) {
      const change = ((recent[i].close - recent[i - 1].close) / recent[i - 1].close) * 100;
      priceChanges.push(change);
    }

    // Average rate of change
    return priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
  }

  /**
   * Analyze overall momentum
   */
  analyzeMomentum(priceHistory: PricePoint[]): MomentumData {
    return {
      rsi: this.calculateRSI(priceHistory),
      macdSignal: this.calculateMACD(priceHistory),
      volumeIncrease: this.calculateVolumeIncrease(priceHistory),
      priceVelocity: this.calculatePriceVelocity(priceHistory),
    };
  }

  /**
   * Score momentum from 0-100
   */
  scoreMomentum(momentum: MomentumData): number {
    let score = 0;

    // RSI scoring (30-70 is healthy, >70 overbought, <30 oversold)
    if (momentum.rsi > 50 && momentum.rsi < 70) {
      score += 25;
    } else if (momentum.rsi >= 70) {
      score += 15; // Overbought but still bullish
    } else if (momentum.rsi > 30) {
      score += 10;
    }

    // MACD scoring
    if (momentum.macdSignal === 'bullish') {
      score += 25;
    } else if (momentum.macdSignal === 'neutral') {
      score += 10;
    }

    // Volume increase scoring
    if (momentum.volumeIncrease > 100) {
      score += 25;
    } else if (momentum.volumeIncrease > 50) {
      score += 15;
    } else if (momentum.volumeIncrease > 0) {
      score += 5;
    }

    // Price velocity scoring
    if (momentum.priceVelocity > 10) {
      score += 25;
    } else if (momentum.priceVelocity > 5) {
      score += 15;
    } else if (momentum.priceVelocity > 0) {
      score += 5;
    }

    return Math.min(score, 100);
  }
}
