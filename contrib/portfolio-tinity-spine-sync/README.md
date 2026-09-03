# Apply the `/tinity` spine on `jseramn/portfolio`

This cloud agent could not push `cursor/tinity-spine-sync-7ff7` to `jseramn/portfolio` (`403` for `cursor[bot]`). The portfolio work is complete and committed locally; this patch is the portable copy **without** `.agents/skills` (install those with the same `npx skills add` set as tinity, or copy `.agents` + `skills-lock.json` from this repo).

## Apply

```bash
cd /path/to/portfolio
git checkout -b cursor/tinity-spine-sync-7ff7
git apply --3way /path/to/tinity/contrib/portfolio-tinity-spine-sync/0001-tinity-spine-sync.patch
# First pull already ran from tinity SHA 347d35fe7f13ca047e90530f201e25fb25fb0e5f.
# After this tinity branch lands on main:
pnpm tinity:pull
pnpm test
```

Until tinity `main` has the spine, pull with:

```bash
TINITY_SRC=/path/to/tinity pnpm tinity:pull
# or
TINITY_REF=cursor/tinity-landing-v2-7ff7 pnpm tinity:pull
```

## What the patch does

- `scripts/tinity-pull.mjs` + `pnpm tinity:pull`
- Vendored landing spine under `src/tinity` (except `TinityApp.tsx`)
- `/tinity` without `lockScroll` or the sr-only duplicate H1
- Twin routes `/tinity/{llms.txt,index.md,changelog.md,design.md}`
- `Accept: text/markdown` on `/tinity` reads the overview twin
- Layout favicon/OG/`SoftwareSourceCode`/`#tinity-state`
- `public/llms.txt` lists the twins
