#!/bin/bash
set -euo pipefail

# BCS Rollback Script
# Usage: ./scripts/rollback.sh [image_tag|previous]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

if [[ $# -lt 1 ]]; then
    log_error "Usage: $0 [image_tag|previous]"
    log_info "  image_tag  - Specific image tag to rollback to (e.g., v1.2.3)"
    log_info "  previous   - Rollback to the previous deployment"
    exit 1
fi

TARGET="$1"

cd "$PROJECT_ROOT"

if [[ "$TARGET" == "previous" ]]; then
    log_info "Rolling back to previous deployment..."
    # Get previous image tag from deployment history
    HISTORY_FILE="$PROJECT_ROOT/.deployment_history"
    if [[ -f "$HISTORY_FILE" ]]; then
        TARGET=$(tail -2 "$HISTORY_FILE" | head -1 | awk '{print $2}')
        if [[ -z "$TARGET" ]]; then
            log_error "No previous deployment found in history"
            exit 1
        fi
        log_info "Found previous image tag: $TARGET"
    else
        log_error "No deployment history found"
        exit 1
    fi
fi

log_info "Rolling back to image tag: $TARGET"

# Stop current deployment
log_info "Stopping current services..."
if docker compose version &> /dev/null; then
    docker compose down
else
    docker-compose down
fi

# Pull the target image
log_info "Pulling target image..."
docker pull "ghcr.io/${GITHUB_REPOSITORY:-bcs/bcs}:$TARGET" || {
    log_warn "Could not pull from registry, checking local images..."
    if ! docker image inspect "bcs:$TARGET" &> /dev/null; then
        log_error "Image not found locally or in registry: $TARGET"
        exit 1
    fi
}

# Update docker-compose to use specific tag
cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  app:
    image: ghcr.io/${GITHUB_REPOSITORY:-bcs/bcs}:$TARGET
EOF

# Start with target image
log_info "Starting services with rollback image..."
if docker compose version &> /dev/null; then
    docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
else
    docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
fi

# Record rollback
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") ROLLBACK $TARGET" >> "$PROJECT_ROOT/.deployment_history"

log_info "Rollback complete!"
log_info "Current image: $TARGET"

# Cleanup
rm -f docker-compose.override.yml
