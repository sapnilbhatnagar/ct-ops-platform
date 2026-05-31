# Build Plan: Connecting Traveller Agentic WhatsApp Automation

> UI-first, module-by-module. Visualization drives backend design, not the other way around.

---

## Document Metadata

- **Client:** Connecting Traveller (India travel/tourism)
- **Problem:** ~388 warm WhatsApp leads per campaign receive zero follow-up after trip capacity (10-12 seats) is filled
- **Solution:** WhatsApp-native lead CRM with AI intake agent and re-engagement broadcast engine, with an internal ops console for the travel team
- **Last Updated:** 2026-05-26
- **Approach pivot:** Original plan (Build Plan - Backend Reference v1.md) was backend-first. This plan flips that: every module ships as a fully-styled UI on localhost first, with mock-data hooks. Only after Sapnil signs off on a module's UX do we design and wire its backend. The original backend specs are preserved verbatim in the reference file and consumed per module as backend sub-phases.

---

## Strategic Rationale

**Why UI-first:**

1. **Faster sign-off loop.** A visual artifact gets a yes/no in 10 minutes. A backend spec gets argued for 3 weeks.
2. **Backend contracts emerge from real UI needs.** Every API endpoint, every Airtable column, every Claude prompt structure can be reverse-engineered from "the UI needs this object to render this card." This eliminates speculative backend work.
3. **Client-shareable from Day 2.** The localhost build can be screen-recorded or deployed to Vercel for a client preview without a single line of production backend code.
4. **Risk surfaced earlier.** UX problems (a confusing classification badge, an unclear hot-lead alert) get caught before backend code locks them in.

**What this trades away:**

- We do not validate AISensy webhook reality until backend phases. If AISensy lacks webhooks, we pivot the WhatsApp Business Solution Provider (BSP) layer — but the UI stays exactly the same, because the UI does not know who delivers messages.
- We do not validate end-to-end latency or token costs until backend phases. Mock data is instant and free; real Claude calls are not.

**Acceptance for this trade:** Sapnil explicitly chose UI-first on 2026-05-26 to "see how things will look in the first pass" before committing to architecture.

---

## Tech Stack (Frontend)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router, TypeScript) | Vercel-native deploy target, server components when we need them |
| Styling | Tailwind CSS v4 | Token-driven, fastest iteration |
| Components | shadcn/ui (Radix primitives + Tailwind) | Owned components, no lock-in, easy to theme |
| Icons | Lucide | Consistent with shadcn |
| State / Data | React Query + custom hooks (`useLeads`, `useConversation`) | Hook bodies return mock today, swap to fetch later |
| Tests | Vitest + React Testing Library | Behavior-first TDD per the `tdd` skill |
| Fonts | Inter (UI) + Fraunces or similar warm serif (display only) | Geometric sans for clarity, restrained serif for editorial moments |
| Animation | Framer Motion (only where it serves function) | Variant swaps when AI extraction updates a lead card |

**Tech Stack (Backend, deferred):** Unchanged from original plan — Python + FastAPI, Docker, Claude Sonnet 4.6, Airtable, Langfuse self-hosted, AISensy. See `Build Plan - Backend Reference v1.md` for the full backend specification.

---

## Visual Design Language

**60% Impeccable / 40% Product Sanctum blend** — locked with Sapnil 2026-05-26.

### Impeccable contributions (the frame)

- Generous whitespace; nothing fights for attention
- Hierarchy through weight and size, not color
- Restrained, near-monochrome palette
- Numbered, scannable sections
- Function-first motion (no decorative animation)
- Anti-patterns to avoid: italic-serif heroes, purple gradients, nested card hell, density-for-density's-sake

### Product Sanctum contributions (the content)

- Modular cards with real product UI inside them (live conversation thread, lead card with all five fields, classification badge)
- Narrative-led copy on empty states and section openers ("This lead just messaged from a Meta ad — let's qualify them")
- Bold display heads on section openers, then quiet body
- Photography-of-the-product feel: show real states, not abstract icons

### Design tokens (v1)

| Token | Value | Role |
|---|---|---|
| `--ink` | `#0E1014` | Headlines, primary text, sidebar background |
| `--paper` | `#FAFAF7` | Canvas |
| `--mute` | `#6B6B6B` | Secondary text, metadata |
| `--rule` | `#E8E6E0` | Dividers, borders |
| `--accent` | `#C8553D` | One warm terracotta — classification HOT, primary CTAs, focus rings (chosen to evade purple-gradient trap and lean travel/India warmth) |
| `--warm` | `#E8A87C` | Classification WARM |
| `--cool` | `#9DB4C0` | Classification COLD |
| `--ok` | `#5A8F5A` | Confirmations, success states |
| Font (UI) | Inter Variable | All body, controls, table content |
| Font (Display) | Fraunces 400/600 | Section openers, hero numbers — used sparingly |

---

## Phase Map (New)

Each numbered module ships **visual first, backend second**. No module's backend (`Xb`) starts until that module's UI (`Xa`) is signed off by Sapnil.

| Phase | Name | Type | Status |
|---|---|---|---|
| 0 | Visual Foundation | UI scaffold | Not started — next |
| 1a | Lead Intake — Visual | UI | Blocked on 0 |
| 1b | Lead Intake — Backend | API + Claude | Blocked on 1a sign-off |
| 2a | Leads Dashboard — Visual | UI | Blocked on 1a |
| 2b | Leads Dashboard — Backend | Airtable wiring | Blocked on 2a sign-off + 1b |
| 3a | Trips & Re-engagement — Visual | UI | Blocked on 2a |
| 3b | Trips & Re-engagement — Backend | Filter + broadcast | Blocked on 3a sign-off + 2b |
| 4a | Community & Referral — Visual | UI | Blocked on 3a |
| 4b | Community & Referral — Backend | Group invite + referral capture | Blocked on 4a sign-off + 3b |
| 5 | Settings, Schema Designer, Conversation Designer | UI + Backend together | Blocked on 1b (needs real schema concept) |
| 6 | Observability (Langfuse) — Cross-cutting | Backend | Threaded into every `b` phase |
| 7 | Vercel deploy + production hardening | Deploy | Final |

---

## Phase 0 — Visual Foundation

**Target:** 1-2 days. **Phase goal:** A running localhost Next.js app with the app shell, design tokens, sidebar navigation, empty module screens, and the test infrastructure ready. No real product content yet — this phase is the canvas.

### 0.1 Scaffold

**Inputs:** Stack decisions above.

**Outputs:**
- `app/` subfolder created inside `Connecting Traveller/` with Next.js 15 + TS
- Tailwind v4 configured, design tokens above wired into `globals.css` as CSS custom properties
- shadcn/ui initialized; primitives (Button, Card, Badge, Dialog, Input, Sheet, Tooltip, ScrollArea) installed
- Inter Variable + Fraunces loaded via `next/font`
- `pnpm dev` serves on http://localhost:3000

### 0.2 Test infrastructure

**Inputs:** TDD skill, Vitest + RTL choice.

**Outputs:**
- Vitest + RTL + jsdom configured, `pnpm test` runs
- One green smoke test (`app shell renders sidebar`)
- TDD loop documented in `app/README.md`: write failing test → make it pass → refactor

### 0.3 App shell + sidebar

**Inputs:** Operational sidebar shape (locked 2026-05-26).

**Outputs:**
- Left sidebar (charcoal `--ink`, paper-on-ink text) with sections: **Intake**, **Leads**, **Trips**, **Community**, **Settings**
- Top bar with workspace label "Connecting Traveller" + workspace switcher placeholder
- Empty-state page for each route, each with a section-opener heading in Fraunces and a 1-sentence narrative description
- Light/dark mode token wiring (single source of truth in CSS custom properties; toggle deferred to Phase 5)

### 0.4 Design system review

**Inputs:** Phase 0.3 output.

**Outputs:**
- Sapnil walks the shell, confirms the 60/40 blend reads correctly on screen, or requests adjustments
- Sign-off gate: do not start 1a until shell is approved

### 0.5 GitHub push (first)

**Inputs:** GitHub repo URL from Sapnil.

