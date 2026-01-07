# 🚂 Deploy to Railway.app - Step by Step

## ⚡ Quick Deploy (5 minutes)

### Step 1: Sign Up for Railway

1. Go to: **https://railway.app**
2. Click **"Start a New Project"** or **"Login with GitHub"**
3. Sign in with your GitHub account (free)

### Step 2: Deploy Your Bot

**Option A - From GitHub (Recommended):**

1. Make sure your code is pushed to GitHub
2. In Railway, click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `pumpfunbot` repository
5. Railway will automatically detect it's a Node.js app

**Option B - From Railway CLI:**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Step 3: Add Environment Variables

In the Railway dashboard:

1. Click on your deployed project
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add these **3 required variables**:

```
TELEGRAM_BOT_TOKEN = 8513505274:AAGXiF3RJnc8Fltgzha7SB6oc-OTjFoy3ck
CHECK_INTERVAL_MINUTES = 15
MIN_PROBABILITY_THRESHOLD = 70
```

**Optional - For Public Access:**
- Leave `ALLOWED_USER_IDS` empty or don't add it → **Anyone can use the bot** ✅

**Optional - For Restricted Access:**
- Add `ALLOWED_USER_IDS = 8366932263,123456789` → Only specified users can use commands

**Note:** `TELEGRAM_CHAT_ID` is no longer needed! The bot works in any chat you add it to (private chats and groups).

4. Click **"Save"** or **"Deploy"**

### Step 4: Verify Deployment

1. In Railway, go to the **"Deployments"** tab
2. Wait for the build to complete (usually 1-2 minutes)
3. Check the **"Logs"** tab - you should see:
   ```
   INFO: Starting Pump.fun Trading Bot...
   INFO: Telegram bot handlers configured
   INFO: Bot is now running
   ```

### Step 5: Test in Telegram

**Private Chat:**
1. Open Telegram
2. Find **@AgarthaKirkBot**
3. Send: `/start`
4. **Bot responds!** ✅

**Group Chat (NEW!):**
1. Create or open a Telegram group
2. Click group name → **"Add Members"**
3. Search for **@AgarthaKirkBot** and add it
4. Bot sends automatic welcome message ✅
5. Send `/start` in the group to test
6. Alerts will now be sent to BOTH private chat and group!

See **GROUP_CHAT_GUIDE.md** for full group chat documentation.

---

## 🎯 What You'll See

### In Railway Logs:
```
[timestamp] INFO: Starting Pump.fun Trading Bot...
[timestamp] INFO: Telegram bot handlers configured
[timestamp] INFO: Starting monitoring with 15 minute interval
[timestamp] INFO: Bot is now running. Press Ctrl+C to stop.
```

### In Telegram:
Bot responds with welcome message and instructions!

---

## 💰 Pricing

- **Free tier:** $5 credit/month (plenty for this bot)
- **Usage:** This bot uses minimal resources (~$1-2/month)
- No credit card required for free tier

---

## 🔧 Troubleshooting

### "Build failed"
- Make sure `package.json` has `"start": "node dist/index.js"`
- Check Railway logs for specific error

### "Bot not responding"
- Check Railway logs - is the bot running?
- Verify environment variables are set correctly
- Make sure deployment status shows "Active"

### "Missing environment variable"
- Go to Variables tab in Railway
- Re-add all the environment variables listed above

---

## 📊 Managing Your Bot

### View Logs:
Railway Dashboard → Your Project → Logs tab

### Restart Bot:
Railway Dashboard → Settings → Restart

### Update Code:
Just push to GitHub - Railway auto-deploys!

### Stop Bot:
Railway Dashboard → Settings → Remove Service

---

## ✅ Success Checklist

- [ ] Railway account created
- [ ] Repository connected/deployed
- [ ] All 5 environment variables added
- [ ] Deployment shows "Active"
- [ ] Logs show "Bot is now running"
- [ ] `/start` works in Telegram

---

## 🚀 You're Done!

Once deployed, your bot runs 24/7 automatically. It will:
- Scan for opportunities every 15 minutes
- Alert you in Telegram when it finds good trades
- Always be online and responsive

**Need help?** Check the Railway logs first - they show exactly what's happening.
