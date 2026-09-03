import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ShellProviders, useSurface, useWindow } from "./shell";

function Probe() {
  const { surface, setSurface } = useSurface();
  const { id, open, close } = useWindow();
  return (
    <div>
      <span data-testid="surface">{surface}</span>
      <span data-testid="window">{id ?? "none"}</span>
      <button type="button" onClick={() => setSurface("agent")}>
        to-agent
      </button>
      <button type="button" onClick={() => open("changelog")}>
        to-log
      </button>
      <button type="button" onClick={close}>
        close-win
      </button>
    </div>
  );
}

describe("shell query state", () => {
  it("writes surface and window params", async () => {
    const user = userEvent.setup();
    render(
      <ShellProviders>
        <Probe />
      </ShellProviders>,
    );
    expect(screen.getByTestId("surface")).toHaveTextContent("human");
    await user.click(screen.getByRole("button", { name: "to-agent" }));
    expect(screen.getByTestId("surface")).toHaveTextContent("agent");
    expect(window.location.search).toMatch(/surface=agent/);
    await user.click(screen.getByRole("button", { name: "to-log" }));
    expect(screen.getByTestId("window")).toHaveTextContent("changelog");
    expect(window.location.search).toMatch(/w=changelog/);
    await user.click(screen.getByRole("button", { name: "close-win" }));
    expect(screen.getByTestId("window")).toHaveTextContent("none");
  });
});
