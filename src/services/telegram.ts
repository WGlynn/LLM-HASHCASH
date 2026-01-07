import TelegramBot from 'node-telegram-bot-api';
import { BotConfig } from '../types';
import { Logger } from '../utils/logger';
import AntiScamGate from './antiScam';

export class TelegramService {
  private bot: TelegramBot;
  private config: BotConfig;
  private activeChats: Set<number>;
  private antiScam: AntiScamGate;

  constructor(config: BotConfig) {
    this.config = config;
    this.bot = new TelegramBot(config.telegramToken, { polling: true });
    this.activeChats = new Set();
    // Initialize AntiScamGate with allowed users as trusted senders
    this.antiScam = new AntiScamGate(config.allowedUserIds.map(String));

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

      // Gate private messages through AntiScam
      try {
        if (msg.chat.type === 'private' && msg.from && msg.text) {
          const senderId = String(msg.from.id);
          const decision = this.antiScam.handleIncoming(senderId, msg.text);
          if (decision.status === 'accepted') {
            // Generate async summary via LLM then forward
            this.antiScam.produceSummary(msg.text).then((summary) => {
              const forward = `*Message from ${msg.from.first_name || senderId}*: ${summary}\n\n${msg.text}`;
              this.sendMessage(forward);
            }).catch((e) => {
              const forward = `*Message from ${msg.from.first_name || senderId}*: ${decision.summary}\n\n${msg.text}`;
              this.sendMessage(forward);
            });
          } else if (decision.status === 'challenge') {
            const c = decision.challenge;
            const instruct = decision.prompt ? decision.prompt : `To contact this account, please perform the required challenge (id: ${c.id}) and reply with /resp ${c.id} <answer>`;
            this.bot.sendMessage(msg.chat.id, instruct);
          } else if (decision.status === 'rejected') {
            this.bot.sendMessage(msg.chat.id, `Message rejected: ${decision.reason}`);
          }
        }
      } catch (e) {
        Logger.error('AntiScam handling failed', e);
      }
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
/test - Test API connections

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
/test - Test API connections

Bot is running in ${chatType} mode and will send alerts automatically.
      `;

      this.bot.sendMessage(msg.chat.id, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Handle PoW response: /pow <challengeId> <nonce>
    this.bot.onText(/\/pow\s+(\S+)\s+(\S+)/, async (msg, match) => {
      if (!msg.from) return;
      const senderId = String(msg.from.id);
      const challengeId = match && match[1];
      const nonce = match && match[2];
      if (!challengeId || !nonce) return;
      const res = await this.antiScam.respondWithPow(senderId, challengeId, nonce);
      if (res.status === 'accepted') {
        const forward = `*Message from ${msg.from.first_name || senderId}*: ${res.summary}`;
        this.sendMessage(forward);
        this.bot.sendMessage(msg.chat.id, '✅ Proof-of-work accepted — your message was forwarded.');
      } else {
        this.bot.sendMessage(msg.chat.id, `❌ PoW rejected: ${res.reason}`);
      }
    });

    // Payment request: /pay -> returns a demo token; /payok <token> to confirm
    this.bot.onText(/\/pay$/, (msg) => {
      if (!msg.from) return;
      const senderId = String(msg.from.id);
      const token = this.antiScam.createPaymentRequest(senderId);
      this.bot.sendMessage(msg.chat.id, `To pay for attention (demo), use token: ${token}\nAfter paying, reply with /payok ${token}`);
    });

    this.bot.onText(/\/payok\s+(\S+)/, async (msg, match) => {
      if (!msg.from) return;
      const senderId = String(msg.from.id);
      const token = match && match[1];
      if (!token) return;
      const res = await this.antiScam.respondWithPayment(senderId, token);
      if (res.status === 'accepted') {
        const forward = `*Message from ${msg.from.first_name || senderId}*: ${res.summary}`;
        this.sendMessage(forward);
        this.bot.sendMessage(msg.chat.id, '✅ Payment accepted — your message was forwarded.');
      } else {
        this.bot.sendMessage(msg.chat.id, `❌ Payment rejected: ${res.reason}`);
      }
    });

    // Generic challenge response: /resp <challengeId> <answer...>
    this.bot.onText(/\/resp\s+(\S+)\s+([\s\S]+)/, async (msg, match) => {
      if (!msg.from) return;
      const senderId = String(msg.from.id);
      const challengeId = match && match[1];
      const answer = match && match[2];
      if (!challengeId || !answer) return;
      const res = await this.antiScam.respondWithAnswer(senderId, challengeId, answer.trim());
      if (res.status === 'accepted') {
        const forward = `*Message from ${msg.from.first_name || senderId}*: ${res.summary}`;
        this.sendMessage(forward);
        this.bot.sendMessage(msg.chat.id, '✅ Challenge accepted — your message was forwarded.');
      } else if (res.status === 'challenge') {
        const c = res.challenge;
        this.bot.sendMessage(msg.chat.id, `Next challenge issued: id=${c.id} payload=${c.prefix}`);
      } else {
        this.bot.sendMessage(msg.chat.id, `❌ Response rejected: ${res.reason}`);
      }
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

  async testConnections(chatId: number): Promise<void> {
    try {
      await this.bot.sendMessage(chatId, '🧪 *Testing API Connections...*', { parse_mode: 'Markdown' });

      // Import services dynamically
      const { PumpfunService } = await import('./pumpfun');
      const { MacroAnalyzer } = await import('../analyzers/macro');
      const { DexScreenerService } = await import('./dexscreener');

      const pumpfunService = new PumpfunService();
      const macroAnalyzer = new MacroAnalyzer();
      const dexScreener = new DexScreenerService();

      let results: string[] = [];

      // Test 1: Pump.fun API
      try {
        const tokens = await pumpfunService.getRecentTokens(1);
        if (tokens.length > 0) {
          const token = tokens[0];
          results.push(`✅ *Pump.fun API:* Connected`);
          results.push(`   Latest token: ${token.symbol}`);
          results.push(`   Name: ${token.name}`);
          results.push(`   Created: ${token.createdAt.toLocaleDateString()}`);
        } else {
          results.push(`⚠️ *Pump.fun API:* Connected but no tokens found`);
        }
      } catch (error) {
        results.push(`❌ *Pump.fun API:* Failed to connect`);
        Logger.error('Pump.fun test failed', error);
      }

      // Test 2: CoinGecko (Macro data)
      try {
        const macro = await macroAnalyzer.fetchMacroData();
        if (macro.btcPrice > 0) {
          results.push(`✅ *CoinGecko API:* Connected`);
          results.push(`   BTC: $${macro.btcPrice.toFixed(0)} (${macro.btcChange24h.toFixed(2)}%)`);
          results.push(`   ETH: $${macro.ethPrice.toFixed(0)} (${macro.ethChange24h.toFixed(2)}%)`);
        } else {
          results.push(`⚠️ *CoinGecko API:* No data received`);
        }
      } catch (error) {
        results.push(`❌ *CoinGecko API:* Failed to connect`);
        Logger.error('CoinGecko test failed', error);
      }

      // Test 3: DexScreener
      try {
        // Use a known Solana token for testing (e.g., BONK)
        const testAddress = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
        const data = await dexScreener.getTokenData(testAddress);
        if (data) {
          results.push(`✅ *DexScreener API:* Connected`);
          results.push(`   Test query successful`);
        } else {
          results.push(`⚠️ *DexScreener API:* Connected but no data`);
        }
      } catch (error) {
        results.push(`❌ *DexScreener API:* Failed to connect`);
        Logger.error('DexScreener test failed', error);
      }

      // Send results
      const testMessage = `
🧪 *API Connection Test Results*

${results.join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${results.filter(r => r.includes('✅')).length === 3 ? '✅ All systems operational!' : '⚠️ Some connections have issues'}
      `;

      await this.bot.sendMessage(chatId, testMessage, { parse_mode: 'Markdown' });
      Logger.info('API connection test completed');
    } catch (error) {
      Logger.error('Test command failed', error);
      await this.bot.sendMessage(chatId, '❌ Test failed. Check bot logs for details.', { parse_mode: 'Markdown' });
    }
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
