# Deployment runbook

Pivot deploys as a split stack: **Vercel** for the frontend, **Railway** for
the backend. The whole flow takes ~30 minutes the first time.

## Prerequisites

- GitHub account with this repo pushed
- Free Vercel account: <https://vercel.com>
- Free Railway account: <https://railway.app> (sign in with GitHub)

## Step 1 — Backend on Railway

1. Open <https://railway.com/new>, click **Deploy from GitHub repo**, pick
   the Pivot repo.
2. After it imports, open the service settings:
   - **Root Directory:** `server`
   - **Build & Deploy:** picks up [server/railway.json](server/railway.json) automatically
3. Open **Variables** and add:
   - `NODE_ENV=production`
   - `CORS_ORIGIN=` _(leave blank for now — fill in after Step 2)_
4. Click **Deploy**. Wait for the green check (~1 min).
5. Open **Settings → Networking → Generate Domain**. Copy the URL,
   e.g. `https://pivot-api-production.up.railway.app`.
6. Smoke test:
   ```bash
   curl https://pivot-api-production.up.railway.app/api/health
   ```
   Should return JSON with `playable`, `endpoints`, and `pools` fields.

## Step 2 — Frontend on Vercel

1. Open <https://vercel.com/new>, **Import** the GitHub repo.
2. Vercel auto-detects Vite from [vercel.json](vercel.json). Confirm:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Open **Environment Variables** and add:
   - `VITE_API_BASE` = the Railway URL from Step 1, e.g. `https://pivot-api-production.up.railway.app`
4. Click **Deploy**. Wait for the green check (~1 min).
5. Note the Vercel URL, e.g. `https://pivot.vercel.app`.

## Step 3 — Lock down CORS

1. Back in Railway, **Variables**, edit `CORS_ORIGIN` to the Vercel URL
   from Step 2, e.g. `https://pivot.vercel.app`.
2. Railway redeploys automatically.

## Step 4 — Smoke test the live site

- Open the Vercel URL in a browser.
- Click PIVOT → menu → **Today's Puzzle** → submit a valid word → win.
- Open the same URL in a separate browser/incognito → daily puzzle should be
  identical.
- DevTools → Network → confirm `/api/puzzle/daily` calls go to the Railway
  domain.
- Throw a deliberate render error (e.g. paste `throw new Error('test')` into
  the console while on the menu) — confirm the ErrorBoundary fallback shows
  with a Reload button.

## Step 5 — Update README

In [README.md](README.md):
- Replace the "Live demo" placeholder with the Vercel URL.
- Optional: add deploy badges:
  ```md
  ![Vercel](https://img.shields.io/badge/deploy-Vercel-000)
  ![Railway](https://img.shields.io/badge/deploy-Railway-9F4FFF)
  ```

## Rollback

- Vercel: open the project → **Deployments** → click the previous green
  one → **Promote to Production**.
- Railway: open the service → **Deployments** → **⋯ → Redeploy** on the
  previous build.

## Costs

- Vercel **Hobby** plan: free, sufficient for this project.
- Railway **Trial**: $5 free credit; after that ~$5/mo for a service this
  size. Pause the service when not actively demoing if you want zero cost.
