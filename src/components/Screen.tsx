import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";

interface ShareResult {
  filepath: string;
  copiedToClipboard: boolean;
  altText: string;
}

interface ScreenProps {
  title: string;
  emoji: string;
  children: React.ReactNode;
  roast?: string;
  roastLoading?: boolean;
  currentScreen: number;
  totalScreens: number;
  shareStatus?: "idle" | "generating" | "done" | "error";
  shareResult?: ShareResult | null;
}

export function Screen({
  title,
  emoji,
  children,
  roast,
  roastLoading,
  currentScreen,
  totalScreens,
  shareStatus = "idle",
  shareResult,
}: ScreenProps) {
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

      {/* Share status */}
      {shareStatus === "generating" && (
        <Box marginTop={1}>
          <Text color="blue">
            <Spinner type="dots" /> Generating share image...
          </Text>
        </Box>
      )}
      {shareStatus === "done" && shareResult && (
        <Box marginTop={1} flexDirection="column">
          <Box>
            {shareResult.copiedToClipboard ? (
              <Text color="green">✓ Image copied to clipboard!</Text>
            ) : (
              <Text color="green">✓ Image saved!</Text>
            )}
            <Text dimColor> {shareResult.filepath}</Text>
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text bold color="blue">Alt text:</Text>
            <Box borderStyle="round" borderColor="gray" paddingX={1} marginTop={1}>
              <Text wrap="wrap">{shareResult.altText}</Text>
            </Box>
          </Box>
        </Box>
      )}
      {shareStatus === "error" && (
        <Box marginTop={1}>
          <Text color="red">✗ Failed to generate image</Text>
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>
          ────────────────────────────────────────────────────────────────
        </Text>
        <Box justifyContent="space-between" marginTop={1}>
          <Text dimColor>
            [{currentScreen}/{totalScreens}] <Text bold color="blue">SPACE</Text>/<Text bold color="blue">→</Text> next • <Text bold color="blue">s</Text> share • <Text bold color="blue">q</Text> quit
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
