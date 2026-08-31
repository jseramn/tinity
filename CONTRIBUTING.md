# Contributing to Tinity

Thanks for wanting to help. This project is early. Read this and the [Code of Conduct](./CODE_OF_CONDUCT.md) before opening a PR.

## Ground rules

- MIT licensed. You keep the right to your contribution; you grant the same MIT terms.
- Follow the Code of Conduct.
- No paid API keys in the repo. No secrets in issues or PRs.
- Prefer evolving existing files over rewrites.

## Dev

Landing and wrap already have local deps; do not install unless missing.

From repo root: landing test, then packages/cursor-gateway test and start.

Wrap binds 127.0.0.1:4390, grok-4.6 high, never Fast. Mocked tests must not fire a live job.

See packages/cursor-gateway/README.md.

## PRs

- One change per PR.
- Describe why, not only what.
- If you change landing UI, note how you tested it.
- Maintainer disk is tight. Avoid huge generated files.

## Security

Do not file public issues for secrets or exploitable bugs. Use a GitHub issue on the tinity repo only for non-sensitive reports until SECURITY.md exists.
