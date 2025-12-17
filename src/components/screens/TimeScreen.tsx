import React from "react";
import { Box, Text } from "ink";
import { Screen } from "../Screen.tsx";
import { formatHour } from "../../analyzers/index.ts";
import type { AnalysisResult } from "../../types/index.ts";

interface Props {
  analysis: AnalysisResult;
  roast?: string;
  roastLoading?: boolean;
  currentScreen: number;
  totalScreens: number;
}

export function TimeScreen({ analysis, roast, roastLoading, currentScreen, totalScreens }: Props) {
  const maxHourCount = Math.max(...analysis.timePatterns.map((t) => t.count));
  const peakHourFormatted = formatHour(analysis.peakHour);

  // Create hour bars with more detail
  const hourBars = analysis.timePatterns.map((t) => {
    const intensity = t.count / maxHourCount;
    if (intensity > 0.8) return "█";
    if (intensity > 0.6) return "▓";
    if (intensity > 0.4) return "▒";
    if (intensity > 0.2) return "░";
    return " ";
  });

  // Day distribution
  const maxDayCount = Math.max(...analysis.dayPatterns.map((d) => d.count));

  return (
    <Screen
      title="When You Code"
      emoji="🕐"
      roast={roast}
      roastLoading={roastLoading}
      currentScreen={currentScreen}
      totalScreens={totalScreens}
    >
      {/* Hourly distribution */}
      <Box flexDirection="column">
        <Text bold color="white">Hourly Activity:</Text>
        <Box marginTop={1}>
          <Text>
            <Text dimColor>12AM </Text>
            <Text color="magenta">{hourBars.join("")}</Text>
            <Text dimColor> 11PM</Text>
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text>
            Peak hour: <Text bold color="magenta">{peakHourFormatted}</Text>
          </Text>
        </Box>
      </Box>

      {/* Daily distribution */}
      <Box flexDirection="column" marginTop={2}>
        <Text bold color="white">Daily Activity:</Text>
        <Box flexDirection="column" marginTop={1}>
          {analysis.dayPatterns.map((day) => {
            const barLength = Math.round((day.count / maxDayCount) * 20);
            const bar = "█".repeat(barLength);
            const isPeak = day.dayName === analysis.peakDay;

            return (
              <Box key={day.day}>
                <Text>
                  <Text color={isPeak ? "yellow" : "white"}>{day.dayName.padEnd(10)}</Text>{" "}
                  <Text bold color="blue">{bar.padEnd(20)}</Text>{" "}
                  <Text dimColor>{day.count.toLocaleString()}</Text>
                  {isPeak && <Text color="yellow"> ← Peak</Text>}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Most active day */}
      {analysis.mostActiveDate && (
        <Box marginTop={2}>
          <Text>
            🔥 Most active day:{" "}
            <Text bold color="green">{analysis.mostActiveDate.date}</Text>{" "}
            with <Text bold color="yellow">{analysis.mostActiveDate.count}</Text> commands!
          </Text>
        </Box>
      )}
    </Screen>
  );
}
