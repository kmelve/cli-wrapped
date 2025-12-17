import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { generateShareImage } from "../share/generateImage.tsx";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { AnalysisResult } from "../types/index.ts";

// Create mock analysis data
function createMockAnalysis(): AnalysisResult {
  return {
    totalCommands: 8837,
    uniqueCommands: 2881,
    topCommands: [
      { command: "git", count: 1500, percentage: 17 },
      { command: "cd", count: 1200, percentage: 13.5 },
      { command: "ls", count: 800, percentage: 9 },
    ],
    timePatterns: Array.from({ length: 24 }, (_, hour) => ({ hour, count: Math.floor(Math.random() * 100) })),
    dayPatterns: [
      { day: 0, dayName: "Sunday", count: 100 },
      { day: 1, dayName: "Monday", count: 500 },
      { day: 2, dayName: "Tuesday", count: 600 },
      { day: 3, dayName: "Wednesday", count: 550 },
      { day: 4, dayName: "Thursday", count: 480 },
      { day: 5, dayName: "Friday", count: 400 },
      { day: 6, dayName: "Saturday", count: 150 },
    ],
    hourlyHeatmap: [],
    peakHour: 13,
    peakDay: "Tuesday",
    struggles: [],
    gitStats: {
      totalCommits: 349,
      totalPushes: 230,
      totalPulls: 216,
      branches: 50,
      merges: 30,
      rebases: 10,
      stashes: 5,
      mostUsedGitCommand: "status",
    },
    packageManagers: [
      { manager: "pnpm", count: 500, percentage: 80 },
      { manager: "npm", count: 125, percentage: 20 },
    ],
    longestCommandLength: 150,
    mostActiveDate: { date: "2025-03-15", count: 250 },
  };
}

describe("generateShareImage", () => {
  const testFilePath = join(homedir(), "Downloads", "cli-wrapped-2025-summary.png");

  afterAll(() => {
    // Clean up test files (different screen types generate different files)
    const filesToClean = [
      testFilePath,
      join(homedir(), "Downloads", "cli-wrapped-2025-commands.png"),
    ];
    for (const file of filesToClean) {
      if (existsSync(file)) {
        try {
          unlinkSync(file);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });

  test("generates a PNG image file", async () => {
    const analysis = createMockAnalysis();

    const result = await generateShareImage(analysis, 2025, "zsh", "Test Award");

    expect(result.filepath).toBe(testFilePath);
    expect(existsSync(result.filepath)).toBe(true);
  });

  test("returns alt text", async () => {
    const analysis = createMockAnalysis();

    const result = await generateShareImage(analysis, 2025, "zsh", "Test Award");

    expect(result.altText).toContain("CLI Wrapped 2025");
    expect(result.altText).toContain("8,837 total commands");
    expect(result.altText).toContain("git");
    expect(result.altText).toContain("13:00");
    expect(result.altText).toContain("Tuesday");
    expect(result.altText).toContain("zsh");
  });

  test("generates image without headline", async () => {
    const analysis = createMockAnalysis();

    const result = await generateShareImage(analysis, 2025, "bash");

    expect(result.filepath).toBeDefined();
    expect(existsSync(result.filepath)).toBe(true);
    expect(result.altText).not.toContain("Test Award");
  });

  test("generates image without git stats", async () => {
    const analysis = createMockAnalysis();
    analysis.gitStats = null;

    const result = await generateShareImage(analysis, 2025, "fish");

    expect(result.filepath).toBeDefined();
    expect(existsSync(result.filepath)).toBe(true);
    expect(result.altText).not.toContain("commits");
  });

  test("generates screen-specific images", async () => {
    const analysis = createMockAnalysis();

    const result = await generateShareImage(analysis, 2025, "zsh", undefined, "commands");

    expect(result.filepath).toContain("cli-wrapped-2025-commands.png");
    expect(existsSync(result.filepath)).toBe(true);
    expect(result.altText).toContain("Top Commands");
  });
});
