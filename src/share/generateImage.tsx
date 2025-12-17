import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { AnalysisResult } from "../types/index.ts";

// Load a basic font for rendering
async function loadFont(): Promise<ArrayBuffer> {
  // Try to load Inter from Google Fonts CDN
  try {
    const response = await fetch(
      "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjp-Ek-_0ew.woff"
    );
    return await response.arrayBuffer();
  } catch {
    // Fallback: try system font on macOS
    try {
      const fontPath = "/System/Library/Fonts/Supplemental/Arial.ttf";
      return readFileSync(fontPath).buffer as ArrayBuffer;
    } catch {
      throw new Error("Could not load font");
    }
  }
}

interface ShareCardProps {
  analysis: AnalysisResult;
  year: number;
  headline?: string;
  shell: string;
}

function ShareCard({ analysis, year, headline, shell }: ShareCardProps) {
  const topCmd = analysis.topCommands[0];
  const topPM = analysis.packageManagers[0];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#0d1117",
        color: "#e6edf3",
        padding: "48px",
        fontFamily: "Inter",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            fontSize: "48px",
            fontWeight: 700,
            color: "#58a6ff",
            marginBottom: "8px",
          }}
        >
          CLI WRAPPED {year}
        </div>
        {headline && (
          <div
            style={{
              fontSize: "24px",
              color: "#f0c14b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            🏆 {headline} 🏆
          </div>
        )}
      </div>

      {/* Main stat */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            fontSize: "64px",
            fontWeight: 700,
            color: "#3fb950",
          }}
        >
          {analysis.totalCommands.toLocaleString()}
        </div>
        <div
          style={{
            fontSize: "24px",
            color: "#8b949e",
            marginLeft: "12px",
            alignSelf: "flex-end",
            marginBottom: "12px",
          }}
        >
          commands
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginBottom: "32px",
        }}
      >
        {topCmd && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: "16px", color: "#8b949e" }}>Top Command</div>
            <div style={{ fontSize: "28px", fontWeight: 600, color: "#f0c14b" }}>
              {topCmd.command}
            </div>
            <div style={{ fontSize: "14px", color: "#8b949e" }}>
              {topCmd.count.toLocaleString()}x
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: "16px", color: "#8b949e" }}>Peak Hour</div>
          <div style={{ fontSize: "28px", fontWeight: 600, color: "#a371f7" }}>
            {analysis.peakHour}:00
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: "16px", color: "#8b949e" }}>Peak Day</div>
          <div style={{ fontSize: "28px", fontWeight: 600, color: "#a371f7" }}>
            {analysis.peakDay}
          </div>
        </div>

        {topPM && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: "16px", color: "#8b949e" }}>Favorite PM</div>
            <div style={{ fontSize: "28px", fontWeight: 600, color: "#58a6ff" }}>
              {topPM.manager}
            </div>
          </div>
        )}
      </div>

      {/* Git stats */}
      {analysis.gitStats && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "48px",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>📝</span>
            <span style={{ fontSize: "20px", color: "#3fb950" }}>
              {analysis.gitStats.totalCommits} commits
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>⬆️</span>
            <span style={{ fontSize: "20px", color: "#58a6ff" }}>
              {analysis.gitStats.totalPushes} pushes
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>⬇️</span>
            <span style={{ fontSize: "20px", color: "#a371f7" }}>
              {analysis.gitStats.totalPulls} pulls
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "auto",
          borderTop: "1px solid #30363d",
          paddingTop: "24px",
        }}
      >
        <div style={{ fontSize: "16px", color: "#8b949e" }}>
          Shell: {shell} • {analysis.uniqueCommands.toLocaleString()} unique commands
        </div>
        <div style={{ fontSize: "16px", color: "#58a6ff" }}>
          github.com/kmelve/cli-wrapped
        </div>
      </div>
    </div>
  );
}

export async function generateShareImage(
  analysis: AnalysisResult,
  year: number,
  shell: string,
  headline?: string
): Promise<string> {
  const font = await loadFont();

  const svg = await satori(
    <ShareCard analysis={analysis} year={year} shell={shell} headline={headline} />,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: font,
          weight: 400,
          style: "normal",
        },
        {
          name: "Inter",
          data: font,
          weight: 600,
          style: "normal",
        },
        {
          name: "Inter",
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
  const filename = `cli-wrapped-${year}.png`;
  const filepath = join(downloadsDir, filename);

  writeFileSync(filepath, pngBuffer);

  return filepath;
}
