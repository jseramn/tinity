# Archive Report: landing-reference-flip

**Change**: landing-reference-flip  
**Archived**: 2026-08-30  
**Project**: tinity  
**Artifact store**: hybrid  
**Archive path**: `openspec/changes/archive/2026-08-30-landing-reference-flip/`  
**reviewGate**: structurally ABSENT (RDD kill switch off; no review started). Archive proceeds under ordinary repository policy. No receipt demanded.

## Observation IDs (Engram, project tinity)

| Artifact | Topic key | Observation ID | Rank |
|----------|-----------|----------------|------|
| proposal | `sdd/landing-reference-flip/proposal` | #767 | planning |
| spec | `sdd/landing-reference-flip/spec` | #768 | planning |
| design | `sdd/landing-reference-flip/design` | #769 | planning |
| tasks | `sdd/landing-reference-flip/tasks` | #770 | completion visibility |
| apply-progress | `sdd/landing-reference-flip/apply-progress` | #771 | lowest (snapshot) |
| verify-report | `sdd/landing-reference-flip/verify-report` | #772 | lowest (snapshot) |
| archive-report | `sdd/landing-reference-flip/archive-report` | this observation | terminal |

Filesystem tasks.md (archived): 14/14 `[x]`, 0 unchecked. Task Completion Gate passed. No checkbox reconciliation.

## Final state at close

Authoritative order: (1) reviewGate absent — ordinary policy; (2) persisted tasks 14/14; (3) orchestrator final-state facts; (4) #772 / #771 as history only.

1. Verify **PASS** (not PASS WITH WARNINGS): 7/7 requirements, **20/20** scenarios COMPLIANT, 0 CRITICAL, 0 WARNING. Evidence revision `sha256:339d2edd9ebb28069e37826ec0a75760298211efaa3103deedee6ea91571452a`. Validator admitted exact bytes. Report: Engram #772 + archived `verify-report.md`.
2. Tasks **14/14** `[x]` including freeze 5.1. No incomplete implementation tasks.
3. Tests at close: `pnpm --dir landing test` → **44 passed / 8 files**, exit 0. Build `pnpm --dir landing build` exit 0.
4. Apply WU1+WU2 both shipped (stacked-to-main chosen; **no git commit / no PR created** — landing tree remains largely untracked). Code lives in:
   - `landing/src/styles/tokens.css`
   - `landing/src/experience/Stage.tsx`
   - `landing/src/experience/Stage.test.tsx`
   - `landing/src/experience/delays.ts`
   - `landing/src/experience/delays.test.ts`
5. Browser (orchestrator, 2026-08-30): CTA flip → 11 numbered glyphs, occupancy/CTA unflipped; second click unflips to 0; `.cube-tumble` wrapper present; sample `--flip-tilt` ≈ 0.707.
6. SUGGESTION only (not a blocker): leftover generic `.cube-face--back { transform: rotateY(180deg); }` for non-numbered faces; numbered backs override with rotate3d.
7. Hard freeze held: no edits under `landing/src/components/canvasui/*`.
8. No `is-settled`, no WAAPI, no three.js. Reverse unflip tumble remains **out of this change** (documented deferred risk, not an open task).

Snapshots #771 and #772 agree with these close facts (14/14, PASS, 44/44). No unrankable contradiction.

## Specs synced

Main `openspec/specs/` was empty (`.gitkeep` only). Delta is ADDED + MODIFIED only (no REMOVED / RENAMED). `rules.archive` destructive-delta warning does not apply.

| Domain | Action | Details |
|--------|--------|---------|
| landing-epicentric-flip | Created | Mechanical `cp` of change spec to `openspec/specs/landing-epicentric-flip/spec.md`. 2 ADDED + 5 MODIFIED requirements (live total 7 / 20 scenarios). Byte identity 7863. |

## Mechanical copy evidence

Step 2 `diff -r` (delta source vs new main spec): empty (pass).  
Step 3 `diff -r` (pre-move snapshot vs archived folder): empty (pass).  
`git mv` failed (untracked / empty source to git); `mv` used.

## Archive contents

- proposal.md ✅
- exploration.md ✅
- specs/landing-epicentric-flip/spec.md ✅
- design.md ✅
- tasks.md ✅ (14/14 complete)
- verify-report.md ✅
- state.yaml ✅
- archive-report.md ✅ (additive after move)

Active `openspec/changes/landing-reference-flip/` is gone.

## Delivery

No git commit, push, or PR. Landing implementation remains untracked workspace files. SDD cycle for this change is closed.

## Deferred (not open tasks)

- Reverse unflip tumble if cancelled-tumble pop appears — later change, not WAAPI.
- Generic `.cube-face--back` `rotateY(180deg)` leftover (SUGGESTION).
