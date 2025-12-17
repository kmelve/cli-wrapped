import type { ParsedHistory, AnalysisResult, DateRange } from "../types/index.ts";
import { getTopCommands, countUniqueCommands, findLongestCommandLength } from "./commands.ts";
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
 * Find the date range of entries with timestamps
 */
function findDateRange(entries: ParsedHistory["entries"]): DateRange | null {
  const timestamps = entries
    .map(e => e.timestamp)
    .filter((t): t is Date => t !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (timestamps.length === 0) return null;

  return {
    from: timestamps[0]!,
    to: timestamps[timestamps.length - 1]!,
  };
}

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
    longestCommandLength: findLongestCommandLength(entries),
    mostActiveDate: findMostActiveDate(entries),
    dateRange: findDateRange(entries),
  };
}

/**
 * Format a date range for display
 */
export function formatDateRange(dateRange: DateRange | null): string {
  if (!dateRange) return "Unknown date range";

  const formatDate = (d: Date) => d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const from = formatDate(dateRange.from);
  const to = formatDate(dateRange.to);

  // If same day, just show one date
  if (from === to) return from;

  return `${from} – ${to}`;
}

// Re-export utilities
export { formatHour } from "./patterns.ts";
export { detectPackageManagerLoyalty } from "./packageManagers.ts";
