import axios from 'axios';
import { MacroData } from '../types';
import { Logger } from '../utils/logger';
import NodeCache from 'node-cache';

export class MacroAnalyzer {
  private cache: NodeCache;

  constructor() {
    // Cache for 5 minutes
    this.cache = new NodeCache({ stdTTL: 300 });
  }

  async fetchMacroData(): Promise<MacroData> {
    const cached = this.cache.get<MacroData>('macroData');
    if (cached) {
      return cached;
    }

    try {
      // Fetch BTC and ETH data from CoinGecko
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price',
        {
          params: {
            ids: 'bitcoin,ethereum',
            vs_currencies: 'usd',
            include_24hr_change: true,
          },
          timeout: 10000,
        }
      );

      const btcData = response.data.bitcoin;
      const ethData = response.data.ethereum;

      const macroData: MacroData = {
        btcPrice: btcData.usd,
        btcChange24h: btcData.usd_24h_change,
        ethPrice: ethData.usd,
        ethChange24h: ethData.usd_24h_change,
        marketSentiment: this.calculateMarketSentiment(
          btcData.usd_24h_change,
          ethData.usd_24h_change
        ),
      };

      this.cache.set('macroData', macroData);
      return macroData;
    } catch (error) {
      Logger.error('Failed to fetch macro data', error);

      // Return neutral data if fetch fails
      return {
        btcPrice: 0,
        btcChange24h: 0,
        ethPrice: 0,
        ethChange24h: 0,
        marketSentiment: 'neutral',
      };
    }
  }

  private calculateMarketSentiment(
    btcChange: number,
    ethChange: number
  ): 'bullish' | 'bearish' | 'neutral' {
    const avgChange = (btcChange + ethChange) / 2;

    if (avgChange > 3) return 'bullish';
    if (avgChange < -3) return 'bearish';
    return 'neutral';
  }

  scoreMacro(macro: MacroData): number {
    let score = 50; // Start neutral

    // BTC trend scoring
    if (macro.btcChange24h > 5) {
      score += 25;
    } else if (macro.btcChange24h > 2) {
      score += 15;
    } else if (macro.btcChange24h > 0) {
      score += 5;
    } else if (macro.btcChange24h < -5) {
      score -= 25;
    } else if (macro.btcChange24h < -2) {
      score -= 15;
    }

    // ETH trend scoring
    if (macro.ethChange24h > 5) {
      score += 25;
    } else if (macro.ethChange24h > 2) {
      score += 15;
    } else if (macro.ethChange24h > 0) {
      score += 5;
    } else if (macro.ethChange24h < -5) {
      score -= 25;
    } else if (macro.ethChange24h < -2) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  getMarketContext(macro: MacroData): string {
    const btcTrend = macro.btcChange24h > 0 ? '📈' : '📉';
    const ethTrend = macro.ethChange24h > 0 ? '📈' : '📉';

    return `
*Market Context:*
${btcTrend} BTC: $${macro.btcPrice.toFixed(0)} (${macro.btcChange24h.toFixed(2)}%)
${ethTrend} ETH: $${macro.ethPrice.toFixed(0)} (${macro.ethChange24h.toFixed(2)}%)
Sentiment: ${macro.marketSentiment.toUpperCase()}
    `.trim();
  }
}