**Outputs:**
- `git init`, `.gitignore` for Next.js, initial commit, push to the provided repo
- `README.md` at repo root documenting localhost run instructions

**Note:** Sapnil will provide the repo URL when ready. Until then, work stays local.

### Phase 0 Success Criteria

- [ ] `pnpm dev` boots and `/` shows the shell with all five sidebar routes
- [ ] `pnpm test` shows at least one green test
- [ ] Sapnil signs off on visual shell (typography, spacing, color, sidebar feel)
- [ ] Repo pushed to GitHub (or marked deferred if URL not yet provided)

---

## Phase 1a — Lead Intake (Visual)

**Target:** 2-3 days. **Phase goal:** The signature screen of the product. A human user can open `/intake` and see a single in-progress lead conversation rendered with full visual fidelity, with the AI extraction filling in fields live, classification animating in, and the hot-lead alert firing — all driven by mock data behind hooks.

### 1a.1 Mock data model

**Inputs:** The five qualifying fields from Phase 0 reference (name, destination, travel dates, group size, budget) and the hot/warm/cold classification logic.

**Outputs:**
- TypeScript types in `app/lib/types.ts`: `Lead`, `Message`, `ExtractedField`, `Classification`
- Mock data file `app/lib/mock/leads.ts` with 8-12 hand-crafted lead conversations covering: a complete hot lead, a warm lead, a cold lead, an abandoned mid-flow lead, a Hindi/Hinglish lead, a referral lead
- Hooks: `useLeads()`, `useLead(id)`, `useConversation(id)` — all return mock data with realistic latency (200-400ms artificial delay) so loading states are testable

### 1a.2 Conversation thread component

**Inputs:** Mock conversation data.

**Outputs:**
- WhatsApp-flavored thread (right-aligned user, left-aligned AI agent, timestamp groups, read ticks for fidelity)
- Visual cue when the AI extracts a field from a message (subtle highlight + Framer Motion variant swap)
- Voice note placeholder ("voice note received — unsupported in v1") rendered as a distinct message type
- TDD: tests cover render order, message types, empty thread, extraction highlight

### 1a.3 Extraction panel

**Inputs:** `ExtractedField` data tied to the conversation.

**Outputs:**
- Right-side panel showing the five fields as a structured card
- Each field shows: label, value (or "—" if not yet extracted), confidence indicator
- Field card fills in with a fade-in as the conversation progresses
- TDD: tests cover empty state, partial extraction, complete extraction

### 1a.4 Classification badge + hot-lead alert

**Inputs:** Classification logic.

**Outputs:**
- Classification badge using the `--accent`/`--warm`/`--cool` tokens
- When a lead crosses to HOT in the mock timeline, a toast/banner fires "Hot lead — agent notified" with timestamp
- TDD: tests cover each classification state and the alert firing

### 1a.5 Intake list + detail layout

**Inputs:** Lead list mock data.

**Outputs:**
- `/intake` shows a left-column list of in-progress conversations
- Clicking a lead opens the conversation + extraction view
- Empty state when no in-progress conversations
- TDD: list render, selection, empty state

### Phase 1a Success Criteria

- [ ] `/intake` renders a list of in-progress leads from mock data
- [ ] Selecting a lead shows the conversation thread + extraction panel + classification badge
- [ ] A simulated incoming message updates the conversation, fills an extraction field, and (if applicable) animates the classification
- [ ] All components have behavior tests (Vitest + RTL); test suite is green
- [ ] Sapnil signs off on visual fidelity and interaction feel
- [ ] Pushed to GitHub

---

## Phase 1b — Lead Intake (Backend)

**Stack locked 2026-05-27** after a focused tradeoff discussion with Sapnil. Departing from the original (Python + FastAPI + self-hosted Docker stack) preserved in `Build Plan - Backend Reference v1.md`.

### Locked Stack

| Layer | Pick | Rationale |
|---|---|---|
| API framework | **Next.js 16 API routes** (in the same `app/` codebase) | Single TypeScript stack with the frontend, shared `Lead` / `Message` types across UI and API, one `vercel deploy` for everything, no Docker setup tax for v1 |
| LLM | **Claude Sonnet 4.6** via `@anthropic-ai/sdk` | Best conversational quality + structured extraction, official TS SDK is parity with Python |
| WhatsApp BSP | **AISensy** (with Meta Cloud API direct as documented fallback) | Client already owns the account, travel team can use AISensy's dashboard for manual messages. Pending audit confirmation of webhook + outbound + broadcast |
| Lead database | **Airtable** for v1 | Travel team reads and edits it directly; no admin UI needed. Migration trigger documented below |
| Observability | **Langfuse Cloud** (free tier) | 50k observations/month covers v1 easily, zero Docker setup, same SDK as self-hosted |
| Session state | In-memory `Map` for v1 → Vercel KV (Upstash Redis) when serverless cold-start drops state | Avoids premature infra |
| Deploy | **Vercel** for frontend + API routes | Same `git push` ships both. No separate backend host |
| WhatsApp policy compliance | Meta-approved templates for first-message and hot-lead notification | Approval submitted in Phase 1b.0 since it takes 24-48 hours |

**Migration triggers (documented now, not pre-built):**
- Airtable → Supabase Postgres when any of: 5,000+ leads, > $50/month Airtable cost, repeated 5 req/sec rate-limit errors
- AISensy → Meta Cloud API direct if Phase 1b.0 audit finds a missing capability
- Langfuse Cloud → self-hosted if a compliance review demands trace data residency in India

### Phase 1b.0 — Audit and credentials (half day, blocking)

Cannot start any code without these. **Performed by Sapnil + client:**

1. AISensy capability audit: send a test outbound message via API, confirm inbound webhook fires for a test inbound message, confirm broadcast API supports > 50 contacts per call
2. Provision API credentials: Anthropic, AISensy, Airtable (create empty base from the schema below), Langfuse Cloud (sign up, get keys)
3. Submit Meta-approved WhatsApp templates: opening greeting, hot-lead agent notification
4. Document the human agent's WhatsApp number for hot-lead notifications

### Phase 1b.1 — Backend dependencies and env (1-2 hours)

**Outputs:**
- `@anthropic-ai/sdk`, `airtable`, `langfuse` added to `app/package.json`
- `.env.local.example` documenting every required env var with a comment
- `.env.local` populated locally (gitignored)
- Vercel env vars set up in dashboard for preview and production

### Phase 1b.2 — Server library wrappers (3-4 hours)

`src/lib/server/` holds server-only clients. Imported only from API routes:

- `anthropic.ts`: Claude client, default model `claude-sonnet-4-6`, wrapped with Langfuse tracing helper
- `airtable.ts`: typed `leadsTable` helper, `createLead()`, `updateLead()`, `findLeadByPhone()`
- `aisensy.ts`: `sendMessage(phone, text)`, `sendTemplate(phone, templateName, params)`, `verifyWebhookSignature(headers, body)`
- `langfuse.ts`: shared Langfuse instance, helper to start a session trace

Each module reads env once at module load, throws clearly if a required var is missing.

### Phase 1b.3 — `/api/whatsapp/webhook` (1 day)

POST handler at `src/app/api/whatsapp/webhook/route.ts`:

- Verify AISensy signature or shared secret on every request
- Parse payload: `{ phone, text, timestamp, messageId, messageType }`
- Dispatch to session manager, get back the agent's reply
- Send the reply via AISensy outbound (async, do not block the webhook response)
- Return 200 within 5 seconds
- Log full exchange to Langfuse under a session keyed by SHA-256(phone)

**Tests:** vitest unit tests using a sample AISensy payload fixture for happy path, missing signature, malformed payload, voice note (unsupported).

### Phase 1b.4 — Session manager and intake agent (2 days)

`src/lib/server/intake-agent.ts`:

- Session = `Map<phoneHash, SessionState>` where `SessionState` holds conversation history + extracted fields + classification
- TTL: abandon after 24h of inactivity, mark session abandoned, write partial Airtable record
- Each turn calls Claude with: system prompt (qualifying agent persona + 5 questions + edge case rules from `Build Plan - Backend Reference v1.md` 0.5 and 1.3), full history, instruction to return JSON `{ reply, extractedFields, classification, classificationReason }`
- Parse JSON, return reply text to webhook handler, persist updated state
- Every Claude call wrapped in a Langfuse span under the session's parent trace

