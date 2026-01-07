import dotenv from 'dotenv';
import { BotConfig } from '../types';

dotenv.config();

function getEnvVariable(key: string, required: boolean = true): string {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

function parseAllowedUserIds(userIdsStr: string): number[] {
  if (!userIdsStr) return [];
  return userIdsStr.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
}

export function loadConfig(): BotConfig {
  return {
    telegramToken: getEnvVariable('TELEGRAM_BOT_TOKEN'),
    chatId: getEnvVariable('TELEGRAM_CHAT_ID', false), // Optional - bot works in any chat
    allowedUserIds: parseAllowedUserIds(getEnvVariable('ALLOWED_USER_IDS', false)),
    checkIntervalMinutes: parseInt(getEnvVariable('CHECK_INTERVAL_MINUTES', false) || '15', 10),
    minProbabilityThreshold: parseInt(getEnvVariable('MIN_PROBABILITY_THRESHOLD', false) || '70', 10),
  };
}

export const config = loadConfig();
