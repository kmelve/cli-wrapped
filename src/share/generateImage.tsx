import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir, platform } from "os";
import { execSync } from "child_process";
import type { AnalysisResult } from "../types/index.ts";

export interface ShareResult {
  filepath: string;
  copiedToClipboard: boolean;
  altText: string;
}

/**
 * Generate alt text for accessibility
 */
function generateAltText(
  analysis: AnalysisResult,
  year: number,
  shell: string,
  headline?: string
): string {
  const parts: string[] = [];

  parts.push(`CLI Wrapped ${year} stats.`);

  if (headline) {
    parts.push(headline + ".");
  }

  parts.push(`${analysis.totalCommands.toLocaleString()} total commands, ${analysis.uniqueCommands.toLocaleString()} unique.`);

  const topCmd = analysis.topCommands[0];
  if (topCmd) {
    parts.push(`Top command: ${topCmd.command} (${topCmd.count.toLocaleString()} times).`);
  }

  parts.push(`Peak activity: ${analysis.peakHour}:00 on ${analysis.peakDay}s.`);

  const topPM = analysis.packageManagers[0];
  if (topPM) {
    parts.push(`Favorite package manager: ${topPM.manager}.`);
  }

  if (analysis.gitStats) {
    parts.push(`Git: ${analysis.gitStats.totalCommits} commits, ${analysis.gitStats.totalPushes} pushes, ${analysis.gitStats.totalPulls} pulls.`);
  }

  parts.push(`Shell: ${shell}.`);

  return parts.join(" ");
}

// Load a monospace font for rendering
async function loadFont(): Promise<ArrayBuffer> {
  // Try system fonts first (most reliable)
  const systemFonts = [
    "/System/Library/Fonts/Monaco.ttf", // macOS
    "/System/Library/Fonts/SFMono-Regular.otf", // macOS newer
    "/System/Library/Fonts/Menlo.ttc", // macOS
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", // Linux
    "/usr/share/fonts/TTF/DejaVuSansMono.ttf", // Arch Linux
    "C:\\Windows\\Fonts\\consola.ttf", // Windows
  ];

  for (const fontPath of systemFonts) {
    try {
      if (existsSync(fontPath)) {
        const buffer = readFileSync(fontPath);
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      }
    } catch {
      // Try next font
    }
  }

  // Fallback: fetch from CDN
  try {
    const response = await fetch(
      "https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.3/files/jetbrains-mono-latin-400-normal.woff"
    );
    if (!response.ok) {
      throw new Error(`Font fetch failed: ${response.status}`);
    }
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      throw new Error("Font URL returned HTML instead of font data");
    }
    return await response.arrayBuffer();
  } catch (err) {
    throw new Error(`Could not load any font: ${err}`);
  }
}

interface ShareCardProps {
  analysis: AnalysisResult;
  year: number;
  headline?: string;
  shell: string;
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", fontSize: 16, color: "#8b949e" }}>{label}</div>
      <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}

function ShareCard({ analysis, year, headline, shell }: ShareCardProps) {
  const topCmd = analysis.topCommands[0];
  const topPM = analysis.packageManagers[0];
  const git = analysis.gitStats;

  // Build stats array to avoid conditional rendering issues
  const stats: Array<{ label: string; value: string; color: string }> = [];

  if (topCmd) {
    stats.push({ label: "Top Command", value: topCmd.command, color: "#f0c14b" });
  }
  stats.push({ label: "Peak Hour", value: `${analysis.peakHour}:00`, color: "#a371f7" });
  stats.push({ label: "Peak Day", value: analysis.peakDay, color: "#a371f7" });
  if (topPM) {
    stats.push({ label: "Favorite PM", value: topPM.manager, color: "#58a6ff" });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#0d1117",
        color: "#e6edf3",
        padding: 48,
        fontFamily: "Mono",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 48,
            fontWeight: 700,
            color: "#58a6ff",
            marginBottom: headline ? 8 : 0,
          }}
        >
          {`CLI WRAPPED ${year}`}
        </div>
        {headline ? (
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#f0c14b",
            }}
          >
            {headline}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            color: "#3fb950",
          }}
        >
          {analysis.totalCommands.toLocaleString()}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#8b949e",
            marginLeft: 12,
          }}
        >
          commands
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginBottom: 32,
        }}
      >
        {stats.map((stat, i) => (
          <StatBox key={i} label={stat.label} value={stat.value} color={stat.color} />
        ))}
      </div>

      {git ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 48,
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", fontSize: 20 }}>📝</div>
            <div style={{ display: "flex", fontSize: 20, color: "#3fb950" }}>
              {`${git.totalCommits} commits`}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", fontSize: 20 }}>⬆️</div>
            <div style={{ display: "flex", fontSize: 20, color: "#58a6ff" }}>
              {`${git.totalPushes} pushes`}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", fontSize: 20 }}>⬇️</div>
            <div style={{ display: "flex", fontSize: 20, color: "#a371f7" }}>
              {`${git.totalPulls} pulls`}
            </div>
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "auto",
          borderTop: "1px solid #30363d",
          paddingTop: 24,
        }}
      >
        <div style={{ display: "flex", fontSize: 16, color: "#8b949e" }}>
          {`${shell} shell • ${analysis.uniqueCommands.toLocaleString()} unique commands`}
        </div>
        <div style={{ display: "flex", fontSize: 16, color: "#58a6ff" }}>
          github.com/kmelve/cli-wrapped
        </div>
      </div>
    </div>
  );
}

/**
 * Copy image to clipboard on macOS
 */
function copyImageToClipboard(filepath: string): boolean {
  if (platform() !== "darwin") {
    return false;
  }

  try {
    // Use osascript to copy PNG to clipboard on macOS
    const script = `set the clipboard to (read (POSIX file "${filepath}") as «class PNGf»)`;
    execSync(`osascript -e '${script}'`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export async function generateShareImage(
  analysis: AnalysisResult,
  year: number,
  shell: string,
  headline?: string
): Promise<ShareResult> {
  const font = await loadFont();

  const svg = await satori(
    <ShareCard analysis={analysis} year={year} shell={shell} headline={headline} />,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Mono",
          data: font,
          weight: 400,
          style: "normal",
        },
        {
          name: "Mono",
          data: font,
          weight: 600,
          style: "normal",
        },
        {
          name: "Mono",
          data: font,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );

  // Convert SVG to PNG
  const resvg = new Resvg(svg, {
    background: "#0d1117",
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // Save to Downloads folder
  const downloadsDir = join(homedir(), "Downloads");
  if (!existsSync(downloadsDir)) {
    mkdirSync(downloadsDir, { recursive: true });
  }

  const filename = `cli-wrapped-${year}.png`;
  const filepath = join(downloadsDir, filename);

  writeFileSync(filepath, pngBuffer);

  // Try to copy to clipboard
  const copiedToClipboard = copyImageToClipboard(filepath);

  // Generate alt text
  const altText = generateAltText(analysis, year, shell, headline);

  return { filepath, copiedToClipboard, altText };
}
