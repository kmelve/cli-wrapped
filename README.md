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
| `s`                     | Save share image for current screen |
| `q`                     | Quit                                |

### Share Your Stats

Press `s` on any screen to generate a shareable PNG image for that view. Each screen has its own card design - share your top commands, time patterns, git stats, or the full summary. Images are saved to your Downloads folder (and copied to clipboard on macOS).

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

| Shell  | Timestamps | History Location |
| ------ | ---------- | ---------------- |
| zsh    | ✅ Yes     | `~/.zsh_history` or `~/.zsh_sessions/` |
| bash   | ⚠️ If configured | `~/.bash_history` |
| fish   | ✅ Yes     | `~/.local/share/fish/fish_history` |

CLI Wrapped auto-detects your shell and finds the appropriate history file.

## FAQ

### Why does it only show a few commands / today's history?

This usually happens on macOS when using Terminal.app, which stores history in session files instead of a single history file.

**CLI Wrapped automatically checks these locations:**
1. `$HISTFILE` environment variable (if set)
2. `~/.zsh_history` (standard location)
3. `~/.zsh_sessions/*.history` (macOS Terminal.app session files)

**To check your setup:**
```bash
# See where your history is stored
echo $HISTFILE

# Check if you have session-based history
ls -la ~/.zsh_sessions/

# Check your history settings
echo "HISTSIZE=$HISTSIZE SAVEHIST=$SAVEHIST"
```

**To enable unified history** (recommended), add to `~/.zshrc`:
```bash
HISTFILE=~/.zsh_history
HISTSIZE=50000
SAVEHIST=50000
setopt SHARE_HISTORY        # Share history between sessions
setopt INC_APPEND_HISTORY   # Write immediately, not on exit
setopt HIST_IGNORE_DUPS     # Skip duplicates
```

Then restart your terminal. Future commands will be saved to `~/.zsh_history`.

### Why are there no timestamps / everything shows as "this year"?

Your shell might not be saving timestamps. For zsh, ensure extended history is enabled:

```bash
setopt EXTENDED_HISTORY
```

For bash, set the timestamp format:
```bash
export HISTTIMEFORMAT="%F %T "
```

### Can I analyze a different year?

Yes! Use the `--year` flag:
```bash
cli-wrapped --year=2024
cli-wrapped --year=2023
```

Note: This only works if your history has timestamps.

## Tech Stack

- **TypeScript** - Type-safe development
- **React + Ink** - Terminal UI framework
- **Bun** - Fast JavaScript runtime
- **Anthropic SDK** - Claude API for roasts

## License

MIT

## Credits

Built with love and too much terminal time.

Inspired by a Slack conversation about how ridiculous (and fun) year-in-review apps would be for CLI tools.
