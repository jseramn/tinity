import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AgentMark } from "./AgentMark";
import { AGENT_COUNT, AGENTS, agentById } from "./agents";
import { createElement } from "react";
import { render } from "@testing-library/react";

const tokensCss = readFileSync("src/styles/tokens.css", "utf8");
const marksDir = join(dirname(fileURLToPath(import.meta.url)), "marks");
const agentMarkSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "AgentMark.tsx"),
  "utf8",
);

describe("agent catalog", () => {
  it("locks the 17 harness marks in the requested order", () => {
    expect(AGENTS.map((agent) => agent.id)).toEqual([
      "grok-bot",
      "openclaw",
      "openhands",
      "cursor-cli",
      "qwen-code",
      "claude-code",
      "mastra-code",
      "dcode",
      "cline",
      "crush",
      "goose",
      "aider",
      "grok-build",
      "cursor",
      "pi",
      "hermes",
      "opencode",
    ]);
    expect(AGENT_COUNT).toBe(17);
    expect(new Set(AGENTS.map((agent) => agent.id)).size).toBe(17);
    expect(agentById("claude-code")?.label).toBe("Claude Code");
    expect(agentById("01")).toBeUndefined();
  });

  it("gives every agent a unique official https card", () => {
    const hrefs = AGENTS.map((agent) => agent.href);
    expect(hrefs).toEqual([
      "https://x.ai/bot",
      "https://openclaw.ai",
      "https://openhands.dev",
      "https://cursor.com/cli",
      "https://qwen.ai/qwencode",
      "https://claude.com/product/claude-code",
      "https://mastra.ai",
      "https://www.langchain.com/dcode",
      "https://cline.bot",
      "https://github.com/charmbracelet/crush",
      "https://block.github.io/goose",
      "https://aider.chat",
      "https://x.ai/build",
      "https://cursor.com",
      "https://pi.ai",
      "https://hermes-agent.nousresearch.com",
      "https://opencode.ai",
    ]);
    expect(new Set(hrefs).size).toBe(AGENT_COUNT);
  });

  it("ships one raster mark file per catalog id and no extras", () => {
    const files = readdirSync(marksDir).filter((name) => name.endsWith(".png"));
    expect(files.sort()).toEqual(
      AGENTS.map((agent) => `${agent.id}.png`).sort(),
    );
    for (const agent of AGENTS) {
      expect(existsSync(join(marksDir, `${agent.id}.png`))).toBe(true);
    }
  });

  it("renders each catalog id as a linked img, not a hand-drawn svg path", () => {
    expect(agentMarkSource).toMatch(/<img/);
    expect(agentMarkSource).not.toMatch(/const PI_MARK/);
    expect(agentMarkSource).not.toMatch(/GROK_BOT_HEAD/);
    for (const agent of AGENTS) {
      const { container, unmount } = render(
        createElement(AgentMark, { id: agent.id }),
      );
      const img = container.querySelector("img.cube-mark");
      const svg = container.querySelector("svg.cube-mark");
      const link = container.querySelector("a.cube-mark-link");
      expect(svg).toBeNull();
      expect(img).toBeTruthy();
      expect(img).toHaveAttribute("alt", agent.label);
      expect(img?.getAttribute("src") ?? "").toMatch(
        new RegExp(`${agent.id}\\.png`),
      );
      expect(link).toHaveAttribute("href", agent.href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      unmount();
    }
  });

  it("keeps grok-build and grok-bot on different raster files", () => {
    const bot = render(createElement(AgentMark, { id: "grok-bot" }));
    const build = render(createElement(AgentMark, { id: "grok-build" }));
    const botSrc = bot.container.querySelector("img")?.getAttribute("src");
    const buildSrc = build.container.querySelector("img")?.getAttribute("src");
    expect(botSrc).toMatch(/grok-bot\.png/);
    expect(buildSrc).toMatch(/grok-build\.png/);
    expect(botSrc).not.toEqual(buildSrc);
    bot.unmount();
    build.unmount();
  });

  it("sizes cube marks inside the face so silhouettes cannot reach the cell edge", () => {
    expect(tokensCss).toMatch(
      /\.cube-mark\s*\{[^}]*width:\s*calc\(0\.50 \* var\(--cell-css\)\)/,
    );
    expect(tokensCss).toMatch(
      /\.cube-mark\s*\{[^}]*height:\s*calc\(0\.50 \* var\(--cell-css\)\)/,
    );
    expect(tokensCss).toMatch(/\.cube-mark\s*\{[^}]*object-fit:\s*contain/);
  });
});
