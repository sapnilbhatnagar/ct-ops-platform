# Connecting Traveller, Ops Platform

An internal ops console that captures every WhatsApp lead Connecting Traveller generates, qualifies it with an AI intake agent, and re-engages the ones that do not convert on the first trip.

> **New partner? Read [`BUILD_SUMMARY.md`](./BUILD_SUMMARY.md) first** for a 2-minute plain-English status, then this README, then [`Build Plan.md`](./Build%20Plan.md) and [`SETUP.md`](./SETUP.md). This README gets you oriented and running in about 15 minutes. The Build Plan is the source of truth for what we are building and in what order.

---

## 1. Why this exists

Connecting Traveller runs Meta ads that generate roughly 400 WhatsApp leads per campaign at about Rs 7,000 spend. Each trip seats only 10 to 12 people, so 385+ warm leads are lost every campaign with no follow up. There is no automated reply, no CRM, and no re-engagement.

The retention leg of the funnel is broken. Acquisition already works. This platform fixes the gap between "a lead messaged us" and "that lead booked a future trip," without spending another rupee on ads to win them back.

**Two core modules drive everything:**

1. **Intake Agent (real time).** A WhatsApp message hits a webhook, Claude asks the five qualifying questions (name, destination, dates, group size, budget), classifies the lead hot / warm / cold, stores it, and pings a human within two minutes if the lead is hot.
2. **Re-engagement Engine (async).** A human adds a new trip, we filter stored leads by matching criteria, Claude writes a personalized WhatsApp message per lead, and we broadcast. Replies flow back into the intake agent.

---

## 2. Current state

This is a **UI-first** build. Every module ships its visual layer on mock data first, gets signed off, then gets wired to a real backend. See the phase table in §6.

| Area | State |
|---|---|
| App shell + design system | Done. Operational sidebar, second-surface panel layer, skeleton loading states, terracotta accent system. |
| Intake module (visual) | Done. Lead list with filters and pagination, conversation viewer, live AI extraction panel, classification override, assignment controls, hot-lead alert. |
| Leads dashboard (visual) | Done. Sortable table, multi-select + destination + assignee + search filters, row-click detail drawer. |
| Trips & re-engagement (visual) | Done. Trip form, matched-leads preview with drafted messages, broadcast confirm and summary. |
| Community & referral (visual) | Done. Booked travellers grouped by trip with invite/welcome status, referral leaderboard. |
| Settings / Admins (visual) | Done. Add and remove admins with validation. |
| **Backend (intake)** | **Live and verified end to end.** A WhatsApp message (or the sim endpoint) runs the Claude Sonnet 4.6 intake agent, extracts the five fields, classifies hot/warm/cold, writes the lead to Airtable, fires a hot-lead notification, and traces every turn to Langfuse. Runs today in **sim mode** (no WhatsApp key needed); flip one env flag to go fully live. |
| Backend (leads / trips / community) | Not started. Trips and community run on mock data; leads dashboard reads live Airtable. |

The intake module now reads and writes real Airtable data through `/api/leads` and `/api/admins`. The hooks (`useLeads`, `useAdmins`) fetch from those routes and fall back to mock data when Airtable is not configured, so the UI runs with or without credentials. WhatsApp send/receive is stubbed by `AISENSY_SIM_MODE` until the AISensy key arrives.

---

## 3. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | Frontend and API routes in one codebase. |
| Styling | Tailwind v4 | Design tokens as CSS custom properties in `app/src/app/globals.css`. Never hard-code a color. |
| Components | shadcn-compatible (Radix + `cn`) | Owned in repo, added on demand. No external component lock-in. |
| Icons | Lucide | |
| Tests | Vitest + React Testing Library | Behavior tests, TDD. Red, green, refactor. |
| Animation | Framer Motion | Function-first only. |
| LLM | Claude Sonnet 4.6 via `@anthropic-ai/sdk` | Intake extraction and re-engagement copy. |
| WhatsApp | AISensy (Meta Cloud API as fallback) | Send/receive stubbed by `AISENSY_SIM_MODE` until the key arrives; test via `POST /api/dev/simulate-message`. Capability audit pending, see `SETUP.md` §3. |
| Lead DB | Airtable | Migration trigger to Postgres noted in the Build Plan. |
| Observability | Langfuse Cloud (free tier) | Traces every LLM call. |
| Deploy | Vercel | Frontend and API together. Root directory set to `app/`. |

---

## 4. Repo layout

```
ct-ops-platform/
  README.md                              <- you are here
  Build Plan.md                          <- source of truth: phases, specs, data contracts
  Build Plan - Backend Reference v1.md   <- preserved original backend-first plan, consumed per b-phase
  Analysis and Approach Plan.md          <- first-principles breakdown, unit economics
  SETUP.md                               <- exact credentials + Airtable schema needed to go live
  Memory.md                              <- early project notes
  CONTRIBUTING.md                        <- branch / PR workflow, read before your first change
  app/                                   <- the Next.js project
    src/
      app/(console)/                     route group sharing the sidebar shell
        intake/  leads/  trips/  community/  settings/
      components/
        console-shell/                   sidebar, topbar, section openers
        intake/                          lead list, conversation, extraction, classification
        settings/                        admins panel
        ui/                              shared primitives
      lib/
        hooks/                           useLeads, useAdmins  (mock today, fetch later)
        mock/                            seed leads + admins
        server/                          Anthropic, Airtable, AISensy, Langfuse, env, phone wrappers
        types.ts                         shared Lead / Message / Admin types
    env.example                          copy to .env.local and fill in
```

