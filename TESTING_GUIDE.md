# 🧪 Testing Your Bot

Use the `/test` command to verify your bot is working and all API connections are operational.

## 📱 How to Use

In Telegram, send to your bot:
```
/test
```

The bot will:
1. Test connection to Pump.fun API
2. Test connection to CoinGecko API (for BTC/ETH prices)
3. Test connection to DexScreener API
4. Show the latest token from Pump.fun
5. Display current BTC and ETH prices

## ✅ Expected Output

```
🧪 Testing API Connections...

🧪 API Connection Test Results

✅ Pump.fun API: Connected
   Latest token: BONK
   Name: Bonk
   Created: 1/7/2026

✅ CoinGecko API: Connected
   BTC: $45000 (+2.50%)
   ETH: $2800 (+3.20%)

✅ DexScreener API: Connected
   Test query successful

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ All systems operational!
```

## ⚠️ If Something Fails

### Pump.fun API Failed
```
❌ Pump.fun API: Failed to connect
```

**Possible causes:**
- Pump.fun API is down or rate-limited
- Network connectivity issues
- API endpoint changed

**Solution:** Wait a few minutes and try again. The API might be temporarily unavailable.

### CoinGecko API Failed
```
❌ CoinGecko API: Failed to connect
```

**Possible causes:**
- CoinGecko rate limit reached (public API)
- Network issues
- API maintenance

**Solution:** Wait 1-2 minutes between tests. Public API has rate limits.

### DexScreener API Failed
```
❌ DexScreener API: Failed to connect
```

**Possible causes:**
- DexScreener API rate limiting
- Network issues

**Solution:** Retry in a moment. The bot will still work with other APIs.

## 🔧 When to Use /test

### After Initial Deployment
```
1. Deploy bot to Railway
2. Add bot to Telegram
3. Run: /test
4. Verify all 3 APIs are ✅
```

### When Alerts Aren't Working
```
1. Run: /test
2. Check which API is failing
3. Troubleshoot specific API
```

### Regular Health Checks
```
Run /test periodically to ensure everything is working
```

### After Code Updates
```
1. Push new code to Railway
2. Wait for redeployment
3. Run: /test
4. Confirm all systems operational
```

## 🎯 What Each API Does

### Pump.fun API
- Fetches latest tokens from Pump.fun
- Gets token metadata (name, symbol, creation date)
- **Critical** - Without this, bot can't find new tokens

### CoinGecko API
- Gets Bitcoin price and 24h change
- Gets Ethereum price and 24h change
- Determines market sentiment (bullish/bearish)
- **Important** - Used for macro market analysis

### DexScreener API
- Gets detailed token price data
- Fetches price history
- Calculates ATH and drawdowns
- **Critical** - Without this, bot can't analyze tokens

## 📊 Test Results Interpretation

### All Green (✅ ✅ ✅)
```
✅ All systems operational!
```
**Status:** Bot is fully functional and ready to find opportunities.

### 1-2 APIs Working
```
⚠️ Some connections have issues
```
**Status:** Bot may work with limited functionality. Check which APIs failed.

### All APIs Failing
```
⚠️ Some connections have issues
(All showing ❌)
```
**Status:** Check Railway logs, verify bot is running, check internet connectivity.

## 🚀 Quick Verification Workflow

**Before announcing the bot is live:**

1. Deploy to Railway ✓
2. Add to Telegram ✓
3. Send `/start` - bot responds ✓
4. Send `/test` - all APIs ✅ ✓
5. Send `/status` - shows active ✓
6. Wait for first scan cycle (15 min) ✓

**Bot is now verified and operational!** 🎉

## 💡 Pro Tips

### Test Before Every Scan
```
/test
/scan
```
Ensure APIs are working before triggering a manual scan.

### Monitor Failures
If `/test` shows failures consistently:
- Check Railway logs for errors
- Verify environment variables are set
- Ensure bot is deployed and running

### Share Test Results
When reporting issues, include `/test` output to show which APIs are working.

## 🔍 What /test Doesn't Check

- ❌ Token analysis algorithms (use `/scan` for this)
- ❌ Telegram message delivery (if you see test results, Telegram works)
- ❌ Alert formatting
- ❌ Probability calculations

**Use `/scan` to test the full opportunity detection pipeline.**

---

**The `/test` command is your quick health check for the bot's API connections!** 🧪
