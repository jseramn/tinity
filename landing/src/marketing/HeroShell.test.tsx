import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HeroCaption } from "./HeroShell";
import { ShellProviders } from "./shell";

describe("HeroCaption", () => {
  it("opens the agent surface from the hero CTA", async () => {
    const user = userEvent.setup();
    render(
      <ShellProviders>
        <HeroCaption />
      </ShellProviders>,
    );
    await user.click(screen.getByRole("button", { name: "Agent surface" }));
    expect(window.location.search).toMatch(/surface=agent/);
  });
});
