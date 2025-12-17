import { homedir } from "os";
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
    return `${homedir()}/.zsh_history`;
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
