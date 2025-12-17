import { existsSync, readFileSync } from "fs";
import type { ParsedHistory, ShellType, ShellHistoryParser } from "../types/index.ts";
import { ZshParser } from "./zsh.ts";
import { BashParser } from "./bash.ts";
import { FishParser } from "./fish.ts";

const parsers: Record<ShellType, ShellHistoryParser> = {
  zsh: new ZshParser(),
  bash: new BashParser(),
  fish: new FishParser(),
};

/**
 * Detect shell from SHELL environment variable
 */
export function detectShell(): ShellType {
  const shell = process.env.SHELL ?? "";

  if (shell.includes("zsh")) return "zsh";
  if (shell.includes("fish")) return "fish";
  if (shell.includes("bash")) return "bash";

  // Default to zsh on macOS, bash otherwise
  return process.platform === "darwin" ? "zsh" : "bash";
}

/**
 * Find the first available history file
 */
export function findHistoryFile(preferredShell?: ShellType): { shell: ShellType; path: string } | null {
  const shellOrder: ShellType[] = preferredShell
    ? [preferredShell, ...Object.keys(parsers).filter((s) => s !== preferredShell) as ShellType[]]
    : [detectShell(), ...Object.keys(parsers).filter((s) => s !== detectShell()) as ShellType[]];

  for (const shell of shellOrder) {
    const parser = parsers[shell];
    const path = parser.getDefaultPath();
    if (existsSync(path)) {
      return { shell, path };
    }
  }

  return null;
}

/**
 * Parse history from a specific file
 */
export function parseHistoryFile(filePath: string, shell: ShellType): ParsedHistory {
  const parser = parsers[shell];
  const content = readFileSync(filePath, "utf-8");
  const entries = parser.parse(content);

  return {
    entries,
    shell,
    filePath,
  };
}

/**
 * Auto-detect and parse history
 */
export function loadHistory(options?: { shell?: ShellType; filePath?: string }): ParsedHistory {
  if (options?.filePath && options?.shell) {
    return parseHistoryFile(options.filePath, options.shell);
  }

  const found = findHistoryFile(options?.shell);
  if (!found) {
    throw new Error(
      "Could not find shell history file. Tried: " +
        Object.values(parsers)
          .map((p) => p.getDefaultPath())
          .join(", ")
    );
  }

  return parseHistoryFile(found.path, found.shell);
}

/**
 * Filter history entries by year
 */
export function filterByYear(history: ParsedHistory, year: number): ParsedHistory {
  return {
    ...history,
    entries: history.entries.filter((entry) => {
      if (!entry.timestamp) return false;
      return entry.timestamp.getFullYear() === year;
    }),
  };
}
