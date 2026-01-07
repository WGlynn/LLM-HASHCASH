import { config } from './utils/config';
import { Logger } from './utils/logger';
import { TelegramService } from './services/telegram';
import { AlertService } from './services/alerter';
import { TokenScanner } from './services/scanner';

async function main() {
  try {
    Logger.info('Starting Pump.fun Trading Bot...');

    // Validate configuration
    if (!config.telegramToken || !config.chatId) {
      throw new Error('Missing required environment variables. Check your .env file.');
    }

    // Initialize services
    const telegram = new TelegramService(config);
    const alertService = new AlertService(telegram);
    const scanner = new TokenScanner(alertService, config);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      Logger.info('Shutting down gracefully...');
      telegram.sendMessage('🛑 Bot stopped.').finally(() => {
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      Logger.info('Received SIGTERM, shutting down...');
      telegram.sendMessage('🛑 Bot stopped.').finally(() => {
        process.exit(0);
      });
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught exception', error);
      telegram.sendMessage(`⚠️ Bot encountered an error: ${error.message}`).finally(() => {
        process.exit(1);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      Logger.error('Unhandled rejection', reason);
    });

    // Register manual scan command
    telegram.getBot().onText(/\/scan/, async (msg) => {
      const userId = msg.from?.id || 0;
      if (config.allowedUserIds.length > 0 && !config.allowedUserIds.includes(userId)) {
        return;
      }

      await telegram.sendMessage('🔍 Starting manual scan...');
      await scanner.runScan();
    });

    // Start monitoring
    await scanner.startMonitoring();

    Logger.info('Bot is now running. Press Ctrl+C to stop.');

  } catch (error) {
    Logger.error('Fatal error during startup', error);
    process.exit(1);
  }
}

main();
