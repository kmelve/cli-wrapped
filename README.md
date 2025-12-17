# CLI Wrapped

Spotify Wrapped, but for your command line. Analyzes your shell history and generates fun statistics with optional AI-powered roasts.

![CLI Wrapped 2025 stats. The 'cd' Wanderer Award - For Someone Who Clearly Doesn't Know Where They Are. 8,847 total commands, 2,884 unique. Top command: pnpm (1,341 times). Peak activity: 13:00 on Tuesdays. Favorite package manager: pnpm. Git: 349 commits, 230 pushes, 216 pulls. Shell: zsh.](./example.png)

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
bash <(curl -fsSL https://raw.githubusercontent.com/kmelve/cli-wrapped/main/install.sh)
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

| Flag          | Description                                        |
| ------------- | -------------------------------------------------- |
| `--year=YYYY` | Analyze a specific year (default: current year)    |
| `--no-ai`     | Skip AI-powered roasts (faster, no API key needed) |
| `--static`    | Force static mode (no interactive navigation)      |
| `--help, -h`  | Show help message                                  |

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

| Key                     | Action                              |
| ----------------------- | ----------------------------------- |
| `SPACE` / `→` / `ENTER` | Next screen                         |
| `←` / `BACKSPACE`       | Previous screen                     |
| `s`                     | Save share image (on summary screen)|
| `q`                     | Quit                                |

### Share Your Stats

On the final summary screen, press `s` to generate a shareable PNG image. The image is saved to your Downloads folder and is perfect for sharing on social media.

## AI-Powered Roasts

When you run CLI Wrapped, you'll be asked if you want AI-powered roasts.

### Privacy & Security

**We only send aggregate statistics to Claude, never your actual commands.**

✅ What we send:

- Base command names and counts (e.g., "git: 774 times")
- Time patterns (e.g., "peak hour: 14:00")
- Aggregate numbers (total commands, unique commands)
- Package manager usage percentages
- Git operation counts (commits, pushes, pulls)

❌ What we **never** send:

- Command arguments or flags
- File paths, project names, or directory names
- Commit messages
- Environment variables or secrets
- Any history content beyond base command names

🔐 **Security measures:**

- API keys are kept in memory only - never written to disk
- All external data is explicitly sanitized through an allowlist
- Analysis happens locally; only summaries leave your machine

### Setup

**Option 1: Paste when prompted**

When you run CLI Wrapped and choose AI roasts, you'll be prompted to enter your API key. You can paste it directly into the terminal - the key is kept in memory only and never written to disk.

**Option 2: Environment variable**

```bash
# Get a key at https://console.anthropic.com/
export ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Add to ~/.zshrc for permanent use
echo 'export ANTHROPIC_API_KEY=sk-ant-api03-xxxxx' >> ~/.zshrc
```

**Option 3: Skip the prompt**

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
