#!/bin/bash

# Auto-deployment script for fluid-react
# This script handles git pull, build, and restart

set -e  # Exit on error

BRANCH="${1:-master}"
REF="${2:-refs/heads/master}"
REPO_PATH="${REPO_PATH:-$(dirname "$0")/..}"
APP_DIR="${APP_DIR:-fluid-react}"
LOG_FILE="${LOG_FILE:-$(dirname "$0")/deploy.log}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Change to repo directory
cd "$REPO_PATH" || {
    error "Failed to change to repository directory: $REPO_PATH"
    exit 1
}

log "Starting deployment for branch: $BRANCH"
log "Repository path: $REPO_PATH"
log "App directory: $APP_DIR"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not a git repository: $REPO_PATH"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "Current branch: $CURRENT_BRANCH"

# Fetch latest changes
log "Fetching latest changes from origin..."
git fetch origin || {
    error "Failed to fetch from origin"
    exit 1
}

# Checkout the target branch if not already on it
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    log "Checking out branch: $BRANCH"
    git checkout "$BRANCH" || {
        error "Failed to checkout branch: $BRANCH"
        exit 1
    }
fi

# Pull latest changes
log "Pulling latest changes..."
git pull origin "$BRANCH" || {
    error "Failed to pull from origin/$BRANCH"
    exit 1
}

# Get latest commit info
LATEST_COMMIT=$(git rev-parse HEAD)
LATEST_COMMIT_MSG=$(git log -1 --pretty=%B)
log "Latest commit: $LATEST_COMMIT"
log "Commit message: $LATEST_COMMIT_MSG"

# Change to app directory
cd "$APP_DIR" || {
    error "Failed to change to app directory: $APP_DIR"
    exit 1
}

# Check if package.json exists
if [ ! -f "package.json" ]; then
    error "package.json not found in $APP_DIR"
    exit 1
fi

# Install dependencies if package-lock.json changed or node_modules missing
if [ ! -d "node_modules" ] || [ "package-lock.json" -nt "node_modules" ]; then
    log "Installing/updating dependencies..."
    npm ci || {
        error "Failed to install dependencies"
        exit 1
    }
else
    log "Dependencies are up to date, skipping npm install"
fi

# Build the application
log "Building application..."
npm run build || {
    error "Build failed"
    exit 1
}

log "Build completed successfully"

# Find and kill existing process
log "Stopping existing application..."
# Try to find the process by port (default 3000) or by process name
if command -v lsof > /dev/null 2>&1; then
    PORT="${PORT:-3000}"
    PID=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ -n "$PID" ]; then
        log "Found process on port $PORT (PID: $PID), stopping..."
        kill "$PID" || true
        sleep 2
        # Force kill if still running
        if kill -0 "$PID" 2>/dev/null; then
            warning "Process still running, force killing..."
            kill -9 "$PID" || true
        fi
    fi
fi

# Also try to kill by process name (node server.js)
pkill -f "node.*server.js" || true
sleep 1

log "Starting application..."
# Start the application in the background
nohup npm run start > "$(dirname "$LOG_FILE")/app.log" 2>&1 &
APP_PID=$!

# Wait a moment and check if process is still running
sleep 2
if kill -0 "$APP_PID" 2>/dev/null; then
    log "Application started successfully (PID: $APP_PID)"
    log "Deployment completed successfully!"
    exit 0
else
    error "Application failed to start (PID: $APP_PID)"
    error "Check app.log for details: $(dirname "$LOG_FILE")/app.log"
    exit 1
fi

