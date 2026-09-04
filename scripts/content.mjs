#!/usr/bin/env node
/**
 * Generate landing content artifacts from repo sources.
 * Writes changelog.json, public twins, trust pages, sitemap, and crawler HTML.
 */
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://tinity.jseramn.tech";
const CRAWLER_START = "<!-- tinity-crawler-start -->";
const CRAWLER_END = "<!-- tinity-crawler-end -->";

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMd(value) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function mdToArticle(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let para = [];
  let list = [];
  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inlineMd(para.join(" "))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      out.push(
        `<ul>${list.map((item) => `<li>${inlineMd(item)}</li>`).join("")}</ul>`,
      );
      list = [];
    }
  };
  for (const line of lines) {
    if (line.startsWith("# ")) {
      flushPara();
      flushList();
      out.push(`<h1>${inlineMd(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      flushPara();
      flushList();
      out.push(`<h2>${inlineMd(line.slice(3))}</h2>`);
    } else if (line.startsWith("|")) {
      flushPara();
      flushList();
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);
      if (!cells.every((cell) => /^:?-+:?$/.test(cell))) {
        para.push(cells.join(" · "));
      }
    } else if (line.startsWith("- ")) {
      flushPara();
      list.push(line.slice(2));
    } else if (line.trim() === "") {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out.join("\n");
}

function pageNav() {
  return `<nav aria-label="Site">
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
    <a href="/privacy">Privacy</a>
    <a href="/developers">Developers</a>
    <a href="/llms.txt">llms.txt</a>
  </nav>`;
}

function staticPage({ title, description, path: pagePath, articleHtml, mdHref }) {
  const canonical = `${SITE}${pagePath}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#1fdb12" />
    <meta name="description" content="${escapeHtml(description)}" />
    <title>${escapeHtml(title)} · Tinity</title>
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" type="text/markdown" href="${mdHref}" title="Markdown" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <style>
      :root { color-scheme: dark; }
      body { margin: 0; background: #050505; color: #e8e8e8; font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.5; }
      main { max-width: 72ch; margin: 0 auto; padding: 48px 24px 96px; }
      a { color: #1fdb12; }
      h1, h2 { font-weight: 500; letter-spacing: -0.03em; }
      nav { display: flex; flex-wrap: wrap; gap: 12px 16px; padding: 16px 24px; border-bottom: 1px solid #222; font-size: 13px; }
      nav a { color: #a3a3a3; text-decoration: none; }
      nav a:hover { color: #e8e8e8; }
    </style>
  </head>
  <body>
    ${pageNav()}
    <main>
      ${articleHtml}
    </main>
  </body>
</html>
`;
}

function writeTwin(page, title, description, markdown) {
  const articleHtml = mdToArticle(markdown);
  writeFileSync(path.join(pub, `${page}.md`), markdown.endsWith("\n") ? markdown : `${markdown}\n`);
  writeFileSync(
    path.join(pub, `${page}.html`),
    staticPage({
      title,
      description,
      path: `/${page}`,
      articleHtml,
      mdHref: `/${page}.md`,
    }),
  );
}

function patchIndexHtml(articleHtml) {
  const file = path.join(landing, "index.html");
  const html = readFileSync(file, "utf8");
  if (!html.includes(CRAWLER_START) || !html.includes(CRAWLER_END)) {
    throw new Error("index.html missing tinity-crawler markers");
  }
  const block = `${CRAWLER_START}
    <noscript>
      <article>
${articleHtml}
      </article>
    </noscript>
    ${CRAWLER_END}`;
  writeFileSync(
    file,
    html.replace(new RegExp(`${CRAWLER_START}[\\s\\S]*?${CRAWLER_END}`), block),
  );
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
- Production path: ${SITE}/

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
- [about.md](./about.md)
- [contact.md](./contact.md)
- [privacy.md](./privacy.md)
- [developers.md](./developers.md)
- [README](https://github.com/jseramn/tinity/blob/main/README.md)
`;

writeFileSync(path.join(pub, "index.md"), indexMd);
patchIndexHtml(mdToArticle(indexMd));

const llmsTxt = `# Tinity

> A harness-of-harnesses for AI testing and evaluation. Friend to all harnesses. Layer 8 will be agent-based.

Tinity studies, evaluates, designs, and implements infrastructure for AI harnesses. It is not a firm and not a chatbot. Current release: v${pkg.version}.

## When to use

Read this site when you are evaluating Tinity as a harness-of-harnesses layer: product intent, which slices are shipped versus later, and how to run the localhost cursor-gateway (OpenAI-compat wrap around cursor-agent on 127.0.0.1:4390). Prefer [index.md](${SITE}/index.md) or \`Accept: text/markdown\` on ${SITE}/ for the same overview. Use [developers.md](${SITE}/developers.md) for clone and local-gateway steps. Use [design.md](${SITE}/design.md) for tokens. Use [changelog.md](${SITE}/changelog.md) for history.

## When not to use

Do not treat tinity.jseramn.tech as a live multi-tenant API, API-key portal, fleet scheduler, Slack bus, or Layer 8 runtime. There is no public eval endpoint and no hosted sandbox here. Idle harness tiles on the landing are marketing status, not live connectors.

## Files

- [Overview](${SITE}/index.md): manifesto, slices, harness statuses
- [Developers](${SITE}/developers.md): local cursor-gateway, no hosted keys
- [About](${SITE}/about.md): what Tinity is
- [Contact](${SITE}/contact.md): GitHub Issues and X
- [Privacy](${SITE}/privacy.md): static-site privacy
- [Changelog](${SITE}/changelog.md): Keep a Changelog
- [Design system](${SITE}/design.md): DESIGN.md tokens
- [Sitemap](${SITE}/sitemap.xml)
- [Source](https://github.com/jseramn/tinity): MIT

## Optional

- [Human surface](${SITE}/): lattice + marketing spine
- [Agent surface](${SITE}/?surface=agent): same URL, markdown twin
`;

writeFileSync(path.join(pub, "llms.txt"), llmsTxt);

const aboutMd = `# About Tinity

Tinity is an agentic systems engineering framework designed to build a harness-of-harnesses infrastructure for AI testing and evaluation. MIT license. The vision is not to replace or drive any other harness out of the market. Tinity exists to be a friend to all, to work alongside other harnesses and orchestrate them, putting advanced tools in creative developers' hands. Layer 8 will be agent-based.

## What Tinity is

Tinity is not a firm and not a chatbot. It is the engineer that builds the harness: a catalog of peer harnesses, a public landing, and a localhost gateway for Cursor's CLI. The human canvas is a one-page lattice Stage. Agents should read the markdown twins and this about page instead of screenshotting the WebGL field.

## What runs today

Version ${pkg.version} ships the marketing landing at ${SITE} and cursor-gateway, a localhost wrap around cursor-agent. The connector library is in-tree as mocks. There is not yet an in-tree sandbox controller or fleet scheduler. Membership in the Vercel open source program is not claimed; the landing is hosted on Vercel while we apply.

## What Tinity is not

Tinity does not replace Cursor, Claude Code, or any other harness. It does not run your agents in the cloud from this domain. Layer 8, eval fleets, and a Slack bus stay future tense until they ship.

## Trust pages

- [Contact](/contact)
- [Privacy](/privacy)
- [Developers](/developers)
- [Source](https://github.com/jseramn/tinity)
`;

const contactMd = `# Contact Tinity

The public contact channel for Tinity is GitHub Issues on the source repository. File bugs, questions, and contribution intent there. The project is early and MIT licensed. Read CONTRIBUTING.md and the Code of Conduct before opening an issue.

## Channels

- GitHub Issues: https://github.com/jseramn/tinity/issues
- Source: https://github.com/jseramn/tinity
- X (product): https://x.com/tinityorch
- X (author): https://x.com/jseramn_
- Author site: https://jseramn.tech

## What we do not publish

No phone number is listed for Tinity. No postal address is listed. Do not invent a billing department or a support inbox that is not linked from this page. CoC enforcement also runs through GitHub Issues.

## Security

If you believe you found a vulnerability in cursor-gateway or the landing, open a GitHub issue without embedding secrets, or follow CONTRIBUTING.md. This site does not accept API keys and does not host a security portal.

## Agents

For machine-readable context use [llms.txt](/llms.txt), [index.md](/index.md), and [sitemap.xml](/sitemap.xml).
`;

const privacyMd = `# Privacy

Tinity's public site at ${SITE} is a static marketing landing plus markdown twins. We do not offer user accounts, sign-in, paid plans, or a hosted product API on this host. You can read the site without creating an identity.

## What we collect on this landing

This landing does not run first-party analytics, advertising pixels, or a tracking cookie banner. We do not set a product session cookie to identify you. Request logs may be processed by the host (Vercel) as part of serving static files. We do not sell personal information.

## What other services process

If you open GitHub Issues, GitHub's privacy policy applies to that conversation. If you follow X links, X's policy applies. Deployments are served from Vercel. The optional localhost cursor-gateway never runs on this domain; it binds 127.0.0.1:4390 on your machine and inherits Cursor login there, not a Tinity account.

## Children and legal

This is developer documentation and a catalog of AI harnesses. It is not directed at children. There is no postal address or phone number to publish. For contact see [contact.md](/contact.md).

## Changes

Privacy text lives in the public repository. Material changes will show up in the changelog and on this page.
`;

const developersMd = `# Developers

Tinity does not expose a public multi-tenant API, API key dashboard, or cloud sandbox on ${SITE}. What shipped for developers is the Git repository, agent-readable twins, and a localhost OpenAI-compat wrap.

## Quickstart

1. Clone https://github.com/jseramn/tinity
2. Read [index.md](/index.md) and [llms.txt](/llms.txt) for what is shipped versus later.
3. Run cursor-gateway locally (not on Vercel): from the repo, use \`pnpm --dir packages/cursor-gateway start\`.
4. Bind is 127.0.0.1:4390. Preflight \`GET /health\` then \`GET /v1/models\` before \`POST /v1/chat/completions\`.
5. Auth is Cursor login on the machine (optional inherited CURSOR_API_KEY). Do not send AI_GATEWAY_API_KEY to the child.

cursor-gateway is not a Vercel Function. It spawns \`cursor-agent\`; it does not reimplement the agent. See packages/cursor-gateway/README.md.

## Agent files

- ${SITE}/llms.txt
- ${SITE}/index.md
- ${SITE}/developers.md (this page)
- ${SITE}/design.md
- ${SITE}/changelog.md
- ${SITE}/sitemap.xml

Send \`Accept: text/markdown\` to ${SITE}/ for the overview twin.

## Sandbox

There is no hosted sandbox. Idle cubes on the lattice are marketing status. Layer 8 runtimes stay later. Do not expect API keys to be issued from this page.
`;

writeTwin(
  "about",
  "About",
  "Tinity is a harness-of-harnesses for AI testing and evaluation. Not a firm. Not a chatbot.",
  aboutMd,
);
writeTwin(
  "contact",
  "Contact",
  "Contact Tinity through GitHub Issues and X. No phone or postal address is published.",
  contactMd,
);
writeTwin(
  "privacy",
  "Privacy",
  "Tinity's public landing is a static site with no user accounts and no first-party analytics.",
  privacyMd,
);
writeTwin(
  "developers",
  "Developers",
  "Local cursor-gateway on 127.0.0.1:4390. No hosted API keys or cloud sandbox on this domain.",
  developersMd,
);

const notFound = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Not found · Tinity</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <pre># Not found

This path does not exist on Tinity.

- [llms.txt](/llms.txt)
- [sitemap.xml](/sitemap.xml)
- [index.md](/index.md)
- [developers](/developers)
- [home](/)
</pre>
  </body>
</html>
`;
writeFileSync(path.join(pub, "404.html"), notFound);

const lastmod =
  changelog.find((entry) => entry.date)?.date ?? "2026-09-04";
const sitemapPaths = [
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/developers",
  "/index.md",
  "/llms.txt",
  "/changelog.md",
  "/design.md",
  "/about.md",
  "/contact.md",
  "/privacy.md",
  "/developers.md",
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths
  .map(
    (pagePath) => `  <url>
    <loc>${SITE}${pagePath}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
writeFileSync(path.join(pub, "sitemap.xml"), `${sitemap}\n`);
writeFileSync(
  path.join(pub, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`,
);

console.log(
  `content: ${changelog.length} changelog entries, ${agents.length} harnesses, v${pkg.version}`,
);
