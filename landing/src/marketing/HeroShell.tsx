import { REPO_HREF } from "../content/version";
import { Stage } from "../experience/Stage";
import { Nav } from "./Nav";
import { useSurface, useWindow } from "./shell";

export function HeroCaption() {
  const { open } = useWindow();
  const { setSurface } = useSurface();
  return (
    <div className="hero-caption">
      <p className="eyebrow">TINITY / HARNESS</p>
      <h1 className="hero-title">A friend to all harnesses.</h1>
      <p className="hero-dek">
        Harness-of-harnesses infrastructure for AI testing and evaluation. Layer
        8 will be agent-based.
      </p>
      <div className="hero-actions">
        <a
          className="btn-ghost"
          href={REPO_HREF}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <button type="button" className="btn-ghost" onClick={() => open("docs")}>
          Docs · soon
        </button>
        <button
          type="button"
          className="btn-ghost btn-ghost--agent"
          onClick={() => setSurface("agent")}
        >
          Agent surface
        </button>
      </div>
      <a className="scroll-hint" href="#status">
        SCROLL
      </a>
    </div>
  );
}

export function HeroShell() {
  return (
    <div className="hero-shell" id="top">
      <Nav />
      <div className="hero-stage">
        <Stage />
      </div>
      <HeroCaption />
    </div>
  );
}