**Tests:** unit tests with a stubbed Claude client returning canned JSON; assert state transitions, extraction merging, classification updates.

### Phase 1b.5 — Airtable writes (4 hours)

On session complete or abandoned:
- `createLead({ ...session, status, classification, ... })` → returns Airtable record ID
- Field mapping mirrors the `Lead` TS type from `src/lib/types.ts` (1:1)
- Migration to Postgres later: this module's interface stays the same, only the implementation swaps

### Phase 1b.6 — Hot-lead notifier (4 hours)

On classification = hot AND not yet notified:
- Send Meta-approved template message to the human agent's WhatsApp number via AISensy outbound
- Template variables: lead name, destination, dates, group size, budget, Airtable record URL
- Write `agent_notified_at` timestamp back to the Airtable record
- Retry once after 30 seconds on AISensy failure, then log error to Langfuse and surface in `/intake` UI

### Phase 1b.7 — `/api/leads` and hook swap (1 day)

`GET /api/leads`: reads from Airtable, returns `Lead[]` matching the existing UI contract.
`GET /api/leads/[id]`: returns the full `Lead` including messages and extracted fields.
`PATCH /api/leads/[id]`: accepts partial Lead, supports manual classification override (sets `classificationSource: "user"`) and assignment changes (sets `assignedToId`).

Then update `src/lib/hooks/use-leads.ts` to `fetch()` from these endpoints instead of the mock store. The `MOCK_LEADS` import goes away. Every Phase 1a test must still pass against the live data source (verified with a test seed of 3 known Airtable records).

For live updates of the in-progress conversation, the dashboard polls `/api/leads/[id]` every 3 seconds when the lead is viewed (cheap, simple, good enough for v1). SSE deferred.

### Phase 1b.8 — Admins CRUD and lead assignment (4-6 hours)

**Added 2026-05-27** to support the team-assignment workflow shipped in the Phase 1a refresh.

**Airtable schema additions:**
- New `Admins` table: `Name`, `Email`, `Initials`, `Color`, `Active` (checkbox)
- New fields on `Leads` table: `Classification source` (single-select: model / user), `Assigned to` (link to Admins, single record)

**API endpoints:**
- `GET /api/admins`: returns active admins
- `POST /api/admins`: creates an admin (name + email; initials and color derived)
- `DELETE /api/admins/[id]`: soft-deletes an admin (sets active=false to preserve historical lead assignments)
- `PATCH /api/leads/[id]` (extended): accepts `assignedToId` and `classification` + `classificationSource: "user"` for manual overrides

**Hook swap:**
- `use-admins.ts` body swaps from in-memory `_state` to `fetch("/api/admins")`
- `addAdmin` / `removeAdmin` swap to POST / DELETE

**UI already shipped (Phase 1a refresh):**
- Pagination at 10 leads per page with prev/next + numbered controls
- Classification filter chips (All / Hot / Warm / Cold / Qualifying)
- Assignee filter (Everyone / Unassigned / per-admin)
- Classification override dropdown on the lead detail header (sets source=user)
- Assignment dropdown on the lead detail header
- `/settings/admins` config panel with add and remove

**Why these changes:** The team wants the model to do the initial classification but reserve the right to override per-lead, and the operations manager wants to fan out leads across teammates so two people can work the backlog without stepping on each other. Without these, "hot" and "warm" stay purely model-decided and there is no way to load-balance.

### Phase 1b Success Criteria

- [ ] AISensy audit complete with all three capabilities confirmed (or pivot decision documented)
- [ ] Webhook receives a real inbound message and returns 200 within 5 seconds
- [ ] A complete 5-question conversation creates an Airtable record with all fields populated and a classification
- [ ] Hot classification triggers an outbound WhatsApp template message to the human agent within 2 minutes
- [ ] Every Claude call shows up in Langfuse Cloud dashboard with prompt, response, token count, latency
- [ ] `/intake` UI shows real leads from Airtable via the swapped hooks
- [ ] Manual classification override from the UI persists to Airtable and shows `classificationSource: user` in the badge
- [ ] Lead assignment from the UI persists to Airtable and the assignee filter narrows the list correctly
- [ ] `/settings/admins` add/remove persists to the Airtable Admins table
- [ ] Every Phase 1a Vitest test still passes (no regression from the data source swap)
- [ ] Pushed to GitHub and deployed to a Vercel preview URL

---

## Phase 2a — Leads Dashboard (Visual)

**Target:** 2 days. **Phase goal:** The sales agent's daily workspace — a table view of all leads with filters by classification, destination, urgency, and travel date.

### 2a.1 Table component

**Outputs:**
- Sortable, filterable table at `/leads`
- Columns: name, phone (masked), destination, dates, group size, budget, classification badge, urgency, last activity
- Click row → opens detail drawer (reuses 1a conversation + extraction view)
- TDD: render with mock data, sort, filter, row selection

### 2a.2 Filter bar

**Outputs:**
- Classification chips (Hot / Warm / Cold) — multi-select
- Destination dropdown (populated from mock data)
- Travel date range picker
- Urgency slider
- TDD: filter combinations narrow the table correctly

### 2a.3 Pipeline view (alt layout)

**Outputs:**
- Kanban toggle on `/leads`: columns for New / Contacted / Booked / Lost
- Drag to move (mock-only, persists in local state)
- TDD: drag-drop changes column membership

### Phase 2a Success Criteria

- [ ] `/leads` shows 50+ mock leads in both table and Kanban views
- [ ] Filters compose correctly, all tests green
- [ ] Sign-off

---

## Phase 2b — Leads Dashboard (Backend)

**Begins after 2a sign-off + 1b complete.** Maps to reference sections 1.5 (Airtable lead writer), 1.8 (Zoho sync if Option A), plus Phase 2 of the original plan (conversation summarizer 2.1, lead profile enrichment 2.2, Airtable dashboard configuration 2.3, Langfuse analytics enhancement 2.4).

The frontend hooks (`useLeads`, `useLead`) now read from `/api/leads` which proxies Airtable. Filters in the UI become Airtable filter formulas server-side.

### Phase 2b Success Criteria

- Inherits all reference Phase 2 success criteria
- Phase 2a UI now renders real lead data with no visual regression

---

## Phase 3a — Trips & Re-engagement (Visual)

**Target:** 2-3 days. **Phase goal:** The agent inputs a new trip, sees matched leads filter live, previews personalized messages, and confirms send — all visualized end-to-end with mock data.

### 3a.1 New trip form

**Outputs:**
- `/trips/new` form: destination, date range, price per person, seats, highlights (rich text), offer deadline
- TDD: validation, required fields, submit handler

### 3a.2 Match preview

**Outputs:**
- After form submit (mock), preview screen shows: total matched leads, breakdown by classification, sample lead cards
- Each matched lead card shows: name, destination preference, budget, why-this-matched explanation (mock string)
- TDD: empty match, partial match, full match

### 3a.3 Personalized message preview

**Outputs:**
- For each matched lead, a generated message preview (mock from a small set of templates with lead-name interpolation)
- Edit-before-send affordance per message (optional, marked v2)
- TDD: message renders with lead context

### 3a.4 Broadcast confirmation

**Outputs:**
- "Send to N leads" confirmation modal with rate-limit warning
- Post-send: progress indicator (mock animates "sending… 12 of 50")
- Final state: send summary with success/failure counts (mock)
- TDD: confirm, progress, summary

### Phase 3a Success Criteria

- [ ] Full flow from trip-input → match preview → message preview → confirm → summary, all with mock data
- [ ] Sign-off

---

## Phase 3b — Trips & Re-engagement (Backend)

**Begins after 3a sign-off + 2b complete.** Maps to reference Phase 3 sections 3.1-3.6.

---

## Phase 4a — Community & Referral (Visual)

**Target:** 1-2 days. **Phase goal:** Booked travellers' community view + referral leaderboard.

