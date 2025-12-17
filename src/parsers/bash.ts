import { homedir } from "os";
import type { HistoryEntry, ShellHistoryParser } from "../types/index.ts";

/**
 * Bash History Format:
 * - Simple: one command per line
 * - With HISTTIMEFORMAT: #timestamp\ncommand
 *
 * We support both formats
 */
export class BashParser implements ShellHistoryParser {
  getDefaultPath(): string {
    return `${homedir()}/.bash_history`;
  }

  parse(content: string): HistoryEntry[] {
    const entries: HistoryEntry[] = [];
    const lines = content.split("\n");

    let pendingTimestamp: Date | null = null;

    for (const line of lines) {
      if (line.length === 0) continue;

      // Check for timestamp line (used when HISTTIMEFORMAT is set)
      const timestampMatch = line.match(/^#(\d+)$/);

      if (timestampMatch && timestampMatch[1]) {
        pendingTimestamp = new Date(parseInt(timestampMatch[1], 10) * 1000);
        continue;
      }

      // Regular command line
      entries.push({
        command: line,
        timestamp: pendingTimestamp,
        rawLine: pendingTimestamp ? `#${Math.floor(pendingTimestamp.getTime() / 1000)}\n${line}` : line,
      });

      pendingTimestamp = null;
    }

    return entries;
  }
}
