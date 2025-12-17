#!/bin/bash
# CLI Wrapped - Install and Run Script
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/kmelve/cli-wrapped/main/install.sh)

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         CLI WRAPPED INSTALLER         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Check for Bun
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}Bun not found. Installing Bun...${NC}"
    curl -fsSL https://bun.sh/install | bash

    # Source the updated PATH
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"

    # Also try to source shell config
    [ -f "$HOME/.bashrc" ] && source "$HOME/.bashrc" 2>/dev/null || true
    [ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc" 2>/dev/null || true

    echo -e "${GREEN}Bun installed!${NC}"
    echo ""
fi

# Create temp directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo -e "${GREEN}Downloading CLI Wrapped...${NC}"

# Download and extract
curl -fsSL https://github.com/kmelve/cli-wrapped/archive/refs/heads/main.tar.gz | tar -xz -C "$TEMP_DIR"

cd "$TEMP_DIR/cli-wrapped-main"

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
bun install --silent

# Run with TTY
echo ""
exec bun run src/index.tsx "$@" </dev/tty
