#!/usr/bin/env bun
import React, { useState, useEffect } from "react";
import { render, useInput, useApp } from "ink";
import { loadHistory, filterByYear } from "./parsers/index.ts";
import { analyzeHistory } from "./analyzers/index.ts";
import { generateRoasts, getFallbackRoasts, type Roasts } from "./api/claude.ts";
import type { AnalysisResult } from "./types/index.ts";
import type { ScreenType } from "./share/generateImage.tsx";

// Components
import { Intro } from "./components/Intro.tsx";
import { StaticView } from "./components/StaticView.tsx";
import { AiConsent, getApiKey } from "./components/AiConsent.tsx";
import { TopCommandsScreen } from "./components/screens/TopCommandsScreen.tsx";
import { TimeScreen } from "./components/screens/TimeScreen.tsx";
import { StrugglesScreen } from "./components/screens/StrugglesScreen.tsx";
import { GitScreen } from "./components/screens/GitScreen.tsx";
import { PackageManagerScreen } from "./components/screens/PackageManagerScreen.tsx";
import { SummaryScreen } from "./components/screens/SummaryScreen.tsx";

interface AppProps {
  analysis: AnalysisResult;
  year: number;
  shell: string;
  hasApiKey: boolean;
  staticMode: boolean;
  skipConsent: boolean;
  forceAI: boolean;
}

type ScreenName = "consent" | "intro" | "commands" | "time" | "struggles" | "git" | "packages" | "summary";

const SCREENS: ScreenName[] = ["consent", "intro", "commands", "time", "struggles", "git", "packages", "summary"];

// Map screen names to share image screen types
const SCREEN_TO_SHARE_TYPE: Record<ScreenName, ScreenType | null> = {
  consent: null,
  intro: null,
  commands: "commands",
  time: "time",
  struggles: "struggles",
  git: "git",
  packages: "packages",
  summary: "summary",
};

interface ShareResult {
  filepath: string;
  copiedToClipboard: boolean;
  altText: string;
}

