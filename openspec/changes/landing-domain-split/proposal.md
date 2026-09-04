# Proposal: landing-domain-split

## Intent

Split Tinity's landing from the Astro portfolio where it currently lives as a sub-route (`jseramn.tech/tinity/`). Tinity becomes its own deployable subdomain (`tinity.jseramn.tech`) served by its own Vercel project. Portfolio stops mirroring Tinity code.

## Proposal question round

Locked with JR on 2026-09-04:

1. **Tinity = its own subdomain.** `tinity.jseramn.tech`, not a sub-path of `jseramn.tech`.
2. **Portfolio has zero Tinity code.** `src/tinity/`, `public/tinity/`, `pages/tinity/index.astro`, `tinity-pull.mjs`, `tinity-og.py`, all removed.
3. **Tinity monorepo deploys only `/landing`.** `vite.config.ts` base changes from `/tinity/` to `/`.
4. **Vercel project separation.** Tinity Vercel project points to `~/tinity/` with root `landing/`. Portfolio Vercel project points to `~/portfolio/` only.
5. **Branch-based environments.** `main` → production, `stage` → stage env, PR branches → preview.

## Scope

### In Scope

- OpenSpec change `landing-domain-split`
- `landing/vite.config.ts`: `base: "/"` instead of `"/tinity/"`
- `landing/vercel.json`: rewrites without `/tinity/` prefix
- README documents the new deploy model
- Plan document for phases B-E (which JR executes manually)
- Documentation of Vercel project setup (not executed by Hermes)

### Out of Scope

- Removing `src/tinity/`, `public/tiny/`, etc. from portfolio (Fase C, JR)
- Creating Vercel projects (Fase B, JR)
- Cursor workspace cleanup (Fase D, JR)
- DNS cutover (Fase E, JR)
- SEO/redirect configuration (JR, post-cutover)

## Capabilities

### New Capabilities

- `tinity-deploy-isolation`: Tinity landing builds and deploys independently of any other repo.
- `tinity-domain-dedicated`: Tinity serves at `tinity.jseramn.tech`, not as a sub-path.

### Modified Capabilities

- `landing-deployment`: Vite config no longer assumes `/tinity/` base path. Assets paths in the built bundle become root-relative.

## Approach

Three-stage:

1. **Config changes** (this change): update Tinity repo's vite.config and vercel.json to support subdomain serving.
2. **Vercel setup** (JR, Fase B): create Tinity project in Vercel, configure domains and branch mapping.
3. **Portfolio cleanup** (JR, Fase C): remove Tinity code from portfolio, update portfolio vercel.json.
4. **DNS cutover** (JR, Fase E): point `tinity.jseramn.tech` to the new Vercel project.

This change covers stage 1 only. Stages 2-4 are documented in `plan.md` and require JR action.

## Affected Areas

- Modified: `landing/vite.config.ts`, `landing/vercel.json`, `README.md`
- New: `openspec/changes/landing-domain-split/`
- Unchanged: `landing/src/**`, `packages/**`

## Risks

1. **Breaking existing prod while stage 2-4 are pending.** Mitigation: this change is safe to merge without affecting current prod. Prod still served from portfolio until JR cuts over.
2. **Asset path regression.** Vite base change may break absolute asset paths in components. Mitigation: smoke test build locally before merge.
3. **Build may produce different output hash.** CDN cache invalidation needed at cutover. Mitigation: Vercel handles this automatically on project switch.

## Rollback Plan

Revert `landing/vite.config.ts` and `landing/vercel.json` to current state. No production impact until Vercel project is created and DNS is switched (JR's actions).

## Dependencies

- None. This change is self-contained.

## Success Criteria

- [ ] `vite.config.ts` has `base: "/"`
- [ ] `vercel.json` has no `/tinity/` references in rewrites
- [ ] `pnpm --dir landing build` succeeds and produces a working bundle
- [ ] Built bundle assets are root-relative (no `/tinity/` prefix in `dist/`)
- [ ] README documents the deploy model
- [ ] Plan document covers phases B-E
- [ ] Files unstaged; no commit (per repo convention)

## Estimated changed lines

~30-50 lines authored (config changes + docs). 400-line budget risk: None.
