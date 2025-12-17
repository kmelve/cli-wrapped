import React from "react";
import { Box, Text } from "ink";
import { Screen } from "../Screen.tsx";
import type { AnalysisResult } from "../../types/index.ts";

interface Props {
  analysis: AnalysisResult;
  roast?: string;
  roastLoading?: boolean;
  currentScreen: number;
  totalScreens: number;
}

export function GitScreen({ analysis, roast, roastLoading, currentScreen, totalScreens }: Props) {
  const { gitStats } = analysis;

  if (!gitStats) {
    return (
      <Screen
        title="Git Activity"
        emoji="🔀"
        roast={roast}
        roastLoading={roastLoading}
        currentScreen={currentScreen}
        totalScreens={totalScreens}
      >
        <Box flexDirection="column">
          <Text color="yellow">No git activity detected in your history.</Text>
          <Box marginTop={1}>
            <Text dimColor>
              Either you&apos;re not using git, or you&apos;re a GUI person. No judgment here!
            </Text>
          </Box>
        </Box>
      </Screen>
    );
  }

  const pushPullRatio = gitStats.totalPulls > 0
    ? (gitStats.totalPushes / gitStats.totalPulls).toFixed(2)
    : "∞";

  return (
    <Screen
      title="Git Activity"
      emoji="🔀"
      roast={roast}
      roastLoading={roastLoading}
      currentScreen={currentScreen}
      totalScreens={totalScreens}
    >
      {/* Main stats */}
      <Box flexDirection="column">
        <Box>
          <Text>
            <Text bold color="green">📝 {gitStats.totalCommits}</Text> commits
            {"  "}
            <Text bold color="blue">⬆️  {gitStats.totalPushes}</Text> pushes
            {"  "}
            <Text bold color="magenta">⬇️  {gitStats.totalPulls}</Text> pulls
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text>
            <Text bold color="magenta">🌿 {gitStats.branches}</Text> branch switches
            {"  "}
            <Text bold color="yellow">📦 {gitStats.stashes}</Text> stashes
            {"  "}
            <Text bold color="red">🔄 {gitStats.rebases}</Text> rebases
          </Text>
        </Box>
      </Box>

      {/* Insights */}
      <Box flexDirection="column" marginTop={2}>
        <Text bold>Insights:</Text>
        <Box marginTop={1}>
          <Text>
            • Push/Pull ratio: <Text bold color="blue">{pushPullRatio}</Text>
            {parseFloat(pushPullRatio) > 1.5 && <Text color="green"> (You ship a lot! 🚀)</Text>}
            {parseFloat(pushPullRatio) < 0.7 && <Text color="yellow"> (Keeping up with the team!)</Text>}
          </Text>
        </Box>
        <Box>
          <Text>
            • Favorite command: <Text bold color="green">{gitStats.mostUsedGitCommand}</Text>
          </Text>
        </Box>
        {gitStats.rebases > 10 && (
          <Box>
            <Text>
              • <Text color="red">{gitStats.rebases} rebases</Text> - You like a clean history! 🧹
            </Text>
          </Box>
        )}
        {gitStats.stashes > 5 && (
          <Box>
            <Text>
              • <Text color="yellow">{gitStats.stashes} stashes</Text> - Context switching pro! 🔀
            </Text>
          </Box>
        )}
      </Box>
    </Screen>
  );
}
