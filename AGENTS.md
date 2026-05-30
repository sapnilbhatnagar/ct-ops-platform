# Project instructions: Connecting Traveller Ops Platform

Read `README.md` for orientation and `CONTRIBUTING.md` for the full workflow. This file is the short, binding version for any AI assistant or contributor working in this repo.

## Workflow (non-negotiable)

- **Every feature becomes a PR.** Never commit or push directly to `main`.
- One feature, one branch, one PR. Branch names: `feat/ | fix/ | chore/ | docs/ | refactor/` + short kebab description.
- Before opening a PR, from `app/`: `npm test` and `npm run build` must both pass.
- A human reviews and merges. After merge, branch from a fresh `main` for the next feature.
- **After every PR merge, update `BUILD_SUMMARY.md`** (plain-English status + "Last updated" line). It is the partner-facing status doc and must reflect `main`.

## How we build

- **UI-first, module by module.** Ship the visual layer on mock data first, get Sapnil's sign-off, then wire the backend. No module's backend phase starts until its visual phase is signed off.
- Define hook contracts first (`app/src/lib/hooks/`), build the component against the hook, write Vitest + RTL behavior tests **before** the implementation, then swap the hook body from mock to `fetch`. Components never import mock data directly.
- Current phase order and status: `README.md` §6. Full specs: `Build Plan.md`.

## Boundaries

- The Next.js project lives in `app/`. Run npm commands from there.
- `app/AGENTS.md` carries a Next.js 16 warning: this is not the Next.js in your training data, check `node_modules/next/dist/docs/` before writing framework code.
- Never commit secrets. `.env*` is gitignored. Templates only (`app/env.example`).
- Surgical changes: every changed line should trace to the feature. No drive-by refactors.
