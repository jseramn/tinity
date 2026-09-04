import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { prefersMarkdown } from "../middleware.js";

const SITE = "https://tinity.jseramn.tech";

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function noscriptInner(html: string): string {
  const match = html.match(/<noscript>([\s\S]*?)<\/noscript>/i);
  expect(match, "homepage must include <noscript> crawler article").toBeTruthy();
  return match![1];
}

function jsonLdGraph(html: string): Array<Record<string, unknown>> {
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  expect(match).toBeTruthy();
  const parsed = JSON.parse(match![1]) as {
    "@graph"?: Array<Record<string, unknown>>;
    "@type"?: string;
  };
  if (Array.isArray(parsed["@graph"])) return parsed["@graph"];
  return [parsed];
}

describe("homepage crawler HTML", () => {
  const html = readFileSync("index.html", "utf8");

  it("serves ≥500 characters of noscript prose with H1 then H2", () => {
    const inner = noscriptInner(html);
    const text = stripTags(inner);
    expect(text.length).toBeGreaterThanOrEqual(500);
    expect(inner).toMatch(/<h1\b/i);
    expect(inner).toMatch(/<h2\b/i);
    const levels = [...inner.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeGreaterThan(levels[i - 1] - 1);
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
    expect(inner).not.toMatch(/tinity me/i);
  });

  it("keeps crawler article outside #root and ForceField", () => {
    expect(html).toMatch(/id="root"/);
    const rootAt = html.indexOf('id="root"');
    const noscriptAt = html.indexOf("<noscript>");
    expect(noscriptAt).toBeGreaterThan(rootAt);
    expect(html).toContain("<!-- tinity-crawler-start -->");
    expect(html).toContain("<!-- tinity-crawler-end -->");
  });

  it("sets og:type website and identity JSON-LD", () => {
    expect(html).toMatch(/property="og:type"\s+content="website"/);
    const types = jsonLdGraph(html).map((node) => node["@type"]);
    expect(types).toContain("SoftwareApplication");
    expect(types).toContain("SoftwareSourceCode");
    expect(types).toContain("Person");
    const app = jsonLdGraph(html).find((node) => node["@type"] === "SoftwareApplication");
    expect(app?.name).toBe("Tinity");
    expect(app?.url).toBe(`${SITE}/`);
    expect(app?.description).toEqual(expect.any(String));
  });
});

describe("agent static files", () => {
  const pages = ["about", "contact", "privacy", "developers"] as const;

  it("ships 404.html pointing agents at sitemap and llms.txt", () => {
    const body = readFileSync("public/404.html", "utf8");
    expect(body).toMatch(/llms\.txt/);
    expect(body).toMatch(/sitemap\.xml/);
    expect(body).toMatch(/index\.md/);
    expect(stripTags(body).length).toBeGreaterThan(40);
  });

  it("ships robots.txt and sitemap.xml for real URLs", () => {
    const robots = readFileSync("public/robots.txt", "utf8");
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
    const sitemap = readFileSync("public/sitemap.xml", "utf8");
    expect(sitemap).toContain("<urlset");
    expect(sitemap).toContain("<lastmod>");
    for (const path of ["/", "/about", "/contact", "/privacy", "/developers", "/index.md", "/llms.txt"]) {
      expect(sitemap).toContain(`<loc>${SITE}${path === "/" ? "/" : path}</loc>`);
    }
  });

  it("ships trust and developers pages with ≥500 characters", () => {
    for (const page of pages) {
      expect(existsSync(`public/${page}.html`)).toBe(true);
      expect(existsSync(`public/${page}.md`)).toBe(true);
      const html = readFileSync(`public/${page}.html`, "utf8");
      const md = readFileSync(`public/${page}.md`, "utf8");
      expect(stripTags(html).length).toBeGreaterThanOrEqual(500);
      expect(md.length).toBeGreaterThanOrEqual(500);
      expect(html).toMatch(/<h1\b/i);
      expect(html).toContain(`rel="canonical"`);
    }
  });

  it("tells agents when to use Tinity and that there is no hosted API", () => {
    const llms = readFileSync("public/llms.txt", "utf8");
    expect(llms).toMatch(/When to use/i);
    expect(llms).toMatch(/When not to use/i);
    expect(llms).toMatch(/cursor-gateway/i);
    expect(llms).toMatch(/127\.0\.0\.1:4390/);
    const developers = readFileSync("public/developers.md", "utf8");
    expect(developers).toMatch(/does not expose a public multi-tenant API/i);
    expect(developers).toMatch(/127\.0\.0\.1:4390/);
    expect(developers).toMatch(/no hosted sandbox/i);
  });
});

describe("markdown Accept helper", () => {
  it("prefers markdown only when q allows it", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
    expect(prefersMarkdown("text/html")).toBe(false);
    expect(prefersMarkdown("text/html,application/xhtml+xml")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=0, text/html")).toBe(false);
    expect(prefersMarkdown("text/html;q=0.8, text/markdown;q=0.9")).toBe(true);
    expect(prefersMarkdown("")).toBe(false);
  });

  it("keeps root and landing middleware copies identical", () => {
    const landing = readFileSync("middleware.js", "utf8");
    const root = readFileSync("../middleware.js", "utf8");
    expect(landing).toBe(root);
  });
});
