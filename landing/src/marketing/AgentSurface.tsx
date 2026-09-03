import { useEffect, useState } from "react";
import { Nav } from "./Nav";

export function AgentSurface() {
  const [text, setText] = useState("Loading index.md…");
  const [copied, setCopied] = useState(false);
  const href = `${import.meta.env.BASE_URL}index.md`;

  useEffect(() => {
    let alive = true;
    fetch(href)
      .then((res) => (res.ok ? res.text() : Promise.reject(res.status)))
      .then((body) => {
        if (alive) setText(body);
      })
      .catch(() => {
        if (alive) setText("Could not load index.md.");
      });
    return () => {
      alive = false;
    };
  }, [href]);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="agent-surface">
      <Nav />
      <div className="agent-toolbar">
        <button type="button" className="btn-ghost" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy page"}
        </button>
        <a className="btn-ghost" href={`${import.meta.env.BASE_URL}llms.txt`}>
          llms.txt
        </a>
        <a className="btn-ghost" href={`${import.meta.env.BASE_URL}index.md`}>
          index.md
        </a>
        <a className="btn-ghost" href={`${import.meta.env.BASE_URL}changelog.md`}>
          changelog.md
        </a>
        <a className="btn-ghost" href={`${import.meta.env.BASE_URL}design.md`}>
          design.md
        </a>
        <a
          className="btn-ghost"
          href="https://github.com/jseramn/tinity"
          target="_blank"
          rel="noopener noreferrer"
        >
          README
        </a>
      </div>
      <pre className="agent-md">{text}</pre>
    </div>
  );
}
