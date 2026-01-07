import axios from 'axios';
import { CoinData, PricePoint } from '../types';
import { Logger } from '../utils/logger';

interface PumpfunToken {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  image_uri?: string;
  metadata_uri?: string;
  twitter?: string;
  telegram?: string;
  bonding_curve?: string;
  associated_bonding_curve?: string;
  creator?: string;
  created_timestamp?: number;
  raydium_pool?: string;
  complete?: boolean;
  virtual_sol_reserves?: number;
  virtual_token_reserves?: number;
  total_supply?: number;
  website?: string;
  show_name?: boolean;
  king_of_the_hill_timestamp?: number;
  market_cap?: number;
  reply_count?: number;
  last_reply?: number;
  nsfw?: boolean;
  market_id?: string;
  inverted?: boolean;
  usd_market_cap?: number;
}

export class PumpfunService {
  private readonly API_BASE = 'https://frontend-api.pump.fun';
  private readonly FALLBACK_API = 'https://pumpportal.fun/api';

  async getRecentTokens(limit: number = 50): Promise<CoinData[]> {
    try {
      // Try primary API
      const response = await axios.get(`${this.API_BASE}/coins/latest`, {
        params: { limit, offset: 0, sort: 'created_timestamp', order: 'DESC' },
        timeout: 10000,
      });

      if (response.data && Array.isArray(response.data)) {
        return this.mapTokensToCoins(response.data);
      }

      // Fallback to alternative endpoint
      return this.getFallbackTokens(limit);
    } catch (error) {
      Logger.warn('Primary API failed, trying fallback', error);
      return this.getFallbackTokens(limit);
    }
  }

  private async getFallbackTokens(limit: number): Promise<CoinData[]> {
    try {
      const response = await axios.get(`${this.FALLBACK_API}/tokens`, {
        params: { limit },
        timeout: 10000,
      });

      return this.mapTokensToCoins(response.data?.data || response.data || []);
    } catch (error) {
      Logger.error('Fallback API also failed', error);
      return [];
    }
  }

  private mapTokensToCoins(tokens: any[]): CoinData[] {
    return tokens
      .filter(token => token && (token.mint || token.address))
      .map(token => {
        const createdTimestamp = token.created_timestamp || token.createdAt || Date.now();
        const marketCap = token.usd_market_cap || token.market_cap || 0;

        return {
          address: token.mint || token.address || '',
          symbol: token.symbol || 'UNKNOWN',
          name: token.name || 'Unknown Token',
          createdAt: new Date(createdTimestamp * (createdTimestamp < 10000000000 ? 1000 : 1)),
          priceUsd: this.calculatePrice(token),
          marketCapUsd: marketCap,
          volume24h: token.volume_24h || 0,
          priceHistory: [],
        };
      });
  }

  private calculatePrice(token: any): number {
    // Try to extract price from various possible fields
    if (token.price_usd) return token.price_usd;
    if (token.priceUsd) return token.priceUsd;

    // Calculate from reserves if available
    if (token.virtual_sol_reserves && token.virtual_token_reserves) {
      const solPrice = 200; // Approximate SOL price, should be fetched dynamically
      return (token.virtual_sol_reserves / token.virtual_token_reserves) * solPrice;
    }

    // Calculate from market cap if available
    if (token.usd_market_cap && token.total_supply) {
      return token.usd_market_cap / token.total_supply;
    }

    return 0;
  }

  async getTokenPriceHistory(tokenAddress: string): Promise<PricePoint[]> {
    try {
      // This would fetch historical price data
      // For now, we'll use a simple approach with multiple API calls over time
      // In production, you'd want to use a proper price history API

      const pricePoints: PricePoint[] = [];
      const now = Date.now();

      // Simulate fetching historical data points
      // In reality, you'd need to integrate with a service that provides historical data
      // like Birdeye, DexScreener, or store your own data

      Logger.debug(`Fetching price history for ${tokenAddress}`);

      return pricePoints;
    } catch (error) {
      Logger.error('Failed to fetch price history', error);
      return [];
    }
  }

  async getTokenDetails(tokenAddress: string): Promise<CoinData | null> {
    try {
      const response = await axios.get(`${this.FALLBACK_API}/token/${tokenAddress}`, {
        timeout: 10000,
      });

      if (response.data) {
        const tokens = this.mapTokensToCoins([response.data]);
        return tokens[0] || null;
      }

      return null;
    } catch (error) {
      Logger.error(`Failed to fetch token details for ${tokenAddress}`, error);
      return null;
    }
  }
}
