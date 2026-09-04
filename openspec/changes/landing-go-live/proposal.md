# Proposal: landing-go-live

## Intent

Make `tinity.jseramn.tech` the production surface for Tinity's landing. Stop serving Tinity from `jseramn.tech/tinity/*`. Redirect all traffic from the legacy path to the new subdomain with HTTP 301 so search engines and existing links migrate cleanly.

## Proposal question round

Locked with JR on 2026-09-04:

1. **Production domain = `tinity.jseramn.tech`.** No more `jseramn.tech/tinity/*`.
2. **301 redirect** from legacy path to new subdomain. Permanent, not temporary.
3. **Vercel project separation.** Tinity project serves only the new domain. Portfolio keeps `jseramn.tech` (root).
4. **Portfolio keeps a minimal Tinity shell** that issues the 301 to `tinity.jseramn.tech`. No code mirror, no Tinity bundle inside portfolio.

## Scope

### In Scope

- OpenSpec change `landing-go-live`
- `landing/index.html`: add `<link rel="canonical">` and update `og:url` to `tinity.jseramn.tech`
- `landing/public/llms.txt`, `landing/public/changelog.md`, `landing/public/index.md`, `landing/public/design.md`: replace any hardcoded `jseramn.tech/tinity/` references with `tinity.jseramn.tech/`
- `portfolio/vercel.json`: add redirect rule for `/tinity/*` → `https://tinity.jseramn.tech/:splat` with status 301
- `portfolio/src/pages/tiny/index.astro`: replace TinityApp import with a redirect-only Astro page (or delete and rely on vercel.json rewrite)
- README: update links to point at the new domain
- Plan document with step-by-step Vercel instructions for JR

### Out of Scope

- Removing all Tinity code from portfolio (that is `landing-repo-split`, the larger cleanup) — `landing-go-live` only does the redirect shell
- Creating the new Vercel project for Tinity (JR executes, document is in `plan.md`)
- DNS configuration for `tinity.jseramn.tech` (JR executes in Vercel + registrar)
- Reverting commit `f314f19` — the subdomain-ready config is required for this change to work

## Capabilities

### New Capabilities

- `tinity-domain-redirect`: Any request to `jseramn.tech/tinity/*` returns 301 to `tiny.jseramn.tech/*` with the path and query string preserved.
- `tinity-canonical-url`: The landing declares `https://tinity.jseramn.tech/` as its canonical URL. Search engines consolidate ranking signals to the new domain.

### Modified Capabilities

- `landing-deployment`: The landing's `og:url`, `og:image`, and `alternates` reference the new subdomain, not the legacy sub-path.
- `portfolio-deployment`: Portfolio gains a single redirect rule that emits 301s for `/tinity/*` paths, but no longer bundles Tinity source code.

## Approach

Three sequenced steps:

1. **Landing updates (this change, commiteable).** Update canonical URL, og:url, og:image host, and any inline links in `landing/public/*`. After this lands, the landing is fully self-aware of the new domain.

2. **Portfolio redirect shell (this change, JR-executed).** Add a `vercel.json` redirect rule for `/tinity/*`. Optionally replace `src/pages/tinity/index.astro` with a one-line `<meta http-equiv="refresh">` redirect or rely on `vercel.json` only.

3. **Vercel + DNS cutover (JR-executed, `plan.md`).** Create a new Vercel project `tinity` pointing to `~/tinity/` with root `landing/`, add the `tinity.jseramn.tech` domain, configure DNS, deploy.

The legacy path stops serving Tinity content as soon as step 2 lands. The legacy path stops responding with 200s entirely once `src/pages/tiny/index.astro` is removed (replaced by the redirect shell).

## Affected Areas

- Modified: `landing/index.html`, `landing/public/*.md`, `README.md`
- Modified (JR-executed): `portfolio/vercel.json`, optionally `portfolio/src/pages/tiny/index.astro`
- New: `openspec/changes/landing-go-live/`

## Risks

1. **301 loop.** If both portfolio's `/tinity/*` and Tinity's root have conflicting redirects, browsers loop. Mitigation: portfolio redirects to `tinity.jseramn.tech` (different host, exits the loop).
2. **SEO ranking loss during transition.** Search engines need to see the 301s for ~30 days before consolidating. Mitigation: keep the 301 in place indefinitely; remove portfolio's Tinity Astro page only after search engines confirm migration.
3. **Asset path breakage.** Old links pointing to `jseramn.tech/tinity/assets/*` must redirect to `tinity.jseramn.tech/assets/*`, not 404. Mitigation: use Vercel's splat redirect with `:splat` placeholder.
4. **og:image caching.** Social platforms cache `og:image` URLs. Mitigation: keep the old og:image URL alive (TBD — see follow-ups).

## Rollback Plan

1. Revert this change (single commit, files listed in `tasks.md`).
2. Re-add `src/pages/tiny/index.astro` to portfolio if it was removed.
3. Restore portfolio's `vercel.json` to the previous state.

No production data is migrated, so rollback is purely config.

## Dependencies

- Phase A of `landing-domain-split` already merged (`f314f19`).
- DNS for `tinity.jseramn.tech` must resolve to the new Vercel project (JR executes).
- Vercel project for Tinity must exist and serve the landing (JR executes).

## Success Criteria

- [ ] `landing/index.html` has `<link rel="canonical" href="https://tinity.jseramn.tech/">`
- [ ] `landing/index.html` has `<meta property="og:url" content="https://tinity.jseramn.tech/">`
- [ ] `landing/public/*.md` have no hardcoded `jseramn.tech/tinity/` paths
- [ ] README links point at `tinity.jseramn.tech`
- [ ] `portfolio/vercel.json` has a 301 redirect for `/tinity/*` (proposed patch, JR applies)
- [ ] `plan.md` documents Vercel + DNS steps for JR
- [ ] All landing tests still pass
- [ ] Files unstaged; no commit (per repo convention)

## Estimated changed lines

~40-60 lines authored. 400-line budget risk: None.

## Phasing

This change ships in a single commit. No `size:exception` needed. Phase A (`landing-domain-split`) is already merged and provides the config foundation this change assumes.
