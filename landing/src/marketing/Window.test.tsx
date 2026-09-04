import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Changelog } from "./Changelog";
import { Nav } from "./Nav";
import { ShellProviders } from "./shell";
import { WindowHost } from "./Window";

describe("Window", () => {
  it("opens the docs window from ?w=docs and closes on the dialog close button", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/?w=docs");
    render(
      <ShellProviders>
        <Nav />
        <WindowHost />
      </ShellProviders>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeVisible();
    expect(screen.getByRole("heading", { name: "Docs" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(window.location.search).not.toMatch(/w=/);
  });

  it("opens the changelog variant from Full changelog", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/");
    render(
      <ShellProviders>
        <Changelog />
        <WindowHost />
      </ShellProviders>,
    );
    await user.click(screen.getByRole("button", { name: "Full changelog" }));
    expect(window.location.search).toMatch(/w=changelog/);
    expect(screen.getByRole("heading", { name: "Changelog" })).toBeInTheDocument();
  });
});
