# Developers

Tinity does not expose a public multi-tenant API, API key dashboard, or cloud sandbox on https://tinity.jseramn.tech. What shipped for developers is the Git repository, agent-readable twins, and a localhost OpenAI-compat wrap.

## Quickstart

1. Clone https://github.com/jseramn/tinity
2. Read [index.md](/index.md) and [llms.txt](/llms.txt) for what is shipped versus later.
3. Run cursor-gateway locally (not on Vercel): from the repo, use `pnpm --dir packages/cursor-gateway start`.
4. Bind is 127.0.0.1:4390. Preflight `GET /health` then `GET /v1/models` before `POST /v1/chat/completions`.
5. Auth is Cursor login on the machine (optional inherited CURSOR_API_KEY). Do not send AI_GATEWAY_API_KEY to the child.

cursor-gateway is not a Vercel Function. It spawns `cursor-agent`; it does not reimplement the agent. See packages/cursor-gateway/README.md.

## Agent files

- https://tinity.jseramn.tech/llms.txt
- https://tinity.jseramn.tech/index.md
- https://tinity.jseramn.tech/developers.md (this page)
- https://tinity.jseramn.tech/design.md
- https://tinity.jseramn.tech/changelog.md
- https://tinity.jseramn.tech/sitemap.xml

Send `Accept: text/markdown` to https://tinity.jseramn.tech/ for the overview twin.

## Sandbox

There is no hosted sandbox. Idle cubes on the lattice are marketing status. Layer 8 runtimes stay later. Do not expect API keys to be issued from this page.
