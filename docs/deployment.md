# Deployment Guide

This guide will help you deploy your Discord bot to various hosting platforms and ensure it runs reliably in production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Preparing for Production](#preparing-for-production)
- [Deployment Options](#deployment-options)
  - [VPS Deployment](#vps-deployment)
  - [Railway](#railway)
  - [Heroku](#heroku)
  - [DigitalOcean App Platform](#digitalocean-app-platform)
  - [Replit](#replit)
  - [Docker Deployment](#docker-deployment)
- [Production Best Practices](#production-best-practices)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Updating Your Bot](#updating-your-bot)

## Prerequisites

Before deploying your bot, make sure you have:

1. A functioning Discord bot with a valid token
2. All environment variables set up (check `.env.example`)
3. Tested your bot thoroughly in a development environment
4. Basic understanding of your chosen hosting platform

## Preparing for Production

### 1. Environment Configuration

Create production-specific environment settings:

```
# Production Environment
USE_SHARDING = true
TOKEN = "your-bot-token"
SHOW_DEBUG = false  # Disable debug logs in production
PREFIX = -
```

### 2. Setup Process Manager

Install PM2 to ensure your bot stays running:

```bash
npm install pm2 -g
```

Create a PM2 ecosystem file for your bot:

```bash
# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: "discord-bot",
    script: "./dist/index.js",
    env: {
      NODE_ENV: "production",
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env_production: {
      NODE_ENV: "production"
    }
  }]
}
EOL
```

### 3. Build for Production

```bash
npm run build
```

## Deployment Options

### VPS Deployment

Deploying to a VPS (Virtual Private Server) gives you the most control over your bot's environment.

#### Step 1: Set up a VPS

Get a VPS from providers like:
- DigitalOcean
- Linode
- AWS EC2
- OVH

#### Step 2: Install Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Verify installations
node -v
npm -v
git --version
```

#### Step 3: Clone and Setup

```bash
# Clone your repository
git clone https://github.com/yourusername/discord-bot.git
cd discord-bot

# Install dependencies
npm install --production

# Create environment file
cp .env.example .env
nano .env  # Edit with your production values
```

#### Step 4: Start with PM2

```bash
# Install PM2 globally
npm install pm2 -g

# Build the project
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Make PM2 startup on system boot
pm2 startup
pm2 save
```

### Railway

Railway provides a simple platform for deploying Node.js applications with ease.

#### Step 1: Connect Repository

1. Create an account at [Railway](https://railway.app/)
2. Create a new project and select "Deploy from GitHub repo"
3. Connect your GitHub account and select your bot repository

#### Step 2: Configure Environment

1. Go to the "Variables" tab
2. Add all required environment variables:
   - `TOKEN`
   - `USE_SHARDING`
   - `SHOW_DEBUG`
   - `PREFIX`
   - `NODE_ENV=production`

#### Step 3: Configure Build Settings

1. Go to the "Settings" tab
2. Set the build command: `npm run build`
3. Set the start command: `node dist/index.js`

Your bot will automatically deploy and stay online.

### Heroku

Heroku is another popular platform for hosting Discord bots.

#### Step 1: Install Heroku CLI

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login
```

#### Step 2: Prepare Your App

Add a `Procfile` to tell Heroku how to run your bot:

```
# Procfile
worker: node dist/index.js
```

Ensure your package.json has the proper build script and engine information:

```json
{
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "heroku-postbuild": "npm run build"
  }
}
```

#### Step 3: Create and Deploy

```bash
# Create Heroku app
heroku create your-bot-name

# Add environment variables
heroku config:set TOKEN=your_discord_token
heroku config:set USE_SHARDING=true
heroku config:set SHOW_DEBUG=false
heroku config:set PREFIX=-

# Deploy to Heroku
git push heroku main

# Ensure the worker is running (not web)
heroku ps:scale web=0 worker=1
```

### DigitalOcean App Platform

DigitalOcean App Platform is a PaaS solution that makes deployment straightforward.

#### Step 1: Create a New App

1. Go to [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform/)
2. Create an account if you don't have one
3. Click "Create App" and connect to your GitHub repository

#### Step 2: Configure the App

1. Select the repository and branch
2. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `node dist/index.js`
3. Add environment variables in the "Environment Variables" section
4. Select appropriate resource plan (Basic is usually sufficient)

#### Step 3: Deploy

1. Review your settings
2. Click "Launch App"
3. Monitor the build and deployment logs

### Replit

Replit offers free hosting with some limitations.

#### Step 1: Create a Replit

1. Sign up at [Replit](https://replit.com/)
2. Create a new Repl and select "Import from GitHub"
3. Import your Discord bot repository

#### Step 2: Configure Environment

1. Create a `.replit` file:

```
run = "npm run start"
```

2. Set up environment variables in the Secrets tab:
   - Add all your environment variables from `.env.example`

#### Step 3: Keep Alive

To prevent your bot from going to sleep, add a simple web server:

```typescript
// Add to index.ts
import express from 'express';
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
```

Then use an uptime monitoring service like UptimeRobot to ping your bot regularly.

### Docker Deployment

Docker allows you to containerize your bot for consistent deployment across environments.

#### Step 1: Create a Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

CMD ["node", "dist/index.js"]
```

#### Step 2: Build and Run Docker Image

```bash
# Build docker image
docker build -t discord-bot .

# Run docker container
docker run -d \
  --name discord-bot \
  --restart unless-stopped \
  -e TOKEN=your_discord_token \
  -e USE_SHARDING=true \
  -e SHOW_DEBUG=false \
  -e PREFIX=- \
  discord-bot
```

#### Step 3: Docker Compose (Optional)

For easier management, create a docker-compose.yml:

```yaml
version: '3'
services:
  discord-bot:
    build: .
    restart: unless-stopped
    environment:
      - TOKEN=your_discord_token
      - USE_SHARDING=true
      - SHOW_DEBUG=false
      - PREFIX=-
```

Then run with:

```bash
docker-compose up -d
```

## Production Best Practices

### Security

1. **Keep Tokens Secret**: Never commit tokens to version control
2. **Limit Permissions**: Give your bot only the permissions it needs
3. **Validate User Input**: Always sanitize and validate inputs
4. **Use Environment Variables**: Store sensitive information in environment variables

### Performance

1. **Memory Management**: Monitor and optimize memory usage
2. **Efficient Caching**: Cache frequently used data, but expire old entries
3. **Rate Limiting**: Implement rate limiting for commands to prevent abuse
4. **Proper Sharding**: Use sharding for bots in many servers (>2500)

### Reliability

1. **Error Handling**: Implement comprehensive error handling
2. **Graceful Shutdown**: Handle process termination gracefully
3. **Auto-Restart**: Configure your process manager to restart on crashes
4. **Connection Recovery**: Reconnect automatically if the connection drops

## Monitoring and Maintenance

### Logging

Implement comprehensive logging to track issues:

```typescript
// Production logging setup
if (process.env.NODE_ENV === 'production') {
  // Disable debug logging
  client.logger.setLevel('info');
  
  // Log to file
  const logStream = fs.createWriteStream(path.join(__dirname, 'bot.log'), {flags: 'a'});
  console.log = (...args) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    logStream.write(`${new Date().toISOString()} - ${message}\n`);
  };
}
```

### Health Checks

Implement a basic health check endpoint:

```typescript
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    shards: client.ws.shards.size,
    ping: client.ws.ping
  };
  
  res.status(200).send(health);
});
```

### Monitoring Options

1. **UptimeRobot**: Free monitoring for basic uptime checks
2. **StatusCake**: More advanced monitoring with alerts
3. **Prometheus + Grafana**: For comprehensive metric collection and visualization
4. **Discord Webhook**: Send status updates to a private Discord channel

## Updating Your Bot

### Planned Updates

1. **Prepare Changelog**: Document what's changing
2. **Test in Staging**: Test changes in a staging environment first
3. **Schedule Downtime**: For major updates, schedule and announce downtime
4. **Deploy During Low Traffic**: Update when fewer users are active

### Emergency Updates

1. **Identify Issue**: Quickly identify the root cause
2. **Hotfix**: Create a minimal fix for the specific issue
3. **Testing**: Test the hotfix in a staging environment if possible
4. **Deploy & Monitor**: Deploy the fix and monitor for resolution
5. **Post-Mortem**: Document what happened and how to prevent it

### Rollback Plan

Always have a rollback plan in case an update causes issues:

```bash
# Using Git tags for versioning
git tag v1.0.0

# To roll back to a previous version
git checkout v0.9.0
npm run build
pm2 reload discord-bot
```

---

Following these deployment guidelines will help ensure your Discord bot runs reliably in production. Choose the hosting option that best fits your needs and budget, and always prioritize security and stability in your deployment process.
