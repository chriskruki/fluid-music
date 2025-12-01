#!/bin/bash

# Setup script for auto-deployment
# This script helps configure the deployment system

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_PATH="$(dirname "$SCRIPT_DIR")"

echo "=== Auto-Deployment Setup ==="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js first: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed"
    exit 1
fi

echo "✓ npm found: $(npm --version)"

# Make scripts executable
chmod +x "$SCRIPT_DIR/webhook-listener.js"
chmod +x "$SCRIPT_DIR/deploy.sh"
echo "✓ Made scripts executable"

# Generate webhook secret if not set
if [ -z "$GITHUB_WEBHOOK_SECRET" ]; then
    if command -v openssl &> /dev/null; then
        SECRET=$(openssl rand -hex 32)
        echo ""
        echo "Generated webhook secret: $SECRET"
        echo ""
        echo "Add this to your environment or .env file:"
        echo "export GITHUB_WEBHOOK_SECRET=\"$SECRET\""
        echo ""
        echo "Or create a .env file in the deploy directory:"
        echo "echo 'GITHUB_WEBHOOK_SECRET=$SECRET' > $SCRIPT_DIR/.env"
    else
        echo "WARNING: openssl not found. Please generate a secret manually:"
        echo "  openssl rand -hex 32"
    fi
fi

# Create log directory if it doesn't exist
mkdir -p "$SCRIPT_DIR"
touch "$SCRIPT_DIR/deploy.log"
echo "✓ Created log file: $SCRIPT_DIR/deploy.log"

# Test git access
cd "$REPO_PATH"
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "✓ Git repository detected"
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "  Current branch: $CURRENT_BRANCH"
else
    echo "WARNING: Not a git repository"
fi

# Check if app directory exists
APP_DIR="$REPO_PATH/fluid-react"
if [ -d "$APP_DIR" ]; then
    echo "✓ App directory found: $APP_DIR"
    if [ -f "$APP_DIR/package.json" ]; then
        echo "✓ package.json found"
    else
        echo "WARNING: package.json not found in app directory"
    fi
else
    echo "WARNING: App directory not found: $APP_DIR"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Set GITHUB_WEBHOOK_SECRET environment variable"
echo "2. Start the webhook listener:"
echo "   cd $SCRIPT_DIR"
echo "   node webhook-listener.js"
echo ""
echo "3. Configure GitHub webhook:"
echo "   URL: http://your-server-ip:9000/webhook"
echo "   Secret: (your GITHUB_WEBHOOK_SECRET)"
echo "   Events: Just the push event"
echo ""
echo "See deploy/README.md for detailed instructions"

