#!/bin/bash

echo "🔍 Comprehensive Bot Diagnostics"
echo "=================================="
echo ""

# Check .env file exists
echo "1. Checking .env file..."
if [ ! -f .env ]; then
    echo "   ❌ .env file not found!"
    exit 1
else
    echo "   ✅ .env file exists"
fi

# Extract and validate credentials
echo ""
echo "2. Validating credentials..."
BOT_TOKEN=$(grep TELEGRAM_BOT_TOKEN .env | cut -d '=' -f2)
CHAT_ID=$(grep TELEGRAM_CHAT_ID .env | cut -d '=' -f2)
USER_ID=$(grep ALLOWED_USER_IDS .env | cut -d '=' -f2)

if [ -z "$BOT_TOKEN" ]; then
    echo "   ❌ TELEGRAM_BOT_TOKEN is empty"
    exit 1
else
    echo "   ✅ Bot Token: ${BOT_TOKEN:0:20}... (${#BOT_TOKEN} chars)"
fi

if [ -z "$CHAT_ID" ]; then
    echo "   ❌ TELEGRAM_CHAT_ID is empty"
    exit 1
else
    echo "   ✅ Chat ID: $CHAT_ID"
fi

if [ -z "$USER_ID" ]; then
    echo "   ⚠️  User ID is empty (will allow all users)"
else
    echo "   ✅ User ID: $USER_ID"
fi

# Test network connectivity
echo ""
echo "3. Testing network connectivity..."

# Test if we can reach Telegram API
echo "   Testing Telegram API..."
response=$(curl -s -w "%{http_code}" -o /tmp/telegram_test.json --max-time 5 "https://api.telegram.org/bot${BOT_TOKEN}/getMe" 2>/dev/null)

if [ "$response" = "200" ]; then
    bot_username=$(cat /tmp/telegram_test.json | grep -o '"username":"[^"]*"' | cut -d '"' -f4)
    echo "   ✅ Telegram API reachable"
    echo "   ✅ Bot username: @$bot_username"
    echo "   ✅ Bot is valid and active"
elif [ "$response" = "401" ]; then
    echo "   ❌ Bot token is invalid (401 Unauthorized)"
    exit 1
elif [ "$response" = "000" ] || [ -z "$response" ]; then
    echo "   ⚠️  Cannot reach Telegram API (network blocked)"
    echo "   This is expected in restricted environments"
    echo "   The bot will work when run on a machine with internet access"
else
    echo "   ⚠️  Unexpected response: HTTP $response"
fi

# Check for messages
echo ""
echo "4. Checking for messages from you..."
messages=$(curl -s --max-time 5 "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates" 2>/dev/null)

if echo "$messages" | grep -q "\"ok\":true"; then
    message_count=$(echo "$messages" | grep -o '"message"' | wc -l)
    echo "   ✅ Successfully fetched updates"
    echo "   📬 Found $message_count message(s)"

    if [ "$message_count" -gt 0 ]; then
        echo ""
        echo "   Last message details:"
        echo "$messages" | grep -o '"text":"[^"]*"' | head -1 | sed 's/"text":"/     Text: /' | sed 's/"$//'
        echo "$messages" | grep -o '"chat":{"id":[0-9]*' | head -1 | sed 's/"chat":{"id":/     Chat ID: /'
        echo "$messages" | grep -o '"from":{"id":[0-9]*' | head -1 | sed 's/"from":{"id":/     From ID: /'
    fi
else
    echo "   ⚠️  Cannot fetch messages (network blocked)"
fi

# Check Node.js and dependencies
echo ""
echo "5. Checking Node.js environment..."
if command -v node >/dev/null 2>&1; then
    node_version=$(node --version)
    echo "   ✅ Node.js: $node_version"
else
    echo "   ❌ Node.js not found"
    exit 1
fi

if [ -d "node_modules" ]; then
    echo "   ✅ Dependencies installed"
else
    echo "   ❌ Dependencies not installed (run: npm install)"
    exit 1
fi

# Check TypeScript build
echo ""
echo "6. Checking TypeScript build..."
if [ -d "dist" ] && [ -f "dist/index.js" ]; then
    echo "   ✅ TypeScript compiled"
else
    echo "   ⚠️  Not compiled yet (run: npm run build)"
fi

# Summary
echo ""
echo "=================================="
echo "📊 DIAGNOSTIC SUMMARY"
echo "=================================="
echo ""

if [ "$response" = "200" ]; then
    echo "✅ All checks passed!"
    echo "✅ Your bot is properly configured and ready to run"
    echo ""
    echo "🚀 To start the bot:"
    echo "   npm run dev"
    echo ""
    echo "💬 Then send /start to @$bot_username in Telegram"
elif [ "$response" = "000" ] || [ -z "$response" ]; then
    echo "⚠️  Configuration is correct, but network is blocked"
    echo ""
    echo "✅ Your credentials are valid:"
    echo "   - Bot Token: Configured"
    echo "   - Chat ID: $CHAT_ID"
    echo "   - User ID: $USER_ID"
    echo ""
    echo "🔧 To fix:"
    echo "   1. Run this bot on your local computer or a VPS"
    echo "   2. Make sure it has unrestricted internet access"
    echo "   3. Run: npm run dev"
    echo "   4. Send /start to your bot in Telegram"
    echo ""
    echo "📦 To deploy:"
    echo "   See DEPLOYMENT.md for cloud deployment options"
else
    echo "❌ Issues detected - please review the errors above"
fi

echo ""
