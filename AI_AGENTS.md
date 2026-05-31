# AI Agents Inventory

Complete reference for all Claude agents running in Connecting Traveller. Updated after every agent addition or configuration change.

**Last updated:** 2026-05-30 (PR #13)

---

## Overview

| # | Agent | Purpose | Model | Status |
|---|---|---|---|---|
| 1 | **Intake Qualification** | Chat with leads, extract intent, classify | Claude 3.5 Sonnet | Live (sim mode) |
| 2 | **Re-engagement Personalization** | Write contextual trip messages to past leads | Claude 3.5 Sonnet | Live (sim mode) |
| 3 | **Lead Conversation Summarizer** | One-line summary + suggested next action | Claude 3.5 Sonnet | Live (sim mode) |

---

## Agent 1: Intake Qualification

Chats with WhatsApp leads, extracts their intent (name, destination, dates, group size, budget) plus any custom campaign-configured criteria, and classifies them as hot/warm/cold.

### Location
- **File:** `app/src/lib/server/anthropic.ts`
- **Function:** `runIntakeAgent(input: IntakeAgentInput)`
- **Handler:** `app/src/lib/server/intake-handler.ts`
- **Trigger:** `POST /api/dev/simulate-message` (sim mode) or AISensy webhook (production)

### Configuration
- **Model:** `env.anthropic.model()` (Claude 3.5 Sonnet)
- **Max tokens:** 800
- **Temperature:** Not set (default 1.0)
- **Prompt strategy:** **Dynamic** — built from the lead's routed campaign criteria at runtime (the five defaults until the lead is routed), plus a routing block when several campaigns are live

### System Prompt Template
```
You are the intake agent for Connecting Traveller, a small-group travel company in India.
You qualify inbound WhatsApp leads from Meta ads.

Tone: warm, brief, professional, never robotic. Match user's language (English, Hindi, Hinglish).

Your job: gather these qualifying fields in a natural conversation, not a form:
1. name
2. destination (where they want to travel)
3. travel_dates (when, as specific as they will give)
4. group_size (how many people)
5. budget (per person or total, INR)
[+ any custom criteria from the active campaign, e.g., Occasion, Past traveller, etc.]

Rules:
- Ask at most one question per message. Never list multiple questions.
- If the user volunteers information, acknowledge it and skip to the next gap.
- If the user goes off-topic, answer briefly and steer back to the next missing field.
- If the user sends a voice note or image, reply that you cannot process those yet and ask them to type.
- Once all fields are collected, send a short closing message confirming next steps.
- If the conversation goes more than 10 turns without progress, close politely and mark incomplete.

Classification logic (decide based on the fields + context):
- hot: group_size >= 2, travel_dates within 60 days, budget at or above Rs 15,000/person (or Rs 30,000 total), urgency expressed
- warm: any 3+ fields filled, intent clear, but timing or budget soft
- cold: vague, browsing, no concrete intent
- unclassified: not enough information to decide yet

Output format: Always return STRICT JSON only (no prose) with this exact shape:

{
  "reply": "the message text to send back to the user via WhatsApp",
  "extractedFields": {
    "name": "string or null",
    "destination": "string or null",
    "travel_dates": "string or null",
    "group_size": "string or null",
    "budget": "string or null",
    ... any custom field keys from the active campaign ...
  },
  "classification": "hot" | "warm" | "cold" | "unclassified",
  "classificationReason": "one sentence explaining the classification",
  "complete": true | false
}

Set complete=true only when every field is filled AND you have sent a closing message.
```

### Inputs
```typescript
{
  sessionId: string;              // phone hash (SHA256)
  history: Message[];             // prior conversation messages
  newUserMessage: string;         // latest message from lead
  existingFields: ExtractedField[]; // already-extracted fields from prior turns
  criteria: QualifyingCriterion[];  // the lead's ROUTED campaign criteria (defaults until routed)
  liveCampaigns: { key; name; destination }[]; // live campaigns to route among (empty unless multi-live)
}
```

### Outputs
```typescript
{
  reply: string;                  // message to send back via WhatsApp
  extractedFields: ExtractedField[]; // updated field values + confidence + turn index
  classification: "hot" | "warm" | "cold" | "unclassified";
  classificationReason: string;   // one sentence
  complete: boolean;              // true when all fields filled + closing sent
  campaign: string | null;        // routed campaign key, or null if it asked the lead to choose
}
```

### Langfuse Observability
- **Trace Tag:** `"intake"`
- **Session ID:** phone hash (same as userId)
- **Metadata:**
  ```json
  {
    "turnIndex": number,
    "filledFields": number
  }
  ```
- **View in Langfuse:** Filter by tag `intake`, sort by timestamp, inspect input/output/metadata

### Key Behaviors
1. **Dynamic prompting:** The system prompt is built from the active campaign's criteria at request time (via `buildSystemPrompt(criteria)`)
2. **Custom criteria:** When an admin adds a criterion in Settings > Qualifying criteria, the next inbound message automatically extracts it (no code deploy needed)
3. **Field merging:** Extracted values are merged with existing fields; if a field was already extracted, new values override old ones
4. **Classification happens every turn:** Even partial conversations are classified so the operator can see lead temperature in real time

### How to Add / Modify
1. **New extraction fields:** Add them via Settings > Qualifying criteria (no backend change needed)
2. **Change classification logic:** Edit the "Classification logic" section of the system prompt template in `anthropic.ts`
3. **Change tone:** Edit the opening ("Tone: warm, brief...") section
4. **Change max tokens:** Modify the `800` value in `client().messages.create({max_tokens: 800})`
5. **Change model:** Set `ANTHROPIC_MODEL` env var (currently Claude 3.5 Sonnet)

---

## Agent 2: Re-engagement Personalization

When a new trip is posted, generates contextual WhatsApp messages for each lead who hasn't booked but matches the trip's destination/budget.

### Location
- **File:** `app/src/lib/server/reengagement.ts`
- **Function:** `personalizeReengagement(trip, lead)`
- **Trigger:** `POST /api/trips/broadcast` (called after trip creation + matching)

### Configuration
- **Model:** Claude 3.5 Sonnet
- **Max tokens:** 600
- **Prompt strategy:** Static template with trip/lead context interpolated

### System Prompt
```
You are writing a WhatsApp message to a past lead from Connecting Traveller.
They expressed interest in [TRIP_DESTINATION] but haven't booked yet.
A new trip matching their criteria just opened.

Write a brief, warm, contextual message (2-3 sentences max).
Mention the trip destination and dates.
Include a soft CTA ("Want to lock in your spot?" or similar).
Match their language preference (English, Hindi, Hinglish).
Never mention price unless they specifically asked about it.
```

### Inputs
```typescript
{
  trip: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number;
    description: string;
  };
  lead: {
    contactName: string;
    destination: string;
    language: string;
    extractedFields: ExtractedField[];
    messages: Message[];
  };
}
```

### Outputs
```typescript
{
  message: string;  // 100-150 character WhatsApp message
}
```

### Langfuse Observability
- **Trace Tag:** `"reengagement"`
- **Session ID:** leadId
- **Metadata:**
  ```json
  {
    "tripId": string,
    "leadId": string,
    "matched": boolean
  }
  ```
- **View in Langfuse:** Filter by tag `reengagement`, group by tripId to see which leads matched

### Key Behaviors
1. **Template fallback:** If Claude fails, falls back to a generic "We have a new trip to [destination] coming up!" message
2. **No price in message:** Avoids mentioning budget to keep it warm and exploratory
3. **Language match:** Tries to match the lead's preferred language (from Airtable)

### How to Add / Modify
1. **Refine tone:** Edit the system prompt in `reengagement.ts`
2. **Add trip details to message:** Modify the prompt to include trip theme, duration, highlights
3. **Change fallback:** Edit the hardcoded fallback message
4. **Add custom fields:** Pass additional lead data to the prompt (e.g., "They mentioned traveling with kids")

---

## Agent 3: Lead Conversation Summarizer

Summarizes a complete lead conversation into one actionable sentence + suggested next step.

### Location
- **File:** `app/src/lib/server/anthropic.ts`
- **Function:** `summarizeConversation(messages)`
- **Trigger:** `POST /api/leads/summary` (called when opening a lead detail in UI)

### Configuration
- **Model:** Claude 3.5 Sonnet
- **Max tokens:** 300
- **Prompt strategy:** Static template

### System Prompt
```
Summarize this WhatsApp conversation in one sentence.
Capture: who they are, where they want to go, and their urgency/intent.

Then suggest the next step the sales team should take (e.g., "Send itinerary", "Follow up on dates", "Address budget concerns").

Output as JSON:
{
  "summary": "string (one sentence, 15-20 words max)",
  "nextAction": "string (one action item, imperative form)"
}
```

### Inputs
```typescript
{
  messages: Message[];  // full conversation history
}
```

### Outputs
```typescript
{
  summary: string;      // "Couple planning 10th anniversary trip, Udaipur, Dec, hot lead"
  nextAction: string;   // "Send Udaipur itinerary options for December 15-22"
}
```

### Langfuse Observability
- **Trace Tag:** `"summary"`
- **Session ID:** leadId
- **Metadata:**
  ```json
  {
    "leadId": string,
    "messageCount": number,
    "timeToSummarize": number
  }
  ```
- **View in Langfuse:** Filter by tag `summary`, check latency to optimize

### Key Behaviors
1. **Shown in lead detail drawer:** Summary appears at the top when you click a lead in the Leads table
2. **Skeleton loading:** UI shows a loader while Langfuse processes
3. **Failure graceful:** If Claude fails, hides the summary section (doesn't break the UI)

### How to Add / Modify
1. **Change summary length:** Edit "15-20 words" to desired length
2. **Add custom fields:** Modify prompt to ask for specific things ("Did they mention kids?", "Budget range?")
3. **Change next action guidance:** Add examples to the prompt ("e.g., 'Confirm dates', 'Send payment terms'")

---

## Checking Agents in Langfuse

### Dashboard Setup
1. Log in to https://cloud.langfuse.com
2. Credentials in `app/.env.local`: `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY`
3. Navigate to Traces (left sidebar)

### Filter by Agent
- **Intake traces:** Filter > Tag = `intake`
- **Re-engagement traces:** Filter > Tag = `reengagement`
- **Summary traces:** Filter > Tag = `summary`

### Inspect a Trace
1. Click any trace
2. **Input:** see the system prompt + user messages
3. **Output:** see the agent's full JSON response
4. **Metadata:** timestamps, token usage, latency, error messages
5. **Scores:** (empty by default) add custom scores for evals

### Evaluating Agent Performance
1. **Intake classification accuracy:** Open intake traces, add a score `"correct_classification": true/false`
2. **Re-engagement engagement rate:** (requires AISensy link clicks) track which messages got responses
3. **Summary quality:** Rate summaries 1-5, filter by score to find patterns
4. **Latency:** Watch token usage to spot expensive prompts; optimize if avg > 1s

---

## Environment Variables

All agents use these credentials (in `app/.env.local`, gitignored):

```bash
# Anthropic
ANTHROPIC_API_KEY=sk_...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Langfuse
LANGFUSE_PUBLIC_KEY=pk_...
LANGFUSE_SECRET_KEY=sk_...
LANGFUSE_HOST=https://cloud.langfuse.com

# Airtable
AIRTABLE_TOKEN=pat...
AIRTABLE_BASE_ID=appM9rCnr2Zg29dwn

# WhatsApp (sim mode for now)
AISENSY_SIM_MODE=true
# AISENSY_API_KEY=...  (when available)
# AISENSY_AGENT_PHONE=...  (when available)
```

---

## Updating This File

After every change to agents (new agent, prompt tweak, model upgrade):

1. Update the agent's section with new details
2. Update "Last updated" date at the top
3. Add a line to the Changelog (below)
4. Commit with message: `docs(agents): [change description]`
5. Include the update in BUILD_SUMMARY.md under the relevant PR

---

## Changelog

### 2026-05-31 (Campaigns C2-C3)
- **Agent 2 (Re-engagement):** now campaign-driven, fed by the Campaign record (destination/dates/price/inclusions) via `campaignToTrip`, triggered from the campaign's Re-engagement section (`/api/campaigns/[id]/match` + `/broadcast`). Message-prompt quality is a known follow-up (it currently second-guesses budget fit).
- **Agent 1 (Intake):** Lead-to-campaign routing added. The agent receives the live campaigns and returns a `campaign` key. With one live campaign the handler auto-routes before the agent runs; with several, the agent infers the campaign from the conversation or asks the lead to choose (returns `campaign: null` and stays unrouted). Criteria are resolved per the lead's routed campaign (defaults until routed), retiring the single global "active campaign". Pure decision logic: `lib/server/lead-routing.ts` (`resolveCampaign`, `needsAgentRouting`, `isLiveKey`, `criteriaForLead`).

### 2026-05-30 (PR #13)
- **Agent 1 (Intake):** Dynamic prompting wired. Prompt now built from active campaign's configured criteria at request time. Custom criteria (e.g., "Occasion") automatically extracted from new conversations.
- **Agent 2 (Re-engagement):** Live with template fallback. Matches leads to trips on destination + budget.
- **Agent 3 (Summary):** Live. Shows in lead detail drawer.
- All three agents traced in Langfuse with tags, metadata, and full I/O logging.

---

## Next Steps

1. **AISensy wiring:** When the WhatsApp key arrives, set `AISENSY_SIM_MODE=false` and add real phone numbers. Agents work as-is; only the delivery changes.
2. **Prompt refinement:** Use Langfuse traces to audit agent outputs. Refine prompts based on real lead data.
3. **New agents:** As you add capability (e.g., discount negotiation, referral outreach), add them to this inventory.
4. **Model upgrades:** If Claude releases a faster or cheaper model, update `ANTHROPIC_MODEL` and re-run old tests against new traces.