### 4a.1 Community panel

**Outputs:**
- `/community` shows booked travellers by trip, invite-link send status, welcome message status
- TDD covers status transitions

### 4a.2 Referral leaderboard

**Outputs:**
- Sorted by `referral_count` desc, with each referring traveller's referral funnel (count, conversion)
- TDD: sort, empty state

### Phase 4a Success Criteria

- [ ] Both screens render mock data convincingly
- [ ] Sign-off

---

## Phase 4b — Community & Referral (Backend)

**Begins after 4a sign-off + 3b complete.** Maps to reference Phase 4 sections 4.1-4.4.

---

## Phase 5 — Settings, Schema Designer, Conversation Designer

**Target:** 2-3 days. **Phase goal:** Admin surfaces where the schema, classification thresholds, and conversation flow are editable through UI (visual + backend together because admin changes have no value without persistence).

### 5.1 Schema designer

**Outputs:**
- `/settings/schema` lets the user view the five qualifying fields, edit names/types, add custom fields
- Writes back to Airtable schema via Airtable Meta API or a config file

### 5.2 Conversation designer

**Outputs:**
- `/settings/conversation` shows the agent's system prompt with edit fields for greeting, question sequence, tone, language
- "Test conversation" affordance: send a fake user message, see Claude's response live

### 5.3 Classification threshold editor

**Outputs:**
- `/settings/classification` shows current hot/warm/cold rules, lets user adjust budget threshold, date proximity, group size
- Writes back to a config table in Airtable

### Phase 5 Success Criteria

- [ ] All three admin screens functional with persistence
- [ ] Round-trip test: edit schema → new field appears in intake → new lead writes new field

---

## Phase 6 — Observability (Cross-cutting)

Langfuse self-hosted, threaded into every `b` phase. Reference: original 1.4 + 2.4. Not a sequential phase — it ships as part of each backend wiring step.

---

## Phase 7 — Vercel Deploy & Hardening

**Begins when Sapnil declares v1 frontend done.** Reference: original Cross-Cutting Concerns section (error handling, Meta policy compliance, security, Docker).

### 7.1 Frontend to Vercel

- Connect GitHub repo to Vercel
- Set env vars (Airtable, Claude, AISensy, Langfuse URLs)
- Preview deployments per PR

### 7.2 Backend to managed Docker host (Railway / Fly.io / Render)

- Decision per cost + region (India proximity matters)
- Langfuse stays on its own managed instance

### Phase 7 Success Criteria

- Public Vercel URL serves the dashboard
- Backend on managed Docker, reachable from Vercel
- AISensy webhook URL pointed at production backend
- End-to-end live test: real WhatsApp message → real Claude → real Airtable record → real UI render

---

## Cross-Cutting Concerns

### TDD discipline (Vitest + RTL)

Every component or hook ships with a behavior test written **first**:
1. Write a failing test that describes the user-facing behavior
2. Implement the minimum to pass
3. Refactor

The `tdd` skill governs the loop. No "I'll write tests later." Tests are commits, not afterthoughts.

### Mock data discipline

Mocks live in `app/lib/mock/`. Hooks live in `app/lib/hooks/`. The hook body is the **only place** that knows whether data is mock or real. Components never import mock data directly. This is the swap point for Phase Xb wiring.

### GitHub push cadence

Push at the end of every sub-phase (1a.1, 1a.2, ...) so Sapnil can pull and review. PR-per-phase is fine but not required for v1.

### Original backend specs preserved

Every backend concern in the original plan (AISensy capability audit, Zoho Bigin decision, Airtable schema, conversation design, Docker, Meta template approvals, security, secrets) is preserved in `Build Plan - Backend Reference v1.md` and consumed by the `b` phases above.

---

## Summary Timeline (UI-first)

| Phase | Name | Duration | Cumulative |
|---|---|---|---|
| 0 | Visual Foundation | 1-2 days | 1-2 days |
| 1a | Lead Intake — Visual | 2-3 days | 3-5 days |
| 1b | Lead Intake — Backend | 5-7 days | 8-12 days |
| 2a | Leads Dashboard — Visual | 2 days | 10-14 days |
| 2b | Leads Dashboard — Backend | 4-5 days | 14-19 days |
| 3a | Trips — Visual | 2-3 days | 16-22 days |
| 3b | Trips — Backend | 6-8 days | 22-30 days |
| 4a | Community — Visual | 1-2 days | 23-32 days |
| 4b | Community — Backend | 4-5 days | 27-37 days |
| 5 | Admin & Designers | 2-3 days | 29-40 days |
| 6 | Observability | parallel | — |
| 7 | Vercel + production hardening | 2-3 days | 31-43 days |

**Total estimated build time:** 31-43 business days from Phase 0 start. ~10 days faster than the backend-first plan because visual sign-off on each module prevents downstream rework.

---

## Module C: Campaigns (reframe of Trips + Community) — added 2026-05-31

### Why this section exists

The original plan modeled "Trips" as a re-engagement blaster and "Community" as a referral/alumni view. Sapnil reframed the product so the **campaign** is the central operating unit. "Trips" becomes "Campaigns"; the referral leaderboard is dropped; "Community" collapses into a campaign's booked-traveller roster.

