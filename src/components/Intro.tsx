import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";

interface IntroProps {
  year: number;
  totalCommands: number;
  onComplete: () => void;
}

export function Intro({ year, totalCommands, onComplete }: IntroProps) {
  const [stage, setStage] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Animate dots
    const dotTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 300);

    // Stage progression
    timers.push(setTimeout(() => setStage(1), 600));
    timers.push(setTimeout(() => setStage(2), 1200));
    timers.push(setTimeout(() => setStage(3), 1800));
    timers.push(setTimeout(() => onComplete(), 2800));

    return () => {
      clearInterval(dotTimer);
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" padding={2}>
      {stage >= 1 && (
        <Box flexDirection="column" alignItems="center">
          <Text bold color="blue">╔═══════════════════════════════════╗</Text>
          <Text bold color="blue">║         CLI WRAPPED               ║</Text>
          <Text bold color="blue">╚═══════════════════════════════════╝</Text>
        </Box>
      )}

      {stage >= 2 && (
        <Box marginTop={1}>
          <Text bold color="yellow">
            ✨ {year} ✨
          </Text>
        </Box>
      )}

      {stage >= 3 && (
        <Box flexDirection="column" alignItems="center" marginTop={2}>
          <Text>
            Analyzing <Text bold color="green">{totalCommands.toLocaleString()}</Text> commands{dots}
          </Text>
        </Box>
      )}

      {stage < 3 && (
        <Box marginTop={2}>
          <Text dimColor>Loading{dots}</Text>
        </Box>
      )}
    </Box>
  );
}
