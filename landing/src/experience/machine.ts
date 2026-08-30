export type Phase = "loader" | "idle" | "revealed";
export type Event = { type: "ready" | "cta" };
export type Slot = "field";

export function reduce(
  phase: Phase,
  event: Event,
  _reducedMotion: boolean,
): Phase {
  switch (event.type) {
    case "ready":
      return phase === "loader" ? "idle" : phase;
    case "cta":
      if (phase === "idle") return "revealed";
      if (phase === "revealed") return "idle";
      return phase;
    default:
      return phase;
  }
}

export function slotFor(_phase: Phase): Slot {
  return "field";
}
