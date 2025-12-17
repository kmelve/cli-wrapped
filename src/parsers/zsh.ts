import { homedir } from "os";
import { existsSync, readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";
import type { HistoryEntry, ShellHistoryParser } from "../types/index.ts";

/**
 * ZSH Extended History Format:
 * : <timestamp>:<duration>;<command>
 *
 * Example: : 1735247578:0;git commit -m "hello"
 *
 * Multi-line commands have continuation lines without the : prefix
 */
export class ZshParser implements ShellHistoryParser {
  getDefaultPath(): string {
    // Check HISTFILE env var first
    if (process.env.HISTFILE && existsSync(process.env.HISTFILE)) {
      return process.env.HISTFILE;
    }

    // Standard location
    const standardPath = `${homedir()}/.zsh_history`;
    if (existsSync(standardPath)) {
      const stats = statSync(standardPath);
      // If the file has reasonable content, use it
      if (stats.size > 100) {
        return standardPath;
      }
    }

    // macOS Terminal.app uses session-based history since Big Sur
    // Check ~/.zsh_sessions/ for history files
    const sessionsDir = `${homedir()}/.zsh_sessions`;
    if (existsSync(sessionsDir)) {
      try {
        const files = readdirSync(sessionsDir)
          .filter(f => f.endsWith(".history") || f.match(/^[A-F0-9-]+\.history$/i))
          .map(f => join(sessionsDir, f))
          .filter(f => existsSync(f));

        if (files.length > 0) {
          // Return a marker that we'll handle specially
          return `${sessionsDir}/*.history`;
        }
      } catch {
        // Ignore errors reading sessions dir
      }
    }

    return standardPath;
  }

  /**
   * Get all session history files for macOS Terminal.app
   */
  getSessionHistoryFiles(): string[] {
    const sessionsDir = `${homedir()}/.zsh_sessions`;
    if (!existsSync(sessionsDir)) return [];

    try {
      return readdirSync(sessionsDir)
        .filter(f => f.endsWith(".history"))
        .map(f => join(sessionsDir, f))
        .filter(f => existsSync(f));
    } catch {
      return [];
    }
  }

  parse(content: string): HistoryEntry[] {
    const entries: HistoryEntry[] = [];
    const lines = content.split("\n");

    let currentEntry: HistoryEntry | null = null;

    for (const line of lines) {
      // ZSH extended history format: : timestamp:duration;command
      const match = line.match(/^: (\d+):\d+;(.*)$/);

      if (match) {
        // Save previous entry if exists
        if (currentEntry) {
          entries.push(currentEntry);
        }

        const [, timestampStr, command] = match;
        const timestamp = timestampStr ? new Date(parseInt(timestampStr, 10) * 1000) : null;

        currentEntry = {
          command: command ?? "",
          timestamp,
          rawLine: line,
        };
      } else if (currentEntry && line.length > 0) {
        // Continuation of multi-line command
        currentEntry.command += "\n" + line;
        currentEntry.rawLine += "\n" + line;
      } else if (!currentEntry && line.length > 0) {
        // Simple history format (no timestamps) - fallback
        entries.push({
          command: line,
          timestamp: null,
          rawLine: line,
        });
      }
    }

    // Don't forget the last entry
    if (currentEntry) {
      entries.push(currentEntry);
    }

    return entries;
  }
}
