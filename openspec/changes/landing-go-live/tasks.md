# Tasks: landing-go-live

## Review Workload Forecast

Estimated changed lines: ~40-60. 400-line budget risk: None. Do not commit unless asked.

## Phase 1: Specs and planning

- [x] 1.1 Author OpenSpec artifacts (proposal, design, tasks, plan).
- [x] 1.2 Identify all hardcoded `jseramn.tech/tinity/` references in landing.
- [x] 1.3 Identify the redirect strategy for portfolio.

## Phase 2: Landing updates (Hermes, commiteable)

- [ ] 2.1 Add `<link rel="canonical" href="https://tinity.jseramn.tech/">` to `landing/index.html`.
- [ ] 2.2 Update `og:url` to `https://tinity.jseramn.tech/`.
- [ ] 2.3 Sweep `landing/public/*.md` for hardcoded `jseramn.tech/tinity/` paths.
- [ ] 2.4 Update `landing/README.md` if present with the new domain.
- [ ] 2.5 Update root `README.md` links to `tinity.jseramn.tech`.

## Phase 3: Portfolio redirect shell (JR executes)

- [ ] 3.1 Add redirect rule to `portfolio/vercel.json`:
  ```json
  {
    "source": "/tinity/:path*",
    "destination": "https://tinity.jseramn.tech/:path*",
    "statusCode": 301
  }
  ```
- [ ] 3.2 Decide: keep `src/pages/tiny/index.astro` (as a redirect stub) or remove it.
  - **Recommendation:** keep `vercel.json` redirect only, remove the Astro page. Simpler, fewer moving parts.
- [ ] 3.3 Build portfolio locally: `pnpm --dir portfolio build`. Verify no broken references to deleted Tinity mirror.
- [ ] 3.4 Commit and push portfolio changes.

## Phase 4: Vercel + DNS cutover (JR executes)

- [ ] 4.1 Create Vercel project `tinity` pointing to `~/tinity/`, root directory `landing/`.
- [ ] 4.2 Add domain `tinity.jseramn.tech` to the new Vercel project.
- [ ] 4.3 Configure DNS at registrar: CNAME or A record for `tinity` → Vercel.
- [ ] 4.4 Wait for DNS propagation (up to 48 hours).
- [ ] 4.5 Verify `https://tinity.jseramn.tech/` serves the landing over HTTPS.
- [ ] 4.6 Verify `https://www.jseramn.tech/tinity/` returns 301 → `https://tinity.jseramn.tech/`.
- [ ] 4.7 Verify all asset paths redirect correctly (splat `:path*`).

## Phase 5: SEO + analytics

- [ ] 5.1 Submit new sitemap to Google Search Console (`https://tinity.jseramn.tech/sitemap.xml`).
- [ ] 5.2 Use Search Console "Change of Address" tool pointing jseramn.tech → tinity.jseramn.tech.
- [ ] 5.3 Update PostHog / analytics to track the new host as primary.
- [ ] 5.4 Update social links (X @tinityorch bio, README, llms.txt).

## Phase 6: Verify

- [ ] 6.1 Landing tests still pass: `pnpm --dir landing test` and `pnpm --dir landing build`.
- [ ] 6.2 Portfolio build still passes: `pnpm --dir portfolio build`.
- [ ] 6.3 Both `tinity.jseramn.tech` and `jseramn.tech/tinity/` resolve correctly.
- [ ] 6.4 No 404s on old `jseramn.tech/tinity/assets/*` paths.

## Open questions for JR

1. **Portfolio Astro page:** keep as redirect stub or remove entirely? My recommendation: remove and rely on vercel.json only.
2. **Redirect period:** keep the 301 indefinitely, or remove after 90 days? My recommendation: keep indefinitely (cheap, preserves SEO).
3. **og:image URL:** should the og:image stay on jseramn.tech (old host) or move to tinity.jseramn.tech? My recommendation: move to tinity.jseramn.tech for cleanliness.

## Follow-ups (not in this change)

- Full portfolio cleanup (remove src/tinity/, public/tinity/, scripts/tinity-pull.mjs) — this is `landing-repo-split`, separate change.
- Update Vercel project description, env vars, and any team-level settings.
- Update Notion, Linear, GitHub issues, and any other tracking links that reference the old path.
