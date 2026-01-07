import { CoinData, PricePoint, ATHData, MomentumData, MacroData, TradingOpportunity } from '../types';
import { MomentumAnalyzer } from './momentum';
import { MacroAnalyzer } from './macro';
import { DexScreenerService } from '../services/dexscreener';
import { Logger } from '../utils/logger';

export class HeuristicsEngine {
  private momentumAnalyzer: MomentumAnalyzer;
  private macroAnalyzer: MacroAnalyzer;
  private dexScreener: DexScreenerService;

  constructor() {
    this.momentumAnalyzer = new MomentumAnalyzer();
    this.macroAnalyzer = new MacroAnalyzer();
    this.dexScreener = new DexScreenerService();
  }

  /**
   * Analyze a token and determine if it's a good opportunity
   */
  async analyzeToken(coin: CoinData): Promise<TradingOpportunity | null> {
    try {
      // Get detailed metrics from DexScreener
      const metrics = await this.dexScreener.getTokenMetrics(coin.address);
      if (!metrics) {
        Logger.debug(`No metrics found for ${coin.symbol}`);
        return null;
      }

      // Check age requirement (3+ days)
      const ageInDays = (Date.now() - metrics.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays < 3) {
        Logger.debug(`${coin.symbol} too young: ${ageInDays.toFixed(2)} days`);
        return null;
      }

      // Get price history
      const priceHistory = await this.dexScreener.getPriceHistory(coin.address);
      if (priceHistory.length < 2) {
        Logger.debug(`${coin.symbol} insufficient price history`);
        return null;
      }

      // Calculate ATH and drawdown
      const athData = this.dexScreener.calculateATH(priceHistory, metrics.price);

      // Check drawdown requirement (60%+ from ATH)
      if (athData.drawdownPercent < 60) {
        Logger.debug(`${coin.symbol} drawdown insufficient: ${athData.drawdownPercent.toFixed(2)}%`);
        return null;
      }

      // Check for recent pump (40%+ in 4-hour window)
      const recentPump = this.dexScreener.findLargestPump(priceHistory, 4);
      if (recentPump < 40) {
        Logger.debug(`${coin.symbol} no significant pump: ${recentPump.toFixed(2)}%`);
        return null;
      }

      // Analyze momentum
      const momentum = this.momentumAnalyzer.analyzeMomentum(priceHistory);
      const momentumScore = this.momentumAnalyzer.scoreMomentum(momentum);

      // Get macro conditions
      const macro = await this.macroAnalyzer.fetchMacroData();
      const macroScore = this.macroAnalyzer.scoreMacro(macro);

      // Calculate technical score
      const technicalScore = this.calculateTechnicalScore(metrics, athData, recentPump);

      // Calculate risk score
      const riskScore = this.calculateRiskScore(metrics, athData, ageInDays);

      // Calculate overall probability
      const totalScore = (
        technicalScore * 0.3 +
        momentumScore * 0.35 +
        macroScore * 0.2 +
        riskScore * 0.15
      );

      const probability = this.scoreToProbability(totalScore);

      // Generate reasoning
      const reasoning = this.generateReasoning(
        metrics,
        athData,
        recentPump,
        momentum,
        macro,
        ageInDays
      );

      // Calculate entry, target, and stop loss
      const currentPrice = metrics.price;
      const entryPrice = currentPrice * 1.02; // Slight premium for slippage
      const targetPrice = currentPrice * 1.10; // 10% target
      const stopLoss = currentPrice * 0.95; // 5% stop loss

      return {
        coinAddress: coin.address,
        symbol: coin.symbol,
        name: coin.name,
        totalScore,
        probability,
        factors: {
          technicalScore,
          momentumScore,
          macroScore,
          riskScore,
        },
        reasoning,
        currentPrice,
        entryPrice,
        targetPrice,
        stopLoss,
        athDrawdown: athData.drawdownPercent,
        recentPump,
      };
    } catch (error) {
      Logger.error(`Failed to analyze token ${coin.symbol}`, error);
      return null;
    }
  }

