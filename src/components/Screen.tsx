import React from "react";
import { Box, Text } from "ink";

interface ScreenProps {
  title: string;
  emoji: string;
  children: React.ReactNode;
  roast?: string;
  roastLoading?: boolean;
  currentScreen: number;
  totalScreens: number;
}

export function Screen({ title, emoji, children, roast, roastLoading, currentScreen, totalScreens }: ScreenProps) {
  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="blue">
          ════════════════════════════════════════════════════════════════
        </Text>
      </Box>

      {/* Title */}
      <Box marginBottom={1}>
        <Text bold color="yellow">
          {emoji} {title}
        </Text>
      </Box>

      {/* Content */}
      <Box flexDirection="column" marginBottom={1}>
        {children}
      </Box>

      {/* Roast */}
      {(roast || roastLoading) && (
        <Box marginTop={1} marginBottom={1}>
          <Text>
            <Text color="blue">🤖</Text>{" "}
            {roastLoading ? (
              <Text dimColor italic>Generating roast...</Text>
            ) : (
              <Text italic>{roast}</Text>
            )}
          </Text>
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>
          ────────────────────────────────────────────────────────────────
        </Text>
        <Box justifyContent="space-between" marginTop={1}>
          <Text dimColor>
            [{currentScreen}/{totalScreens}] Press <Text bold color="blue">SPACE</Text> or <Text bold color="blue">→</Text> to continue • <Text bold color="blue">q</Text> to quit
          </Text>
          <Text dimColor>
            {renderProgressDots(currentScreen, totalScreens)}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

function renderProgressDots(current: number, total: number): string {
  return Array.from({ length: total }, (_, i) =>
    i + 1 === current ? "●" : "○"
  ).join(" ");
}
