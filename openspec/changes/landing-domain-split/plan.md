# Slice: landing-domain-split

## Goal (de JR)
- Tinity se sirve en `tinity.jseramn.tech` como subdominio dedicado
- Portfolio NO contiene código de Tinity
- Vercel deploya Tinity landing desde el repo `~/tinity/`, sin acoplar a portfolio
- Cada repo tiene su propio Vercel project

## Estado actual (verificado)

### ~/tinity/
- Repo: ~/tinity/ (git)
- vercel.json: framework vite, outputDirectory landing/dist, rewrites /tinity → /
- .vercelignore: packages, openspec, .cursor, .env, .env.local ✅
- vite.config.ts: base "/tinity/" (hay que cambiar a "/")
- OpenSpec change landing-domain-split a crear

### ~/portfolio/
- Repo aparte: https://github.com/jseramn/portfolio.git
- Sirve Tinity DESDE dentro del portfolio:
  - src/pages/tinity/index.astro (Astro page con TinityApp React client:only)
  - src/tinity/ (mirror del código de Tinity sincronizado vía tinity-pull.mjs)
  - public/tinity/ (assets: favicon, og image, mark)
  - scripts/tinity-pull.mjs (descarga jseramn/tinity main y copia a src/tinity/)
  - vercel.json con headers /tinity/(...) especiales
- Stack: Astro 5 + React 19, biome, vitest, playwright

### ~/jseramn.tech/tinity/ (producción hoy)
- Servido por Vercel project de portfolio
- Path: /tinity/
- DNS: sub-path de jseramn.tech

## Plan de ejecución

### Fase A — Repo Tinity (yo commiteo)
1. Cambiar `landing/vite.config.ts` base "/tinity/" → "/"
2. Cambiar `landing/vercel.json` rewrites (quitar prefijo /tinity/)
3. Crear OpenSpec change landing-domain-split con proposal + design + tasks
4. Documentar en README la regla de oro (portfolio aparte, monorepo, /landing vive en su folder)
5. NO commiteo todavía — JR aprueba primero

### Fase B — Vercel Tinity project (JR hace)
1. Crear Vercel project `tinity` apuntando a ~/tinity/
2. Root directory: `landing`
3. Dominios: tinity.jseramn.tech (production), stage.tinity.jseramn.tech, preview.tinity.jseramn.tech (auto por PR)
4. Branch mapping: main → production, stage → stage env
5. Configurar DNS para tinity.jseramn.tech

### Fase C — Repo portfolio cleanup (JR hace)
1. Borrar src/pages/tinity/index.astro
2. Borrar src/tinity/ (todo el mirror)
3. Borrar public/tinity/ (assets)
4. Borrar scripts/tinity-pull.mjs y tinity-pull.test.ts
5. Borrar tinity-og.py si existe solo para tinity
6. Simplificar vercel.json (quitar headers /tinity/(...))
7. Simplificar package.json (quitar script tinity:pull)

### Fase D — Cursor workspaces (JR hace)
1. Borrar workspace "tinity-portfolio-workspace" si existe
2. Borrar alias "portfolio, tinity" si existe
3. Quedarse solo con ~/portfolio/ y ~/tinity/ como workspaces separados

### Fase E — DNS cutover (JR hace)
1. Verificar que tinity.jseramn.tech sirve correctamente desde Vercel project de Tinity
2. Agregar redirect 301 desde jseramn.tech/tinity → tinity.jseramn.tech (opcional, por un tiempo)
3. Verificar analytics y links apuntan al nuevo dominio

## Riesgos

1. **SEO drop** — cambiar de jseramn.tech/tinity a tinity.jseramn.tech afecta ranking. Mitigación: redirect 301.
2. **Downtime durante cutover** — si JR hace cutover mal, ambos dominios pueden quedar rotos. Mitigación: hacer cutover en horario de bajo tráfico.
3. **Portfolio astro puede romperse** — al borrar src/tinity/, si hay referencias rotas en otros lados. Mitigación: revisar build antes de push.
4. **Lost assets** — public/tinity/ tiene og:image que puede estar referenciado en links compartidos. Mitigación: redirect desde jseramn.tech/tinity/tinity-og.png → tinity.jseramn.tech/tinity-og.png.

## Lo que YO hago automáticamente

- Fase A completa (commiteable, JR aprueba)
- Diagnóstico + planning (este Slice)
- Documentación
- Persistencia en Engram

## Lo que JR hace manualmente

- Fase B (Vercel project creation)
- Fase C (portfolio cleanup + commit)
- Fase D (Cursor cleanup)
- Fase E (DNS cutover + redirects)

## Status

- [x] Diagnóstico portfolio ↔ tinity coupling
- [x] Identificar archivos a tocar
- [x] Plan de 5 fases
- [ ] Fase A — código Tinity (commiteable)
- [ ] Fase B — Vercel Tinity project
- [ ] Fase C — portfolio cleanup
- [ ] Fase D — Cursor workspaces
- [ ] Fase E — DNS cutover
