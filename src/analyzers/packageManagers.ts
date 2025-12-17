import type { HistoryEntry, PackageManagerStats } from "../types/index.ts";

interface PackageManagerDef {
  name: string;
  patterns: RegExp[];
}

const PACKAGE_MANAGERS: PackageManagerDef[] = [
  {
    name: "pnpm",
    patterns: [/^pnpm\b/, /^pnpx\b/],
  },
  {
    name: "npm",
    patterns: [/^npm\b/, /^npx\b/],
  },
  {
    name: "yarn",
    patterns: [/^yarn\b/],
  },
  {
    name: "bun",
    patterns: [/^bun\b/, /^bunx\b/],
  },
  {
    name: "deno",
    patterns: [/^deno\b/],
  },
  {
    name: "pip",
    patterns: [/^pip3?\b/, /^pipx\b/],
  },
  {
    name: "cargo",
    patterns: [/^cargo\b/],
  },
  {
    name: "go",
    patterns: [/^go\s+(get|install|mod)\b/],
  },
  {
    name: "brew",
    patterns: [/^brew\b/],
  },
  {
    name: "apt",
    patterns: [/^(sudo\s+)?apt(-get)?\b/],
  },
  {
    name: "composer",
    patterns: [/^composer\b/],
  },
  {
    name: "gem",
    patterns: [/^gem\b/, /^bundle\b/],
  },
];

/**
 * Analyze package manager usage
 */
export function analyzePackageManagers(entries: HistoryEntry[]): PackageManagerStats[] {
  const counts = new Map<string, number>();
  let total = 0;

  for (const entry of entries) {
    const cmd = entry.command.trim();

    for (const pm of PACKAGE_MANAGERS) {
      for (const pattern of pm.patterns) {
        if (pattern.test(cmd)) {
          counts.set(pm.name, (counts.get(pm.name) ?? 0) + 1);
          total++;
          break;
        }
      }
    }
  }

  if (total === 0) return [];

  return [...counts.entries()]
    .map(([manager, count]) => ({
      manager,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get the primary package manager (most used)
 */
export function getPrimaryPackageManager(stats: PackageManagerStats[]): string | null {
  if (stats.length === 0) return null;
  return stats[0]?.manager ?? null;
}

/**
 * Detect package manager loyalty (using one manager >80% of the time)
 */
export function detectPackageManagerLoyalty(stats: PackageManagerStats[]): {
  isLoyal: boolean;
  manager: string | null;
  percentage: number;
} {
  if (stats.length === 0) {
    return { isLoyal: false, manager: null, percentage: 0 };
  }

  const primary = stats[0];
  if (!primary) {
    return { isLoyal: false, manager: null, percentage: 0 };
  }

  return {
    isLoyal: primary.percentage >= 80,
    manager: primary.manager,
    percentage: primary.percentage,
  };
}
