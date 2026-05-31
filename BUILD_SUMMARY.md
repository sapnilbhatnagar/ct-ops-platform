# Build Summary

Plain-English status for anyone joining the project. Updated after every PR merge.

**Last updated:** 2026-05-31 (after Campaigns C3)
**Live demo:** https://ct-ops-copilot.vercel.app (real Airtable + Claude; WhatsApp in sim mode).

---

## What we're building

A web console for Connecting Traveller (a travel business) that catches every WhatsApp lead from their ads, lets an AI assistant qualify it, and helps the team re-engage the hundreds of leads that don't book the first time. Two engines: **Intake** (qualify new leads in real time) and **Re-engagement** (message past leads when a matching trip opens).

## What's working live right now

- **The AI intake pipeline.** A WhatsApp message comes in, Claude (Anthropic) chats with the lead, pulls out the five things we need (name, destination, dates, group size, budget), decides if they're hot/warm/cold, saves them to our Airtable database, and pings the sales team if it's hot. Every step is logged to Langfuse so we can see what the AI did. This runs today without a real WhatsApp connection using a "simulate message" test button, because the WhatsApp provider key isn't available yet.
- **The Leads dashboard** reads the real Airtable data: a sortable, filterable table of every lead, with a side panel to read the conversation and reassign or re-tag a lead. Opening a lead now shows a one-line **AI summary and a suggested next action** (Claude, traced in Langfuse).
- **The Intake screen** is now a working conversation workspace: live list of WhatsApp leads, the thread opens in the middle with a reply box (the operator answers from inside the platform; real send goes through the WhatsApp Business API once connected), and a Live extraction panel that checks the lead against the campaign's qualifying criteria.
- **Qualifying criteria are configurable per campaign** from Settings, stored in Airtable, and **the AI intake agent actually extracts them** from new WhatsApp conversations (its prompt is built from the campaign's criteria). Add a custom parameter like "Occasion" and a new lead's occasion is captured automatically.
- **Trips re-engagement** now runs on the real backend: enter a new trip and it matches every stored lead, and Claude writes a personalised WhatsApp message for each match (traced in Langfuse). The "send" goes through sim mode until the WhatsApp key arrives.

## The Campaigns module (in progress)

We're reorganising the product around **campaigns** (for example "London Diwali 2026"). A campaign owns its trip details (destination, dates, price, itinerary, seats), the ads that bring leads in, its own qualifying questions, the enquiries it sources, and its re-engagement. This reframes "Trips" into "Campaigns" and folds the old "Community" idea in as each campaign's booked-traveller list. **The Campaigns console is now live:** a campaign list plus a detail screen where you curate the trip (overview, day-by-day itinerary, seats) and set its qualifying questions. **Inbound leads are now automatically routed to the right campaign:** when one campaign is live a new lead is attached to it; when several run at once the AI agent works out which trip the lead means, and politely asks them to pick when it cannot tell. Each campaign shows its own enquiries, and the Leads table has a campaign column and filter. **Booking and seat tracking are in too:** mark an enquiry booked/travelled and the campaign's seat count updates, and you can re-engage past leads who fit the trip with a Claude-drafted WhatsApp message (sim mode). The Campaigns module is now feature-complete; the old Trips and Community screens are fully folded in.

## What's left

1. **WhatsApp connection (AISensy):** we need the API key and a short check of their webhook format. Until then, sim mode covers both intake replies and trip broadcasts. (One open detail: real sending needs the lead's raw phone number, which we don't store yet for privacy; we'll resolve that with the AISensy wiring.)
2. **Leads backend polish** (Phase 2b): richer Airtable wiring, conversation summaries.
3. **Re-engagement message quality:** the campaign re-engagement flow works, but the Claude prompt that drafts each message needs tuning (Langfuse-observable) so it sells the trip rather than second-guessing budget fit.
4. **Go live:** deploy to Vercel.

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
