import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir, platform } from "os";
import { execSync } from "child_process";
import type { AnalysisResult } from "../types/index.ts";

export type ScreenType = "summary" | "commands" | "time" | "struggles" | "git" | "packages";

export interface ShareResult {
  filepath: string;
  copiedToClipboard: boolean;
  altText: string;
}

// Load a monospace font for rendering
async function loadFont(): Promise<ArrayBuffer> {
  const systemFonts = [
    "/System/Library/Fonts/Monaco.ttf",
    "/System/Library/Fonts/SFMono-Regular.otf",
    "/System/Library/Fonts/Menlo.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/TTF/DejaVuSansMono.ttf",
    "C:\\Windows\\Fonts\\consola.ttf",
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

  try {
    const response = await fetch(
      "https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.3/files/jetbrains-mono-latin-400-normal.woff"
    );
    if (!response.ok) throw new Error(`Font fetch failed: ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) throw new Error("Font URL returned HTML");
    return await response.arrayBuffer();
  } catch (err) {
    throw new Error(`Could not load any font: ${err}`);
  }
}

// Common wrapper for all cards
function CardWrapper({ children, year, title, emoji, roast }: { children: React.ReactNode; year: number; title: string; emoji: string; roast?: string }) {
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: "#58a6ff" }}>
          {`CLI WRAPPED ${year}`}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#f0c14b", marginTop: 8 }}>
          {`${emoji} ${title}`}
        </div>
      </div>
      {children}
      {roast ? (
        <div style={{ display: "flex", alignItems: "center", marginTop: 24, padding: 16, backgroundColor: "#161b22", borderRadius: 8 }}>
          <div style={{ display: "flex", fontSize: 20, marginRight: 12 }}>🤖</div>
          <div style={{ display: "flex", flex: 1, fontSize: 16, fontStyle: "italic", color: "#8b949e" }}>
            {roast}
          </div>
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "auto",
          borderTop: "1px solid #30363d",
          paddingTop: 24,
        }}
      >
        <div style={{ display: "flex", fontSize: 16, color: "#58a6ff" }}>
          github.com/kmelve/cli-wrapped
        </div>
      </div>
    </div>
  );
}

// Top Commands Card
function TopCommandsCard({ analysis, year, roast }: { analysis: AnalysisResult; year: number; roast?: string }) {
  const maxCount = analysis.topCommands[0]?.count ?? 1;
  const top5 = analysis.topCommands.slice(0, 5);

  return (
    <CardWrapper year={year} title="Your Top Commands" emoji="🏆" roast={roast}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {top5.map((cmd, i) => {
          const barWidth = Math.round((cmd.count / maxCount) * 400);
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", width: 30, fontSize: 20 }}>{medal}</div>
              <div style={{ display: "flex", width: 120, fontSize: 24, fontWeight: 600, color: i < 3 ? "#f0c14b" : "#e6edf3" }}>
                {cmd.command}
              </div>
              <div style={{ display: "flex", width: barWidth, height: 24, backgroundColor: "#3fb950", borderRadius: 4 }} />
              <div style={{ display: "flex", fontSize: 18, color: "#8b949e", marginLeft: 8 }}>
                {`${cmd.count.toLocaleString()} (${cmd.percentage.toFixed(1)}%)`}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
        <div style={{ display: "flex", fontSize: 20, color: "#8b949e" }}>
          {`${analysis.totalCommands.toLocaleString()} total • ${analysis.uniqueCommands.toLocaleString()} unique commands`}
        </div>
      </div>
    </CardWrapper>
  );
}

// Time Patterns Card
function TimeCard({ analysis, year, roast }: { analysis: AnalysisResult; year: number; roast?: string }) {
  const maxHour = Math.max(...analysis.timePatterns.map(t => t.count));
  const maxDay = Math.max(...analysis.dayPatterns.map(d => d.count));

  return (
    <CardWrapper year={year} title="When You Code" emoji="🕐" roast={roast}>
      <div style={{ display: "flex", gap: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 18, color: "#8b949e", marginBottom: 12 }}>Hourly Activity</div>
          <div style={{ display: "flex", alignItems: "flex-end", height: 100, gap: 4 }}>
            {analysis.timePatterns.map((t, i) => {
              const height = maxHour > 0 ? Math.round((t.count / maxHour) * 100) : 0;
              const isPeak = t.hour === analysis.peakHour;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ display: "flex", width: 16, height, backgroundColor: isPeak ? "#f0c14b" : "#a371f7", borderRadius: 2 }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <div style={{ display: "flex", fontSize: 12, color: "#8b949e" }}>12AM</div>
            <div style={{ display: "flex", fontSize: 12, color: "#8b949e" }}>11PM</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 18, color: "#8b949e", marginBottom: 12 }}>Daily Activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {analysis.dayPatterns.map((d, i) => {
              const width = maxDay > 0 ? Math.round((d.count / maxDay) * 200) : 0;
              const isPeak = d.dayName === analysis.peakDay;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", width: 60, fontSize: 14, color: isPeak ? "#f0c14b" : "#e6edf3" }}>
                    {d.dayName.slice(0, 3)}
                  </div>
                  <div style={{ display: "flex", width, height: 16, backgroundColor: isPeak ? "#f0c14b" : "#58a6ff", borderRadius: 2 }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 48, marginTop: 24 }}>
        <div style={{ display: "flex", fontSize: 20, color: "#a371f7" }}>{`Peak: ${analysis.peakHour}:00`}</div>
        <div style={{ display: "flex", fontSize: 20, color: "#f0c14b" }}>{`Peak: ${analysis.peakDay}`}</div>
      </div>
    </CardWrapper>
  );
}

// Struggles Card
function StrugglesCard({ analysis, year, roast }: { analysis: AnalysisResult; year: number; roast?: string }) {
  const struggles = analysis.struggles.slice(0, 4);

  return (
    <CardWrapper year={year} title="The Struggle Was Real" emoji="😅" roast={roast}>
      {struggles.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {struggles.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", fontSize: 24 }}>
                {s.type === "typo" ? "⌨️" : s.type === "rage-sudo" ? "🔐" : s.type === "repeated-failure" ? "🔄" : "📖"}
              </div>
              <div style={{ display: "flex", flex: 1, fontSize: 20, color: "#e6edf3" }}>
                {s.description}
              </div>
              <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: "#f0c14b" }}>
                {`${s.count}x`}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 24, color: "#3fb950" }}>
            No struggles detected! You're a CLI wizard! 🧙‍♂️
          </div>
        </div>
      )}
    </CardWrapper>
  );
}

// Git Stats Card
function GitCard({ analysis, year, roast }: { analysis: AnalysisResult; year: number; roast?: string }) {
  const git = analysis.gitStats;

  if (!git) {
    return (
      <CardWrapper year={year} title="Git Activity" emoji="🔀" roast={roast}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 24, color: "#f0c14b" }}>
            No git activity detected
          </div>
        </div>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper year={year} title="Git Activity" emoji="🔀" roast={roast}>
      <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 48, fontWeight: 700, color: "#3fb950" }}>{git.totalCommits}</div>
          <div style={{ display: "flex", fontSize: 18, color: "#8b949e" }}>commits</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 48, fontWeight: 700, color: "#58a6ff" }}>{git.totalPushes}</div>
          <div style={{ display: "flex", fontSize: 18, color: "#8b949e" }}>pushes</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 48, fontWeight: 700, color: "#a371f7" }}>{git.totalPulls}</div>
          <div style={{ display: "flex", fontSize: 18, color: "#8b949e" }}>pulls</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
        <div style={{ display: "flex", fontSize: 18, color: "#8b949e" }}>{`🌿 ${git.branches} branches`}</div>
        <div style={{ display: "flex", fontSize: 18, color: "#8b949e" }}>{`📦 ${git.stashes} stashes`}</div>
        <div style={{ display: "flex", fontSize: 18, color: "#8b949e" }}>{`🔄 ${git.rebases} rebases`}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
        <div style={{ display: "flex", fontSize: 20, color: "#f0c14b" }}>
          {`Favorite: git ${git.mostUsedGitCommand}`}
        </div>
      </div>
    </CardWrapper>
  );
}

// Package Managers Card
function PackagesCard({ analysis, year, roast }: { analysis: AnalysisResult; year: number; roast?: string }) {
  const pms = analysis.packageManagers.slice(0, 5);
  const maxCount = pms[0]?.count ?? 1;

  return (
    <CardWrapper year={year} title="Package Managers" emoji="📦" roast={roast}>
      {pms.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {pms.map((pm, i) => {
            const barWidth = Math.round((pm.count / maxCount) * 400);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", width: 80, fontSize: 24, fontWeight: 600, color: i === 0 ? "#f0c14b" : "#e6edf3" }}>
                  {pm.manager}
                </div>
                <div style={{ display: "flex", width: barWidth, height: 24, backgroundColor: "#58a6ff", borderRadius: 4 }} />
                <div style={{ display: "flex", fontSize: 18, color: "#8b949e", marginLeft: 8 }}>
                  {`${pm.count} (${pm.percentage.toFixed(0)}%)`}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 24, color: "#8b949e" }}>
            No package manager usage detected
          </div>
        </div>
      )}
    </CardWrapper>
  );
}

// Summary Card (original)
function SummaryCard({ analysis, year, headline, shell, roast }: { analysis: AnalysisResult; year: number; headline?: string; shell: string; roast?: string }) {
  const topCmd = analysis.topCommands[0];
  const topPM = analysis.packageManagers[0];
  const git = analysis.gitStats;

  const stats: Array<{ label: string; value: string; color: string }> = [];
  if (topCmd) stats.push({ label: "Top Command", value: topCmd.command, color: "#f0c14b" });
  stats.push({ label: "Peak Hour", value: `${analysis.peakHour}:00`, color: "#a371f7" });
  stats.push({ label: "Peak Day", value: analysis.peakDay, color: "#a371f7" });
  if (topPM) stats.push({ label: "Favorite PM", value: topPM.manager, color: "#58a6ff" });

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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", fontSize: 48, fontWeight: 700, color: "#58a6ff", marginBottom: headline ? 8 : 0 }}>
          {`CLI WRAPPED ${year}`}
        </div>
        {headline ? <div style={{ display: "flex", fontSize: 24, color: "#f0c14b" }}>{headline}</div> : null}
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", marginBottom: 32 }}>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#3fb950" }}>
          {analysis.totalCommands.toLocaleString()}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#8b949e", marginLeft: 12 }}>commands</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 32 }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 16, color: "#8b949e" }}>{stat.label}</div>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>
      {git ? (
        <div style={{ display: "flex", justifyContent: "center", gap: 48, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", fontSize: 20 }}>📝</div>
            <div style={{ display: "flex", fontSize: 20, color: "#3fb950" }}>{`${git.totalCommits} commits`}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", fontSize: 20 }}>⬆️</div>
            <div style={{ display: "flex", fontSize: 20, color: "#58a6ff" }}>{`${git.totalPushes} pushes`}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", fontSize: 20 }}>⬇️</div>
            <div style={{ display: "flex", fontSize: 20, color: "#a371f7" }}>{`${git.totalPulls} pulls`}</div>
          </div>
        </div>
      ) : null}
      {roast ? (
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16, padding: 16, backgroundColor: "#161b22", borderRadius: 8 }}>
          <div style={{ display: "flex", fontSize: 20, marginRight: 12 }}>🤖</div>
          <div style={{ display: "flex", flex: 1, fontSize: 16, fontStyle: "italic", color: "#8b949e" }}>
            {roast}
          </div>
        </div>
      ) : null}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", borderTop: "1px solid #30363d", paddingTop: 24 }}>
        <div style={{ display: "flex", fontSize: 16, color: "#8b949e" }}>
          {`${shell} shell • ${analysis.uniqueCommands.toLocaleString()} unique commands`}
        </div>
        <div style={{ display: "flex", fontSize: 16, color: "#58a6ff" }}>github.com/kmelve/cli-wrapped</div>
      </div>
    </div>
  );
}

// Alt text generators
function generateAltText(screen: ScreenType, analysis: AnalysisResult, year: number, shell: string, headline?: string): string {
  const base = `CLI Wrapped ${year}`;

  switch (screen) {
    case "commands": {
      const top3 = analysis.topCommands.slice(0, 3).map(c => `${c.command} (${c.count})`).join(", ");
      return `${base} - Top Commands. ${analysis.totalCommands.toLocaleString()} total commands. Top 3: ${top3}. ${analysis.uniqueCommands.toLocaleString()} unique commands.`;
    }
    case "time":
      return `${base} - When You Code. Peak hour: ${analysis.peakHour}:00. Peak day: ${analysis.peakDay}. ${analysis.mostActiveDate ? `Most active date: ${analysis.mostActiveDate.date} with ${analysis.mostActiveDate.count} commands.` : ""}`;
    case "struggles": {
      const struggles = analysis.struggles.slice(0, 3).map(s => s.description).join(" ");
      return `${base} - The Struggle Was Real. ${struggles || "No struggles detected!"}`;
    }
    case "git":
      if (!analysis.gitStats) return `${base} - Git Activity. No git activity detected.`;
      return `${base} - Git Activity. ${analysis.gitStats.totalCommits} commits, ${analysis.gitStats.totalPushes} pushes, ${analysis.gitStats.totalPulls} pulls. Favorite command: git ${analysis.gitStats.mostUsedGitCommand}.`;
    case "packages": {
      const top = analysis.packageManagers[0];
      return `${base} - Package Managers. ${top ? `Favorite: ${top.manager} (${top.percentage.toFixed(0)}%).` : "No package manager usage detected."}`;
    }
    case "summary":
    default: {
      const parts = [base + " stats."];
      if (headline) parts.push(headline + ".");
      parts.push(`${analysis.totalCommands.toLocaleString()} total commands, ${analysis.uniqueCommands.toLocaleString()} unique.`);
      const topCmd = analysis.topCommands[0];
      if (topCmd) parts.push(`Top command: ${topCmd.command} (${topCmd.count.toLocaleString()} times).`);
      parts.push(`Peak activity: ${analysis.peakHour}:00 on ${analysis.peakDay}s.`);
      const topPM = analysis.packageManagers[0];
      if (topPM) parts.push(`Favorite package manager: ${topPM.manager}.`);
      if (analysis.gitStats) parts.push(`Git: ${analysis.gitStats.totalCommits} commits, ${analysis.gitStats.totalPushes} pushes, ${analysis.gitStats.totalPulls} pulls.`);
      parts.push(`Shell: ${shell}.`);
      return parts.join(" ");
    }
  }
}

function copyImageToClipboard(filepath: string): boolean {
  if (platform() !== "darwin") return false;
  try {
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
  headline?: string,
  screen: ScreenType = "summary",
  roast?: string
): Promise<ShareResult> {
  const font = await loadFont();

  let card: React.ReactElement;
  switch (screen) {
    case "commands":
      card = <TopCommandsCard analysis={analysis} year={year} roast={roast} />;
      break;
    case "time":
      card = <TimeCard analysis={analysis} year={year} roast={roast} />;
      break;
    case "struggles":
      card = <StrugglesCard analysis={analysis} year={year} roast={roast} />;
      break;
    case "git":
      card = <GitCard analysis={analysis} year={year} roast={roast} />;
      break;
    case "packages":
      card = <PackagesCard analysis={analysis} year={year} roast={roast} />;
      break;
    case "summary":
    default:
      card = <SummaryCard analysis={analysis} year={year} headline={headline} shell={shell} roast={roast} />;
      break;
  }

  const svg = await satori(card, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Mono", data: font, weight: 400, style: "normal" },
      { name: "Mono", data: font, weight: 600, style: "normal" },
      { name: "Mono", data: font, weight: 700, style: "normal" },
    ],
  });

  const resvg = new Resvg(svg, { background: "#0d1117" });
  const pngBuffer = resvg.render().asPng();

  const downloadsDir = join(homedir(), "Downloads");
  if (!existsSync(downloadsDir)) mkdirSync(downloadsDir, { recursive: true });

  const filename = `cli-wrapped-${year}-${screen}.png`;
  const filepath = join(downloadsDir, filename);
  writeFileSync(filepath, pngBuffer);

  const copiedToClipboard = copyImageToClipboard(filepath);
  const altText = generateAltText(screen, analysis, year, shell, headline);

  return { filepath, copiedToClipboard, altText };
}
