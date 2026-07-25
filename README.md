# Five Archetypes Platform — Phase 1 scaffold

A starting skeleton for the corporate team-relationship platform built on
Carey Davidson's Five Archetypes system. **This is not a finished product.**
It exists to hand off a working foundation to Claude Code (or any dev)
instead of an empty folder.

Read `CLAUDE.md` first, then `docs/BUILD_PLAN.md` for full product context,
then `docs/CLAUDE_CODE_KICKOFF.md` for the recommended build order.

## What's real vs. stubbed

- **Real**: the archetype relationship logic (`src/lib/archetypes.ts`) —
  Sheng/Ke cycle lookups, bridge-element calculation, rank-profile and
  relationship computation. This is exercised end-to-end by the demo pages
  under `/teams/demo` using fictional data (`src/lib/sampleData.ts`), no
  database required.
- **Scaffolded, not wired up**: the Prisma schema (`prisma/schema.prisma`)
  and client (`src/lib/prisma.ts`) exist but no page queries them yet.
  Auth, CSV upload, PDF generation, and the real report template content
  are not built — see the kickoff doc for build order.

## Setup

1. Install Node 20+.
2. `npm install`
3. Copy `.env.example` to `.env` and point `DATABASE_URL` at a
   [Neon](https://neon.tech) Postgres project's connection string. The app
   connects via the Neon serverless driver + Prisma driver adapter
   (`src/lib/prisma.ts`, `driverAdapters` preview feature in
   `prisma/schema.prisma`), which is Neon-specific — a plain local/Docker
   Postgres won't work with this wiring.
4. `npm run prisma:migrate` — creates the tables from `prisma/schema.prisma`.
   This needs a plain TCP connection to the database (Prisma Migrate's engine
   doesn't go through the driver adapter), so it won't work from a network
   that only allows outbound HTTPS.
5. `npm run prisma:seed` — loads one fictional demo org/team so the DB
   isn't empty once pages are wired up to it.
6. `npm run dev` — runs at http://localhost:3000. Visit `/teams/demo` for
   the working demo (uses in-memory sample data, not the DB, until step 1
   of the kickoff doc is done).

## Tech stack

Next.js (App Router) + TypeScript + Tailwind + Prisma/Postgres, per
docs/BUILD_PLAN.md Section 7.2. Auth provider not yet chosen/installed —
recommendation was Clerk or Auth0, left out of this scaffold so `npm install`
doesn't require API keys you don't have yet.
