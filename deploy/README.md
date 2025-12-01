# Auto-Deployment Setup

This directory contains scripts for automatic deployment when code is pushed to GitHub.

## Overview

The deployment system consists of:
1. **webhook-listener.js** - HTTP server that listens for GitHub webhook events
2. **deploy.sh** - Script that handles git pull, build, and restart
3. **setup.sh** - Helper script to set up the deployment system

## Quick Setup

### 1. Install Dependencies

The webhook listener requires Node.js. Make sure it's installed:

```bash
node --version
npm --version
```

### 2. Configure Environment Variables

Create a `.env` file in the `deploy` directory (optional, or set environment variables):

```bash
cd deploy
cat > .env << EOF
WEBHOOK_PORT=9000
GITHUB_WEBHOOK_SECRET=your-secret-here
REPO_PATH=/path/to/your/repo
EOF
```

Or export them in your shell:

```bash
export WEBHOOK_PORT=9000
export GITHUB_WEBHOOK_SECRET="your-random-secret-string"
export REPO_PATH="/path/to/fluid-music"
```

**Important**: Generate a strong secret for `GITHUB_WEBHOOK_SECRET`:
```bash
openssl rand -hex 32
```

### 3. Make Scripts Executable

```bash
chmod +x deploy/webhook-listener.js
chmod +x deploy/deploy.sh
```

### 4. Test the Deployment Script

Test the deployment script manually first:

```bash
cd deploy
./deploy.sh master refs/heads/master
```

### 5. Start the Webhook Listener

#### Option A: Run in tmux (Recommended)

```bash
# Create a new tmux session
tmux new -s webhook

# Start the webhook listener
cd /path/to/fluid-music/deploy
node webhook-listener.js

# Detach from tmux: Press Ctrl+B, then D
```

#### Option B: Run as a Background Process

```bash
cd deploy
nohup node webhook-listener.js > webhook.log 2>&1 &
```

#### Option C: Use PM2 (if installed)

```bash
cd deploy
pm2 start webhook-listener.js --name webhook-listener
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

### 6. Configure GitHub Webhook

1. Go to your GitHub repository
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `http://your-droplet-ip:9000/webhook`
   - **Content type**: `application/json`
   - **Secret**: The same secret you set in `GITHUB_WEBHOOK_SECRET`
   - **Events**: Select "Just the push event"
   - **Active**: ✓

### 7. Configure Firewall

Make sure port 9000 (or your chosen port) is open:

```bash
# Ubuntu/Debian
sudo ufw allow 9000/tcp

# Or for Digital Ocean, configure in their dashboard
```

## How It Works

1. **Push to GitHub**: When you push code to any branch, GitHub sends a webhook POST request
2. **Webhook Listener**: Receives the event, verifies the signature, and triggers deployment
3. **Deployment Script**: 
   - Fetches latest changes
   - Checks out the branch
   - Pulls changes
   - Installs dependencies (if needed)
   - Builds the application
   - Stops the old process
   - Starts the new process

## Monitoring

### View Logs

```bash
# Webhook listener logs
tail -f deploy/deploy.log

# Application logs
tail -f deploy/app.log
```

### Check Webhook Listener Status

```bash
# Check if process is running
ps aux | grep webhook-listener

# Check if port is listening
netstat -tuln | grep 9000
# or
lsof -i :9000
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check if the listener is running: `ps aux | grep webhook-listener`
2. Check firewall: `sudo ufw status`
3. Verify GitHub webhook configuration (check delivery logs in GitHub)
4. Check webhook logs: `tail -f deploy/deploy.log`

### Deployment Fails

1. Check deployment logs: `tail -f deploy/deploy.log`
2. Verify git access: `git fetch origin`
3. Check npm permissions: `npm install` (run manually)
4. Verify build works: `cd fluid-react && npm run build`
5. Check application logs: `tail -f deploy/app.log`

### Application Won't Start

1. Check if port is already in use: `lsof -i :3000`
2. Check application logs: `tail -f deploy/app.log`
3. Try starting manually: `cd fluid-react && npm run start`

## Security Considerations

1. **Use HTTPS**: For production, use a reverse proxy (nginx) with SSL/TLS
2. **Webhook Secret**: Always use a strong secret and verify signatures
3. **Firewall**: Only allow webhook port from GitHub IPs (if possible)
4. **Permissions**: Run webhook listener with minimal privileges

## Advanced: Using Nginx Reverse Proxy

For production, set up nginx to proxy webhooks:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /webhook {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Then configure GitHub webhook to use `https://your-domain.com/webhook`.

## Manual Deployment

You can also trigger deployment manually:

```bash
cd deploy
./deploy.sh master refs/heads/master
```

Or for a specific branch:

```bash
./deploy.sh develop refs/heads/develop
```

