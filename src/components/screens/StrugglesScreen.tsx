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

export function StrugglesScreen({ analysis, roast, roastLoading, currentScreen, totalScreens, shareStatus, shareResult }: Props) {
  const hasStruggles = analysis.struggles.length > 0;

  return (
    <Screen
      title="The Struggle Was Real"
      emoji="😅"
      roast={roast}
      roastLoading={roastLoading}
      currentScreen={currentScreen}
      totalScreens={totalScreens}
      shareStatus={shareStatus}
      shareResult={shareResult}
    >
      {hasStruggles ? (
        <Box flexDirection="column">
          {analysis.struggles.slice(0, 6).map((struggle, index) => {
            const icon =
              struggle.type === "rage-sudo"
                ? "🔐"
                : struggle.type === "typo"
                  ? "⌨️"
                  : struggle.type === "man-page-check"
                    ? "📖"
                    : "🔄";

            return (
              <Box key={index} marginBottom={1}>
                <Text>
                  {icon} <Text color="red">{struggle.description}</Text>
                </Text>
              </Box>
            );
          })}

          <Box marginTop={1}>
            <Text dimColor italic>
              Don&apos;t worry, we&apos;ve all been there. 💪
            </Text>
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Text color="green">✨ No major struggles detected!</Text>
          <Box marginTop={1}>
            <Text dimColor>
              Either you&apos;re a CLI wizard, or you&apos;ve got really good muscle memory.
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor italic>
              (Or maybe you just clear your history... we won&apos;t judge.)
            </Text>
          </Box>
        </Box>
      )}
    </Screen>
  );
}
