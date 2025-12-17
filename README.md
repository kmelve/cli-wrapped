# CLI Wrapped

Spotify Wrapped, but for your command line. Analyzes your shell history and generates fun statistics with optional AI-powered roasts.

![CLI Wrapped Demo](https://github.com/user-attachments/assets/demo.gif)

## Features

- **Top Commands** - See your most-used commands with visual bar charts
- **Time Patterns** - When do you code? Hourly and daily breakdowns
- **The Struggles** - Typos, rage-sudo moments, repeated failures
- **Git Stats** - Commits, pushes, pulls, and your favorite git command
- **Package Manager Loyalty** - npm vs yarn vs pnpm vs bun
- **AI Roasts** - Optional witty commentary from Claude

## Quick Start

Run directly (installs Bun if needed):

```bash
curl -fsSL https://raw.githubusercontent.com/kmelve/cli-wrapped/main/install.sh | bash
```

## Installation

### Option 1: Run from source

```bash
# Install Bun if you haven't
curl -fsSL https://bun.sh/install | bash

# Clone and run
git clone https://github.com/kmelve/cli-wrapped
cd cli-wrapped
bun install
bun run start
```

### Option 2: Install globally

```bash
git clone https://github.com/kmelve/cli-wrapped
cd cli-wrapped
bun install
bun link
cli-wrapped
```

## Usage

```bash
cli-wrapped [options]
```

### Options

| Flag | Description |
|------|-------------|
| `--year=YYYY` | Analyze a specific year (default: current year) |
| `--no-ai` | Skip AI-powered roasts (faster, no API key needed) |
| `--static` | Force static mode (no interactive navigation) |
| `--help, -h` | Show help message |

### Examples

```bash
# Interactive experience for current year
cli-wrapped

# Analyze 2024
cli-wrapped --year=2024

# Quick view without AI
cli-wrapped --no-ai --static
```

### Navigation (Interactive Mode)

| Key | Action |
|-----|--------|
| `SPACE` / `→` / `ENTER` | Next screen |
| `←` / `BACKSPACE` | Previous screen |
| `q` | Quit |

## AI-Powered Roasts

When you run CLI Wrapped, you'll be asked if you want AI-powered roasts.

### Privacy First

**We only send statistics to Claude, never your actual commands.**

What we send:
- Command names and counts (e.g., "git: 774 times")
- Time patterns (e.g., "peak hour: 2pm")
- Aggregate numbers (total commands, unique commands)

What we **never** send:
- Your actual command arguments
- File paths or project names
- Any history content beyond command names

### Setup

```bash
# Get a key at https://console.anthropic.com/
export ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Add to ~/.zshrc for permanent use
echo 'export ANTHROPIC_API_KEY=sk-ant-api03-xxxxx' >> ~/.zshrc
```

Or skip the consent prompt:
```bash
cli-wrapped --ai      # Enable AI directly
cli-wrapped --no-ai   # Disable AI directly
```

Without an API key, the app works perfectly - you just won't get the roasts.

## Supported Shells

- **zsh** - Full support with timestamps
- **bash** - Basic support (timestamps if `HISTTIMEFORMAT` is set)
- **fish** - Full support with timestamps

## Tech Stack

- **TypeScript** - Type-safe development
- **React + Ink** - Terminal UI framework
- **Bun** - Fast JavaScript runtime
- **Anthropic SDK** - Claude API for roasts

## Sample Output

```
╔══════════════════════════════════════════════════════════════╗
║                     CLI WRAPPED 2025                        ║
╚══════════════════════════════════════════════════════════════╝

You typed 8,823 commands this year.

🏆 Your Top Commands

 1. pnpm           ████████████████████ 1,341 (15.2%)
 2. cd             ████████████░░░░░░░░   782 (8.9%)
 3. git            ████████████░░░░░░░░   774 (8.8%)

🕐 When You Code
12AM        ░▒▒▓▓▓██▓▒░░      11PM
Peak hour: 1 PM • Peak day: Tuesday

😅 The Struggle Was Real
• You mistyped "pnpm" 2 times
• You forgot sudo 1 time and had to retry

🤖 "You ran pnpm 1,341 times. At this point, it's not a package
    manager, it's a lifestyle choice."
```

## License

MIT

## Credits

Built with love and too much terminal time.

Inspired by a Slack conversation about how ridiculous (and fun) year-in-review apps would be for CLI tools.
