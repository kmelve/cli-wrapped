import { describe, expect, test } from "bun:test";
import { analyzeHistory } from "../analyzers/index.ts";
import { getTopCommands, countUniqueCommands } from "../analyzers/commands.ts";
import {
  analyzeTimePatterns,
  analyzeDayPatterns,
  findPeakHour,
  findPeakDay,
  findMostActiveDate,
} from "../analyzers/patterns.ts";
import { analyzeStruggles } from "../analyzers/struggles.ts";
import { analyzeGitStats } from "../analyzers/git.ts";
import { analyzePackageManagers } from "../analyzers/packageManagers.ts";
import type { ParsedHistory, HistoryEntry } from "../types/index.ts";

// Helper to create test entries
function createEntries(commands: string[], timestamps?: Date[]): HistoryEntry[] {
  const now = new Date();
  return commands.map((command, i) => ({
    command,
    timestamp: timestamps?.[i] ?? new Date(now.getTime() - i * 60000),
    rawLine: command,
  }));
}

// Helper to create test history
function createHistory(commands: string[], timestamps?: Date[]): ParsedHistory {
  return {
    entries: createEntries(commands, timestamps),
    shell: "zsh",
    filePath: "/test/.zsh_history",
  };
}

describe("getTopCommands", () => {
  test("counts command frequency correctly", () => {
    const entries = createEntries(["git", "git", "git", "ls", "ls", "cd"]);
    const result = getTopCommands(entries);

    expect(result[0]?.command).toBe("git");
    expect(result[0]?.count).toBe(3);
    expect(result[1]?.command).toBe("ls");
    expect(result[1]?.count).toBe(2);
  });

  test("extracts base command from complex commands", () => {
    const entries = createEntries([
      "git commit -m 'test'",
      "git push origin main",
      "npm install lodash",
    ]);
    const result = getTopCommands(entries);

    expect(result[0]?.command).toBe("git");
    expect(result[0]?.count).toBe(2);
  });

  test("calculates percentages correctly", () => {
    const entries = createEntries(["git", "git", "ls", "ls"]);
    const result = getTopCommands(entries);

    expect(result[0]?.percentage).toBe(50);
    expect(result[1]?.percentage).toBe(50);
  });
});

describe("countUniqueCommands", () => {
  test("counts unique commands", () => {
    const entries = createEntries(["git status", "git status", "ls", "cd"]);
    const result = countUniqueCommands(entries);

    expect(result).toBe(3);
  });
});

describe("analyzeTimePatterns", () => {
  test("identifies peak hour correctly", () => {
    const hour14 = new Date();
    hour14.setHours(14, 0, 0, 0);

    const timestamps = [
      hour14,
      hour14,
      hour14,
      new Date(hour14.getTime() - 3600000), // 13:00
    ];

    const entries = createEntries(["git", "ls", "cd", "npm"], timestamps);
    const timePatterns = analyzeTimePatterns(entries);
    const peakHour = findPeakHour(timePatterns);

    expect(peakHour).toBe(14);
  });

  test("identifies peak day correctly", () => {
    const monday = new Date("2025-01-06T12:00:00"); // Monday
    const tuesday = new Date("2025-01-07T12:00:00"); // Tuesday

    const timestamps = [monday, monday, monday, tuesday];
    const entries = createEntries(["git", "ls", "cd", "npm"], timestamps);
    const dayPatterns = analyzeDayPatterns(entries);
    const peakDay = findPeakDay(dayPatterns);

    expect(peakDay).toBe("Monday");
  });

  test("tracks most active date", () => {
    const date1 = new Date("2025-01-06T12:00:00");
    const date2 = new Date("2025-01-07T12:00:00");

    const timestamps = [date1, date1, date1, date1, date2];
    const entries = createEntries(["a", "b", "c", "d", "e"], timestamps);
    const result = findMostActiveDate(entries);

    expect(result?.date).toBe("2025-01-06");
    expect(result?.count).toBe(4);
  });
});

describe("analyzeStruggles", () => {
  test("detects typos", () => {
    const entries = createEntries(["gti", "git", "gut", "git"]);
    const result = analyzeStruggles(entries);

    const typoStruggle = result.find((s) => s.type === "typo");
    expect(typoStruggle).toBeDefined();
  });

  test("detects rage-sudo pattern", () => {
    const entries = createEntries(["apt install foo", "sudo apt install foo"]);
    const result = analyzeStruggles(entries);

    const sudoStruggle = result.find((s) => s.type === "rage-sudo");
    expect(sudoStruggle).toBeDefined();
  });

  test("detects repeated failures", () => {
    const entries = createEntries(["make", "make", "make", "make"]);
    const result = analyzeStruggles(entries);

    const repeatStruggle = result.find((s) => s.type === "repeated-failure");
    expect(repeatStruggle).toBeDefined();
  });
});

describe("analyzeGitStats", () => {
  test("counts git operations", () => {
    const entries = createEntries([
      "git commit -m 'test'",
      "git commit -m 'another'",
      "git push",
      "git pull",
      "git pull",
    ]);
    const result = analyzeGitStats(entries);

    expect(result?.totalCommits).toBe(2);
    expect(result?.totalPushes).toBe(1);
    expect(result?.totalPulls).toBe(2);
  });

  test("returns null when no git commands", () => {
    const entries = createEntries(["ls", "cd", "npm install"]);
    const result = analyzeGitStats(entries);

    expect(result).toBeNull();
  });

  test("identifies most used git command", () => {
    const entries = createEntries([
      "git status",
      "git status",
      "git status",
      "git commit -m 'test'",
    ]);
    const result = analyzeGitStats(entries);

    expect(result?.mostUsedGitCommand).toBe("status");
  });
});

describe("analyzePackageManagers", () => {
  test("counts package manager usage", () => {
    const entries = createEntries([
      "npm install",
      "npm install lodash",
      "pnpm add react",
    ]);
    const result = analyzePackageManagers(entries);

    expect(result[0]?.manager).toBe("npm");
    expect(result[0]?.count).toBe(2);
    expect(result[1]?.manager).toBe("pnpm");
    expect(result[1]?.count).toBe(1);
  });

  test("calculates percentages correctly", () => {
    const entries = createEntries([
      "npm install",
      "npm install",
      "yarn add",
      "yarn add",
    ]);
    const result = analyzePackageManagers(entries);

    expect(result[0]?.percentage).toBe(50);
    expect(result[1]?.percentage).toBe(50);
  });
});

describe("analyzeHistory (integration)", () => {
  test("combines all analyzers", () => {
    const history = createHistory([
      "git commit -m 'test'",
      "git push",
      "npm install",
      "ls",
      "cd projects",
    ]);

    const result = analyzeHistory(history);

    expect(result.totalCommands).toBe(5);
    expect(result.uniqueCommands).toBe(5);
    expect(result.topCommands.length).toBeGreaterThan(0);
    expect(result.gitStats).toBeDefined();
    expect(result.packageManagers.length).toBeGreaterThan(0);
  });
});
