import type { HistoryEntry, CommandCount } from "../types/index.ts";

/**
 * Extract the base command from a full command string
 * e.g., "git commit -m 'hello'" -> "git"
 */
export function extractBaseCommand(command: string): string {
  const trimmed = command.trim();

  // Handle sudo prefix - we want "sudo apt" not just "sudo"
  if (trimmed.startsWith("sudo ")) {
    const afterSudo = trimmed.slice(5).trim();
    const parts = afterSudo.split(/\s+/);
    return `sudo ${parts[0] ?? ""}`.trim();
  }

  // Handle env vars at start (e.g., "NODE_ENV=prod node app.js")
  const parts = trimmed.split(/\s+/);
  for (const part of parts) {
    if (!part.includes("=") && part.length > 0) {
      return part;
    }
  }

  return parts[0] ?? "";
}

/**
 * Count command frequencies
 */
export function countCommands(entries: HistoryEntry[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const base = extractBaseCommand(entry.command);
    if (base) {
      counts.set(base, (counts.get(base) ?? 0) + 1);
    }
  }

  return counts;
}

/**
 * Get top N commands with percentages
 */
export function getTopCommands(entries: HistoryEntry[], limit = 15): CommandCount[] {
  const counts = countCommands(entries);
  const total = entries.length;

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([command, count]) => ({
      command,
      count,
      percentage: (count / total) * 100,
    }));
}

/**
 * Count unique commands
 */
export function countUniqueCommands(entries: HistoryEntry[]): number {
  const unique = new Set<string>();
  for (const entry of entries) {
    unique.add(entry.command.trim());
  }
  return unique.size;
}

/**
 * Find the longest command
 */
export function findLongestCommand(entries: HistoryEntry[]): string {
  let longest = "";
  for (const entry of entries) {
    if (entry.command.length > longest.length) {
      longest = entry.command;
    }
  }
  // Truncate for display
  return longest.length > 100 ? longest.slice(0, 100) + "..." : longest;
}
