import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".cli-wrapped");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

interface Config {
  apiKey?: string;
}

export function loadConfig(): Config {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, "utf-8")) as Config;
    }
  } catch {
    // Ignore errors
  }
  return {};
}

export function saveConfig(config: Config): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch {
    // Ignore errors
  }
}

export function getApiKey(): string | undefined {
  // Environment variable takes precedence
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }
  // Fall back to stored config
  const config = loadConfig();
  return config.apiKey;
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
      setSelected((s) => Math.min(hasApiKey ? 1 : 2, s + 1));
    }
    if (key.return || input === " ") {
      handleSelect(selected);
    }
    if (input === "y" || input === "Y") {
      handleSelect(0);
    }
    if (input === "n" || input === "N") {
      handleSelect(hasApiKey ? 1 : 2);
    }
    if ((input === "p" || input === "P") && !hasApiKey) {
      handleSelect(1);
    }
  });

  const handleSelect = (option: number) => {
    if (option === 0) {
      // Yes, enable AI
      onChoice(true);
    } else if (option === 1 && !hasApiKey) {
      // Paste key
      setScreen("input-key");
    } else {
      // No AI
      onChoice(false);
    }
  };

  const handleKeySubmit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed.startsWith("sk-ant-")) {
      setError("Key should start with sk-ant-");
      return;
    }
    // Save the key
    saveConfig({ apiKey: trimmed });
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
          <Text dimColor italic>Key will be saved to ~/.cli-wrapped/config.json</Text>
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
        { key: "Y", label: "Yes, add witty roasts", selected: selected === 0 },
        { key: "P", label: "Paste API key", selected: selected === 1 },
        { key: "N", label: "No, just show my stats", selected: selected === 2 },
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
        <Text>We only send <Text bold>statistics</Text> to Claude, never your actual commands.</Text>
        <Text dimColor>Example: "top command: git (774 times)" — NOT the actual git commands.</Text>
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
