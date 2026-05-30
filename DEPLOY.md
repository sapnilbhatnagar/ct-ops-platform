# Deploy to Vercel

The app lives in the `app/` subfolder. Two ways to ship it. The dashboard
import (Option A) is the fastest and keeps the project under your account.

## Option A — Vercel dashboard (about 2 minutes)

1. Go to [vercel.com/new](https://vercel.com/new) and **Import** the
   `sapnilbhatnagar/CT-ops-copilot` GitHub repo.
2. **Root Directory:** click **Edit** and set it to **`app`**. (Vercel
   auto-detects Next.js from there.)
3. **Environment Variables:** add the ones below (copy the secret values
   from your local `app/.env.local`).
4. Click **Deploy**. You get a `https://ct-ops-copilot-*.vercel.app` URL.
5. Every push to `main` auto-deploys; every PR gets a preview URL.

## Option B — Vercel CLI (if you prefer the terminal)

```bash
npm i -g vercel
cd app
vercel link          # sign in, pick scope, create project
vercel env add ...   # add each variable below (or paste in the dashboard)
vercel --prod
```

If you give me a Vercel token (`export VERCEL_TOKEN=...`), I can run the
production deploy for you.

## Environment variables

Set these in the Vercel project (Production, and Preview if you want previews
functional). Values for the secrets are in your local `app/.env.local`.

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | (secret, from .env.local) |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` |
| `AIRTABLE_API_KEY` | (secret, from .env.local) |
| `AIRTABLE_BASE_ID` | `appM9rCnr2Zg29dwn` |
| `AIRTABLE_LEADS_TABLE` | `Leads` |
| `AIRTABLE_ADMINS_TABLE` | `Admins` |
| `LANGFUSE_PUBLIC_KEY` | (from .env.local) |
| `LANGFUSE_SECRET_KEY` | (secret, from .env.local) |
| `LANGFUSE_HOST` | `https://cloud.langfuse.com` |
| `AISENSY_SIM_MODE` | `true` |
| `AISENSY_WEBHOOK_SECRET` | any 32+ char string |
| `AISENSY_TEMPLATE_HOT_LEAD` | `hot_lead_notification_v1` |
| `AISENSY_TEMPLATE_GREETING` | `intake_greeting_v1` |

With these set, the live link is fully functional: the Leads dashboard reads
your Airtable, and the Trips re-engagement runs Claude. WhatsApp stays in sim
mode until the AISensy key is added.

Without the keys the site still loads and the UI works on mock data, so a
no-secret deploy is fine for a pure visual demo.

## After deploying

Add the live URL to the top of `BUILD_SUMMARY.md` so your partner and the
client can find it.
