import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SLICE_STATUSES, SLICES } from "../content/slices";
import { Slices } from "./Slices";

describe("Slices", () => {
  it("renders six cells with allowed statuses", () => {
    render(<Slices />);
    expect(SLICES).toHaveLength(6);
    const cards = screen.getAllByRole("listitem");
    expect(cards).toHaveLength(6);
    for (const slice of SLICES) {
      expect(SLICE_STATUSES).toContain(slice.status);
      expect(screen.getByText(slice.title)).toBeInTheDocument();
    }
    expect(screen.getAllByText("SHIPPED").length).toBeGreaterThan(0);
    expect(screen.getByText("IN DESIGN")).toBeInTheDocument();
    expect(screen.getByText("LATER")).toBeInTheDocument();
  });
});
