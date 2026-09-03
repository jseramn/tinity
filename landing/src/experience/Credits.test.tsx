import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CREDIT_LINKS, Credits } from "./Credits";

const creditsCss = readFileSync("src/styles/credits.css", "utf8");
const creditsSrc = readFileSync("src/experience/Credits.tsx", "utf8");

describe("credits row", () => {
  it("renders a project-links nav with six external anchors", () => {
    const { container } = render(<Credits />);
    const nav = screen.getByRole("navigation", { name: "Project links" });
    const links = screen.getAllByRole("link");

    expect(nav).toBeInTheDocument();
    expect(links).toHaveLength(6);
    expect(CREDIT_LINKS).toHaveLength(6);
    expect(container.querySelector("button")).toBeNull();
    expect(creditsSrc).not.toMatch(/GlitchAdapter/);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      CREDIT_LINKS.map((item) => item.href),
    );

    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link.getAttribute("aria-label")?.trim().length).toBeGreaterThan(0);
    }
  });

  it("marks the Vercel glyph and the canvasui badge", () => {
    render(<Credits />);
    const vercel = screen.getByRole("link", { name: "Deployed on Vercel" });
    const badge = screen.getByRole("link", { name: "made with canvasui" });

    expect(vercel).toHaveTextContent("Deployed on Vercel");
    expect(vercel.querySelector("svg.credits-vercel-glyph")).not.toBeNull();
    expect(badge).toHaveClass("credits-badge");
    expect(badge).toHaveTextContent("made with canvasui");
    expect(badge.querySelector("svg.credits-canvasui-mark")).not.toBeNull();
    expect(creditsSrc).toMatch(/viewBox="0 0 81 75"/);
    expect(creditsSrc).not.toMatch(/M4\.3 0\.7v10\.6/);
    expect(creditsCss).not.toMatch(/--inverse/);
    expect(creditsCss).not.toMatch(/credits-chip--/);
  });

  it("keeps credits.css free of glass and honors reduced motion", () => {
    expect(creditsCss).not.toMatch(/backdrop-filter/);
    expect(creditsCss).toMatch(/prefers-reduced-motion/);
    expect(creditsCss).toMatch(/max-width:\s*640px/);
    expect(creditsCss).toMatch(/letter-spacing:\s*0\.08em/);
    expect(creditsCss).toMatch(/\.credits-short\.credits-chip/);
  });
});
