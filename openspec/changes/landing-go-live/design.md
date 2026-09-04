# Design: landing-go-live

## Flow

```
Browser request                    Server response
──────────────────────────────────────────────────────────────

GET jseramn.tech/tinity/  ───────►  301 Location: https://tinity.jseramn.tech/
                                  (portfolio's Vercel project)

GET jseramn.tech/tinity/foo ───►   301 Location: https://tinity.jseramn.tech/foo
                                  (splat preserves the path)

GET tinity.jseramn.tech/  ─────►  200 OK, landing HTML
                                  (Tinity's Vercel project)

GET tinity.jseramn.tech/foo ─►   200 OK, landing HTML (SPA rewrites to index.html)
                                  (Tinity's Vercel project)
```

## Why 301, not 302 or meta refresh

- **301 (Moved Permanently):** Search engines transfer ranking signals to the new URL. Browsers cache the redirect. This is the right choice when the move is permanent.
- **302 (Found):** Temporary. Search engines keep indexing the old URL. Wrong for a permanent move.
- **meta refresh:** Works without server config but is invisible to search engines and slow. Avoid.

## Canonical URL strategy

- `<link rel="canonical" href="https://tinity.jseramn.tech/">` in `landing/index.html` tells search engines which URL is the authoritative version.
- This is independent of the redirect — even direct visitors who typed `tinity.jseramn.tech` see the canonical tag, which helps search engines consolidate.

## og:url strategy

- `<meta property="og:url" content="https://tinity.jseramn.tech/">` tells social platforms which URL to associate with shares.
- og:image stays as `https://tinity.jseramn.tech/tinity-og.png` (same domain now).

## Redirect configuration

### portfolio/vercel.json

```json
{
  "redirects": [
    {
      "source": "/tinity",
      "destination": "https://tinity.jseramn.tech",
      "statusCode": 301
    },
    {
      "source": "/tinity/:path*",
      "destination": "https://tinity.jseramn.tech/:path*",
      "statusCode": 301
    }
  ]
}
```

The first rule handles the bare `/tinity` (no trailing slash, no path). The second handles everything else with the splat placeholder preserving the path.

### Why not a single rule

Vercel's `/:path*` matches one or more segments but does not match the empty path. So `/tinity` and `/tinity/foo` need separate rules, or use a more complex regex.

## Asset paths

The landing's Vite config now uses `base: "/"`. Built bundle assets are referenced as `/assets/index-XXX.js`, `/favicon.svg`, `/tinity-og.png`. These resolve correctly when served from `tinity.jseramn.tech`.

Old paths of the form `jseramn.tech/tinity/assets/index-XXX.js` will 301 redirect to `tinity.jseramn.tech/assets/index-XXX.js` via the splat rule. The browser follows the redirect, gets the asset, done.

## llms.txt and other public files

`landing/public/llms.txt`, `changelog.md`, `index.md`, `design.md` are static files served from the Vercel project root. They can mention `tinity.jseramn.tech` directly. No special handling needed.

## Why not redirect at the registrar level

Some registrars support domain-level redirects (`tinity.jseramn.tech` → `jseramn.tech/tinity`). This is the wrong direction for our case. We want `jseramn.tech/tinity/*` → `tinity.jseramn.tech/*`, not the other way.

If Vercel's redirect doesn't work for any reason, fallback is a Cloudflare Worker or a small edge function on portfolio's Vercel project. Defer until proven necessary.

## Testing

### Local

- Run `pnpm --dir landing build` and verify dist/index.html has the canonical tag.
- Verify all `<a href>` in dist/ point at relative paths or the new domain.

### Production (JR)

- `curl -I https://www.jseramn.tech/tinity/` → 301 with Location header.
- `curl -I https://www.jseramn.tech/tinity/assets/foo.js` → 301 with Location header preserving `/assets/foo.js`.
- `curl -I https://tinity.jseramn.tech/` → 200 with the landing HTML.
- `curl -s https://tinity.jseramn.tech/ | grep canonical` → contains `https://tinity.jseramn.tech/`.

## Rollback

1. Revert this change's commit.
2. In portfolio, remove the redirect rule from vercel.json (or revert).
3. Optionally re-add `src/pages/tiny/index.astro` if it was removed.

DNS changes for `tinity.jseramn.tech` are reversible: remove the domain from the Vercel project, delete the DNS record.

## Open design questions

1. **Astro page vs vercel.json only.** Astro page gives a fallback if vercel.json fails; vercel.json only is simpler. My recommendation: vercel.json only.
2. **Trailing slash.** Vercel handles trailing slashes consistently, but worth testing `/tinity/` and `/tinity` separately.
3. **HTTP → HTTPS.** Vercel redirects HTTP to HTTPS automatically. The 301 destination uses `https://`, so the chain is HTTP→HTTPS→301→HTTPS. No infinite loop.
