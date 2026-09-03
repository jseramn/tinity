import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HARNESSES } from "../content/harnesses";
import { VERSION } from "../content/version";
import { StatusBar } from "./StatusBar";

describe("StatusBar", () => {
  it("shows RUNS ON v0.1.0 and 17 idle pips", () => {
    render(<StatusBar />);
    const version = screen.getByRole("link", { name: `RUNS ON v${VERSION}` });
    expect(version).toHaveAttribute(
      "href",
      "https://github.com/jseramn/tinity/releases/tag/v0.1.0",
    );
    const pips = screen.getAllByRole("listitem");
    expect(pips).toHaveLength(17);
    expect(HARNESSES).toHaveLength(17);
    expect(screen.getByText("17 IDLE")).toBeInTheDocument();
    for (const pip of pips) {
      expect(pip).toHaveAttribute("data-status", "idle");
      expect(pip).toHaveAttribute("aria-label", expect.stringMatching(/ — idle$/));
    }
  });
});
