import { TradingOpportunity } from '../types';
import { TelegramService } from './telegram';
import { MacroAnalyzer } from '../analyzers/macro';
import { Logger } from '../utils/logger';

export class AlertService {
  private telegram: TelegramService;
  private macroAnalyzer: MacroAnalyzer;
  private sentAlerts: Set<string>;

  constructor(telegram: TelegramService) {
    this.telegram = telegram;
    this.macroAnalyzer = new MacroAnalyzer();
    this.sentAlerts = new Set();
  }

  async sendOpportunityAlert(opportunity: TradingOpportunity): Promise<void> {
    // Prevent duplicate alerts
    const alertKey = `${opportunity.coinAddress}-${Date.now().toString().slice(0, -5)}`;
    if (this.sentAlerts.has(alertKey)) {
      Logger.debug('Alert already sent for this opportunity');
      return;
    }

    try {
      const macro = await this.macroAnalyzer.fetchMacroData();
      const message = this.formatOpportunityMessage(opportunity, macro);

      await this.telegram.sendOpportunityAlert(message);

      this.sentAlerts.add(alertKey);

      // Clean up old alerts (keep last 100)
      if (this.sentAlerts.size > 100) {
        const toDelete = Array.from(this.sentAlerts).slice(0, 50);
        toDelete.forEach(key => this.sentAlerts.delete(key));
      }

      Logger.info(`Alert sent for ${opportunity.symbol} with ${opportunity.probability}% probability`);
    } catch (error) {
      Logger.error('Failed to send opportunity alert', error);
    }
  }

  private formatOpportunityMessage(opportunity: TradingOpportunity, macro: any): string {
    const probabilityEmoji = this.getProbabilityEmoji(opportunity.probability);
    const trendEmoji = opportunity.recentPump > 50 ? '🚀' : '📈';

    const message = `
${probabilityEmoji} *TRADING OPPORTUNITY DETECTED* ${probabilityEmoji}

*${opportunity.symbol}* - ${opportunity.name}

*Probability:* ${opportunity.probability}% (Score: ${opportunity.totalScore.toFixed(1)}/100)

*Price Action:*
• Current: $${opportunity.currentPrice.toFixed(8)}
• Entry: $${opportunity.entryPrice.toFixed(8)}
• Target: $${opportunity.targetPrice.toFixed(8)} (+10%)
• Stop Loss: $${opportunity.stopLoss.toFixed(8)} (-5%)

*Key Metrics:*
${trendEmoji} ATH Drawdown: ${opportunity.athDrawdown.toFixed(1)}%
${trendEmoji} Recent Pump: ${opportunity.recentPump.toFixed(1)}% in 4h

*Analysis Breakdown:*
• Technical Score: ${opportunity.factors.technicalScore.toFixed(1)}/100
• Momentum Score: ${opportunity.factors.momentumScore.toFixed(1)}/100
• Macro Score: ${opportunity.factors.macroScore.toFixed(1)}/100
• Risk Score: ${opportunity.factors.riskScore.toFixed(1)}/100

*Reasoning:*
${opportunity.reasoning.map(r => `• ${r}`).join('\n')}

${this.macroAnalyzer.getMarketContext(macro)}

*Links:*
[DexScreener](https://dexscreener.com/solana/${opportunity.coinAddress})
[Pump.fun](https://pump.fun/${opportunity.coinAddress})

⚠️ *DYOR - Not Financial Advice*
    `.trim();

    return message;
  }

  private getProbabilityEmoji(probability: number): string {
    if (probability >= 80) return '🔥';
    if (probability >= 70) return '⭐';
    if (probability >= 60) return '✨';
    return '💡';
  }

  async sendStartupMessage(): Promise<void> {
    const message = `
🤖 *Pump.fun Bot Started*

Monitoring for high-probability trading opportunities...

*Scanning for:*
• Tokens 3+ days old
• 60%+ drawdown from ATH
• 40%+ pump in recent 4h window
• Strong momentum indicators
• Favorable market conditions

You'll be notified when opportunities are found.
    `.trim();

    await this.telegram.sendMessage(message);
  }

  async sendScanComplete(scanned: number, found: number): Promise<void> {
    if (found === 0) return; // Don't spam if nothing found

    const message = `
✅ Scan complete: ${scanned} tokens analyzed, ${found} opportunities found.
    `.trim();

    await this.telegram.sendMessage(message);
  }
}
