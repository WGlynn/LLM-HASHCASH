# LLM Hashcash

**Proof-of-Work for AI Systems. Infinite Compute. Verifiable Intelligence.**

Two converging systems in one repo:

1. **Pump.fun Trading Bot** -- Secure Telegram bot for crypto trading with multi-factor analysis
2. **LLM Hashcash + Wardenclyffe** -- PoW challenges + 9-provider LLM cascade for infinite AI compute
3. **Proof of Mind** -- Verifiable cognitive work artifacts proving genuine AI reasoning

---

## Wardenclyffe -- Infinite Compute Cascade

Every AI system has a kill switch: the credit card. When the money stops, the AI stops. **Wardenclyffe eliminates this.** By cascading through 4 paid + 5 free-tier LLM providers, the system maintains 12-nines availability (99.9999999998% uptime) at 6.3x capacity headroom.

When premium credits exhaust, quality degrades visibly. The community sees it. Tips flow. Credits refill. Quality restores. **The free market prices AI intelligence in real time.** This is elastic intelligence -- perpetual motion for AI cognition.

LLM Hashcash proves the work is real. You can't spoof SHA-256 leading zeros AND maintain semantic coherence across multi-round cognitive challenges. **If you can fake all four verification layers, you've done the work.**

### Architecture

```
Wardenclyffe Cascade (9 providers, 12-nines availability)
  |
  v
Elastic Intelligence Market (quality = f(credits remaining))
  |
  v
LLM Hashcash (Ergon PoW + 10 cognitive challenge types)
  |
  v
Proof of Mind (git commits, test results, knowledge evolution)
```

### Components

- **Ergon PoW Engine** (`src/services/ergon.ts`) -- SHA-256 hashcash with adjustable difficulty
- **Challenge System** (`src/services/challenges.ts`) -- 10 types: `pow_chain`, `riddle_relay`, `microtasks`, `clarify_loop`, `format_bureaucracy`, `nested_captcha`, `token_hunt`, `expensive_work`, `agent_marathon`, `false_lead`
- **Anti-Scam Gate** (`src/services/antiScam.ts`) -- PoW + cognitive challenges + LLM analysis

### Papers

- [Wardenclyffe Paper](docs/wardenclyffe-paper.md) -- Formal paper (also available as [PDF](docs/wardenclyffe-paper.pdf))
- [Wardenclyffe Synthesis](WARDENCLYFFE.md) -- Technical synthesis document

### Related

- [VibeSwap](https://github.com/WGlynn/VibeSwap) -- The DEX where Wardenclyffe runs in production (JARVIS Mind Network)
- [Near-Zero Token Scaling](https://github.com/WGlynn/VibeSwap/blob/master/jarvis-bot/docs/near-zero-token-scaling.md) -- BFT network economics

---

## Pump.fun Crypto Trading Bot

A secure Telegram bot that monitors Pump.fun tokens and identifies high-probability trading opportunities using technical analysis, momentum indicators, and macro market conditions.

### Features

- **Secure**: User authentication, input validation, and rate limiting
- **Multi-Factor Analysis**: Combines technical, momentum, and macro indicators
- **Smart Filtering**: Only alerts on tokens meeting strict criteria
- **Probability Scoring**: Calculates likelihood of 10%+ price increase
- **Automated Monitoring**: Continuously scans for opportunities
- **Telegram Integration**: Receive instant alerts with detailed analysis

### How It Works

The bot scans Pump.fun tokens and identifies opportunities based on:

#### 1. **Initial Filters**
- Token must be **3+ days old** (established, not brand new)
- Must be **60%+ down from all-time high** (recovery potential)
- Must have had a **40%+ pump in a 4-hour candle** (momentum confirmation)

#### 2. **Technical Analysis**
- ATH drawdown percentage
- Recent pump magnitude
- Liquidity levels
- 24h trading volume

#### 3. **Momentum Indicators**
- **RSI (Relative Strength Index)**: Identifies overbought/oversold conditions
- **MACD**: Detects trend direction and momentum
- **Volume Analysis**: Tracks trading activity increases
- **Price Velocity**: Measures rate of price change

#### 4. **Macro Market Analysis**
- Bitcoin price and 24h change
- Ethereum price and 24h change
- Overall market sentiment
- Correlation with major crypto trends

#### 5. **Heuristics Scoring**
Combines all factors with weighted scoring:
- Technical Score: 30%
- Momentum Score: 35%
- Macro Score: 20%
- Risk Score: 15%

Final probability is calculated using a sigmoid curve to provide realistic predictions.

### Setup

#### Prerequisites

- Node.js 18+ and npm
- A Telegram bot token (from [@BotFather](https://t.me/botfather))
- Your Telegram chat ID

#### Installation

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

#### Getting Your Telegram Credentials

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

### Usage

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

#### Telegram Commands

- `/start` - Show welcome message and bot info
- `/status` - Check bot status and configuration
- `/scan` - Run an immediate manual scan

### Security Features

#### Authentication
- User ID whitelist (configure in `.env`)
- Unauthorized users receive rejection message
- All commands require authorization

#### Best Practices
- Store credentials in `.env` (never commit)
- Use environment variables for sensitive data
- Rate limiting on API calls
- Error handling and graceful degradation

### Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | - | Your Telegram bot token |
| `TELEGRAM_CHAT_ID` | Yes | - | Your Telegram chat ID |
| `ALLOWED_USER_IDS` | No | All | Comma-separated list of authorized user IDs |
| `CHECK_INTERVAL_MINUTES` | No | 15 | Minutes between scans |
| `MIN_PROBABILITY_THRESHOLD` | No | 70 | Minimum probability % to alert |

### Bot Architecture

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
│   ├── scanner.ts      # Main orchestrator
│   ├── ergon.ts        # Hashcash PoW engine
│   ├── challenges.ts   # Cognitive challenge system
│   └── antiScam.ts     # Anti-scam gate
├── types/              # TypeScript definitions
├── utils/              # Utilities
│   ├── config.ts       # Configuration loader
│   └── logger.ts       # Logging utility
└── index.ts            # Entry point
```

### API Dependencies

- **Pump.fun API**: Token discovery
- **DexScreener API**: Price data and metrics
- **CoinGecko API**: BTC/ETH macro data
- **Telegram Bot API**: Notifications

All APIs use public endpoints - no API keys required (though rate limits apply).

## Disclaimer

**THIS IS NOT FINANCIAL ADVICE.** Cryptocurrency trading involves substantial risk of loss. Always DYOR.

## License

MIT

---

*Tesla's tower was demolished because the financiers couldn't meter the energy. The APIs can't meter the intelligence. Wardenclyffe stands.*
