import TelegramBot from 'node-telegram-bot-api';
import { BotConfig } from '../types';
import { Logger } from '../utils/logger';

export class TelegramService {
  private bot: TelegramBot;
  private config: BotConfig;

  constructor(config: BotConfig) {
    this.config = config;
    this.bot = new TelegramBot(config.telegramToken, { polling: true });
    this.setupHandlers();
  }

  private isAuthorized(userId: number): boolean {
    // If no allowed users specified, allow all (not recommended for production)
    if (this.config.allowedUserIds.length === 0) {
      Logger.warn('No allowed user IDs configured - accepting all users');
      return true;
    }
    return this.config.allowedUserIds.includes(userId);
  }

  private setupHandlers(): void {
    // Security middleware - check authorization for all messages
    this.bot.on('message', (msg) => {
      const userId = msg.from?.id;
      if (!userId || !this.isAuthorized(userId)) {
        Logger.warn(`Unauthorized access attempt from user ${userId}`);
        this.bot.sendMessage(msg.chat.id, '⛔ Unauthorized access. This bot is private.');
        return;
      }
    });

    // Command handlers
    this.bot.onText(/\/start/, (msg) => {
      if (!this.isAuthorized(msg.from?.id || 0)) return;

      const welcomeMessage = `
🤖 *Pump.fun Crypto Opportunity Bot*

I monitor Pump.fun tokens and alert you to high-probability opportunities.

*Criteria:*
- Token age: 3+ days
- Drawdown: 60%+ from ATH
- Recent pump: 40%+ in 4-hour candle
- Strong momentum indicators
- Favorable macro conditions

*Commands:*
/start - Show this message
/status - Check bot status
/scan - Run immediate scan

Bot is running and will alert you automatically.
      `;

      this.bot.sendMessage(msg.chat.id, welcomeMessage, { parse_mode: 'Markdown' });
    });

    this.bot.onText(/\/status/, (msg) => {
      if (!this.isAuthorized(msg.from?.id || 0)) return;

      const statusMessage = `
✅ *Bot Status: Active*

Check interval: ${this.config.checkIntervalMinutes} minutes
Probability threshold: ${this.config.minProbabilityThreshold}%
Monitoring: Pump.fun tokens
      `;

      this.bot.sendMessage(msg.chat.id, statusMessage, { parse_mode: 'Markdown' });
    });

    Logger.info('Telegram bot handlers configured');
  }

  async sendOpportunityAlert(message: string): Promise<void> {
    try {
      await this.bot.sendMessage(this.config.chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });
      Logger.info('Opportunity alert sent successfully');
    } catch (error) {
      Logger.error('Failed to send Telegram message', error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<void> {
    try {
      await this.bot.sendMessage(this.config.chatId, message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      Logger.error('Failed to send Telegram message', error);
    }
  }

  getBot(): TelegramBot {
    return this.bot;
  }
}
