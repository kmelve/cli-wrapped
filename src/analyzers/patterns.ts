import type { HistoryEntry, TimePattern, DayPattern, HourlyHeatmap } from "../types/index.ts";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Analyze command usage by hour of day
 */
export function analyzeTimePatterns(entries: HistoryEntry[]): TimePattern[] {
  const hourCounts = new Array(24).fill(0) as number[];

  for (const entry of entries) {
    if (entry.timestamp) {
      const hour = entry.timestamp.getHours();
      const current = hourCounts[hour];
      if (current !== undefined) {
        hourCounts[hour] = current + 1;
      }
    }
  }

  return hourCounts.map((count, hour) => ({ hour, count }));
}

/**
 * Analyze command usage by day of week
 */
export function analyzeDayPatterns(entries: HistoryEntry[]): DayPattern[] {
  const dayCounts = new Array(7).fill(0) as number[];

  for (const entry of entries) {
    if (entry.timestamp) {
      const day = entry.timestamp.getDay();
      const current = dayCounts[day];
      if (current !== undefined) {
        dayCounts[day] = current + 1;
      }
    }
  }

  return dayCounts.map((count, day) => ({
    day,
    dayName: DAY_NAMES[day] ?? "Unknown",
    count,
  }));
}

/**
 * Create hour x day heatmap
 */
export function createHourlyHeatmap(entries: HistoryEntry[]): HourlyHeatmap[] {
  const heatmap: HourlyHeatmap[] = [];
  const counts: Map<string, number> = new Map();

  for (const entry of entries) {
    if (entry.timestamp) {
      const hour = entry.timestamp.getHours();
      const day = entry.timestamp.getDay();
      const key = `${hour}-${day}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${hour}-${day}`;
      heatmap.push({
        hour,
        day,
        count: counts.get(key) ?? 0,
      });
    }
  }

  return heatmap;
}

/**
 * Find peak coding hour
 */
export function findPeakHour(patterns: TimePattern[]): number {
  let maxHour = 0;
  let maxCount = 0;

  for (const { hour, count } of patterns) {
    if (count > maxCount) {
      maxCount = count;
      maxHour = hour;
    }
  }

  return maxHour;
}

/**
 * Find peak coding day
 */
export function findPeakDay(patterns: DayPattern[]): string {
  let maxDay = "Monday";
  let maxCount = 0;

  for (const { dayName, count } of patterns) {
    if (count > maxCount) {
      maxCount = count;
      maxDay = dayName;
    }
  }

  return maxDay;
}

/**
 * Find the most active date
 */
export function findMostActiveDate(entries: HistoryEntry[]): { date: string; count: number } | null {
  const dateCounts = new Map<string, number>();

  for (const entry of entries) {
    if (entry.timestamp) {
      const dateStr = entry.timestamp.toISOString().split("T")[0] ?? "";
      if (dateStr) {
        dateCounts.set(dateStr, (dateCounts.get(dateStr) ?? 0) + 1);
      }
    }
  }

  let maxDate = "";
  let maxCount = 0;

  for (const [date, count] of dateCounts) {
    if (count > maxCount) {
      maxCount = count;
      maxDate = date;
    }
  }

  if (!maxDate) return null;

  return { date: maxDate, count: maxCount };
}

/**
 * Format hour for display (12-hour format)
 */
export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}
