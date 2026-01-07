# Deployment Guide

This guide will help you deploy the Pump.fun Trading Bot to various environments.

## Quick Start (Local Development)

```bash
# 1. Clone and setup
git clone <repo-url>
cd pumpfunbot
npm install

# 2. Configure
cp .env.example .env
# Edit .env with your credentials

# 3. Run
npm run dev
```

## Production Deployment

### Option 1: PM2 (Process Manager)

PM2 keeps your bot running and auto-restarts on crashes.

```bash
# Install PM2 globally
npm install -g pm2

# Build the project
npm run build

# Start with PM2
pm2 start dist/index.js --name pumpfun-bot

# Save configuration
pm2 save

# Setup auto-start on system boot
pm2 startup
```

**PM2 Commands:**
```bash
pm2 status              # Check status
pm2 logs pumpfun-bot    # View logs
pm2 restart pumpfun-bot # Restart bot
pm2 stop pumpfun-bot    # Stop bot
pm2 delete pumpfun-bot  # Remove from PM2
```

### Option 2: Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  bot:
    build: .
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
```

**Deploy with Docker:**
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 3: Systemd Service

Create `/etc/systemd/system/pumpfun-bot.service`:

```ini
[Unit]
Description=Pumpfun Trading Bot
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/pumpfunbot
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=pumpfun-bot
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Systemd Commands:**
```bash
# Enable and start
sudo systemctl enable pumpfun-bot
sudo systemctl start pumpfun-bot

# Check status
sudo systemctl status pumpfun-bot

# View logs
sudo journalctl -u pumpfun-bot -f

# Restart
sudo systemctl restart pumpfun-bot
```

## VPS Deployment (Ubuntu/Debian)

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Create app user
sudo adduser --disabled-password --gecos "" pumpfunbot
```

### 2. Deploy Application

```bash
# Switch to app user
sudo su - pumpfunbot

# Clone repository
git clone <repo-url>
cd pumpfunbot

# Install dependencies
npm install

# Configure
cp .env.example .env
nano .env  # Edit with your credentials

# Build
npm run build

# Test run
node dist/index.js
```

### 3. Setup PM2 or Systemd

Follow the PM2 or Systemd instructions above.

### 4. Security Hardening

```bash
# Setup firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Install fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Cloud Platforms

### Railway.app

1. Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. Deploy:
   - Connect GitHub repo
   - Add environment variables
   - Deploy

### Heroku

1. Create `Procfile`:
```
worker: node dist/index.js
```

2. Deploy:
```bash
heroku create pumpfun-bot
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set TELEGRAM_CHAT_ID=your_chat_id
git push heroku main
heroku ps:scale worker=1
```

### AWS EC2

1. Launch Ubuntu instance
2. Follow VPS deployment steps
3. Configure security groups (allow SSH)
4. Setup Elastic IP for static address

### DigitalOcean Droplet

1. Create Ubuntu droplet
2. Follow VPS deployment steps
3. Enable monitoring
4. Setup backups

## Environment Variables

### Required
```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Optional
```env
CHECK_INTERVAL_MINUTES=15
MIN_PROBABILITY_THRESHOLD=70
ALLOWED_USER_IDS=123456789,987654321
NODE_ENV=production
```

## Monitoring & Logging

### Log Files

Create logs directory:
```bash
mkdir -p logs
```

Modify `src/utils/logger.ts` to write to files:
```typescript
import fs from 'fs';

const logStream = fs.createWriteStream('logs/bot.log', { flags: 'a' });
```

### PM2 Monitoring

```bash
# Monitor resources
pm2 monit

# Web dashboard
pm2 web
```

### Health Checks

Add to `src/index.ts`:
```typescript
import express from 'express';

const app = express();
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
app.listen(3000);
```

## Troubleshooting

### Bot Not Starting

```bash
# Check logs
pm2 logs pumpfun-bot

# Verify environment
node -e "console.log(process.env.TELEGRAM_BOT_TOKEN)"

# Test build
npm run build
node dist/index.js
```

### Connection Issues

```bash
# Test network
ping api.telegram.org
curl https://api.coingecko.com/api/v3/ping

# Check firewall
sudo ufw status
```

### Memory Issues

```bash
# Monitor resources
pm2 monit

# Increase Node memory
pm2 start dist/index.js --name pumpfun-bot --node-args="--max-old-space-size=2048"
```

## Backup & Recovery

### Backup Configuration

```bash
# Backup .env
cp .env .env.backup

# Backup entire project
tar -czf pumpfun-bot-backup.tar.gz pumpfunbot/
```

### Recovery

```bash
# Restore from backup
tar -xzf pumpfun-bot-backup.tar.gz
cd pumpfunbot
npm install
npm run build
pm2 restart pumpfun-bot
```

## Updates

```bash
# Pull latest code
git pull origin main

# Reinstall dependencies
npm install

# Rebuild
npm run build

# Restart
pm2 restart pumpfun-bot
```

## Performance Optimization

### Node.js Options

```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=2048" node dist/index.js

# Enable optimization
NODE_ENV=production node dist/index.js
```

### Caching

Already implemented for:
- Macro data (5 minute cache)
- Alert deduplication

### Rate Limiting

Adjust delays in `src/services/scanner.ts`:
```typescript
await this.sleep(500);  // Reduce for faster scans
```

## Security Checklist

- [ ] `.env` file secured (chmod 600)
- [ ] Firewall configured
- [ ] SSH key-only authentication
- [ ] Regular security updates
- [ ] Log rotation configured
- [ ] Backups automated
- [ ] User IDs whitelisted
- [ ] HTTPS for web endpoints (if any)

## Support

- Check logs first
- Review GitHub issues
- Test in development mode
- Verify API connectivity

---

Happy deploying! 🚀
