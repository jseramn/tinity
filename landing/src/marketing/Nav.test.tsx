import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Nav } from "./Nav";
import { ShellProviders } from "./shell";

describe("Nav", () => {
  it("renders lockup, surface switch, GitHub, and Docs", () => {
    render(
      <ShellProviders>
        <Nav />
      </ShellProviders>,
    );
    expect(screen.getByRole("link", { name: "Tinity home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "HUMAN" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "AGENT" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getAllByRole("link", { name: "GitHub ↗" }).length).toBeGreaterThan(0);
    const docs = screen.getAllByRole("link", { name: "Docs" });
    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0]).toHaveAttribute("href", "/developers");
  });

  it("switches to the agent surface via query", async () => {
    const user = userEvent.setup();
    render(
      <ShellProviders>
        <Nav />
      </ShellProviders>,
    );
    await user.click(screen.getByRole("button", { name: "AGENT" }));
    expect(screen.getByRole("button", { name: "AGENT" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(window.location.search).toMatch(/surface=agent/);
  });
});
