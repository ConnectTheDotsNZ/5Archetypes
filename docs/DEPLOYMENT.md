# Deploying the MVP

Two separate goals, two different answers:

- **"I want to click through it today"** → deploy to Vercel. Minutes, no
  server to manage, PDF export works. See "Quick preview on Vercel" below.
- **"I want it live on a connectthedots.co.nz subdomain"** → a container host.
  See "Deploying to a subdomain" further down. Takes longer to set up, costs
  a small amount monthly, but is the shape this should run in longer-term.

Nothing about the second option requires having done the first — pick either
one first, independently.

## Quick preview on Vercel

This gets a shareable `https://something.vercel.app` URL with the full app —
including working PDF export — running.

1. Push this repo to GitHub (if not already) and import it on
   [vercel.com/new](https://vercel.com/new). Framework preset: Next.js,
   detected automatically.
2. Set these environment variables in the Vercel project (Settings →
   Environment Variables):
   ```
   DATABASE_URL=            # a Neon connection string — free tier is enough
   AUTH0_SECRET=            # openssl rand -hex 32
   AUTH0_BASE_URL=          # filled in after the first deploy gives you a URL
   AUTH0_CLIENT_ID=
   AUTH0_CLIENT_SECRET=
   AUTH0_ISSUER_BASE_URL=
   ```
   Leave `EMAIL_PROVIDER`, `PDF_RENDERER` and `CHROMIUM_PATH` **unset**. PDF
   export auto-detects Vercel (via the `VERCEL` variable Vercel sets on every
   deployment, no action needed) and uses `@sparticuz/chromium` — a Chromium
   build compiled small enough to ship inside a serverless function — instead
   of the container path.
3. Deploy. Once you have the assigned URL, go back and set `AUTH0_BASE_URL`
   to it, and add that same URL as an Allowed Callback URL
   (`<url>/api/auth/callback`), Logout URL, and Web Origin on the Auth0
   application.
4. Apply migrations once, from your own machine, pointed at the same
   `DATABASE_URL`: `npx prisma migrate deploy`. Optionally `npm run
   prisma:seed` for the fictional demo org.

**What to expect to work:** everything — the demo pages need no
configuration at all, and login/teams/ingestion/both reports/both PDF
exports all work once the env vars above are set. Verify in the same order
as the subdomain checklist below.

**Why this isn't the final answer:** Vercel is a fine permanent home for the
app itself, but running Chromium in a 250MB-ish serverless function on every
PDF request is slower and pricier at real volume than a container with
Chromium already resident. Treat this as "look at it now," not "where it
lives."

## Deploying to a subdomain (connectthedots.co.nz)

Target: something like `archetypes.connectthedots.co.nz`, so the MVP can be
clicked through and shown to design-partner clients before any decision about
permanent hosting.

## The thing to understand first

**A subdomain is a DNS record, not a host.** `archetypes.connectthedots.co.nz`
can point anywhere — it does not have to live where `www.connectthedots.co.nz`
lives, and in all likelihood it can't.

This app is a Node.js server. It needs:

| Requirement | Why |
|---|---|
| Node.js 20+ runtime | Next.js App Router with server actions |
| A persistent process (not just PHP/static) | server-side rendering and server actions |
| Chromium on disk | PDF export (`src/lib/pdf/renderer.ts`) |
| Outbound HTTPS + SMTP | Neon Postgres, Auth0, Gmail SMTP on port 587 |
| ~1GB RAM | Chromium spikes while rendering a PDF |

So if `www.connectthedots.co.nz` is WordPress on shared hosting, Squarespace,
Wix or similar, **the app cannot run there** — but the subdomain can still be
used, by pointing a DNS record at a host that can run it.

## Recommended shape for the MVP

1. **Host the app** on a container platform. Any of these work with the
   included `Dockerfile` and cost roughly USD $5–15/month at MVP scale:
   - **Fly.io** — closest region to NZ is Sydney (`syd`), good latency
   - **Render** — simplest setup, has a free tier for staging
   - **Railway** — also straightforward
   - A plain VPS (DigitalOcean/Vultr Sydney) if you'd rather own the box
2. **Point DNS** at it: a `CNAME` for `archetypes` → the host's hostname, in
   whatever DNS manages `connectthedots.co.nz`. The host issues the TLS
   certificate automatically.
3. **Keep the database on Neon** (already wired). Choose the region nearest
   your users; `ap-southeast-2` (Sydney) if available.
4. **Auth0** — add the new origin to the Auth0 application:
   - Allowed Callback URL: `https://archetypes.connectthedots.co.nz/api/auth/callback`
   - Allowed Logout URL and Web Origin: `https://archetypes.connectthedots.co.nz`

Vercel isn't the recommendation for the *permanent* subdomain — see the
container-vs-serverless cost/latency note at the end of the Vercel section
above — but it's no longer a functionality gap: `getPdfRenderer()` already
has a `@sparticuz/chromium` branch that Vercel picks up automatically (see
"Quick preview on Vercel" above). Use whichever hosting shape fits how this
gets rolled out; both produce identical PDFs.

## Environment variables

Copy from `.env.example`. For a deployed environment:

```
DATABASE_URL=            # Neon connection string
AUTH0_SECRET=            # openssl rand -hex 32
AUTH0_BASE_URL=https://archetypes.connectthedots.co.nz
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_ISSUER_BASE_URL=https://YOUR_TENANT.us.auth0.com

# Leave EMAIL_PROVIDER unset until you want members emailed for real.
EMAIL_PROVIDER=
GMAIL_USER=noreply@connectthedots.co.nz
GMAIL_APP_PASSWORD=
EMAIL_FROM=Five Archetypes <noreply@connectthedots.co.nz>

# The Dockerfile sets these already; override only if Chromium moves.
PDF_RENDERER=chromium
CHROMIUM_PATH=/usr/bin/chromium
```

`EMAIL_PROVIDER` unset means queued member notifications stay queued and the
admin UI says email isn't configured — the safe default for a preview
environment where you don't want real people emailed by accident.

## Deploy steps

```bash
# 1. Build and run locally first, to prove the image
docker build -t five-archetypes .
docker run --rm -p 3000:3000 --env-file .env five-archetypes

# 2. Apply migrations against the target database (once per deploy)
DATABASE_URL="<neon url>" npx prisma migrate deploy

# 3. Optional: load the fictional demo org
DATABASE_URL="<neon url>" npm run prisma:seed
```

Then push the image to the chosen host (`fly deploy`, or connect the repo on
Render/Railway and let it build the Dockerfile).

## Verifying a deployment

In order, because each step depends on the last:

1. `https://<host>/teams/demo` — the demo heatmap renders. No login, no
   database needed. If this works, the app is running.
2. `https://<host>/teams/demo/members/avery` — the Individual Profile
   template, with placeholder markers where Carey's copy will go.
3. `https://<host>/teams/demo/members/avery/pdf` — a PDF downloads. **This is
   the Chromium check**; a 503 here means `CHROMIUM_PATH` is wrong.
4. `https://<host>/teams/demo/pairs/avery/priya` and its `/pdf` — the pairwise
   report and its export.
5. Log in, which provisions an Organization + User row on first sign-in.
6. Create a team, add two members with emails, and import scores from a CSV at
   `/admin/teams/<id>/scores/upload`.
7. Open the real report pages for those members, and download both PDFs.
8. Only then, set `EMAIL_PROVIDER=gmail` and send one queued notification to a
   mailbox you control.

## Running it locally instead

If you'd rather click through on your own machine before deploying anywhere:

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL and the AUTH0_* values
npx prisma migrate deploy
npm run prisma:seed       # optional demo org
npm run dev               # http://localhost:3000
```

For local PDF export you need a Chromium: `brew install chromium` on macOS, or
`apt install chromium` on Linux. It's autodetected in the usual locations;
otherwise set `CHROMIUM_PATH`.

The `/teams/demo/**` pages work with no database and no Auth0 configured at
all, so `npm run dev` alone is enough to see both report templates and their
PDFs.
