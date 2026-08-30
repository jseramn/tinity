import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("brand CTA", () => {
  it("renders one primary tinity me control after idle", async () => {
    render(<App />);
    const button = await screen.findByRole("button", { name: "tinity me" });
    expect(button).toHaveTextContent("tinity me");
    expect(screen.getAllByRole("button", { name: "tinity me" })).toHaveLength(1);
  });
});