---

## 5. Getting started

```bash
git clone https://github.com/sapnilbhatnagar/ct-ops-platform.git
cd ct-ops-platform/app

npm install        # first checkout only
npm run dev        # http://localhost:3000  (redirects to /intake)
```

Run the tests:

```bash
npm test           # run once
npm run test:watch # leave running while you build
```

Production build check:

```bash
npm run build
```

You do **not** need any API keys to run the UI. Without `app/.env.local` it serves mock data. With credentials in place (`ANTHROPIC_API_KEY`, `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, Langfuse keys) the intake module is fully live. Copy `app/env.example` to `app/.env.local` and follow `SETUP.md`.

### Testing the intake agent without WhatsApp

While `AISENSY_SIM_MODE=true`, simulate an inbound WhatsApp message end to end:

```bash
curl -X POST http://localhost:3000/api/dev/simulate-message \
  -H "Content-Type: application/json" \
  -d '{"phone":"919876543210","text":"Hi, interested in your Rajasthan trip"}'
```

This runs the Claude agent, writes/updates the lead in Airtable, fires the hot-lead notification (logged to the dev console in sim mode), and traces the turn to Langfuse. Send several messages from the same `phone` to advance one conversation and watch the classification move cold → warm → hot.

---

## 6. How we build: UI-first, module by module

**The rule:** every module ships its visual layer first, its backend second. No module's backend (`b`) phase starts until that module's visual (`a`) phase is signed off.

**Why:** the UI defines the data contract the backend must satisfy. Build the UI first and the data shapes reverse-engineer themselves from real interaction needs, instead of being guessed up front.

| Phase | Module | Type | Status |
|---|---|---|---|
| 0 | Visual foundation: scaffold, tokens, app shell | UI | Done |
| 1a | Lead intake, visual | UI | Done |
| 1b | Lead intake, backend (Claude + Airtable + Langfuse) | API | **Done and live in sim mode.** Anthropic + Airtable + Langfuse wired and verified end to end. Real WhatsApp send/receive waits on the AISensy key (sim mode bridges the gap). |
| 2a | Leads dashboard, visual | UI | Done |
| 2b | Leads dashboard, backend | API | **Next** (table already reads live Airtable) |
| 3a | Trips and re-engagement, visual | UI | Done |
| 3b | Trips and re-engagement, backend | API | Blocked on 2b + AISensy key |
| 4a | Community and referral, visual | UI | Done |
| 4b | Community and referral, backend | API | Blocked on 4a + 3b |
| 5 | Settings / schema / conversation designer | UI + API | Blocked on 1b |
| 6 | Observability (Langfuse), threaded into every backend phase | API | Cross-cutting |
| 7 | Vercel deploy + production hardening | Deploy | Final |

Full specs for each phase live in [`Build Plan.md`](./Build%20Plan.md).

---

## 7. Contribution workflow

**Every feature becomes a pull request. `main` is always deployable.** Full detail in [`CONTRIBUTING.md`](./CONTRIBUTING.md). The short version:

```bash
git switch -c feat/<module>-<short-description>   # one branch per feature
# ... build with TDD: write the failing test first ...
npm test && npm run build                         # both must pass
git push -u origin feat/<module>-<short-description>
gh pr create --fill                               # open the PR
```

- One feature, one branch, one PR. Keep PRs small and reviewable.
- Tests and a clean production build are required before merge.
- A human reviews and merges. Do not push directly to `main`.
- Branch naming: `feat/`, `fix/`, `chore/`, `docs/` prefix, then a short kebab description.

---

## 8. Where to look first

- **Understand the product:** `Analysis and Approach Plan.md`, then this README §1.
- **Understand what to build next:** `Build Plan.md`, Phase 2a.
- **Understand the data shapes:** `app/src/lib/types.ts` and `app/src/lib/mock/`.
- **Go live with the backend:** `SETUP.md` (lists the exact six credentials and Airtable schema needed).
- **Make your first change:** `CONTRIBUTING.md`.

---

## 9. Design language

A 60% [impeccable.style](https://impeccable.style) and 40% [productsanctum.com](https://productsanctum.com) blend: generous whitespace, a restrained near-monochrome palette, hierarchy through weight and size rather than color, with modular cards that hold real UI. The one accent is a warm terracotta (`--accent`, `#C8553D`) used for hot leads, primary CTAs, and focus rings. All tokens live in `app/src/app/globals.css`. Adjust a token, and it cascades everywhere.

---

Built by Sapnil Bhatnagar with Claude (Opus 4.8). Questions: open an issue or ping Sapnil.
