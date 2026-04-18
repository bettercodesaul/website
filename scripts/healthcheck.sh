#!/bin/bash
set -euo pipefail

# BCS Health Check Script
# Usage: ./scripts/healthcheck.sh [--verbose]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

VERBOSE="${1:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

EXIT_CODE=0

check_service() {
    local name="$1"
    local url="$2"
    local timeout="${3:-5}"

    if curl -sf --max-time "$timeout" "$url" > /dev/null 2>&1; then
        log_info "$name is healthy ($url)"
        return 0
    else
        log_error "$name is unhealthy ($url)"
        return 1
    fi
}

check_container() {
    local name="$1"

    if docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
        local status=$(docker inspect --format='{{.State.Health.Status}}' "$name" 2>/dev/null || echo "unknown")
        if [[ "$status" == "healthy" ]]; then
            log_info "Container $name is healthy"
            return 0
        elif [[ "$status" == "unknown" ]]; then
            # No healthcheck defined, just check if running
            if docker ps --filter "name=$name" --filter "status=running" | grep -q "$name"; then
                log_info "Container $name is running (no healthcheck)"
                return 0
            fi
        fi
        log_error "Container $name is unhealthy (status: $status)"
        return 1
    else
        log_error "Container $name is not running"
        return 1
    fi
}

log_info "Starting health checks..."
echo ""

# Check Docker containers
if command -v docker &> /dev/null; then
    log_info "Checking Docker containers..."
    check_container "bcs-app" || EXIT_CODE=1
else
    log_warn "Docker not available, skipping container checks"
fi

echo ""

# Check HTTP endpoints
APP_PORT="${APP_PORT:-3000}"
APP_URL="http://localhost:$APP_PORT"

log_info "Checking HTTP endpoints..."
check_service "App Health" "$APP_URL/health" 5 || EXIT_CODE=1
check_service "App Ready" "$APP_URL/ready" 5 || true  # Optional

echo ""

if [[ $EXIT_CODE -eq 0 ]]; then
    log_info "All health checks passed!"
else
    log_error "Some health checks failed!"
fi

exit $EXIT_CODE
