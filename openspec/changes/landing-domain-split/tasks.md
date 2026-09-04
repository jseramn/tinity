# Tasks: landing-domain-split

## Review Workload Forecast

Estimated changed lines: ~30-50. 400-line budget risk: None. Do not commit unless asked.

## Phase 1: Specs and planning

- [x] 1.1 Diagnose portfolio ↔ tinity coupling (read-only).
- [x] 1.2 Identify all files in portfolio that reference Tinity.
- [x] 1.3 Author OpenSpec artifacts (proposal, design, tasks, plan).

## Phase 2: Tinity repo config

- [ ] 2.1 Change `landing/vite.config.ts` base from `/tinity/` to `/`.
- [ ] 2.2 Change `landing/vercel.json` rewrites to drop `/tinity/` prefix.
- [ ] 2.3 Update README.md with new deploy model.
- [ ] 2.4 Local build verification: `pnpm --dir landing build`.

## Phase 3: Vercel setup (JR executes)

- [ ] 3.1 Create Vercel project `tinity` pointing to `~/tinity/`.
- [ ] 3.2 Set root directory to `landing`.
- [ ] 3.3 Add domains: `tinity.jseramn.tech` (production), `stage.tinity.jseramn.tech`, `*.tinity.jseramn.tech` for PR previews.
- [ ] 3.4 Configure branch mapping: `main` → production, `stage` → stage.

## Phase 4: Portfolio cleanup (JR executes)

- [ ] 4.1 Delete `src/pages/tiny/index.astro`.
- [ ] 4.2 Delete `src/tinity/` (Tinity code mirror).
- [ ] 4.3 Delete `public/tinity/` (Tinity assets).
- [ ] 4.4 Delete `scripts/tinity-pull.mjs` and `scripts/tinity-pull.test.ts`.
- [ ] 4.5 Delete `scripts/tinity-og.py` if exclusive to Tinity.
- [ ] 4.6 Simplify `vercel.json` (remove `/tinity/(...)` headers).
- [ ] 4.7 Remove `tinity:pull` script from `package.json`.
- [ ] 4.8 Build portfolio locally to verify nothing else breaks.
- [ ] 4.9 Commit and push portfolio changes.

## Phase 5: Cursor workspaces (JR executes)

- [ ] 5.1 Remove `tinity-portfolio-workspace` from Cursor.
- [ ] 5.2 Remove alias `portfolio, tinity` from Cursor.
- [ ] 5.3 Verify only two workspaces remain: `portfolio` and `tinity`.

## Phase 6: DNS cutover (JR executes)

- [ ] 6.1 Verify `tinity.jseramn.tech` resolves to new Vercel project.
- [ ] 6.2 Test landing renders correctly at new domain.
- [ ] 6.3 Add 301 redirect from `jseramn.tech/tinity*` → `tinity.jseramn.tech*` (optional, transition period).
- [ ] 6.4 Update analytics to track new domain.
- [ ] 6.5 Update README, social links, X @tinityorch bio.

## Phase 7: Verify

- [ ] 7.1 `tinity.jseramn.tech` serves the landing independently.
- [ ] 7.2 Portfolio `jseramn.tech` no longer has `/tinity/` route (redirects or 404).
- [ ] 7.3 Tinity repo commits unaffected by portfolio state.
- [ ] 7.4 No 404s on legacy assets.

## Open questions for JR

1. **Branch strategy:** one repo, three branches (`main`, `stage`, `preview`) or one branch with Vercel preview deploys per PR? My proposal: keep `main` as the only branch and use Vercel's PR preview feature for non-production deploys.
2. **Stage env:** is there a separate stage env in Vercel, or do we use preview URLs for staging?
3. **301 redirect period:** how long do we keep the redirect from `jseramn.tech/tinity/*` to `tinity.jseramn.tech/*`?

## Follow-ups (not in this change)

- Update OpenSpec change proposal/design once JR confirms branch strategy.
- Consider adding `landing/CNAME` for explicit domain declaration.
- Consider Vercel deployment protection rules for preview URLs.
