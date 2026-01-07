# Quick Setup Guide

Follow these steps to get your bot running:

## Step 1: Create Your Telegram Bot

1. **Open Telegram** and search for `@BotFather`
2. **Start a chat** and send: `/newbot`
3. **Choose a name** for your bot (e.g., "My Pumpfun Bot")
4. **Choose a username** (must end in 'bot', e.g., "mypumpfun_bot")
5. **Copy the bot token** - it looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

## Step 2: Get Your Chat ID

**Method A - Using the Bot:**
1. Send any message to your bot (the one you just created)
2. Open this URL in your browser (replace `YOUR_BOT_TOKEN`):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
3. Look for `"chat":{"id":123456789` - that number is your chat ID

**Method B - Using a Bot:**
1. Search for `@userinfobot` in Telegram
2. Send `/start`
3. It will show your user ID (this can also be your chat ID if you're DMing your bot)

## Step 3: Get Your User ID (for security)

1. Search for `@userinfobot` in Telegram
2. Send `/start`
3. Copy the **Id** number shown

## Step 4: Configure the .env File

Open the `.env` file in the project root and fill in:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
ALLOWED_USER_IDS=123456789
```

## Step 5: Test the Bot

Run in development mode:
```bash
npm run dev
```

If you see:
```
[timestamp] INFO: Starting Pump.fun Trading Bot...
[timestamp] INFO: Telegram bot handlers configured
[timestamp] INFO: Bot is now running. Press Ctrl+C to stop.
```

**Success!** ✅

## Step 6: Test in Telegram

Open your bot in Telegram and send:
- `/start` - Should show welcome message
- `/status` - Should show bot status
- `/scan` - Should start a manual scan

## Troubleshooting

### "Missing required environment variable: TELEGRAM_BOT_TOKEN"
- Check your `.env` file exists in the project root
- Make sure the token has no extra spaces or quotes

### Bot doesn't respond
- Verify the bot token is correct
- Make sure the bot is running (`npm run dev`)
- Check that you sent `/start` to your bot first

### "Unauthorized access"
- Add your user ID to `ALLOWED_USER_IDS` in `.env`
- Restart the bot after changing `.env`

## Example .env File

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
ALLOWED_USER_IDS=123456789
CHECK_INTERVAL_MINUTES=15
MIN_PROBABILITY_THRESHOLD=70
```

## Ready to Deploy?

See `DEPLOYMENT.md` for production deployment options.
