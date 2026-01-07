# 👥 Using the Bot in Group Chats

The Pump.fun bot now supports group chats! You can add it to any Telegram group and it will alert everyone in the group about trading opportunities.

## 🎯 How It Works

- Bot can be added to **multiple groups** and **private chats**
- Alerts are sent to **all active chats** where the bot is present
- Only **authorized users** (configured in `ALLOWED_USER_IDS`) can use commands
- Bot automatically tracks which chats it's been added to

## 📋 Setup for Group Chats

### Step 1: Configure Your Bot

In your `.env` file, you need:

```env
# Required
TELEGRAM_BOT_TOKEN=8513505274:AAGXiF3RJnc8Fltgzha7SB6oc-OTjFoy3ck

# Optional - can leave empty for group mode
TELEGRAM_CHAT_ID=

# Required - User IDs who can use commands
ALLOWED_USER_IDS=8366932263,123456789,987654321
```

**Important:**
- `TELEGRAM_CHAT_ID` can be left **empty** or removed
- Add multiple user IDs to `ALLOWED_USER_IDS` (comma-separated)
- Get user IDs from @userinfobot in Telegram

### Step 2: Add Bot to Group

1. **Create or open a Telegram group**
2. Click group name → **"Add Members"**
3. Search for **@AgarthaKirkBot**
4. Add the bot to the group
5. Bot sends welcome message ✅

### Step 3: Give Bot Permissions (Optional)

For best experience:
- Make bot an **admin** (optional but recommended)
- Grant **"Send Messages"** permission
- No other permissions needed

### Step 4: Test It

In the group, send:
```
/start
```

If you're an authorized user (your ID is in `ALLOWED_USER_IDS`), the bot will respond!

## 🔒 Security Features

### User Authorization
- Only users in `ALLOWED_USER_IDS` can:
  - Use commands (`/start`, `/status`, `/scan`)
  - Trigger manual scans
- Unauthorized users get: `⛔ Unauthorized access. This bot is private.`

### Multiple Authorized Users
Add all team members:
```env
ALLOWED_USER_IDS=8366932263,123456789,987654321,555666777
```

Everyone with their user ID in the list can use the bot.

## 📱 Commands in Groups

### `/start`
Shows welcome message and help
```
/start
```

### `/status`
Shows bot status and number of active chats
```
/status
```

### `/scan`
Triggers immediate scan (authorized users only)
```
/scan
```

## 💬 Alert Behavior

When the bot finds an opportunity:
- ✅ Sends alert to **all active chats**
- ✅ Works in **private chats** and **groups**
- ✅ Includes full analysis and trade details

**Example:** If bot is in:
- Your private chat
- Trading group A
- Trading group B

All 3 chats receive the alert simultaneously!

## 🛠️ Managing Multiple Chats

### View Active Chats
Use `/status` command to see how many chats are active:
```
✅ Bot Status: Active

Check interval: 15 minutes
Probability threshold: 70%
Monitoring: Pump.fun tokens
Active chats: 3
```

### Remove Bot from Chat
- In group: Kick the bot
- In private: Block the bot
- Bot automatically removes inactive chats from alert list

## 🎭 Use Cases

### Private Trading Team
```env
ALLOWED_USER_IDS=111111111,222222222,333333333
```
Add to private group → Only team members can use commands → Everyone gets alerts

### Personal Use + Group
Leave in private chat AND add to groups → Get alerts everywhere

### Multiple Groups
Add to multiple trading groups → All groups get notified

## 🚀 Railway Deployment for Groups

Update your Railway environment variables:

```
TELEGRAM_BOT_TOKEN = 8513505274:AAGXiF3RJnc8Fltgzha7SB6oc-OTjFoy3ck
TELEGRAM_CHAT_ID = (leave empty or remove)
ALLOWED_USER_IDS = 8366932263,123456789
CHECK_INTERVAL_MINUTES = 15
MIN_PROBABILITY_THRESHOLD = 70
```

**Note:** `TELEGRAM_CHAT_ID` is now optional!

## 📊 Example Workflow

1. **Deploy bot** on Railway
2. **Add to personal chat** → send `/start`
3. **Create trading group** → add team members
4. **Add bot to group** → bot welcomes everyone
5. **Authorized users** can use `/status` to check bot
6. **Bot scans** every 15 minutes
7. **Finds opportunity** → sends to both personal + group chat!

## ⚠️ Important Notes

### Bot Permissions in Groups
- Bot doesn't need admin rights (but recommended)
- Needs permission to send messages
- Can't read messages from unauthorized users (privacy)

### Authorization vs. Alerts
- **Commands:** Only authorized users can use
- **Alerts:** Everyone in the chat sees alerts
- This is intentional - alerts are for everyone, controls are restricted

### Privacy
- Bot only responds to authorized users
- Doesn't process messages from unauthorized users
- Logs unauthorized attempts (for security)

## 🔧 Troubleshooting

### "Bot not responding in group"
- Check your user ID is in `ALLOWED_USER_IDS`
- Make sure bot has send message permission
- Try `/start` again

### "Alerts not coming to group"
- Verify bot is still in the group
- Check Railway logs for errors
- Send `/status` to check active chats count

### "Unauthorized access" message
- Your user ID isn't in `ALLOWED_USER_IDS`
- Ask admin to add your ID
- Get your ID from @userinfobot

## ✅ Success Checklist

- [ ] Bot deployed on Railway
- [ ] `ALLOWED_USER_IDS` configured with team members
- [ ] `TELEGRAM_CHAT_ID` left empty (for multi-chat mode)
- [ ] Bot added to group
- [ ] Bot has send message permission
- [ ] `/start` works for authorized users
- [ ] `/status` shows correct active chats count
- [ ] Alerts appear in all chats

---

**Your bot is now group-ready!** Add it to as many chats and groups as you want.
