import React from "react";
import { Box, Text } from "ink";
import { formatHour, detectPackageManagerLoyalty } from "../analyzers/index.ts";
import type { AnalysisResult } from "../types/index.ts";
import type { Roasts } from "../api/claude.ts";

interface Props {
  analysis: AnalysisResult;
  year: number;
  shell: string;
  roasts: Roasts | null;
  roastLoading: boolean;
}

function RoastLine({ roast, loading }: { roast?: string; loading?: boolean }) {
  if (loading) return <Text dimColor>  🤖 Generating roast...</Text>;
  if (!roast) return null;
  return <Text>  <Text color="blue">🤖</Text> <Text italic>{roast}</Text></Text>;
}

export function StaticView({ analysis, year, shell, roasts, roastLoading }: Props) {
  const maxCount = analysis.topCommands[0]?.count ?? 1;
  const maxHourCount = Math.max(...analysis.timePatterns.map((t) => t.count));
  const loyalty = detectPackageManagerLoyalty(analysis.packageManagers);

  const hourBars = analysis.timePatterns.map((t) => {
    const intensity = t.count / maxHourCount;
    if (intensity > 0.8) return "█";
    if (intensity > 0.6) return "▓";
    if (intensity > 0.4) return "▒";
    if (intensity > 0.2) return "░";
    return " ";
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="blue">╔══════════════════════════════════════════════════════════════╗</Text>
        <Text bold color="blue">║                     CLI WRAPPED {year}                        ║</Text>
        <Text bold color="blue">╚══════════════════════════════════════════════════════════════╝</Text>
        {roasts?.headline && (
          <Box marginTop={1} justifyContent="center">
            <Text bold color="yellow">🏆 {roasts.headline} 🏆</Text>
          </Box>
        )}
      </Box>

      <Text>You typed <Text bold color="green">{analysis.totalCommands.toLocaleString()}</Text> commands this year.</Text>

      {/* Top Commands */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold underline color="yellow">🏆 Your Top Commands</Text>
        <Box flexDirection="column" marginTop={1}>
          {analysis.topCommands.slice(0, 10).map((cmd, index) => {
            const barLength = Math.round((cmd.count / maxCount) * 20);
            const bar = "█".repeat(barLength) + "░".repeat(20 - barLength);
            return (
              <Text key={cmd.command}>
                <Text bold color="blue">{String(index + 1).padStart(2)}.</Text> <Text bold>{cmd.command.padEnd(14)}</Text> <Text color="green">{bar}</Text> <Text dimColor>{cmd.count.toLocaleString().padStart(5)} ({cmd.percentage.toFixed(1)}%)</Text>
              </Text>
            );
          })}
        </Box>
        <RoastLine roast={roasts?.topCommands} loading={roastLoading} />
      </Box>

      {/* Time Patterns */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold underline color="yellow">🕐 When You Code</Text>
        <Text><Text dimColor>12AM</Text> <Text color="magenta">{hourBars.join("")}</Text> <Text dimColor>11PM</Text></Text>
        <Text>Peak hour: <Text bold color="magenta">{formatHour(analysis.peakHour)}</Text> • Peak day: <Text bold color="magenta">{analysis.peakDay}</Text></Text>
        {analysis.mostActiveDate && (
          <Text>Most active: <Text bold color="green">{analysis.mostActiveDate.date}</Text> ({analysis.mostActiveDate.count} commands!)</Text>
        )}
        <RoastLine roast={roasts?.timePatterns} loading={roastLoading} />
      </Box>

      {/* Struggles */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold underline color="yellow">😅 The Struggle Was Real</Text>
        {analysis.struggles.length > 0 ? (
          analysis.struggles.slice(0, 4).map((s, i) => (
            <Text key={i}><Text color="red">•</Text> {s.description}</Text>
          ))
        ) : (
          <Text dimColor>No struggles detected. Suspiciously clean...</Text>
        )}
        <RoastLine roast={roasts?.struggles} loading={roastLoading} />
      </Box>

      {/* Git */}
      {analysis.gitStats && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold underline color="yellow">🔀 Git Activity</Text>
          <Text><Text bold color="green">{analysis.gitStats.totalCommits}</Text> commits • <Text bold color="blue">{analysis.gitStats.totalPushes}</Text> pushes • <Text bold color="magenta">{analysis.gitStats.totalPulls}</Text> pulls</Text>
          <Text>Favorite: <Text bold color="green">{analysis.gitStats.mostUsedGitCommand}</Text></Text>
          <RoastLine roast={roasts?.gitActivity} loading={roastLoading} />
        </Box>
      )}

      {/* Package Managers */}
      {analysis.packageManagers.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold underline color="yellow">📦 Package Managers</Text>
          {analysis.packageManagers.slice(0, 3).map((pm) => (
            <Text key={pm.manager}><Text bold color="blue">{pm.manager.padEnd(8)}</Text> <Text color="green">{"█".repeat(Math.round(pm.percentage / 5))}</Text> <Text dimColor>{pm.percentage.toFixed(1)}%</Text></Text>
          ))}
          {loyalty.isLoyal && <Text>Loyal <Text bold color="green">{loyalty.manager}</Text> user ({loyalty.percentage.toFixed(0)}%)</Text>}
          <RoastLine roast={roasts?.packageManager} loading={roastLoading} />
        </Box>
      )}

      {/* Summary */}
      <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="gray" paddingX={2} paddingY={1}>
        <Text bold>📊 Summary</Text>
        <Text><Text bold color="green">{analysis.totalCommands.toLocaleString()}</Text> commands • <Text bold color="blue">{analysis.uniqueCommands.toLocaleString()}</Text> unique • Shell: <Text bold color="yellow">{shell}</Text></Text>
        <RoastLine roast={roasts?.overall} loading={roastLoading} />
      </Box>
    </Box>
  );
}
