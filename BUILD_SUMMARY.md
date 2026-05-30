# Build Summary

Plain-English status for anyone joining the project. Updated after every PR merge.

**Last updated:** 2026-05-30 (after PR #4)

---

## What we're building

A web console for Connecting Traveller (a travel business) that catches every WhatsApp lead from their ads, lets an AI assistant qualify it, and helps the team re-engage the hundreds of leads that don't book the first time. Two engines: **Intake** (qualify new leads in real time) and **Re-engagement** (message past leads when a matching trip opens).

## What's working live right now

- **The AI intake pipeline.** A WhatsApp message comes in, Claude (Anthropic) chats with the lead, pulls out the five things we need (name, destination, dates, group size, budget), decides if they're hot/warm/cold, saves them to our Airtable database, and pings the sales team if it's hot. Every step is logged to Langfuse so we can see what the AI did. This runs today without a real WhatsApp connection using a "simulate message" test button, because the WhatsApp provider key isn't available yet.
- **The Leads dashboard** reads the real Airtable data: a sortable, filterable table of every lead, with a side panel to read the conversation and reassign or re-tag a lead.

## What's built and looks real, but runs on sample data

These screens are designed and working, waiting for their backend wiring:

- **Trips & re-engagement:** enter a new trip, see which past leads match, preview a personalised message for each, and "send."
- **Community & referrals:** booked travellers grouped by trip with invite/welcome status, plus a referral leaderboard.

## What's left

1. **WhatsApp connection (AISensy):** we need the API key and a short check of their webhook format. Until then, sim mode covers it.
2. **Leads backend polish** (Phase 2b): richer Airtable wiring.
3. **Trips backend** (Phase 3b): real lead-matching and WhatsApp broadcast.
4. **Community backend** (Phase 4b): real traveller and referral data.
5. **Go live:** deploy to Vercel.

## How we work

Every feature is a separate branch and pull request; nothing goes to `main` without passing tests and a build. We build the screen first (on sample data), get it signed off, then wire the backend. See `CONTRIBUTING.md`.

## How to run it

```bash
cd app
npm install
npm run dev      # open http://localhost:3000
npm test         # 76 tests, all passing
```

You don't need any keys to click around the UI. To run the live AI intake, copy `app/env.example` to `app/.env.local` and follow `SETUP.md`.

## Where to read more

- `README.md` — full technical overview and phase table
- `Build Plan.md` — detailed spec for every phase
- `SETUP.md` — exact credentials needed to go fully live