A campaign is a single marketing-plus-travel operation (example: "London Diwali 2026"). It owns:
- **Curation:** destination, pricing, dates, structured itinerary, seat inventory
- **Sourcing:** the Instagram ads/boosts that drive inbound WhatsApp leads
- **Qualification:** its own qualifying criteria (already per-campaign as of PR #13)
- **Enquiries:** the leads it sourced, owned by a campaign leader
- **Engagement:** responding to and re-engaging those leads

At any time 2+ campaigns run concurrently, so every inbound must be categorized and routed to the right campaign, then qualified on that campaign's criteria, so the right leader works the right people.

### Decisions locked (2026-05-31)

1. **Lead routing = AI inference + clarify-on-ambiguity.** The intake agent infers the campaign from the conversation. If the lead is ambiguous (e.g., "Interested") and more than one campaign is live, the agent replies asking which campaign/destination they mean and lists the live options. If exactly one campaign is live, route to it automatically. No Meta ad-ID plumbing in v1 (revisit Click-to-WhatsApp `referral.source_id` auto-routing when the AISensy webhook format is audited).
2. **Intake criteria = per campaign, defaults until routed.** A lead is qualified on its routed campaign's criteria; before routing (first replies) it uses the five defaults. This supersedes the single global "active campaign" introduced in PR #13.
3. **Community = folded into campaigns.** Track booked travellers and which campaign they booked, inside the campaign. Remove the referral leaderboard and the standalone Community section.
4. **Campaign v1 scope = structured itinerary + inventory.** Day-by-day itinerary blocks, seats total/booked, structured inclusions/exclusions.

### Campaign entity (expand the Airtable `Campaigns` table)

Current columns: `Name`, `Criteria (JSON)`, `Active`. Add:

| Column | Type | Notes |
|---|---|---|
| `Status` | single select: `draft` / `live` / `closed` | Replaces the `Active` flag. `live` = taking leads. |
| `Destination` | text | e.g. "London". Drives AI routing + re-engagement copy. |
| `Match keywords (JSON)` | long text | string[] of aliases the agent routes on (e.g. ["london","uk","england"]). |
| `Start date` / `End date` | date | trip dates |
| `Price per person` | number (INR) | |
| `Seats total` / `Seats booked` | number | inventory |
| `Itinerary (JSON)` | long text | `[{ day, title, detail }]` |
| `Inclusions (JSON)` / `Exclusions (JSON)` | long text | string[] |
| `Leader` | link to `Admins` | campaign owner; its leads default-assign here |
| `Criteria (JSON)` | long text (exists) | qualifying criteria for this campaign |

Migration: `Status=live` replaces `Active`; `getActiveCampaignCriteria()` is retired in favor of per-lead campaign resolution (see agent rework). Auto-provision the new columns via the Airtable Metadata API (the token has schema-write scope, confirmed PR #13).

### Lead changes

- Add `campaignId: string | null` (link to `Campaigns`; null until routed).
- Add `bookingStatus: 'enquiry' | 'booked' | 'travelled'` (default `enquiry`). Marking `booked` increments the campaign's `Seats booked` and powers the booked-traveller roster.
- The global Leads dashboard gains a Campaign column + filter; leads stay cross-campaign there.

### Console structure

- Sidebar: rename **Trips -> Campaigns**; remove **Community**.
- `/campaigns` (list): one tile per campaign showing name, destination, dates, status pill, live lead count + heat breakdown, seats booked/total, leader avatar. "New campaign" action.
- `/campaigns/[id]` (detail), sectioned:
  - **Overview / Curation:** destination, dates, price, seats, status. Editable.
  - **Itinerary:** day-by-day blocks + inclusions/exclusions. Editable.
  - **Enquiries:** this campaign's leads (reuse the leads table/cards filtered by `campaignId`), leader assignment, booking-status control (enquiry -> booked -> travelled).
  - **Criteria:** the existing `CriteriaConfigurator` scoped to this campaign (moved out of Settings).
  - **Re-engagement:** match + broadcast to this campaign's leads using the campaign's own itinerary/price/dates.
- Settings -> Qualifying criteria: replaced by a pointer/redirect to Campaigns (criteria now live on the campaign). Settings -> Admins stays.

### Intake agent rework (Agent 1) — routing + per-campaign criteria

New per-inbound flow in `intake-handler.ts`:
1. Resolve the lead by phone hash and read its `campaignId`.
2. Load live campaigns (`Status = live`).
3. Route:
   - If `lead.campaignId` is set, use it.
   - Else if exactly one campaign is live, set `campaignId` to it.
   - Else (0 or >1 live), pass the live-campaign list into the agent and let it decide (infer, or ask the lead to choose).
4. Criteria = routed campaign's criteria, else the five defaults.
5. Run the agent with those criteria and the live-campaign context.
6. Persist `campaignId` when the agent resolves it.

Agent contract additions:
- **Input:** `liveCampaigns: { key, name, destination }[]`.
- **Output:** `campaign: string | null` (the routed campaign key, or null if unknown / the agent asked the lead to choose).
- **System prompt block:** "Live campaigns: [list]. Determine which campaign the lead is asking about from their messages. If you cannot tell and more than one campaign is live, ask them which destination/campaign they mean and list the options, and set campaign=null. If only one campaign is live, use it. Put the routed campaign key in `campaign`."

Document this in `AI_AGENTS.md` Changelog when shipped.

### Re-engagement (absorbs the old Trips blaster)

`matchLeadsToTrip` / `generateMessage` / `personalizeReengagement` are retained but fed by the campaign record instead of an ad-hoc trip form. "Re-engage" on a campaign matches its enquiries (and optionally other leads), Claude drafts messages referencing this campaign's real itinerary/price/dates, then broadcasts (AISensy sim until the key arrives). `/api/trips/match` + `/api/trips/broadcast` move under `/api/campaigns/[id]/...`.

### Booked travellers (folded Community)

A campaign's booked travellers = its leads with `bookingStatus in (booked, travelled)`, surfaced in the Enquiries section (or a Travellers sub-view). This replaces the standalone Community page. The referral leaderboard is removed entirely.

### Files to remove / transform

- **Remove:** `components/community/*` (community-panel, community-view + test, referral-leaderboard), `lib/community-view.ts` + test, `lib/mock/community.ts`, `app/(console)/community/page.tsx`, the sidebar Community item.
- **Transform (rename, keep logic):** `components/trips/*` -> `components/campaigns/*`; `lib/trip-matching.ts` -> `lib/campaign-matching.ts` (Trip type derived from Campaign); `app/(console)/trips/*` -> `app/(console)/campaigns/*`; `app/api/trips/*` -> `app/api/campaigns/[id]/*`.
- **Keep:** `lib/mock/leads.ts`, `lib/mock/admins.ts` (still wired as live fallbacks in the API routes).

### Build phases (each ships as branch -> PR -> merge)

- **C0 — Campaign data model + storage (backend).** Expand the Airtable Campaigns table + `Campaign` type + CRUD; add `campaignId` + `bookingStatus` to `Lead`; expand `/api/campaigns` to full CRUD. No UI yet.
- **C1 — Campaigns console (curation UI).** Sidebar Trips->Campaigns, remove Community + files; `/campaigns` list and `/campaigns/[id]` detail (Overview, Itinerary editor); move `CriteriaConfigurator` into the campaign detail.
- **C2 — Lead routing + per-campaign intake (agent).** Intake-handler routing (single->auto, multi->infer/ask), per-campaign criteria, `campaign` output field; Enquiries tab + Campaign column on Leads; update `AI_AGENTS.md`.
- **C3 — Campaign engagement + booked travellers.** Re-engagement scoped to the campaign; booking-status control + seat-inventory; booked-traveller roster.

### Open items / dependencies

- CTWA auto-routing (Meta ad-ID via `referral.source_id`) deferred to the AISensy webhook audit; AI inference covers v1.
- Real broadcast still needs the lead's raw phone (we store hash + masked only), unresolved since PR #5; decide when wiring AISensy.
- `bookingStatus` is the seed of a future booking/payments layer (deferred; not in v1).

---

## Phase C0 (detailed build spec, test-first)

**Status: SHIPPED 2026-05-31 (branch `feat/campaigns-c0-data-model`). 96 tests, build clean, verified live against Airtable.**

Additive and non-breaking: expands `Campaign`/`Lead`, provisions Airtable columns, adds `/api/campaigns/[id]`. No UI. The existing 88 tests and the criteria configurator keep working. Planned via the Plan agent + /tdd on 2026-05-31.

**Next.js note:** this repo runs a modified Next.js (`app/AGENTS.md`). Before writing the `[id]` route, read `node_modules/next/dist/docs/`. Dynamic `params` is a Promise and must be awaited.

### Public interfaces

`app/src/lib/types.ts` (edit):
```ts
export type CampaignStatus = "draft" | "live" | "closed";
export type BookingStatus = "enquiry" | "booked" | "travelled";
export type ItineraryDay = { day: number; title: string; detail: string };

export type Campaign = {
  id: string;
  name: string;
  criteria: QualifyingCriterion[];   // unchanged
  status: CampaignStatus;
  destination: string;
  matchKeywords: string[];
  startDate: string | null;
  endDate: string | null;
  pricePerPerson: number | null;
  seatsTotal: number | null;
  seatsBooked: number;               // default 0; increment deferred to C3
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  leaderId: string | null;           // Admin record id, stored as text in C0
};
// Lead gains: campaignId: string | null;  bookingStatus: BookingStatus;

export function emptyCampaign(name: string): Campaign; // pure; status "draft", criteria DEFAULT_CRITERIA, seatsBooked 0, arrays [], nullables null
```

`app/src/lib/server/airtable.ts` (edit): export + expand `recordToCampaign(r)` (parse all new fields, JSON-safe, defaulted); extract + export `recordToLead(r)`; add `getCampaign(id)`, `updateCampaign(id, Partial<Campaign>)`, `liveCampaigns()` (status === "live"); extend `createLead`/`updateLead` for `campaignId` (linked array) + `bookingStatus`. Keep `listCampaigns()` returning `{campaigns, activeId}` (activeId still from `Active`), `createCampaign`, `updateCampaignCriteria`, `setActiveCampaign`, `getActiveCampaignCriteria` unchanged in shape.

`app/src/app/api/campaigns/[id]/route.ts` (create): `GET` -> 200 Campaign | 404 | 503; `PATCH` body `Partial<Campaign>` -> `{ok:true}` | 404 | 400 | 503. Signature `{ params }: { params: Promise<{ id: string }> }`, `const { id } = await params` first. The collection route `/api/campaigns/route.ts` stays untouched.

### Airtable schema migration (one-time, Metadata API, out of band)

`POST /v0/meta/bases/appM9rCnr2Zg29dwn/tables/{tableId}/fields`, one call per field (token has schema-write scope). Not app runtime code.

Campaigns table `tblb41mhtozYI5j1a`, add: `Status` (singleSelect draft/live/closed), `Destination` (singleLineText), `Match keywords (JSON)` (multilineText), `Start date`/`End date` (date, iso), `Price per person`/`Seats total`/`Seats booked` (number, precision 0), `Itinerary (JSON)`/`Inclusions (JSON)`/`Exclusions (JSON)` (multilineText), `Leader` (singleLineText, holds Admin id). Keep `Active` (see risks). JSON-in-text matches the existing `Criteria (JSON)`/`Fields (JSON)` convention.

Leads table, add: `Campaign` (multipleRecordLinks -> Campaigns, single link, read/write as array like `Assigned to`), `Booking status` (singleSelect enquiry/booked/travelled).

### TDD vertical slices (one test -> one impl; tracer bullet first)

All pure-logic Vitest, co-located. The suite has no server/route tests; keep it that way by pushing logic into exported pure helpers and feeding `recordTo*` a fake record stub `{ id, get: (k) => map[k] }` (no vi.mock, no network).

| # | Behavior (via public interface) | Minimal impl |
|---|---|---|
| 1 (tracer) | `emptyCampaign("X")` returns all C0 defaults | add types + `emptyCampaign` |
| 2 | `recordToCampaign` parses a fully-populated fake record | export + map every field, `safeParseJson` arrays |
| 3 | `recordToCampaign` defaults on a legacy record (only `Name`, like seeded `rec7VQpQjCkNP6WA2`) | `?? "draft"` / `?? []` / `?? null` / `seatsBooked ?? 0` |
| 4 | `recordToCampaign` survives malformed JSON | `safeParseJson` -> null -> typed default |
| 5 | JSON round-trip itinerary/inclusions/exclusions/matchKeywords | write-side stringify matches read-side parse |
| 6 | `recordToLead` parses `campaignId` (linked array) + `bookingStatus` (select) | `arr?.[0] ?? null`; `... ?? "enquiry"` |
| 7 | `recordToLead` defaults: no link -> null, no status -> "enquiry" | fallbacks; guards legacy Lead rows |
| 8 | Lead literals typecheck with the two new required fields | add defaults at every construction site (mocks, createLead) |

Route tests skipped at C0 (thin glue: await params, env guard, call getCampaign/updateCampaign; testing needs vi.mock + Next request plumbing the repo never set up). Manual curl smoke instead. `getCampaign`/`updateCampaign`/`liveCampaigns` get no unit test (pure I/O wrappers; field mapping is covered by the cycle-5 round-trip). Keep them trivial.

### Files

Create: `[id]/route.ts`; `types.test.ts` (cycles 1, 5); `airtable.test.ts` (cycles 2-4, 6-7). Edit: `types.ts`, `airtable.ts`, any Lead-literal fixtures (cycle 8).

Non-breaking checklist: `listCampaigns()` shape unchanged + `activeId` from `Active` (Active NOT removed); `recordToCampaign` returning a superset does not break `use-campaigns.ts`/`criteria-configurator.tsx` (they read only id/name/criteria); `/api/campaigns` route + client hook calls untouched; Lead additions are required-with-defaults at every construction site; `emptyFields()`/`fieldsFromCriteria()` unchanged; full suite 88 green + new pure tests green; `tsc --noEmit` clean.

### Risks / decisions

- Leader stored as text (Admin id) in C0; migrate to a linked-record if leader UX needs it in C3.
- `Campaign` on a Lead is a real linked-record: read/write as an array exactly like `Assigned to` (the one fiddly mapping; cycles 6-7 pin it).
- Keep `Active` alongside `status`: the criteria UI + `activeId` depend on `Active`; `status` is the new lifecycle axis. Orthogonal in C0; C1 reconciles them. Note the redundancy so C1 cleans it up.
- `seatsBooked` stored only (default 0); increment/decrement logic deferred to C3. `liveCampaigns()` added now, first used by C2 routing.
- Every JSON column read goes through `safeParseJson` with a typed default (cycle 4 locks it).

---

## Phase C1 (detailed build spec, test-first) — Campaigns console (curation UI)

**Status: SHIPPED 2026-05-31 (branch `feat/campaigns-c1-console`). 104 tests, build clean, routes verified.**

Builds Overview/Curation + Itinerary + Criteria on the `/campaigns/[id]` shell, renames Trips to Campaigns, deletes Community. Assumes C0 shipped (full `Campaign`, `getCampaign`/`updateCampaign`, `PATCH /api/campaigns/[id]`); items needing that are flagged [C0-dep]. Planned via Plan agent + /tdd, 2026-05-31. No backend agent work (that is C2).

### Routes & components

```
app/src/app/(console)/
  campaigns/page.tsx                 NEW  thin -> <CampaignsList/>
  campaigns/[id]/page.tsx            NEW  async; const {id}=await params -> <CampaignDetail id={id}/>
  trips/page.tsx                     DELETE (route renamed to /campaigns; trips/* components stay until C3)
  community/page.tsx                 DELETE
  settings/page.tsx                  EDIT drop "Qualifying criteria" link
  settings/criteria/page.tsx         EDIT -> redirect("/campaigns")
app/src/components/campaigns/        NEW: campaigns-list, campaign-tile, new-campaign-button,
                                     campaign-detail, campaign-overview-form, itinerary-editor,
                                     string-list-editor, section-placeholder
app/src/components/settings/criteria-configurator.tsx  REFACTOR to controlled props
app/src/components/console-shell/sidebar.tsx           EDIT Trips->Campaigns, remove Community
app/src/lib/campaigns-view.ts        NEW pure view-models + validation
app/src/lib/itinerary-editor.ts      NEW pure reducer
app/src/lib/hooks/use-campaigns.ts   REFACTOR to full-CRUD
app/src/components/community/*, lib/community-view.ts(+test), lib/mock/community.ts   DELETE
```

Reused as-is: `TopBar`, `useLeads`, `useAdmins`, `SkeletonRows`, `fieldValue`. Untouched: all `intake/*`, `leads/*`, `/api/leads*`, `/api/admins*`.

### Public interfaces

`useCampaigns` (keep the existing pure reducers `seedState`/`addCriterion`/`removeCriterion`/`addCampaign`; generalize the store from "active campaign" to any campaign):
```ts
useCampaigns(): {
  campaigns: Campaign[]; loading: boolean;
  getCampaign(id): Campaign | undefined;
  create(name): Promise<string>;                    // resolves to new id for navigation
  updateCampaign(id, partial: Partial<Campaign>): void;  // optimistic + PATCH /api/campaigns/[id]
  addParam(id, label): void;  removeParam(id, key): void; // now id-scoped (were active-scoped)
  // removed from public surface: activeCampaign, setActive
}
```
`CriteriaConfigurator` becomes controlled: `{ campaign: Pick<Campaign,"id"|"criteria">; onAdd(label); onRemove(key) }` (internal campaign-selector removed; keeps all `data-testid`s so the behavior test survives).
`campaigns-view.ts` (pure, no React): `campaignTileVM(campaign, leads, admins)` and `campaignTiles(...)` (sort live -> draft -> closed) producing `{id,name,destination,dateRange,status,heat:{hot,warm,cold,total},seatsLabel,seatsFraction,leaderName}`; `formatDateRange(start,end)`; `validateCampaignDraft(draft, seatsBooked): CampaignFormErrors` (name required; end>=start; price>=0; seatsTotal>=seatsBooked); `canGoLive(c): {ok,missing[]}` (destination + both dates + >=1 itinerary day).
`itinerary-editor.ts` (pure): `addDay/removeDay/moveDay/editDay/renumber` (day = i+1, array is source of truth) + `addItem/removeItem` for inclusions/exclusions string lists.

### UI/UX (product register, Apple-light / systemBlue)

- List `/campaigns`: a single-column stack of wide horizontal `.tile` rows (NOT a decorative card grid), each a scannable manifest line: name (`font-display`) + status pill; mute line destination / date range / leader; right cluster heat chips (semantic hot/warm/cold, 0 faint) + a thin seats-fill bar (`--panel` track, `--accent` fill at `seatsFraction`, label "8 / 12"). Whole tile clicks through. Blue only on hover/active + seats-fill.
- Status pill: draft = neutral, live = `.tile-blue-soft`, closed = desaturated.
- Detail `/campaigns/[id]`: stacked sections (not tabs) with a scroll-spy section nav (Overview / Itinerary / Criteria / Enquiries / Re-engagement / Booked); Enquiries/Re-engagement/Booked render inert `section-placeholder` ("Coming in C2/C3"). Overview = two-column field grid, single systemBlue Save enabled when dirty+valid, inline errors, a quiet "Ready to go live" cue from `canGoLive`. Itinerary = auto-numbered day cards (title + detail, move up/down + remove) and an Add-day ghost button, then Inclusions/Exclusions string-list editors; saves coalesce on Save/blur (no PATCH-per-keystroke). New campaign = inline name field in the header (no modal). Empty/loading/unknown-id all quiet panels, never a thrown error.

### TDD vertical slices (test -> impl, tracer first)

| # | Behavior | Impl |
|---|---|---|
| 0 tracer | `sidebar` has Campaigns(`/campaigns`), no Community | edit sidebar |
| 1 | `campaignTileVM` heat/seats/leader/dateRange; `campaignTiles` ordering | `campaigns-view.ts` |
| 2 | `validateCampaignDraft` + `canGoLive` rules | same |
| 3 | itinerary reducer add/remove/move/edit + string list add(trim/dedupe)/remove | `itinerary-editor.ts` |
| 4 | `useCampaigns.updateCampaign(id,{...})` optimistic + PATCHes `/api/campaigns/[id]`; `addParam(id)` targets by id; `create` resolves id (stub fetch) | hook |
| 5 | `CriteriaConfigurator` controlled: 5 defaults shown; add calls `onAdd`; remove calls `onRemove` | refactor + rewrite its test |
| 6 | `CampaignsList`: one tile per campaign; New-campaign -> `create` + router.push; empty state | component |
| 7 | `CampaignOverviewForm`: edit + Save calls update with edited fields; invalid blocks Save | component |
| 8 | `ItineraryEditor`: add appends row; remove/move; Save calls `updateCampaign(id,{itinerary,inclusions,exclusions})` | component |
| 9 | community removal regression (delete tests with code; suite green) | deletions |

Not tested: exact Tailwind/pill palette, scroll-spy, locale exactness, the kept trips blaster.

### Files

Create: the 8 `components/campaigns/*` + 2 pages + `campaigns-view.ts` + `itinerary-editor.ts` + their tests. Edit: `sidebar.tsx`(+test), `use-campaigns.ts`(+test), `criteria-configurator.tsx`(+test), `settings/page.tsx`, `settings/criteria/page.tsx`. Delete (exhaustive): `app/(console)/community/page.tsx`, `components/community/{community-view(+test),community-panel,referral-leaderboard}.tsx`, `lib/community-view.ts(+test)`, `lib/mock/community.ts`, `app/(console)/trips/page.tsx`. Do NOT touch `LeadSource="referral"` / `mock/leads.ts` (unrelated).

### Non-breaking + risks

Non-breaking: reducer tests untouched; criteria add/remove still PATCH `/api/campaigns` `{id,criteria}` (server already supports it) so Airtable + intake panel unaffected; `/intake`+`/leads` untouched; grep-confirmed only the sidebar referenced Community; `[id]/page.tsx` awaits `params`. Risks: (R1) stacked sections chosen over tabs (curation is co-dependent); (R2) CriteriaConfigurator refactor rewrites its test in-slice, keeps testids; (R3) stop surfacing `activeId`, treat `status` as truth (a console can have many `live`), flag for C2 to delete `activeId`/`setActiveCampaign`; (R4) "live" gating = `canGoLive`; (R6) [C0-dep] confirm `PATCH /api/campaigns/[id]` + `updateCampaign` serialize itinerary/lists (JSON columns) before slices 7/8.

---

## Phase C2 (detailed build spec, test-first) — Lead routing + per-campaign intake

**Status: SHIPPED 2026-05-31 (branch `feat/campaigns-c2-routing`). 115 tests, build clean. Verified live: 1-live auto-route + multi-live ask-to-choose, both persisted to Airtable.**

Routing is a PURE function (every branch unit-tested); the handler/agent are thin orchestrators. Supersedes the single-active model. [C0-dep] needs `liveCampaigns()`, `Campaign.{status,destination}`, `Lead.campaignId`. Planned via Plan agent + /tdd, 2026-05-31.

### Public interfaces

New pure module `app/src/lib/server/lead-routing.ts` (no I/O, no `server-only`):
```ts
type RoutableCampaign = { key: string; name: string; destination: string }; // key == campaign id
type RoutingDecision = { campaignId: string | null; awaitingChoice: boolean;
                         source: "existing"|"single"|"agent"|"none" };
resolveCampaign(currentCampaignId, live, agentChoiceKey?): RoutingDecision;
needsAgentRouting(currentCampaignId, live): boolean;   // true only when multi-live + unrouted
isLiveKey(key, live): boolean;                          // rejects hallucinated keys
criteriaForLead(campaignId, campaignsById): QualifyingCriterion[]; // routed crit else DEFAULT_CRITERIA
```
`anthropic.ts`: `runIntakeAgent` input gains `liveCampaigns:{key,name,destination}[]`; output gains `campaign: string|null` (parse `parsed.campaign ?? null`); `buildSystemPrompt(criteria, liveCampaigns)` appends a Routing block ONLY when `liveCampaigns.length>1` (lists `key — name (destination)`, instructs infer-or-ask, set `campaign=null` when asking) and adds `"campaign"` to the JSON shape. STRICT JSON preserved.
`airtable.ts`: `F.campaign="Campaign"` linked-record array (like `Assigned to`): `updateLead` writes `partial.campaignId ? [id] : []`; `listLeads` reads `links[0] ?? null`; `setLeadCampaign(recordId, campaignId)`. Deprecate `getActiveCampaignCriteria` (remove its handler caller).
`sessions.ts`: `ConversationSession` gains `campaignId: string | null`.
Manual reassignment reuses the existing lead PATCH (`PATCH /api/leads/[id]` body gains `campaignId`), no new endpoint.

### Routing decision table (drives the tests)

| current | live | agentKey | -> campaignId | awaiting | source |
|---|---|---|---|---|---|
| set | any | any | current | false | existing |
| null | 1 | undefined | live[0] | false | single (auto, before agent) |
| null | 0 | any | null | false | none (defaults) |
| null | >=2 | valid key | that key | false | agent |
| null | >=2 | null/undefined | null | true | agent (asked) |
| null | >=2 | hallucinated | null | true | agent (isLiveKey rejects) |

### Conversation behavior

0 live: no routing block, qualify on defaults, never mention campaigns. 1 live: handler auto-routes BEFORE the agent; normal qualify, no "which trip". >1 live + clear: agent returns the key, qualifies on that campaign's criteria. >1 live + ambiguous ("Interested"): agent sets `campaign=null` and `reply` asks the lead to pick, listing live options; lead stays unrouted. Next inbound: the AGENT maps the free-text choice ("the himalayan one", Hinglish) to a key using full history; the pure function only validates it (`isLiveKey`). Mid-conversation campaign flip: the PR #13 reseed (`existingFields.every(f=>criteriaKeys.has(f.key)) ? existing : fieldsFromCriteria(criteria)`) already rebuilds fields on key mismatch. "Awaiting choice" is derived (`campaignId===null && live>=2`), not stored.

### Handler flow (orchestration only)

```
live = await liveCampaigns(); routable = live.map(id->{key,name,destination}); byId = Map(live)
campaignId = session.campaignId ?? null
pre = resolveCampaign(campaignId, routable, undefined); campaignId = pre.campaignId   // existing/single/none
criteria = criteriaForLead(campaignId, byId)                                          // reseed fields on key change
agent = runIntakeAgent({..., criteria, liveCampaigns: needsAgentRouting(campaignId,routable)?routable:[] })
post = resolveCampaign(campaignId, routable, agent.campaign); campaignId = post.campaignId
// persist campaignId on create/update; save session.campaignId
```

### TDD vertical slices

| Slice | Test | Impl |
|---|---|---|
| T0 tracer | `resolveCampaign` single-live auto | row "single" |
| T1 | existing / 0-live rows | those branches |
| T2 | multi + key / null / undefined | multi branch |
| T3 | hallucinated key rejected | `isLiveKey` |
| T4 | `needsAgentRouting` truth table | impl |
| T5 | `criteriaForLead` routed vs defaults | impl |
| T6 | `buildSystemPrompt(crit, multi)` has routing block + keys; single/`[]` omits it; JSON shape has `campaign` (assert on string, no network) | prompt |
| T7 | RTL Leads: Campaign column renders name; filter narrows by campaignId | column + filter |
| T8 opt | RTL reassign control PATCHes campaignId | drawer control |

No server/Airtable integration tests (repo has none): keep handler/agent thin, verify by build + `/api/dev/simulate-message`. Back-compat parse `campaign ?? null`.

### Files

Create: `lib/server/lead-routing.ts`(+test). Edit: `intake-handler.ts` (liveCampaigns + resolve flow), `anthropic.ts` (I/O + routing block), `airtable.ts` (`F.campaign`, setLeadCampaign, deprecate getActiveCampaignCriteria), `sessions.ts` (campaignId), `leads-view.ts` (campaignId filter + `campaignOptions`), `lead-table.tsx` + `leads-dashboard.tsx` + filter bar (Campaign column/filter), `lead-detail-drawer.tsx` (reassign), `api/leads/[id]/route.ts` (accept campaignId), campaign-detail Enquiries section (reuse LeadTable filtered by campaignId), `AI_AGENTS.md` (Agent 1 + Changelog).

### Non-breaking + risks

Non-breaking: 88 tests green (routing additive); single-campaign case identical to PR #13 (`liveCampaigns:[]`, no routing block); PR #13 criteria storage + dynamic prompt intact (only WHICH criteria changes + appended block); `/leads` still shows all leads with no filter; `liveCampaigns()->[]` when Airtable unset -> defaults. Risks: AI ambiguity reliability (mitigated by prompt rule + `isLiveKey`, monitor in Langfuse); agent owns free-text choice mapping, pure fn only validates; key == campaign id (no separate slug); `matchKeywords` available but not used for deterministic routing in v1 (AI inference is the locked path).

---

## Phase C3 (detailed build spec, test-first) — Campaign engagement + booked travellers

**Status: SHIPPED 2026-05-31 (branch `feat/campaigns-c3-engagement`). 117 tests, build clean. Verified live: booking updates seats; campaign match + broadcast (sent 1/0). Completes Module C. Follow-up: tune the re-engagement message prompt.**

Re-engagement becomes campaign-driven (trip data from the Campaign record, not a form); booking status drives seat inventory; booked travellers replace the deleted Community. [C0-dep] needs `Campaign.{destination,startDate,endDate,pricePerPerson,seatsTotal,seatsBooked,inclusions}`, `updateCampaign`, `Lead.{campaignId,bookingStatus}`. Self-planned (C3 agent hit a session limit), consistent with C0-C2 + the existing `trip-matching.ts`/`reengagement.ts`.

### Public interfaces

`lib/campaign-matching.ts` (rename of `trip-matching.ts`; keep the tested pure logic): `matchLeadsToCampaign(leads, campaign): MatchedLead[]` (destination-token OR budget-fit >=80% vs `pricePerPerson`, hot-first; internally may build a Trip-shaped view from the campaign), `generateMessage(lead, campaign)` (references campaign destination/dates/price/first inclusion), `classificationBreakdown`, `ReengagementMatch` type unchanged. Core audience = this campaign's un-booked enquiries (`campaignId===id && bookingStatus==='enquiry'`); the destination/budget matcher ranks + can suggest additional unrouted leads.
`lib/booking.ts` (PURE seat math): `countsAsSeat(s: BookingStatus): boolean` (booked||travelled); `seatDelta(from, to): -1|0|1` = `(countsAsSeat(to)?1:0) - (countsAsSeat(from)?1:0)`; `applyBooking(seatsBooked, seatsTotal, from, to): number` = clamp(seatsBooked + seatDelta, 0, seatsTotal ?? Infinity). Service `setBooking(leadId, campaign, from, to)`: `updateLead(leadId,{bookingStatus:to})` + `updateCampaign(campaign.id,{seatsBooked: applyBooking(...)})`.
`reengagement.ts`: `buildMatches(campaign)` and `personalizeReengagement(lead, campaign)` (was trip-based). `runBroadcast` unchanged (aisensy sim).
Routes (await `params`): `POST /api/campaigns/[id]/match` -> `buildMatches(getCampaign(id))`; `POST /api/campaigns/[id]/broadcast` -> `runBroadcast`. Old `/api/trips/match|broadcast` deleted.

### Seat-inventory decision table (drives tests)

| from -> to | seatDelta | note |
|---|---|---|
| enquiry -> booked | +1 | clamp <= seatsTotal |
| booked -> travelled | 0 | already counted |
| booked -> enquiry (cancel) | -1 | clamp >= 0 |
| travelled -> enquiry | -1 | |
| enquiry -> travelled | +1 | |
| same -> same | 0 | no-op |

### UI/UX (product register)

Campaign detail Re-engagement section reuses the existing trips-flow UX (match preview -> confirm -> broadcast -> summary) but campaign-driven: no form, audience + draft messages come from the campaign; the existing `match-preview` renders matched leads + per-lead Claude message. Booking control = a small segmented control (enquiry / booked / travelled) per enquiry row (blue = selected state); changing it optimistically updates and calls `setBooking`. Booked travellers = a filter/segment within Enquiries (or its own panel) listing `bookingStatus in (booked,travelled)`, with a seats booked/total indicator reusing the list-tile seats-fill. No referral leaderboard.

### TDD vertical slices

| # | Behavior | Impl |
|---|---|---|
| 0 tracer | `seatDelta(enquiry,booked)===1`, `(booked,travelled)===0` | `booking.ts` |
| 1 | `applyBooking` clamps at seatsTotal and at 0; null seatsTotal no upper clamp | same |
| 2 | full from x to delta table | same |
| 3 | `matchLeadsToCampaign(leads, campaign)` destination/budget match, hot-first (adapt `trip-matching.test.ts`) | rename+refactor |
| 4 | `generateMessage(lead, campaign)` includes destination + formatted dates + price | refactor |
| 5 | RTL booking control: changing status calls `setBooking`/optimistic update | component |
| 6 | RTL booked-travellers list renders only booked/travelled + seats indicator | component |

Not tested: broadcast/aisensy I/O, Claude personalization output (sim/template fallback already covered).

### Files

Rename: `lib/trip-matching.ts`(+test) -> `lib/campaign-matching.ts`(+test); fold `components/trips/*` into `components/campaigns/re-engagement*` (or reuse within campaign-detail). Create: `lib/booking.ts`(+test), `api/campaigns/[id]/match/route.ts`, `api/campaigns/[id]/broadcast/route.ts`, booking-control + booked-travellers components (+tests). Edit: `reengagement.ts` (campaign-based), `anthropic.ts` `personalizeReengagement(lead,campaign)`, `airtable.ts` (`updateCampaign` seatsBooked already from C0), campaign-detail (Re-engagement + Booked sections replacing C1 placeholders). Delete: `api/trips/match/route.ts`, `api/trips/broadcast/route.ts`. Keep `mock/leads.ts`/`mock/admins.ts`.

### Non-breaking + risks

Non-breaking: 88 tests green (note `trip-matching.test.ts` renamed/adapted, not dropped); intake/leads/curation untouched; aisensy sim path preserved; routes await `params`. Risks: raw-phone-for-real-send still open (PR #5) -> sim only; re-engagement audience defaults to this campaign's un-booked enquiries (wider destination/budget matches are suggested, not auto-included); broadcast idempotency not handled in v1 (sim tolerant; revisit with AISensy); booked-travellers as a segment within Enquiries vs its own section is a minor UI call (segment chosen); seat counts can drift if Airtable hand-edited (seatsBooked is derived-on-write, not recomputed) -> acceptable v1, a recompute helper can be added later.
