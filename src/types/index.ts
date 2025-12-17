export interface HistoryEntry {
  command: string;
  timestamp: Date | null;
  rawLine: string;
}

export interface ParsedHistory {
  entries: HistoryEntry[];
  shell: ShellType;
  filePath: string;
}

export type ShellType = "zsh" | "bash" | "fish";

export interface ShellHistoryParser {
  parse(content: string): HistoryEntry[];
  getDefaultPath(): string;
}

// Analysis types
export interface CommandCount {
  command: string;
  count: number;
  percentage: number;
}

export interface TimePattern {
  hour: number;
  count: number;
}

export interface DayPattern {
  day: number; // 0 = Sunday, 6 = Saturday
  dayName: string;
  count: number;
}

export interface HourlyHeatmap {
  hour: number;
  day: number;
  count: number;
}

export interface Struggle {
  type: "rage-sudo" | "typo" | "repeated-failure" | "man-page-check";
  description: string;
  count: number;
  // Note: examples intentionally omitted to prevent sensitive command data leakage
}

export interface GitStats {
  totalCommits: number;
  totalPushes: number;
  totalPulls: number;
  branches: number;
  merges: number;
  rebases: number;
  stashes: number;
  mostUsedGitCommand: string;
}

export interface PackageManagerStats {
  manager: string;
  count: number;
  percentage: number;
}

export interface AnalysisResult {
  totalCommands: number;
  uniqueCommands: number;
  topCommands: CommandCount[];
  timePatterns: TimePattern[];
  dayPatterns: DayPattern[];
  hourlyHeatmap: HourlyHeatmap[];
  peakHour: number;
  peakDay: string;
  struggles: Struggle[];
  gitStats: GitStats | null;
  packageManagers: PackageManagerStats[];
  longestCommandLength: number;
  mostActiveDate: { date: string; count: number } | null;
}
