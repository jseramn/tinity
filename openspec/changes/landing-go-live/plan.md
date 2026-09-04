# Plan: landing-go-live

## Goal

`tinity.jseramn.tech` is the production surface for Tinity's landing. `jseramn.tech/tinity/*` returns 301 to the new domain. The legacy path stops serving Tinity content.

## Step-by-step for JR

### Step 1 — Create Vercel project for Tinity

1. Go to https://vercel.com/new (or dashboard → Add New → Project).
2. Import the `jseramn/tinity` repository (GitHub).
3. Configure:
   - **Project Name:** `tinity`
   - **Framework Preset:** Vite
   - **Root Directory:** `landing`
   - **Build Command:** `pnpm --dir landing build` (or just `vite build` if root is `landing`)
   - **Output Directory:** `dist` (relative to root, so `landing/dist` from the repo root)
   - **Install Command:** leave default (`pnpm install`)
4. Click Deploy. The first deploy will fail because `landing/node_modules` is checked in already — fix the install command to skip if needed, or `pnpm install --frozen-lockfile=false`.

### Step 2 — Add the custom domain

1. In the Vercel project settings → Domains.
2. Add `tinity.jseramn.tech`.
3. Vercel will show the DNS records to add. Either:
   - **CNAME:** `tinity` → `cname.vercel-dns.com`
   - **A:** `tinity` → `76.76.21.21` (Vercel's anycast IP)

### Step 3 — Configure DNS at registrar

1. Log into your registrar for `jseramn.tech` (Namecheap, Cloudflare, Google Domains, etc.).
2. Add the DNS record Vercel showed you.
3. Wait for propagation (usually minutes, can take up to 48 hours).

### Step 4 — Verify the new domain

```bash
curl -I https://tinity.jseramn.tech/
# Expected: 200 OK, served by Vercel, body contains "Tinity"

curl -s https://tinity.jseramn.tech/ | grep canonical
# Expected: <link rel="canonical" href="https://tinity.jseramn.tech/" />
```

### Step 5 — Apply the portfolio redirect

Status: **APPLIED in commit `12fb305`** by Hermes (via `sdd-orchestrator`). JR pushes when ready.

1. In `~/portfolio/vercel.json`, the redirect rule is now:
   ```json
   {
     "source": "/tinity",
     "destination": "https://tinity.jseramn.tech",
     "permanent": true
   },
   {
     "source": "/tinity/:path*",
     "destination": "https://tinity.jseramn.tech/:path*",
     "permanent": true
   }
   ```
2. The redirects are synthesized from `scripts/sync-vercel-security-headers.mjs` → `buildVercelRedirects()`, not edited directly in `vercel.json` (the script regenerates it on every build).
3. Decision: kept `src/pages/tiny/index.astro` as-is. Reasoning: changing it would break `tinityPage.test.ts` (10/10 tests currently pass on the original page). The Astro React island still serves locally for dev; Vercel's edge redirect takes precedence in production.
4. Tests passing: 8/8 sync script tests, 10/10 tinity-related tests.
5. To push:
   ```bash
   cd ~/portfolio
   git push
   ```
6. Vercel auto-deploys portfolio.

### Step 6 — Verify the redirect

```bash
curl -I https://www.jseramn.tech/tinity/
# Expected: 301, Location: https://tinity.jseramn.tech/

curl -I https://www.jseramn.tech/tinity/assets/index-XXX.js
# Expected: 301, Location: https://tinity.jseramn.tech/assets/index-XXX.js

curl -I https://www.jseramn.tech/tiny
# Expected: 301, Location: https://tinity.jseramn.tech
```

### Step 7 — SEO migration

1. Google Search Console → Settings → Change of Address.
2. From: `https://www.jseramn.tech/tinity/`
3. To: `https://tinity.jseramn.tech/`
4. Submit.
5. Verify `https://tinity.jseramn.tech/sitemap.xml` exists (Vercel auto-generates from landing/dist/sitemap.xml or similar).

### Step 8 — Update external links

1. X bio: `https://x.com/tinityorch` description should link to `tinity.jseramn.tech`, not `jseramn.tech/tinity`.
2. README in `~/tinity/` already points at the new domain (updated in commit `f314f19`).
3. `landing/public/llms.txt` should mention the new domain (sweep in Phase 2 of tasks.md).

## Rollback

If anything breaks:

1. Revert this change's commit in `~/tinity/` (the canonical URL updates).
2. Revert the portfolio commit (the redirect).
3. Remove `tinity.jseramn.tech` from the Vercel project (or keep it, it doesn't hurt).
4. Optional: re-add `src/pages/tiny/index.astro` to portfolio if it was removed.

## Timing

Best done in low-traffic hours. Vercel deploys take ~30 seconds. DNS propagation can take minutes to hours. Search engines take weeks to fully migrate.

## Status

- Phase 1 (OpenSpec): ✅ done
- Phase 2 (landing updates): pending Hermes
- Phase 3 (portfolio redirect): pending JR
- Phase 4 (Vercel + DNS): pending JR
- Phase 5 (SEO + analytics): pending JR
- Phase 6 (verify): pending JR + Hermes
