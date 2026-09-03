# Apply the `/tinity` spine on `jseramn/portfolio`

Tinity `main` already has the spine (`276d6da`, PR [#4](https://github.com/jseramn/tinity/pull/4) merged).

This cloud agent cannot push `cursor/tinity-spine-sync-7ff7` to `jseramn/portfolio` (`403` for `cursor[bot]`). The portfolio work is complete locally; this patch is the portable copy **without** `.agents/skills` (install those with the same `npx skills add` set as tinity, or copy `.agents` + `skills-lock.json` from this repo).

## Apply

```bash
cd /path/to/portfolio
git checkout -b cursor/tinity-spine-sync-7ff7
git apply --3way /path/to/tinity/contrib/portfolio-tinity-spine-sync/0001-tinity-spine-sync.patch
pnpm tinity:pull   # defaults to jseramn/tinity@main
pnpm test
git push -u origin cursor/tinity-spine-sync-7ff7
```

`pnpm tinity:pull` pins `src/tinity/.tinity-source.json` to the SHA it fetched. After apply, that pull refreshes the vendor from current tinity `main`.

## What the patch does

- `scripts/tinity-pull.mjs` + `pnpm tinity:pull`
- Vendored landing spine under `src/tinity` (except `TinityApp.tsx`)
- Compound marketing primitives (`Section`, `Panel`, `Window`, `HumanSurface` / `AgentSurface`)
- `/tinity` without `lockScroll` or the sr-only duplicate H1
- Twin routes `/tinity/{llms.txt,index.md,changelog.md,design.md}`
- `Accept: text/markdown` on `/tinity` reads the overview twin
- Layout favicon/OG/`SoftwareSourceCode`/`#tinity-state`
- `public/llms.txt` lists the twins