function InteractiveApp({ analysis, year, shell, hasApiKey, skipConsent, forceAI }: Omit<AppProps, "staticMode">) {
  const { exit } = useApp();
  const initialScreen: ScreenName = skipConsent ? "intro" : "consent";
  const [currentScreen, setCurrentScreen] = useState<ScreenName>(initialScreen);
  const [enableAI, setEnableAI] = useState(forceAI);
  const [runtimeApiKey, setRuntimeApiKey] = useState<string | undefined>(undefined);
  const [roasts, setRoasts] = useState<Roasts | null>(null);
  const [roastLoading, setRoastLoading] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);

  // Load roasts when AI is enabled
  useEffect(() => {
    const effectiveHasKey = hasApiKey || !!runtimeApiKey;
    if (!enableAI || !effectiveHasKey) return;

    // Use runtime key if provided during this session, otherwise rely on env var
    const apiKeyToUse = runtimeApiKey;

    setRoastLoading(true);
    generateRoasts(analysis, year, apiKeyToUse)
      .then((r) => {
        setRoasts(r);
        setRoastLoading(false);
      })
      .catch(() => {
        setRoasts(getFallbackRoasts(analysis));
        setRoastLoading(false);
      });
  }, [analysis, year, enableAI, hasApiKey, runtimeApiKey]);

  // Reset share status when changing screens
  const navigateTo = (screen: ScreenName) => {
    setShareStatus("idle");
    setShareResult(null);
    setCurrentScreen(screen);
  };

  // Get the roast for the current screen
  const getRoastForScreen = (screen: ScreenName): string | undefined => {
    if (!roasts) return undefined;
    switch (screen) {
      case "commands": return roasts.topCommands;
      case "time": return roasts.timePatterns;
      case "struggles": return roasts.struggles;
      case "git": return roasts.gitActivity;
      case "packages": return roasts.packageManager;
      case "summary": return roasts.overall;
      default: return undefined;
    }
  };

  // Handle share action
  const handleShare = () => {
    const shareType = SCREEN_TO_SHARE_TYPE[currentScreen];
    if (!shareType || shareStatus !== "idle") return;

    const roast = getRoastForScreen(currentScreen);

    setShareStatus("generating");
    // Dynamic import to avoid loading heavy WASM deps at startup
    import("./share/generateImage.tsx")
      .then(({ generateShareImage }) => generateShareImage(analysis, year, shell, roasts?.headline, shareType, roast))
      .then((result) => {
        setShareResult(result);
        setShareStatus("done");
      })
      .catch((err) => {
        console.error(err);
        setShareStatus("error");
      });
  };

  // Keyboard navigation
  useInput((input, key) => {
    if (currentScreen === "consent") return; // Consent handles its own input

    if (input === "q" || (key.ctrl && input === "c")) {
      exit();
      return;
    }

    // Handle share
    if ((input === "s" || input === "S") && SCREEN_TO_SHARE_TYPE[currentScreen]) {
      handleShare();
      return;
    }

    const currentIndex = SCREENS.indexOf(currentScreen);

    if (input === " " || key.rightArrow || key.return) {
      if (currentIndex < SCREENS.length - 1) {
        navigateTo(SCREENS[currentIndex + 1]!);
      }
    }

    if (key.leftArrow || key.backspace) {
      if (currentIndex > 2) { // Skip consent and intro on back
        navigateTo(SCREENS[currentIndex - 1]!);
      }
    }
  });

  const handleConsent = (wantsAI: boolean, apiKey?: string) => {
    if (apiKey) {
      setRuntimeApiKey(apiKey);
    }
    setEnableAI(wantsAI && (hasApiKey || !!apiKey));
    setCurrentScreen("intro");
  };

  const handleIntroComplete = () => setCurrentScreen("commands");

  const screenNumber = SCREENS.indexOf(currentScreen) - 1; // Exclude consent
  const totalScreens = SCREENS.length - 2; // Exclude consent and intro

  switch (currentScreen) {
    case "consent":
      return <AiConsent onChoice={handleConsent} hasApiKey={hasApiKey} />;
    case "intro":
      return <Intro year={year} totalCommands={analysis.totalCommands} onComplete={handleIntroComplete} />;
    case "commands":
      return <TopCommandsScreen analysis={analysis} roast={roasts?.topCommands} roastLoading={roastLoading} currentScreen={screenNumber} totalScreens={totalScreens} shareStatus={shareStatus} shareResult={shareResult} />;
    case "time":
      return <TimeScreen analysis={analysis} roast={roasts?.timePatterns} roastLoading={roastLoading} currentScreen={screenNumber} totalScreens={totalScreens} shareStatus={shareStatus} shareResult={shareResult} />;
    case "struggles":
      return <StrugglesScreen analysis={analysis} roast={roasts?.struggles} roastLoading={roastLoading} currentScreen={screenNumber} totalScreens={totalScreens} shareStatus={shareStatus} shareResult={shareResult} />;
    case "git":
      return <GitScreen analysis={analysis} roast={roasts?.gitActivity} roastLoading={roastLoading} currentScreen={screenNumber} totalScreens={totalScreens} shareStatus={shareStatus} shareResult={shareResult} />;
    case "packages":
      return <PackageManagerScreen analysis={analysis} roast={roasts?.packageManager} roastLoading={roastLoading} currentScreen={screenNumber} totalScreens={totalScreens} shareStatus={shareStatus} shareResult={shareResult} />;
    case "summary":
      return <SummaryScreen analysis={analysis} year={year} shell={shell} headline={roasts?.headline} overallRoast={roasts?.overall} shareStatus={shareStatus} shareResult={shareResult} />;
    default:
      return null;
  }
}

