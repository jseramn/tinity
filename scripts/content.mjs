#!/usr/bin/env node
/**
 * Generate landing content artifacts from repo sources.
 * Writes changelog.json and public twins (llms.txt, index.md, changelog.md, design.md).
 */
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const landing = path.join(root, "landing");
const pub = path.join(landing, "public");
const contentDir = path.join(landing, "src", "content");

mkdirSync(pub, { recursive: true });
mkdirSync(contentDir, { recursive: true });

const changelogMd = readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
const designMd = readFileSync(path.join(landing, "DESIGN.md"), "utf8");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const agentsSrc = readFileSync(
  path.join(landing, "src", "experience", "agents.ts"),
  "utf8",
);

const AGENT_RE =
  /\{\s*id:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*href:\s*"([^"]+)"\s*\}/g;
const agents = [...agentsSrc.matchAll(AGENT_RE)].map((m) => ({
  id: m[1],
  label: m[2],
  href: m[3],
  status: "idle",
}));

function parseChangelog(md) {
  const re = /^## \[([^\]]+)\](?: - (\d{4}-\d{2}-\d{2}))?\s*$/gm;
  const matches = [...md.matchAll(re)];
  return matches.map((match, i) => {
    const version = match[1];
    const date = match[2] ?? null;
    const start = match.index + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : md.length;
    const body = md.slice(start, end).trim();
    const highlights = [...body.matchAll(/^[-*]\s+(.+)$/gm)].map((item) =>
      item[1].trim(),
    );
    return { version, date, highlights };
  });
}

const changelog = parseChangelog(changelogMd);
writeFileSync(
  path.join(contentDir, "changelog.json"),
  `${JSON.stringify(changelog, null, 2)}\n`,
);

writeFileSync(path.join(pub, "changelog.md"), changelogMd);
writeFileSync(path.join(pub, "design.md"), designMd);

const markSrc = path.join(root, "brand", "tinity-mark.svg");
if (existsSync(markSrc)) {
  copyFileSync(markSrc, path.join(pub, "favicon.svg"));
  copyFileSync(markSrc, path.join(pub, "tinity-mark.svg"));
}

const harnessRows = agents
  .map((a) => `| ${a.label} | \`${a.id}\` | ${a.status} | ${a.href} |`)
  .join("\n");

const indexMd = `# Tinity

Tinity is an agentic systems engineering framework designed to build a harness-of-harnesses infrastructure for AI testing and evaluation. MIT license. The vision is not to replace or drive any other harness out of the market. Tinity exists to be a friend to all, to work alongside other harnesses and orchestrate them, putting advanced tools in creative developers' hands. Layer 8 will be agent-based.

- Version: ${pkg.version}
- Repository: https://github.com/jseramn/tinity
- License: MIT
- Production path: https://tinity.jseramn.tech/

## What runs today

| Slice | Status |
|-------|--------|
| Marketing landing (Vite React 19, lattice Stage) | shipped |
| cursor-gateway v0.1.0 (localhost OpenAI-compat wrap around cursor-agent) | shipped |
| Connector pattern library | shipped (library only, no live Slack) |
| OpenClaw ↔ Hermes contract | in design |
| Policy layer 2.1 (rules, SQLite audit, CLI) | next |
| Harness adoption over Slack | next |
| Layer 8 (runtimes, sandboxes, fleets) | later |

There is not yet an in-tree sandbox controller or fleet scheduler.

## Harnesses

${agents.length} harnesses on the landing. All status \`${"idle"}\` until a connector reports live.

| Label | Id | Status | URL |
|-------|----|--------|-----|
${harnessRows}

## Agent files

- [llms.txt](./llms.txt)
- [index.md](./index.md) (this page)
- [changelog.md](./changelog.md)
- [design.md](./design.md)
- [README](https://github.com/jseramn/tinity/blob/main/README.md)
`;

writeFileSync(path.join(pub, "index.md"), indexMd);

const llmsTxt = `# Tinity

> A harness-of-harnesses for AI testing and evaluation. Friend to all harnesses. Layer 8 will be agent-based.

Tinity studies, evaluates, designs, and implements infrastructure for AI harnesses. It is not a firm and not a chatbot. Current release: v${pkg.version}.

## Files

- [Overview](https://tinity.jseramn.tech/index.md): manifesto, slices, harness statuses
- [Changelog](https://tinity.jseramn.tech/changelog.md): Keep a Changelog
- [Design system](https://tinity.jseramn.tech/design.md): DESIGN.md tokens
- [Source](https://github.com/jseramn/tinity): MIT

## Optional

- [Human surface](https://tinity.jseramn.tech/): lattice + marketing spine
- [Agent surface](https://tinity.jseramn.tech/?surface=agent): same URL, markdown twin
`;

writeFileSync(path.join(pub, "llms.txt"), llmsTxt);

console.log(
  `content: ${changelog.length} changelog entries, ${agents.length} harnesses, v${pkg.version}`,
);
