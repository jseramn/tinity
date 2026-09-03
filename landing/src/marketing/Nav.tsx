import { useRef } from "react";
import { REPO_HREF } from "../content/version";
import { Lockup } from "./Lockup";
import { useSurface, useWindow } from "./shell";

export function Nav() {
  const { surface, setSurface } = useSurface();
  const { open } = useWindow();
  const menuRef = useRef<HTMLDialogElement>(null);

  const closeMenu = () => {
    menuRef.current?.close();
  };

  return (
    <header className="nav">
      <Lockup />
      <div className="nav-end">
        <div
          className="surface-switch"
          role="group"
          aria-label="Page surface"
        >
          <button
            type="button"
            className="surface-switch-btn"
            aria-pressed={surface === "human"}
            onClick={() => setSurface("human")}
          >
            HUMAN
          </button>
          <button
            type="button"
            className="surface-switch-btn"
            aria-pressed={surface === "agent"}
            title="MCP-readable markdown surface with llms.txt twins"
            onClick={() => setSurface("agent")}
          >
            AGENT
          </button>
        </div>
        <a
          className="btn-ghost nav-desktop"
          href={REPO_HREF}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </a>
        <button
          type="button"
          className="btn-ghost nav-desktop"
          onClick={() => open("docs")}
        >
          Docs · soon
        </button>
        <button
          type="button"
          className="nav-menu"
          aria-label="Open menu"
          onClick={() => menuRef.current?.showModal()}
        >
          Menu
        </button>
      </div>
      <dialog ref={menuRef} className="nav-drawer" onClose={closeMenu}>
        <form method="dialog">
          <button type="submit" className="btn-ghost">
            Close
          </button>
        </form>
        <a
          className="btn-ghost"
          href={REPO_HREF}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </a>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            open("docs");
            closeMenu();
          }}
        >
          Docs · soon
        </button>
        <a className="btn-ghost" href="#status" onClick={closeMenu}>
          Status
        </a>
        <a className="btn-ghost" href="#hub" onClick={closeMenu}>
          Hub
        </a>
        <a className="btn-ghost" href="#slices" onClick={closeMenu}>
          Slices
        </a>
        <a className="btn-ghost" href="#changelog" onClick={closeMenu}>
          Changelog
        </a>
        <a className="btn-ghost" href="#community" onClick={closeMenu}>
          Community
        </a>
        <a className="btn-ghost" href="#faq" onClick={closeMenu}>
          FAQ
        </a>
      </dialog>
    </header>
  );
}
