# Pump.fun Crypto Trading Bot

A secure Telegram bot that monitors Pump.fun tokens and identifies high-probability trading opportunities using technical analysis, momentum indicators, and macro market conditions.

## Features

- 🔒 **Secure**: User authentication, input validation, and rate limiting
- 📊 **Multi-Factor Analysis**: Combines technical, momentum, and macro indicators
- 🎯 **Smart Filtering**: Only alerts on tokens meeting strict criteria
- 📈 **Probability Scoring**: Calculates likelihood of 10%+ price increase
- 🤖 **Automated Monitoring**: Continuously scans for opportunities
- 📱 **Telegram Integration**: Receive instant alerts with detailed analysis

## How It Works

The bot scans Pump.fun tokens and identifies opportunities based on:

### 1. **Initial Filters**
- Token must be **3+ days old** (established, not brand new)
- Must be **60%+ down from all-time high** (recovery potential)
- Must have had a **40%+ pump in a 4-hour candle** (momentum confirmation)

### 2. **Technical Analysis**
- ATH drawdown percentage
- Recent pump magnitude
- Liquidity levels
- 24h trading volume

### 3. **Momentum Indicators**
- **RSI (Relative Strength Index)**: Identifies overbought/oversold conditions
- **MACD**: Detects trend direction and momentum
- **Volume Analysis**: Tracks trading activity increases
- **Price Velocity**: Measures rate of price change

### 4. **Macro Market Analysis**
- Bitcoin price and 24h change
- Ethereum price and 24h change
- Overall market sentiment
- Correlation with major crypto trends

### 5. **Heuristics Scoring**
Combines all factors with weighted scoring:
- Technical Score: 30%
- Momentum Score: 35%
- Macro Score: 20%
- Risk Score: 15%

Final probability is calculated using a sigmoid curve to provide realistic predictions.

## Setup

### Prerequisites

- Node.js 18+ and npm
- A Telegram bot token (from [@BotFather](https://t.me/botfather))
- Your Telegram chat ID

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd pumpfunbot
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
# Required
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_CHAT_ID=your_chat_id

# Optional
CHECK_INTERVAL_MINUTES=15
MIN_PROBABILITY_THRESHOLD=70
ALLOWED_USER_IDS=123456789,987654321
```

### Getting Your Telegram Credentials

1. **Bot Token**:
   - Open Telegram and search for [@BotFather](https://t.me/botfather)
   - Send `/newbot` and follow the instructions
   - Copy the bot token provided

2. **Chat ID**:
   - Send a message to your bot
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find your `chat_id` in the JSON response

3. **User ID** (for authorization):
   - Send a message to [@userinfobot](https://t.me/userinfobot)
   - It will reply with your user ID

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Telegram Commands

- `/start` - Show welcome message and bot info
- `/status` - Check bot status and configuration
- `/scan` - Run an immediate manual scan

## Security Features

### Authentication
- User ID whitelist (configure in `.env`)
- Unauthorized users receive rejection message
- All commands require authorization

### Best Practices
- Store credentials in `.env` (never commit)
- Use environment variables for sensitive data
- Rate limiting on API calls
- Error handling and graceful degradation

### Recommended Security Settings

1. **Set allowed user IDs**:
```env
ALLOWED_USER_IDS=123456789,987654321
```

2. **Use a strong bot token** (provided by BotFather)

3. **Run in a secure environment** (VPS, dedicated server)

4. **Monitor logs** for suspicious activity

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | - | Your Telegram bot token |
| `TELEGRAM_CHAT_ID` | Yes | - | Your Telegram chat ID |
| `ALLOWED_USER_IDS` | No | All | Comma-separated list of authorized user IDs |
| `CHECK_INTERVAL_MINUTES` | No | 15 | Minutes between scans |
| `MIN_PROBABILITY_THRESHOLD` | No | 70 | Minimum probability % to alert |

### Customizing Thresholds

Edit `src/analyzers/heuristics.ts` to adjust:
- Minimum token age
- ATH drawdown threshold
- Recent pump percentage
- Scoring weights

## Alert Format

When an opportunity is found, you'll receive a detailed message:

```
🔥 TRADING OPPORTUNITY DETECTED 🔥

SYMBOL - Token Name

Probability: 75% (Score: 78.5/100)

Price Action:
• Current: $0.00001234
• Entry: $0.00001259
• Target: $0.00001357 (+10%)
• Stop Loss: $0.00001172 (-5%)

Key Metrics:
📈 ATH Drawdown: 68.5%
🚀 Recent Pump: 45.2% in 4h

Analysis Breakdown:
• Technical Score: 75.0/100
• Momentum Score: 82.5/100
• Macro Score: 65.0/100
• Risk Score: 80.0/100

Reasoning:
• Token age: 4.2 days (established)
• Down 68.5% from ATH (recovery potential)
• Recent pump: 45.2% in 4h (momentum confirmed)
• RSI at 58.3 (healthy bullish)
• Volume up 125.5% (increasing interest)
• Market bullish: BTC +3.5%, ETH +4.2%

Market Context:
📈 BTC: $45000 (+3.50%)
📈 ETH: $2800 (+4.20%)
Sentiment: BULLISH

Links:
[DexScreener](...) [Pump.fun](...)

⚠️ DYOR - Not Financial Advice
```

## Architecture

```
src/
├── analyzers/          # Analysis engines
│   ├── heuristics.ts   # Main scoring system
│   ├── macro.ts        # BTC/ETH market analysis
│   └── momentum.ts     # Technical indicators
├── services/           # External integrations
│   ├── telegram.ts     # Telegram bot handler
│   ├── pumpfun.ts      # Pump.fun API client
│   ├── dexscreener.ts  # Price data provider
│   ├── alerter.ts      # Alert formatting
│   └── scanner.ts      # Main orchestrator
├── types/              # TypeScript definitions
│   └── index.ts
├── utils/              # Utilities
│   ├── config.ts       # Configuration loader
│   └── logger.ts       # Logging utility
└── index.ts            # Entry point
```

## API Dependencies

- **Pump.fun API**: Token discovery
- **DexScreener API**: Price data and metrics
- **CoinGecko API**: BTC/ETH macro data
- **Telegram Bot API**: Notifications

All APIs use public endpoints - no API keys required (though rate limits apply).

## Troubleshooting

### Bot not responding
- Check `TELEGRAM_BOT_TOKEN` is correct
- Verify bot is running (`/status` command)
- Check logs for errors

### No opportunities found
- Lower `MIN_PROBABILITY_THRESHOLD` in `.env`
- Check market conditions (may be in a downtrend)
- Verify Pump.fun API is accessible

### Rate limiting
- Increase `CHECK_INTERVAL_MINUTES`
- Add delays in `scanner.ts`
- Use API keys if available

## Disclaimer

**⚠️ THIS IS NOT FINANCIAL ADVICE**

This bot is for educational and informational purposes only. Cryptocurrency trading involves substantial risk of loss. Always:
- Do your own research (DYOR)
- Never invest more than you can afford to lose
- Use stop losses
- Understand the risks of low-liquidity tokens
- Be aware of pump-and-dump schemes

The developers are not responsible for any financial losses incurred using this software.

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the code documentation

---

Built with TypeScript, Node.js, and ❤️ for the crypto community
