import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FAQ } from "../content/faq";
import { Faq } from "./Faq";

describe("Faq", () => {
  it("uses exclusive native details named faq", () => {
    const { container } = render(<Faq />);
    const items = container.querySelectorAll("details[name='faq']");
    expect(items).toHaveLength(5);
    expect(FAQ).toHaveLength(5);
    for (const item of FAQ) {
      expect(screen.getByText(item.question)).toBeInTheDocument();
    }
  });
});
