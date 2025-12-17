import type { HistoryEntry, Struggle } from "../types/index.ts";

// Common typos for popular commands
const TYPO_PATTERNS: Array<{ typo: RegExp; correct: string }> = [
  // git typos
  { typo: /^gut\b/, correct: "git" },
  { typo: /^gti\b/, correct: "git" },
  { typo: /^got\s+(commit|push|pull|status|add|checkout)/, correct: "git" },
  { typo: /^giut\b/, correct: "git" },
  // ls typos
  { typo: /^sl\b/, correct: "ls" },
  // cd typos (cd.. without space)
  { typo: /^cd\.\./, correct: "cd .." },
  // cat typos
  { typo: /^cta\b/, correct: "cat" },
  { typo: /^act\b/, correct: "cat" },
  // npm typos
  { typo: /^nmp\b/, correct: "npm" },
  { typo: /^nppm\b/, correct: "npm" },
  { typo: /^nom\b/, correct: "npm" },
  // yarn typos
  { typo: /^yarrn\b/, correct: "yarn" },
  { typo: /^yran\b/, correct: "yarn" },
  // pnpm typos
  { typo: /^pnmp\b/, correct: "pnpm" },
  { typo: /^pnm\b/, correct: "pnpm" },
  // bun typos
  { typo: /^bnu\b/, correct: "bun" },
  { typo: /^ubn\b/, correct: "bun" },
  // python typos
  { typo: /^pythno\b/, correct: "python" },
  { typo: /^pyhton\b/, correct: "python" },
  { typo: /^pytohn\b/, correct: "python" },
  // docker typos
  { typo: /^dcoker\b/, correct: "docker" },
  { typo: /^dokcer\b/, correct: "docker" },
  { typo: /^docekr\b/, correct: "docker" },
  // kubectl typos
  { typo: /^kuebctl\b/, correct: "kubectl" },
  { typo: /^kubeclt\b/, correct: "kubectl" },
  { typo: /^kubetcl\b/, correct: "kubectl" },
  // clear typos
  { typo: /^claer\b/, correct: "clear" },
  { typo: /^cealr\b/, correct: "clear" },
  { typo: /^clera\b/, correct: "clear" },
  // exit typos
  { typo: /^eixt\b/, correct: "exit" },
  { typo: /^exti\b/, correct: "exit" },
  // grep typos
  { typo: /^grpe\b/, correct: "grep" },
  { typo: /^gerp\b/, correct: "grep" },
  // mkdir typos
  { typo: /^mkdri\b/, correct: "mkdir" },
  { typo: /^mdkir\b/, correct: "mkdir" },
  { typo: /^mkdor\b/, correct: "mkdir" },
  // code/cursor typos
  { typo: /^ocde\b/, correct: "code" },
  { typo: /^cdoe\b/, correct: "code" },
  { typo: /^cusror\b/, correct: "cursor" },
  { typo: /^cursro\b/, correct: "cursor" },
];

/**
 * Detect rage-sudo: when a command is immediately followed by sudo + same command
 */
export function detectRageSudo(entries: HistoryEntry[]): Struggle | null {
  let count = 0;

  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i - 1];
    const curr = entries[i];
    if (!prev || !curr) continue;

    const prevCmd = prev.command.trim();
    const currCmd = curr.command.trim();

    // Check if current is "sudo <previous command>"
    if (currCmd.startsWith("sudo ") && currCmd.slice(5).trim() === prevCmd) {
      count++;
    }
  }

  if (count === 0) return null;

  return {
    type: "rage-sudo",
    description: `You forgot sudo ${count} time${count === 1 ? "" : "s"} and had to retry`,
    count,
  };
}

/**
 * Detect common typos
 */
export function detectTypos(entries: HistoryEntry[]): Struggle[] {
  const typoCounts = new Map<string, number>();

  for (const entry of entries) {
    const cmd = entry.command.trim();

    for (const { typo, correct } of TYPO_PATTERNS) {
      if (typo.test(cmd)) {
        typoCounts.set(correct, (typoCounts.get(correct) ?? 0) + 1);
        break; // Only count once per entry
      }
    }
  }

  return [...typoCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([correct, count]) => ({
      type: "typo" as const,
      description: `You mistyped "${correct}" ${count} time${count === 1 ? "" : "s"}`,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Detect man page lookups (sign of struggle)
 */
export function detectManPageChecks(entries: HistoryEntry[]): Struggle | null {
  const manCommands = new Map<string, number>();

  for (const entry of entries) {
    const match = entry.command.match(/^man\s+(\S+)/);
    if (match?.[1]) {
      manCommands.set(match[1], (manCommands.get(match[1]) ?? 0) + 1);
    }
  }

  // Find commands looked up multiple times
  const repeated = [...manCommands.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  if (repeated.length === 0) return null;

  const total = repeated.reduce((sum, [, count]) => sum + count, 0);

  return {
    type: "man-page-check",
    description: `You checked the manual ${total} time${total === 1 ? "" : "s"} for commands you've looked up before`,
    count: total,
  };
}

/**
 * Detect repeated failures (same command run multiple times in a row)
 */
export function detectRepeatedFailures(entries: HistoryEntry[]): Struggle | null {
  let streakCount = 0;
  let currentStreak = 1;
  let prevCmd = "";

  for (const entry of entries) {
    const cmd = entry.command.trim();

    if (cmd === prevCmd && cmd.length > 0) {
      currentStreak++;
      if (currentStreak === 3) {
        streakCount++;
      }
    } else {
      currentStreak = 1;
    }

    prevCmd = cmd;
  }

  if (streakCount === 0) return null;

  return {
    type: "repeated-failure",
    description: `You ran the same command 3+ times in a row ${streakCount} time${streakCount === 1 ? "" : "s"} (hoping for a different result?)`,
    count: streakCount,
  };
}

/**
 * Collect all struggles
 */
export function analyzeStruggles(entries: HistoryEntry[]): Struggle[] {
  const struggles: Struggle[] = [];

  const rageSudo = detectRageSudo(entries);
  if (rageSudo) struggles.push(rageSudo);

  const typos = detectTypos(entries);
  struggles.push(...typos);

  const manPages = detectManPageChecks(entries);
  if (manPages) struggles.push(manPages);

  const repeated = detectRepeatedFailures(entries);
  if (repeated) struggles.push(repeated);

  return struggles.sort((a, b) => b.count - a.count);
}
