#!/bin/bash

echo "🔍 Fetching your Chat ID and User ID..."
echo ""

# Load bot token from .env file
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

BOT_TOKEN=$(grep TELEGRAM_BOT_TOKEN .env | cut -d '=' -f2)

# Get updates from Telegram
response=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates")

# Parse the response to extract chat ID and user ID
chat_id=$(echo "$response" | grep -o '"chat":{"id":[0-9]*' | head -1 | grep -o '[0-9]*$')
user_id=$(echo "$response" | grep -o '"from":{"id":[0-9]*' | head -1 | grep -o '[0-9]*$')

if [ -n "$chat_id" ] && [ -n "$user_id" ]; then
    echo "✅ Found your credentials!"
    echo ""
    echo "Chat ID: $chat_id"
    echo "User ID: $user_id"
    echo ""
    echo "📝 Updating .env file..."

    # Update .env file
    sed -i "s/TELEGRAM_CHAT_ID=.*/TELEGRAM_CHAT_ID=$chat_id/" .env
    sed -i "s/ALLOWED_USER_IDS=.*/ALLOWED_USER_IDS=$user_id/" .env

    echo "✅ Configuration complete!"
    echo ""
    echo "Your .env file has been updated with:"
    echo "  TELEGRAM_CHAT_ID=$chat_id"
    echo "  ALLOWED_USER_IDS=$user_id"
else
    echo "❌ No messages found!"
    echo ""
    echo "Please:"
    echo "1. Open Telegram"
    echo "2. Search for @AgarthaKirkBot"
    echo "3. Send any message (like 'hello' or '/start')"
    echo "4. Run this script again: ./get-chat-id.sh"
fi
