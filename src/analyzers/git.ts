import type { HistoryEntry, GitStats } from "../types/index.ts";

// Git command patterns
const GIT_PATTERNS = {
  commit: /^(git\s+commit|gc\s|gcmsg?\s)/,
  push: /^(git\s+push|gp\s|gp$|ggpush)/,
  pull: /^(git\s+pull|gl\s|gl$|ggpull|gup)/,
  branch: /^(git\s+(branch|switch|checkout\s+-b)|gco\s+-b|gsw\s)/,
  merge: /^(git\s+merge|gm\s)/,
  rebase: /^(git\s+rebase|grb)/,
  stash: /^(git\s+stash|gsta)/,
};

// Common git aliases to their full forms
const GIT_ALIASES: Record<string, string> = {
  "g": "git",
  "ga": "git add",
  "gaa": "git add --all",
  "gc": "git commit",
  "gcmsg": "git commit -m",
  "gco": "git checkout",
  "gsw": "git switch",
  "gp": "git push",
  "gl": "git pull",
  "gst": "git status",
  "gd": "git diff",
  "glog": "git log",
  "gb": "git branch",
  "gm": "git merge",
  "grb": "git rebase",
  "gsta": "git stash",
  "gstp": "git stash pop",
};

/**
 * Check if a command is git-related
 */
function isGitCommand(cmd: string): boolean {
  const trimmed = cmd.trim();
  if (trimmed.startsWith("git ") || trimmed === "git") return true;

  // Check for common aliases
  const firstWord = trimmed.split(/\s+/)[0] ?? "";
  return firstWord in GIT_ALIASES;
}


/**
 * Analyze git usage
 */
export function analyzeGitStats(entries: HistoryEntry[]): GitStats | null {
  const gitEntries = entries.filter((e) => isGitCommand(e.command));

  if (gitEntries.length === 0) return null;

  // Count git subcommands
  const subcommandCounts = new Map<string, number>();

  let commits = 0;
  let pushes = 0;
  let pulls = 0;
  let branches = 0;
  let merges = 0;
  let rebases = 0;
  let stashes = 0;

  for (const entry of gitEntries) {
    const cmd = entry.command.trim();

    // Count specific operations
    if (GIT_PATTERNS.commit.test(cmd)) commits++;
    if (GIT_PATTERNS.push.test(cmd)) pushes++;
    if (GIT_PATTERNS.pull.test(cmd)) pulls++;
    if (GIT_PATTERNS.branch.test(cmd)) branches++;
    if (GIT_PATTERNS.merge.test(cmd)) merges++;
    if (GIT_PATTERNS.rebase.test(cmd)) rebases++;
    if (GIT_PATTERNS.stash.test(cmd)) stashes++;

    // Track all git subcommands
    const firstWord = cmd.split(/\s+/)[0] ?? "";

    if (firstWord === "git") {
      const subcommand = cmd.split(/\s+/)[1] ?? "unknown";
      subcommandCounts.set(subcommand, (subcommandCounts.get(subcommand) ?? 0) + 1);
    } else if (firstWord in GIT_ALIASES) {
      // It's an alias
      subcommandCounts.set(firstWord, (subcommandCounts.get(firstWord) ?? 0) + 1);
    }
  }

  // Find most used git command
  let mostUsed = "status";
  let mostUsedCount = 0;
  for (const [cmd, count] of subcommandCounts) {
    if (count > mostUsedCount) {
      mostUsed = cmd;
      mostUsedCount = count;
    }
  }

  return {
    totalCommits: commits,
    totalPushes: pushes,
    totalPulls: pulls,
    branches,
    merges,
    rebases,
    stashes,
    mostUsedGitCommand: mostUsed,
  };
}
