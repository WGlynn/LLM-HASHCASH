import axios from 'axios';
import { PricePoint, ATHData } from '../types';
import { Logger } from '../utils/logger';

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  pairCreatedAt: number;
}

export class DexScreenerService {
  private readonly API_BASE = 'https://api.dexscreener.com/latest';

  async getTokenData(tokenAddress: string): Promise<DexScreenerPair | null> {
    try {
      const response = await axios.get(`${this.API_BASE}/dex/tokens/${tokenAddress}`, {
        timeout: 10000,
      });

      if (response.data?.pairs && response.data.pairs.length > 0) {
        // Return the pair with highest liquidity
        const pairs = response.data.pairs.sort((a: DexScreenerPair, b: DexScreenerPair) =>
          (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
        );
        return pairs[0];
      }

      return null;
    } catch (error) {
      Logger.error(`Failed to fetch DexScreener data for ${tokenAddress}`, error);
      return null;
    }
  }

  async getPriceHistory(tokenAddress: string, hoursBack: number = 168): Promise<PricePoint[]> {
    try {
      // DexScreener doesn't provide direct historical candle data via public API
      // We'll construct price points from available data
      const pair = await this.getTokenData(tokenAddress);
      if (!pair) return [];

      const now = new Date();
      const pricePoints: PricePoint[] = [];

      // Use available price change data to estimate historical prices
      const currentPrice = parseFloat(pair.priceUsd);

      // Estimate prices based on price change percentages
      const changes = [
        { hours: 0, change: 0 },
        { hours: 1, change: pair.priceChange.h1 || 0 },
        { hours: 6, change: pair.priceChange.h6 || 0 },
        { hours: 24, change: pair.priceChange.h24 || 0 },
      ];

      for (const { hours, change } of changes) {
        const timestamp = new Date(now.getTime() - hours * 60 * 60 * 1000);
        const price = currentPrice / (1 + change / 100);

        pricePoints.push({
          timestamp,
          open: price,
          high: price * 1.02,
          low: price * 0.98,
          close: price,
          volume: pair.volume.h24 / 24,
        });
      }

      return pricePoints.reverse();
    } catch (error) {
      Logger.error('Failed to construct price history', error);
      return [];
    }
  }

  calculateATH(priceHistory: PricePoint[], currentPrice: number): ATHData {
    if (priceHistory.length === 0) {
      return {
        price: currentPrice,
        timestamp: new Date(),
        drawdownPercent: 0,
      };
    }

    let athPrice = currentPrice;
    let athTimestamp = new Date();

    for (const point of priceHistory) {
      if (point.high > athPrice) {
        athPrice = point.high;
        athTimestamp = point.timestamp;
      }
    }

    const drawdownPercent = ((athPrice - currentPrice) / athPrice) * 100;

    return {
      price: athPrice,
      timestamp: athTimestamp,
      drawdownPercent,
    };
  }

  findLargestPump(priceHistory: PricePoint[], windowHours: number = 4): number {
    if (priceHistory.length < 2) return 0;

    let maxPump = 0;

    for (let i = 1; i < priceHistory.length; i++) {
      const timeDiff = (priceHistory[i].timestamp.getTime() - priceHistory[i - 1].timestamp.getTime()) / (1000 * 60 * 60);

      if (timeDiff <= windowHours) {
        const pumpPercent = ((priceHistory[i].high - priceHistory[i - 1].low) / priceHistory[i - 1].low) * 100;
        maxPump = Math.max(maxPump, pumpPercent);
      }
    }

    return maxPump;
  }

  async getTokenMetrics(tokenAddress: string) {
    const pair = await this.getTokenData(tokenAddress);
    if (!pair) return null;

    return {
      price: parseFloat(pair.priceUsd),
      volume24h: pair.volume.h24,
      liquidity: pair.liquidity.usd,
      priceChange24h: pair.priceChange.h24,
      priceChange6h: pair.priceChange.h6,
      priceChange1h: pair.priceChange.h1,
      txnCount24h: pair.txns.h24.buys + pair.txns.h24.sells,
      createdAt: new Date(pair.pairCreatedAt),
    };
  }
}
