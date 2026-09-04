/**
 * Accept: text/markdown negotiation helper for Tinity's homepage.
 * Only an explicit markdown type with q > 0 wins. Browser wildcards must not match.
 */
export function prefersMarkdown(acceptHeader) {
  const accept = String(acceptHeader || "").trim();
  if (!accept) return false;
  let markdownQ = null;
  let htmlQ = null;
  for (const part of accept.split(",")) {
    const [rawType, ...params] = part.trim().split(";");
    const type = (rawType || "").trim().toLowerCase();
    let q = 1;
    for (const param of params) {
      const [key, value] = param.trim().split("=");
      if (key.trim() === "q" && value) {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed)) q = parsed;
      }
    }
    if (type === "text/markdown" || type === "text/x-markdown") {
      if (markdownQ == null || q > markdownQ) markdownQ = q;
    }
    if (type === "text/html") {
      if (htmlQ == null || q > htmlQ) htmlQ = q;
    }
  }
  if (markdownQ == null || markdownQ <= 0) return false;
  if (htmlQ == null) return true;
  return markdownQ >= htmlQ;
}

export const config = {
  matcher: ["/", "/index.html"],
};

export default async function middleware(request) {
  if (!prefersMarkdown(request.headers.get("accept"))) return;
  const mdUrl = new URL("/index.md", request.url);
  const res = await fetch(mdUrl);
  const headers = new Headers(res.headers);
  headers.set("Content-Type", "text/markdown; charset=utf-8");
  headers.set("Vary", "Accept, Accept-Encoding");
  return new Response(res.body, { status: res.status, headers });
}