  private calculateTechnicalScore(metrics: any, athData: ATHData, recentPump: number): number {
    let score = 0;

    // Drawdown scoring (higher drawdown = more recovery potential)
    if (athData.drawdownPercent > 80) score += 30;
    else if (athData.drawdownPercent > 70) score += 25;
    else if (athData.drawdownPercent > 60) score += 20;

    // Recent pump scoring
    if (recentPump > 60) score += 30;
    else if (recentPump > 50) score += 25;
    else if (recentPump > 40) score += 20;

    // Liquidity scoring
    if (metrics.liquidity > 50000) score += 20;
    else if (metrics.liquidity > 20000) score += 15;
    else if (metrics.liquidity > 10000) score += 10;

    // Volume scoring
    if (metrics.volume24h > 100000) score += 20;
    else if (metrics.volume24h > 50000) score += 15;
    else if (metrics.volume24h > 20000) score += 10;

    return Math.min(score, 100);
  }

  private calculateRiskScore(metrics: any, athData: ATHData, ageInDays: number): number {
    let score = 100;

    // Lower liquidity = higher risk
    if (metrics.liquidity < 10000) score -= 30;
    else if (metrics.liquidity < 20000) score -= 15;

    // Very high drawdown might indicate dead project
    if (athData.drawdownPercent > 95) score -= 20;
    else if (athData.drawdownPercent > 90) score -= 10;

    // Very new projects are riskier
    if (ageInDays < 7) score -= 10;

    // Low volume is risky
    if (metrics.volume24h < 10000) score -= 20;
    else if (metrics.volume24h < 20000) score -= 10;

    return Math.max(0, score);
  }

  private scoreToProbability(score: number): number {
    // Convert 0-100 score to probability percentage
    // Using a sigmoid-like curve for more realistic probabilities
    return Math.round(50 + (score - 50) * 0.8);
  }

  private generateReasoning(
    metrics: any,
    athData: ATHData,
    recentPump: number,
    momentum: MomentumData,
    macro: MacroData,
    ageInDays: number
  ): string[] {
    const reasons: string[] = [];

    reasons.push(`Token age: ${ageInDays.toFixed(1)} days (established)`);
    reasons.push(`Down ${athData.drawdownPercent.toFixed(1)}% from ATH (recovery potential)`);
    reasons.push(`Recent pump: ${recentPump.toFixed(1)}% in 4h (momentum confirmed)`);

    if (momentum.rsi > 50 && momentum.rsi < 70) {
      reasons.push(`RSI at ${momentum.rsi.toFixed(1)} (healthy bullish)`);
    } else if (momentum.rsi >= 70) {
      reasons.push(`RSI at ${momentum.rsi.toFixed(1)} (strong but overbought)`);
    }

    if (momentum.macdSignal === 'bullish') {
      reasons.push('MACD showing bullish crossover');
    }

    if (momentum.volumeIncrease > 50) {
      reasons.push(`Volume up ${momentum.volumeIncrease.toFixed(1)}% (increasing interest)`);
    }

    if (macro.marketSentiment === 'bullish') {
      reasons.push(`Market bullish: BTC +${macro.btcChange24h.toFixed(2)}%, ETH +${macro.ethChange24h.toFixed(2)}%`);
    } else if (macro.marketSentiment === 'bearish') {
      reasons.push(`Market bearish: BTC ${macro.btcChange24h.toFixed(2)}%, ETH ${macro.ethChange24h.toFixed(2)}%`);
    }

    if (metrics.liquidity > 50000) {
      reasons.push(`Strong liquidity: $${(metrics.liquidity / 1000).toFixed(1)}k`);
    } else if (metrics.liquidity < 20000) {
      reasons.push(`Low liquidity: $${(metrics.liquidity / 1000).toFixed(1)}k (higher risk)`);
    }

    return reasons;
  }
}
