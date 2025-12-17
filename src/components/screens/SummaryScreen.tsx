import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import type { AnalysisResult } from "../../types/index.ts";

interface Props {
  analysis: AnalysisResult;
  year: number;
  shell: string;
  headline?: string;
  overallRoast?: string;
}

export function SummaryScreen({ analysis, year, shell, headline, overallRoast }: Props) {
  const topCmd = analysis.topCommands[0];
  const topPM = analysis.packageManagers[0];
  const [shareStatus, setShareStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [shareResult, setShareResult] = useState<{ filepath: string; copiedToClipboard: boolean } | null>(null);

  useInput((input) => {
    if ((input === "s" || input === "S") && shareStatus === "idle") {
      setShareStatus("generating");
      // Dynamic import to avoid loading heavy WASM deps at startup
      import("../../share/generateImage.tsx")
        .then(({ generateShareImage }) => generateShareImage(analysis, year, shell, headline))
        .then((result) => {
          setShareResult(result);
          setShareStatus("done");
        })
        .catch((err) => {
          console.error(err);
          setShareStatus("error");
        });
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Text bold color="blue">
          ╔═══════════════════════════════════════════════════════════════════╗
        </Text>
        <Text bold color="blue">
        ║                      YOUR {year} IN REVIEW                          ║
        </Text>
        <Text bold color="blue">
          ╚═══════════════════════════════════════════════════════════════════╝
        </Text>
      </Box>

      {/* Headline/Award */}
      {headline && (
        <Box justifyContent="center" marginBottom={2}>
          <Text bold color="yellow">
            🏆 {headline} 🏆
          </Text>
        </Box>
      )}

      {/* Stats grid */}
      <Box flexDirection="column" marginBottom={1}>
        <Box borderStyle="round" borderColor="gray" paddingX={2} paddingY={1} flexDirection="column">
          <Text bold color="white">📊 The Numbers</Text>
          <Box marginTop={1}>
            <Text>
              Commands: <Text bold color="green">{analysis.totalCommands.toLocaleString()}</Text>
              {"  "}•{"  "}
              Unique: <Text bold color="blue">{analysis.uniqueCommands.toLocaleString()}</Text>
              {"  "}•{"  "}
              Shell: <Text bold color="yellow">{shell}</Text>
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Highlights */}
      <Box flexDirection="column" marginBottom={1}>
        <Box borderStyle="round" borderColor="gray" paddingX={2} paddingY={1} flexDirection="column">
          <Text bold color="white">⭐ Highlights</Text>
          <Box marginTop={1} flexDirection="column">
            {topCmd && (
              <Text>
                🥇 Top command: <Text bold color="yellow">{topCmd.command}</Text> ({topCmd.count.toLocaleString()} times)
              </Text>
            )}
            <Text>
              🕐 Peak hour: <Text bold color="magenta">{analysis.peakHour}:00</Text> • Peak day: <Text bold color="magenta">{analysis.peakDay}</Text>
            </Text>
            {topPM && (
              <Text>
                📦 Favorite PM: <Text bold color="blue">{topPM.manager}</Text> ({topPM.percentage.toFixed(0)}%)
              </Text>
            )}
            {analysis.gitStats && (
              <Text>
                🔀 Git commits: <Text bold color="green">{analysis.gitStats.totalCommits}</Text>
              </Text>
            )}
          </Box>
        </Box>
      </Box>

      {/* Final roast */}
      {overallRoast && (
        <Box marginBottom={1}>
          <Box borderStyle="round" borderColor="blue" paddingX={2} paddingY={1} flexDirection="column">
            <Text bold color="blue">🤖 Claude Says:</Text>
            <Box marginTop={1}>
              <Text italic>{overallRoast}</Text>
            </Box>
          </Box>
        </Box>
      )}

      {/* Share status */}
      {shareStatus === "generating" && (
        <Box marginBottom={1} justifyContent="center">
          <Text color="blue">
            <Spinner type="dots" /> Generating share image...
          </Text>
        </Box>
      )}
      {shareStatus === "done" && shareResult && (
        <Box marginBottom={1} flexDirection="column" alignItems="center">
          {shareResult.copiedToClipboard ? (
            <Text color="green">
              ✓ Copied to clipboard! Ready to paste.
            </Text>
          ) : (
            <Text color="green">
              ✓ Image saved!
            </Text>
          )}
          <Text dimColor>
            {shareResult.filepath}
          </Text>
        </Box>
      )}
      {shareStatus === "error" && (
        <Box marginBottom={1} justifyContent="center">
          <Text color="red">
            ✗ Failed to generate image
          </Text>
        </Box>
      )}

      {/* Footer */}
      <Box flexDirection="column" alignItems="center" marginTop={1}>
        <Text dimColor>
          ─────────────────────────────────────────────────────────────────────
        </Text>
        <Box marginTop={1}>
          <Text dimColor>
            Press <Text bold color="blue">s</Text> to save share image • <Text bold color="blue">q</Text> to exit
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor italic>
            Thanks for a great {year}! Here&apos;s to even more commands in {year + 1} 🚀
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
