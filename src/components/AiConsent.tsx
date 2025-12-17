import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";

/**
 * Check if API key is available from environment variable.
 * API keys are NOT stored on disk for security reasons - only kept in memory.
 */
export function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY;
}

interface AiConsentProps {
  onChoice: (enableAI: boolean, apiKey?: string) => void;
  hasApiKey: boolean;
}

type Screen = "choice" | "input-key";

export function AiConsent({ onChoice, hasApiKey }: AiConsentProps) {
  const [screen, setScreen] = useState<Screen>("choice");
  const [selected, setSelected] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  useInput((input, key) => {
    if (screen === "input-key") {
      if (key.escape) {
        setScreen("choice");
        setApiKey("");
        setError("");
      }
      return; // TextInput handles the rest
    }

    // Choice screen
    if (key.upArrow || input === "k") {
      setSelected((s) => Math.max(0, s - 1));
    }
    if (key.downArrow || input === "j") {
      setSelected((s) => Math.min(1, s + 1));
    }
    if (key.return || input === " ") {
      handleSelect(selected);
    }
    if (hasApiKey) {
      if (input === "y" || input === "Y") {
        handleSelect(0);
      }
      if (input === "n" || input === "N") {
        handleSelect(1);
      }
    } else {
      if (input === "p" || input === "P") {
        handleSelect(0);
      }
      if (input === "n" || input === "N") {
        handleSelect(1);
      }
    }
  });

  const handleSelect = (option: number) => {
    if (hasApiKey) {
      if (option === 0) {
        // Yes, enable AI
        onChoice(true);
      } else {
        // No AI
        onChoice(false);
      }
    } else {
      if (option === 0) {
        // Paste key
        setScreen("input-key");
      } else {
        // No AI
        onChoice(false);
      }
    }
  };

  const handleKeySubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed.startsWith("sk-ant-")) {
      setError("Key should start with sk-ant-");
      return;
    }
    // Key is kept in memory only for this session (not saved to disk)
    onChoice(true, trimmed);
  };

  if (screen === "input-key") {
    return (
      <Box flexDirection="column" padding={2}>
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="blue">Paste your Anthropic API key:</Text>
          <Text dimColor>Get one at https://console.anthropic.com/</Text>
        </Box>

        <Box marginBottom={1}>
          <Text color="green">❯ </Text>
          <TextInput
            value={apiKey}
            onChange={setApiKey}
            onSubmit={handleKeySubmit}
            placeholder="sk-ant-api03-..."
            mask="*"
          />
        </Box>

        {error && (
          <Box marginBottom={1}>
            <Text color="red">⚠ {error}</Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text dimColor>
            Press <Text bold color="blue">Enter</Text> to save • <Text bold color="blue">Esc</Text> to go back
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text dimColor italic>Key is used for this session only (not stored on disk)</Text>
        </Box>
      </Box>
    );
  }

  const options = hasApiKey
    ? [
        { key: "Y", label: "Yes, add witty roasts", selected: selected === 0 },
        { key: "N", label: "No, just show my stats", selected: selected === 1 },
      ]
    : [
        { key: "P", label: "Paste API key", selected: selected === 0 },
        { key: "N", label: "No, just show my stats", selected: selected === 1 },
      ];

  return (
    <Box flexDirection="column" padding={2}>
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="blue">
          ╔═══════════════════════════════════════════════════════════════╗
        </Text>
        <Text bold color="blue">
          ║                     CLI WRAPPED                               ║
        </Text>
        <Text bold color="blue">
          ╚═══════════════════════════════════════════════════════════════╝
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold>Would you like AI-powered roasts? 🤖</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1} paddingLeft={2}>
        <Text color="green" bold>Privacy:</Text>
        <Text>We only send <Text bold>aggregate statistics</Text> to Claude.</Text>
        <Text dimColor>Example: "git: 774 times" — never your actual commands or arguments.</Text>
        <Text dimColor>No file paths, secrets, or commit messages are sent.</Text>
      </Box>

      {!hasApiKey && (
        <Box flexDirection="column" marginBottom={1} paddingLeft={2}>
          <Text color="yellow">⚠ No API key found.</Text>
        </Box>
      )}

      <Box flexDirection="column" marginTop={1}>
        {options.map((opt, i) => (
          <Box key={opt.key}>
            <Text color={opt.selected ? "cyan" : "white"}>
              {opt.selected ? "❯ " : "  "}
              <Text bold={opt.selected}>[{opt.key}] {opt.label}</Text>
            </Text>
          </Box>
        ))}
      </Box>

      <Box marginTop={2}>
        <Text dimColor>
          Use arrows + Enter, or press the letter key
        </Text>
      </Box>
    </Box>
  );
}
