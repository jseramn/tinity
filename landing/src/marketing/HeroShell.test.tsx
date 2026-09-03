import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroCaption } from "./HeroShell";
import { ShellProviders } from "./shell";

describe("HeroCaption", () => {
  it("keeps ghost GitHub and Docs as the only caption actions", () => {
    render(
      <ShellProviders>
        <HeroCaption />
      </ShellProviders>,
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Docs · soon" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agent surface" })).not.toBeInTheDocument();
  });
});
