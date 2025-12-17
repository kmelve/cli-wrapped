import type { ParsedHistory, AnalysisResult } from "../types/index.ts";
import { getTopCommands, countUniqueCommands, findLongestCommand } from "./commands.ts";
import {
  analyzeTimePatterns,
  analyzeDayPatterns,
  createHourlyHeatmap,
  findPeakHour,
  findPeakDay,
  findMostActiveDate,
} from "./patterns.ts";
import { analyzeStruggles } from "./struggles.ts";
import { analyzeGitStats } from "./git.ts";
import { analyzePackageManagers } from "./packageManagers.ts";

/**
 * Run full analysis on parsed history
 */
export function analyzeHistory(history: ParsedHistory): AnalysisResult {
  const { entries } = history;

  const timePatterns = analyzeTimePatterns(entries);
  const dayPatterns = analyzeDayPatterns(entries);

  return {
    totalCommands: entries.length,
    uniqueCommands: countUniqueCommands(entries),
    topCommands: getTopCommands(entries, 15),
    timePatterns,
    dayPatterns,
    hourlyHeatmap: createHourlyHeatmap(entries),
    peakHour: findPeakHour(timePatterns),
    peakDay: findPeakDay(dayPatterns),
    struggles: analyzeStruggles(entries),
    gitStats: analyzeGitStats(entries),
    packageManagers: analyzePackageManagers(entries),
    longestCommand: findLongestCommand(entries),
    mostActiveDate: findMostActiveDate(entries),
  };
}

// Re-export utilities
export { formatHour } from "./patterns.ts";
export { detectPackageManagerLoyalty } from "./packageManagers.ts";
