import React from "react";
import { Box, Text } from "ink";
import { Screen } from "../Screen.tsx";
import { detectPackageManagerLoyalty } from "../../analyzers/index.ts";
import type { AnalysisResult } from "../../types/index.ts";

interface Props {
  analysis: AnalysisResult;
  roast?: string;
  roastLoading?: boolean;
  currentScreen: number;
  totalScreens: number;
}

export function PackageManagerScreen({ analysis, roast, roastLoading, currentScreen, totalScreens }: Props) {
  const loyalty = detectPackageManagerLoyalty(analysis.packageManagers);

  if (analysis.packageManagers.length === 0) {
    return (
      <Screen
        title="Package Managers"
        emoji="📦"
        roast={roast}
        roastLoading={roastLoading}
        currentScreen={currentScreen}
        totalScreens={totalScreens}
      >
        <Box flexDirection="column">
          <Text color="yellow">No package manager usage detected.</Text>
          <Box marginTop={1}>
            <Text dimColor>
              Either you&apos;re not doing JS/Python/Rust, or your packages just work™.
            </Text>
          </Box>
        </Box>
      </Screen>
    );
  }

  const maxCount = analysis.packageManagers[0]?.count ?? 1;

  return (
    <Screen
      title="Package Managers"
      emoji="📦"
      roast={roast}
      roastLoading={roastLoading}
      currentScreen={currentScreen}
      totalScreens={totalScreens}
    >
      {/* Bar chart */}
      <Box flexDirection="column">
        {analysis.packageManagers.slice(0, 6).map((pm, index) => {
          const barLength = Math.round((pm.count / maxCount) * 30);
          const bar = "█".repeat(barLength);
          const isTop = index === 0;

          return (
            <Box key={pm.manager}>
              <Text>
                <Text bold color={isTop ? "yellow" : "blue"}>{pm.manager.padEnd(10)}</Text>{" "}
                <Text color="green">{bar.padEnd(30)}</Text>{" "}
                <Text dimColor>{pm.percentage.toFixed(1)}%</Text>
                {isTop && <Text color="yellow"> 👑</Text>}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Loyalty badge */}
      {loyalty.isLoyal && loyalty.manager && (
        <Box marginTop={2} flexDirection="column">
          <Box>
            <Text bold color="yellow">
              🏆 Loyalty Award: {loyalty.manager.toUpperCase()} Devotee
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text>
              You used <Text bold color="green">{loyalty.manager}</Text>{" "}
              <Text bold>{loyalty.percentage.toFixed(0)}%</Text> of the time.
              That&apos;s commitment!
            </Text>
          </Box>
        </Box>
      )}

      {/* Fun facts */}
      {!loyalty.isLoyal && analysis.packageManagers.length >= 2 && (
        <Box marginTop={2}>
          <Text dimColor italic>
            Using multiple package managers? You&apos;re either polyglot or chaotic. Maybe both.
          </Text>
        </Box>
      )}
    </Screen>
  );
}
