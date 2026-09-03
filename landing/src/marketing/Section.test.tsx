import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Section } from "./Section";

describe("Section compound", () => {
  it("composes labelled copy without boolean layout props", () => {
    render(
      <Section.Root aria-labelledby="demo-title">
        <Section.Inner>
          <Section.Header>
            <Section.Copy>
              <Section.Eyebrow id="demo-title">STATUS</Section.Eyebrow>
              <Section.Title>Runtime rail</Section.Title>
            </Section.Copy>
            <Section.Dek>Seventeen harnesses. All idle.</Section.Dek>
          </Section.Header>
        </Section.Inner>
      </Section.Root>,
    );
    const region = screen.getByRole("region", { name: "STATUS" });
    expect(region).toHaveClass("section");
    expect(screen.getByRole("heading", { name: "Runtime rail" })).toBeInTheDocument();
    expect(screen.getByText("Seventeen harnesses. All idle.")).toBeInTheDocument();
  });
});
