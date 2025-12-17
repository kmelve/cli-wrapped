import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "../types/index.ts";

function getClient(apiKey?: string): Anthropic {
  if (apiKey) {
    return new Anthropic({ apiKey });
  }
  return new Anthropic();
}

export interface Roasts {
  headline: string;
  topCommands: string;
  timePatterns: string;
  struggles: string;
  gitActivity: string;
  packageManager: string;
  overall: string;
}

/**
 * SECURITY: Data structure that is safe to send to external APIs.
 * This is an explicit allowlist of what can leave the user's machine.
 * Only aggregate statistics - no actual command content or arguments.
 */
interface SafeExternalData {
  totalCommands: number;
  uniqueCommands: number;
  topCommands: Array<{ command: string; count: number; percentage: number }>;
  peakHour: number;
  peakDay: string;
  mostActiveDate: { date: string; count: number } | null;
  struggles: Array<{ description: string; count: number }>;
  gitStats: {
    totalCommits: number;
    totalPushes: number;
    totalPulls: number;
    mostUsedGitCommand: string;
  } | null;
  packageManagers: Array<{ manager: string; percentage: number }>;
}

/**
 * SECURITY: Sanitize analysis results before sending to external API.
 * Only extracts safe, aggregate statistics - no command arguments or content.
 */
function sanitizeForExternalAPI(analysis: AnalysisResult): SafeExternalData {
  return {
    totalCommands: analysis.totalCommands,
    uniqueCommands: analysis.uniqueCommands,
    // Only base command names (first word), counts, and percentages
    topCommands: analysis.topCommands.slice(0, 5).map((c) => ({
      command: c.command,
      count: c.count,
      percentage: c.percentage,
    })),
    peakHour: analysis.peakHour,
    peakDay: analysis.peakDay,
    mostActiveDate: analysis.mostActiveDate,
    // Only descriptions (which are pre-constructed safe strings), no examples
    struggles: analysis.struggles.slice(0, 3).map((s) => ({
      description: s.description,
      count: s.count,
    })),
    // Only aggregate git stats, no commit messages
    gitStats: analysis.gitStats
      ? {
          totalCommits: analysis.gitStats.totalCommits,
          totalPushes: analysis.gitStats.totalPushes,
          totalPulls: analysis.gitStats.totalPulls,
          mostUsedGitCommand: analysis.gitStats.mostUsedGitCommand,
        }
      : null,
    // Only package manager names and percentages
    packageManagers: analysis.packageManagers.slice(0, 2).map((p) => ({
      manager: p.manager,
      percentage: p.percentage,
    })),
  };
}

function buildPrompt(safeData: SafeExternalData, year: number): string {
  const topCmds = safeData.topCommands
    .map((c) => `${c.command}: ${c.count} times (${c.percentage.toFixed(1)}%)`)
    .join("\n");

  const struggles = safeData.struggles.map((s) => s.description).join("\n");

  const gitInfo = safeData.gitStats
    ? `Commits: ${safeData.gitStats.totalCommits}, Pushes: ${safeData.gitStats.totalPushes}, Pulls: ${safeData.gitStats.totalPulls}, Favorite: ${safeData.gitStats.mostUsedGitCommand}`
    : "No git usage detected";

  const pmInfo = safeData.packageManagers
    .map((p) => `${p.manager}: ${p.percentage.toFixed(0)}%`)
    .join(", ");

  const peakHour = safeData.peakHour;
  const timeDescription =
    peakHour >= 0 && peakHour < 6
      ? "late night/early morning (vampire hours)"
      : peakHour >= 6 && peakHour < 12
        ? "morning"
        : peakHour >= 12 && peakHour < 18
          ? "afternoon"
          : "evening";

  return `You are a witty, sarcastic comedian writing roasts for a developer's "CLI Wrapped ${year}" - like Spotify Wrapped but for command line usage. Be funny, slightly roasty but not mean. Keep each roast to 1-2 short sentences max. Use developer humor.

Here are their stats:

TOTAL COMMANDS: ${safeData.totalCommands.toLocaleString()}
UNIQUE COMMANDS: ${safeData.uniqueCommands.toLocaleString()}

TOP COMMANDS:
${topCmds}

PEAK CODING TIME: ${peakHour}:00 (${timeDescription})
PEAK DAY: ${safeData.peakDay}
${safeData.mostActiveDate ? `MOST ACTIVE DAY: ${safeData.mostActiveDate.date} with ${safeData.mostActiveDate.count} commands` : ""}

STRUGGLES:
${struggles || "None detected (suspiciously clean...)"}

GIT ACTIVITY:
${gitInfo}

PACKAGE MANAGERS:
${pmInfo || "None detected"}

Generate exactly 7 roasts in this JSON format (no markdown, just raw JSON):
{
  "headline": "A punny/funny headline for their year (e.g., 'The Terminal Velocity Award')",
  "topCommands": "Roast about their most used command",
  "timePatterns": "Roast about when they code (reference the specific hour/time of day)",
  "struggles": "Roast about their typos/struggles (or lack thereof)",
  "gitActivity": "Roast about their git habits",
  "packageManager": "Roast about their package manager loyalty/choices",
  "overall": "A final summary roast of their year"
}`;
}

export async function generateRoasts(analysis: AnalysisResult, year: number, apiKey?: string): Promise<Roasts> {
  // SECURITY: Sanitize data before sending to external API
  const safeData = sanitizeForExternalAPI(analysis);

  const client = getClient(apiKey);
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: buildPrompt(safeData, year),
      },
    ],
  });

  // Extract text content
  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Parse JSON response
  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse roasts from response");
  }

  return JSON.parse(jsonMatch[0]) as Roasts;
}

// Fallback roasts if API fails
export function getFallbackRoasts(analysis: AnalysisResult): Roasts {
  const topCmd = analysis.topCommands[0];
  const pmLoyalty = analysis.packageManagers[0];

  return {
    headline: "The Command Line Warrior",
    topCommands: topCmd
      ? `You ran '${topCmd.command}' ${topCmd.count.toLocaleString()} times. That's commitment... or muscle memory.`
      : "Your command diversity is... interesting.",
    timePatterns:
      analysis.peakHour >= 22 || analysis.peakHour < 4
        ? "Coding at this hour? Your keyboard should file for overtime."
        : `Peak productivity at ${analysis.peakHour}:00. Your coffee knows.`,
    struggles:
      analysis.struggles.length > 0
        ? "We all make typos. Some of us just make more than others."
        : "No typos detected? Either you're perfect or your history is hiding something.",
    gitActivity: analysis.gitStats
      ? `${analysis.gitStats.totalCommits} commits. Your git log is basically a diary at this point.`
      : "No git detected. Living dangerously without version control?",
    packageManager: pmLoyalty
      ? `${pmLoyalty.percentage.toFixed(0)}% loyal to ${pmLoyalty.manager}. That's called brand loyalty.`
      : "No package manager preference? A true CLI minimalist.",
    overall: `${analysis.totalCommands.toLocaleString()} commands. That's a lot of Enter key abuse.`,
  };
}
