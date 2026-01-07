import { config } from './utils/config';
import { Logger } from './utils/logger';
import { TelegramService } from './services/telegram';
import { AlertService } from './services/alerter';
import { TokenScanner } from './services/scanner';
import { startNotifyServer } from './services/notify';

async function main() {
  try {
    Logger.info('Starting Pump.fun Trading Bot...');

    // Validate configuration
    if (!config.telegramToken) {
      throw new Error('Missing required environment variable: TELEGRAM_BOT_TOKEN');
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

      await telegram.getBot().sendMessage(msg.chat.id, '🔍 Starting manual scan...', { parse_mode: 'Markdown' });
      await scanner.runScan();
    });

    // Register test command
    telegram.getBot().onText(/\/test/, async (msg) => {
      const userId = msg.from?.id || 0;
      if (config.allowedUserIds.length > 0 && !config.allowedUserIds.includes(userId)) {
        return;
      }

      await telegram.testConnections(msg.chat.id);
    });

    // Start monitoring
    await scanner.startMonitoring();

    // Start optional notify HTTP server for RPC-style notifications
    try {
      const port = process.env.NOTIFY_PORT ? Number(process.env.NOTIFY_PORT) : 3001;
      const token = process.env.NOTIFY_TOKEN;
      startNotifyServer(port, token);
    } catch (err) {
      Logger.warn('Failed to start notify server', err as any);
    }

    Logger.info('Bot is now running. Press Ctrl+C to stop.');

  } catch (error) {
    Logger.error('Fatal error during startup', error);
    process.exit(1);
  }
}

main();
