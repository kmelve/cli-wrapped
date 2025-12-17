import React from "react";
import { Box, Text } from "ink";
import { Screen } from "../Screen.tsx";
import type { AnalysisResult } from "../../types/index.ts";

interface ShareResult {
  filepath: string;
  copiedToClipboard: boolean;
  altText: string;
}

interface Props {
  analysis: AnalysisResult;
  roast?: string;
  roastLoading?: boolean;
  currentScreen: number;
  totalScreens: number;
  shareStatus?: "idle" | "generating" | "done" | "error";
  shareResult?: ShareResult | null;
}

export function TopCommandsScreen({ analysis, roast, roastLoading, currentScreen, totalScreens, shareStatus, shareResult }: Props) {
  const maxCount = analysis.topCommands[0]?.count ?? 1;

  return (
    <Screen
      title="Your Top Commands"
      emoji="🏆"
      roast={roast}
      roastLoading={roastLoading}
      currentScreen={currentScreen}
      totalScreens={totalScreens}
      shareStatus={shareStatus}
      shareResult={shareResult}
    >
      <Box flexDirection="column">
        {analysis.topCommands.slice(0, 10).map((cmd, index) => {
          const barLength = Math.round((cmd.count / maxCount) * 24);
          const bar = "█".repeat(barLength) + "░".repeat(24 - barLength);
          const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";

          return (
            <Box key={cmd.command}>
              <Text>
                {medal} <Text bold color="blue">{String(index + 1).padStart(2)}.</Text>{" "}
                <Text bold color={index < 3 ? "yellow" : "white"}>{cmd.command.padEnd(14)}</Text>{" "}
                <Text color="green">{bar}</Text>{" "}
                <Text dimColor>
                  {cmd.count.toLocaleString().padStart(5)} ({cmd.percentage.toFixed(1)}%)
                </Text>
              </Text>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text>
          Total: <Text bold color="green">{analysis.totalCommands.toLocaleString()}</Text> commands •{" "}
          <Text bold color="blue">{analysis.uniqueCommands.toLocaleString()}</Text> unique
        </Text>
      </Box>
    </Screen>
  );
}
