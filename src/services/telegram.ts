import TelegramBot from 'node-telegram-bot-api';
import { BotConfig } from '../types';
import { Logger } from '../utils/logger';

export class TelegramService {
  private bot: TelegramBot;
  private config: BotConfig;
  private activeChats: Set<number>;

  constructor(config: BotConfig) {
    this.config = config;
    this.bot = new TelegramBot(config.telegramToken, { polling: true });
    this.activeChats = new Set();

    // Add the configured chat ID if provided
    if (config.chatId) {
      this.activeChats.add(parseInt(config.chatId));
    }

    this.setupHandlers();
  }

  private isAuthorized(userId: number): boolean {
    // Public access mode - allow everyone
    if (this.config.allowedUserIds.length === 0) {
      return true;
    }
    // Restricted mode - only allow specified users
    return this.config.allowedUserIds.includes(userId);
  }

  private setupHandlers(): void {
    // Track new chats when bot is added
    this.bot.on('message', (msg) => {
      // Track this chat
      this.activeChats.add(msg.chat.id);
    });

    // Welcome message for group chats
    this.bot.on('new_chat_members', async (msg) => {
      // Get bot info to check if this bot was added
      const me = await this.bot.getMe();
      const botWasAdded = msg.new_chat_members?.some(
        (member) => member.id === me.id
      );

      if (botWasAdded) {
        this.activeChats.add(msg.chat.id);
        const chatType = msg.chat.type === 'group' || msg.chat.type === 'supergroup' ? 'group' : 'chat';
        Logger.info(`Bot added to ${chatType}: ${msg.chat.title || msg.chat.id}`);

        const welcomeMessage = `
👋 Thanks for adding me to ${msg.chat.type === 'private' ? 'this chat' : 'the group'}!

🤖 *Pump.fun Crypto Opportunity Bot*

I'll monitor Pump.fun tokens and alert here when I find high-probability opportunities.

*Commands:*
/start - Show help message
/status - Check bot status
/scan - Run immediate scan

Everyone can use this bot!
        `;

        this.bot.sendMessage(msg.chat.id, welcomeMessage, { parse_mode: 'Markdown' });
      }
    });

    // Command handlers
    this.bot.onText(/\/start/, (msg) => {
      if (!this.isAuthorized(msg.from?.id || 0)) return;

      const chatType = msg.chat.type === 'group' || msg.chat.type === 'supergroup' ? 'group' : 'private chat';
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

Bot is running in ${chatType} mode and will send alerts automatically.
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
Active chats: ${this.activeChats.size}
      `;

      this.bot.sendMessage(msg.chat.id, statusMessage, { parse_mode: 'Markdown' });
    });

    Logger.info('Telegram bot handlers configured');
  }

  async sendOpportunityAlert(message: string): Promise<void> {
    // Send to all active chats
    const sendPromises = Array.from(this.activeChats).map(async (chatId) => {
      try {
        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        });
        Logger.info(`Opportunity alert sent to chat ${chatId}`);
      } catch (error) {
        Logger.error(`Failed to send alert to chat ${chatId}`, error);
        // Remove chat if bot was blocked/kicked
        if (error instanceof Error && error.message.includes('blocked')) {
          this.activeChats.delete(chatId);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  }

  async sendMessage(message: string): Promise<void> {
    // Send to all active chats
    const sendPromises = Array.from(this.activeChats).map(async (chatId) => {
      try {
        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
        });
      } catch (error) {
        Logger.error(`Failed to send message to chat ${chatId}`, error);
        // Remove chat if bot was blocked/kicked
        if (error instanceof Error && error.message.includes('blocked')) {
          this.activeChats.delete(chatId);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  }

  getActiveChats(): number[] {
    return Array.from(this.activeChats);
  }

  getBot(): TelegramBot {
    return this.bot;
  }
}
