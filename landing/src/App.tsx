import { AgentSurface } from "./marketing/AgentSurface";
import { Changelog } from "./marketing/Changelog";
import { Community } from "./marketing/Community";
import { Faq } from "./marketing/Faq";
import { Footer } from "./marketing/Footer";
import { HeroShell } from "./marketing/HeroShell";
import { Hub } from "./marketing/Hub";
import { ShellProviders, useSurface } from "./marketing/shell";
import { Slices } from "./marketing/Slices";
import { StatusBar } from "./marketing/StatusBar";
import { WindowHost } from "./marketing/Window";

function HumanSpine() {
  return (
    <div className="human-spine">
      <HeroShell />
      <StatusBar />
      <Hub />
      <Slices />
      <Changelog />
      <Community />
      <Faq />
      <Footer />
    </div>
  );
}

function Shell() {
  const { surface } = useSurface();
  return (
    <div className="app" data-surface={surface}>
      {surface === "agent" ? <AgentSurface /> : <HumanSpine />}
      <WindowHost />
    </div>
  );
}

export function App() {
  return (
    <ShellProviders>
      <Shell />
    </ShellProviders>
  );
}
