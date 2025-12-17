import { homedir } from "os";
import type { HistoryEntry, ShellHistoryParser } from "../types/index.ts";

/**
 * Fish History Format (YAML-like):
 * - cmd: command here
 *   when: 1735247578
 *   paths:
 *     - /some/path
 *
 * The 'paths' field is optional and tracks working directories
 */
export class FishParser implements ShellHistoryParser {
  getDefaultPath(): string {
    return `${homedir()}/.local/share/fish/fish_history`;
  }

  parse(content: string): HistoryEntry[] {
    const entries: HistoryEntry[] = [];
    const lines = content.split("\n");

    let currentCommand: string | null = null;
    let currentTimestamp: Date | null = null;
    let rawLines: string[] = [];

    const saveCurrentEntry = () => {
      if (currentCommand !== null) {
        entries.push({
          command: currentCommand,
          timestamp: currentTimestamp,
          rawLine: rawLines.join("\n"),
        });
      }
      currentCommand = null;
      currentTimestamp = null;
      rawLines = [];
    };

    for (const line of lines) {
      // Start of a new command
      const cmdMatch = line.match(/^- cmd: (.*)$/);
      if (cmdMatch) {
        saveCurrentEntry();
        currentCommand = cmdMatch[1] ?? "";
        rawLines.push(line);
        continue;
      }

      // Timestamp for current command
      const whenMatch = line.match(/^\s+when: (\d+)$/);
      if (whenMatch && whenMatch[1]) {
        currentTimestamp = new Date(parseInt(whenMatch[1], 10) * 1000);
        rawLines.push(line);
        continue;
      }

      // Handle escaped newlines in commands (fish uses \\n)
      if (currentCommand !== null && line.startsWith("  ")) {
        rawLines.push(line);
        // Skip 'paths:' and path entries
        if (!line.includes("paths:") && !line.match(/^\s+-\s/)) {
          // This might be a continuation, but fish typically doesn't have these
        }
      }
    }

    // Save last entry
    saveCurrentEntry();

    return entries;
  }
}
