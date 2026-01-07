import { PumpfunService } from './pumpfun';
import { HeuristicsEngine } from '../analyzers/heuristics';
import { AlertService } from './alerter';
import { BotConfig } from '../types';
import { Logger } from '../utils/logger';

export class TokenScanner {
  private pumpfunService: PumpfunService;
  private heuristicsEngine: HeuristicsEngine;
  private alertService: AlertService;
  private config: BotConfig;
  private isScanning: boolean;

  constructor(alertService: AlertService, config: BotConfig) {
    this.pumpfunService = new PumpfunService();
    this.heuristicsEngine = new HeuristicsEngine();
    this.alertService = alertService;
    this.config = config;
    this.isScanning = false;
  }

  async runScan(): Promise<void> {
    if (this.isScanning) {
      Logger.warn('Scan already in progress, skipping...');
      return;
    }

    this.isScanning = true;
    Logger.info('Starting token scan...');

    try {
      // Fetch recent tokens from Pump.fun
      const tokens = await this.pumpfunService.getRecentTokens(100);
      Logger.info(`Fetched ${tokens.length} tokens to analyze`);

      if (tokens.length === 0) {
        Logger.warn('No tokens fetched, check API connectivity');
        return;
      }

      let opportunitiesFound = 0;

      // Analyze each token
      for (const token of tokens) {
        try {
          const opportunity = await this.heuristicsEngine.analyzeToken(token);

          if (opportunity && opportunity.probability >= this.config.minProbabilityThreshold) {
            Logger.info(
              `Opportunity found: ${opportunity.symbol} with ${opportunity.probability}% probability`
            );

            await this.alertService.sendOpportunityAlert(opportunity);
            opportunitiesFound++;

            // Add delay to avoid rate limiting
            await this.sleep(2000);
          }
        } catch (error) {
          Logger.error(`Error analyzing token ${token.symbol}`, error);
          continue;
        }

        // Small delay between token analyses
        await this.sleep(500);
      }

      Logger.info(`Scan complete. Found ${opportunitiesFound} opportunities.`);
      await this.alertService.sendScanComplete(tokens.length, opportunitiesFound);

    } catch (error) {
      Logger.error('Error during scan', error);
    } finally {
      this.isScanning = false;
    }
  }

  async startMonitoring(): Promise<void> {
    Logger.info(`Starting monitoring with ${this.config.checkIntervalMinutes} minute interval`);

    // Send startup notification
    await this.alertService.sendStartupMessage();

    // Run initial scan
    await this.runScan();

    // Schedule periodic scans
    setInterval(async () => {
      await this.runScan();
    }, this.config.checkIntervalMinutes * 60 * 1000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