function StaticApp({ analysis, year, shell, hasApiKey, forceAI }: Omit<AppProps, "staticMode" | "skipConsent">) {
  const [roasts, setRoasts] = useState<Roasts | null>(null);
  const [roastLoading, setRoastLoading] = useState(forceAI && hasApiKey);

  useEffect(() => {
    if (!forceAI || !hasApiKey) return;

    // API key comes from environment variable only
    generateRoasts(analysis, year)
      .then((r) => {
        setRoasts(r);
        setRoastLoading(false);
      })
      .catch(() => {
        setRoasts(getFallbackRoasts(analysis));
        setRoastLoading(false);
      });
  }, [analysis, year, forceAI, hasApiKey]);

  return <StaticView analysis={analysis} year={year} shell={shell} roasts={roasts} roastLoading={roastLoading} />;
}

function App({ staticMode, skipConsent, ...props }: AppProps) {
  if (staticMode) {
    return <StaticApp {...props} />;
  }
  return <InteractiveApp {...props} skipConsent={skipConsent} />;
}

const HELP_TEXT = `
CLI Wrapped - Spotify Wrapped, but for your command line

Usage: cli-wrapped [options]

Options:
  --year=YYYY    Analyze a specific year (default: current year)
  --ai           Enable AI roasts (skips consent prompt)
  --no-ai        Disable AI roasts (skips consent prompt)
  --static       Force static mode (no interactive navigation)
  --help, -h     Show this help message

Environment:
  ANTHROPIC_API_KEY   Set this for AI-powered roasts from Claude
                      Get one at https://console.anthropic.com/

Privacy & Security:
  When AI roasts are enabled, we send ONLY aggregate statistics to Claude:
  - Base command names and counts (e.g., "git: 774 times")
  - Time patterns (e.g., "peak hour: 14:00")
  - Aggregate numbers (total commands, unique commands)
  - Package manager usage percentages
  - Git operation counts (commits, pushes, pulls)

  We NEVER send:
  ✗ Command arguments or flags
  ✗ File paths or directory names
  ✗ Commit messages
  ✗ Environment variables or secrets
  ✗ Your actual shell history content

  API keys are kept in memory only - never written to disk.

Navigation (interactive mode):
  SPACE / → / ENTER   Next screen
  ← / BACKSPACE       Previous screen
  q                   Quit

Examples:
  cli-wrapped                    # Interactive with AI consent prompt
  cli-wrapped --ai               # Enable AI roasts directly
  cli-wrapped --no-ai            # Skip AI entirely
  cli-wrapped --no-ai --static   # Quick, non-interactive view

Supported shells: zsh, bash, fish
`;

// Main entry point
function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const yearArg = args.find((a) => a.startsWith("--year="));
  const year = yearArg
    ? parseInt(yearArg.split("=")[1] ?? String(new Date().getFullYear()), 10)
    : new Date().getFullYear();

  const noAI = args.includes("--no-ai");
  const forceAI = args.includes("--ai");
  const forceStatic = args.includes("--static");
  const hasApiKey = !!getApiKey();

  // Skip consent if user explicitly chose --ai or --no-ai
  const skipConsent = noAI || forceAI;

  const isTTY = process.stdin.isTTY && process.stdout.isTTY;
  const staticMode = forceStatic || !isTTY;

  try {
    console.clear();

    const history = loadHistory();
    const filtered = filterByYear(history, year);
    const historyToAnalyze = filtered.entries.length > 0 ? filtered : history;

    if (filtered.entries.length === 0) {
      console.log(`📝 Note: Using all history (no timestamps for ${year})\n`);
    }

    const analysis = analyzeHistory(historyToAnalyze);
    render(
      <App
        analysis={analysis}
        year={year}
        shell={history.shell}
        hasApiKey={hasApiKey}
        staticMode={staticMode}
        skipConsent={skipConsent}
        forceAI={forceAI && hasApiKey}
      />
    );
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
