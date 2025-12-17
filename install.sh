#!/bin/bash
# CLI Wrapped - Install and Run Script
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/kmelve/cli-wrapped/main/install.sh)

set -e

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Install directory
INSTALL_DIR="$HOME/.cli-wrapped"

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

    echo -e "${GREEN}Bun installed!${NC}"
    echo ""
fi

# Download/update CLI Wrapped
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${GREEN}Updating CLI Wrapped...${NC}"
    rm -rf "$INSTALL_DIR"
fi

echo -e "${GREEN}Downloading CLI Wrapped...${NC}"
mkdir -p "$INSTALL_DIR"
curl -fsSL https://github.com/kmelve/cli-wrapped/archive/refs/heads/main.tar.gz | tar -xz --strip-components=1 -C "$INSTALL_DIR"

cd "$INSTALL_DIR"

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
bun install --silent

echo ""
echo -e "${GREEN}Running CLI Wrapped...${NC}"
echo -e "${BLUE}(Installed to ~/.cli-wrapped - run again anytime with: cd ~/.cli-wrapped && bun start)${NC}"
echo ""

# Create a runner script and execute it directly
cat > /tmp/run-cli-wrapped.sh << 'RUNNER'
#!/bin/bash
cd "$HOME/.cli-wrapped"
exec bun run src/index.tsx "$@"
RUNNER
chmod +x /tmp/run-cli-wrapped.sh

# Use script command to create a proper PTY (works on both macOS and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    script -q /dev/null /tmp/run-cli-wrapped.sh "$@"
else
    # Linux
    script -q -c "/tmp/run-cli-wrapped.sh $*" /dev/null
fi
