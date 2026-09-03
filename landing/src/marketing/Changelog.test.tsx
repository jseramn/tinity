import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CHANGELOG, datedChangelog } from "../content/changelog";
import { Changelog } from "./Changelog";
import { ShellProviders } from "./shell";

describe("Changelog cards", () => {
  it("shows the three latest dated entries", () => {
    render(
      <ShellProviders>
        <Changelog />
      </ShellProviders>,
    );
    const dated = datedChangelog(CHANGELOG).slice(0, 3);
    expect(dated).toHaveLength(3);
    for (const entry of dated) {
      expect(screen.getByText(`v${entry.version}`)).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Full changelog" })).toBeInTheDocument();
  });
});
