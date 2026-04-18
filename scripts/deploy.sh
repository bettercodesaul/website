#!/bin/bash
set -euo pipefail

# BCS CMS Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

ENVIRONMENT="${1:-staging}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [staging|production]"
    exit 1
fi

log_info "Starting deployment to $ENVIRONMENT"

# Load environment variables
ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
if [[ -f "$ENV_FILE" ]]; then
    log_info "Loading environment from $ENV_FILE"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    log_warn "Environment file not found: $ENV_FILE"
    log_warn "Using default environment variables"
fi

# Check Docker availability
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

# Build and deploy
log_info "Building Docker images..."
cd "$PROJECT_ROOT"

if docker compose version &> /dev/null; then
    docker compose -f docker-compose.yml build
else
    docker-compose -f docker-compose.yml build
fi

log_info "Starting services..."
if docker compose version &> /dev/null; then
    docker compose -f docker-compose.yml up -d
else
    docker-compose -f docker-compose.yml up -d
fi

# Wait for migrations to complete
log_info "Waiting for application to initialize (running migrations)..."
sleep 5

# Health check
log_info "Waiting for services to be healthy..."
MAX_RETRIES=12
RETRY_COUNT=0

while [[ $RETRY_COUNT -lt $MAX_RETRIES ]]; do
    if curl -sf --max-time 5 "http://localhost:${APP_PORT:-3000}/health" > /dev/null 2>&1; then
        log_info "Application is healthy!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    log_warn "Health check attempt $RETRY_COUNT failed, retrying..."
    sleep 5
done

if [[ $RETRY_COUNT -eq $MAX_RETRIES ]]; then
    log_error "Health checks failed after $MAX_RETRIES attempts"
    docker compose logs app
    exit 1
fi

log_info "Deployment complete!"
log_info "Environment: $ENVIRONMENT"
log_info "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Show running containers
log_info "Running services:"
if docker compose version &> /dev/null; then
    docker compose ps
else
    docker-compose ps
fi
