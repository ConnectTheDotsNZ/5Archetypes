# Kicking off the build in Claude Code

## Before you start

1. Install Node.js 20+ and git if you don't have them.
2. Get a Postgres connection string. Fastest options: a free project on
   [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com)
   (copy the connection string they give you), or run Postgres locally via
   Docker if you'd rather keep data on your machine.
3. Decide an auth provider account to sign up for when you get to Step 2
   below — [Clerk](https://clerk.com) is the easiest to wire into Next.js
   quickly; Auth0 is the other reasonable option. You don't need the account
   yet, just know which one you're using.
4. Unzip this project somewhere on your machine, `cd` into it, and run:
   ```
   git init
   git add .
   git commit -m "Initial Phase 1 scaffold"
   ```
   This gives you a clean baseline commit before Claude Code starts making
   changes, so every step below is a reviewable diff.
5. Open a terminal in the project folder and run `claude` to start a
   session. Claude Code will automatically read `CLAUDE.md` for context.

## How to use the prompts below

Paste them one at a time, in order — each one assumes the previous step is
done. After each step: read the diff, run `npm run dev` and click around,
then commit before moving to the next prompt. Don't paste all seven at
once; each is meant to be its own reviewed session.

---

### Step 1 — Connect the database and confirm the demo data round-trips

> Set up the local environment: help me create a `.env` file from
> `.env.example` with my `DATABASE_URL`, run `npm run prisma:migrate` to
> create the tables, and `npm run prisma:seed` to load the demo org. Then
> add a `/teams/[teamId]` page that reads real Member + Assessment rows from
> Postgres via Prisma instead of the hard-coded `sampleData.ts`, reusing the
> existing heatmap UI from `src/app/teams/demo/page.tsx`. Keep the
> `/teams/demo` sample-data page as-is for reference.

### Step 2 — Real authentication and org scoping

> Wire up Clerk (or Auth0, whichever I've signed up for) for authentication.
> When a new user signs up, create an `Organization` and a `User` row linked
> to it. Every subsequent query (teams, members, assessments) must be scoped
> to the logged-in user's `organizationId` — add that scoping consistently,
> not just on the pages I happen to test.

### Step 3 — Team & member management UI

> Build the UI for an HR admin to create a team, and add/edit/remove team
> members (name, role title, email optional) within their organisation.
> This is CRUD only — no assessment scores yet.

### Step 4 — Score ingestion: CSV upload + manual entry

> Build the assessment ingestion flow: (a) a manual entry form for one
> member's five scores, and (b) a CSV upload wizard that lets an admin map
> columns to member name + the five element scores, previews the parsed
> rows, and validates before saving. Store the source (`MANUAL_ENTRY` vs
> `CSV_UPLOAD`) on the `Assessment` row per the existing schema.

### Step 5 — Individual Archetype Profile report + PDF export

> Build the real Individual Archetype Profile report, replacing the
> placeholder content in `src/app/teams/demo/members/[memberId]/page.tsx`.
> Use `[PLACEHOLDER — pending Carey's content library]` for any narrative
> copy that should ultimately come from Carey's approved content (needs
> list, stress patterns, self-care guidance) rather than inventing
> psychological content yourself. Then add a "Download PDF" action that
> renders the same report to PDF via headless Chromium (Puppeteer), reusing
> the React components rather than a separate template.

### Step 6 — Workplace Pairwise Relationship Report + PDF export

> Build out the real Workplace Pairwise Relationship Report, replacing the
> placeholder in `src/app/teams/demo/pairs/[memberAId]/[memberBId]/page.tsx`.
> Structure it as the merged template from docs/BUILD_PLAN.md Section 3.2:
> Core Dynamic, In Practice, Score Impact, Predictable Escalation Loop,
> Risks, Calibration Tools, Direct Script — plus the Fields concepts (Blame
> Loop, Bridge element, Water Doorway) where the pair are Ke-challengers.
> Use `[PLACEHOLDER — pending Carey's content library]` markers for any
> narrative text that should come from Carey rather than being invented.
> Add PDF export the same way as Step 5.

### Step 7 — Wire the team heatmap to real data

> Update the real `/teams/[teamId]` heatmap page (from Step 1) to include
> the Sheng/Ke pairwise-flag table and "View report" links, matching
> `src/app/teams/demo/page.tsx`, but pointed at real members and linking to
> the real report pages from Steps 5–6 instead of the demo ones.

---

## After Phase 1 is functionally complete

Don't start Phase 2 (public self-serve signup, billing, GDPR work, native
assessment delivery) until the Section 9 open questions in
`docs/BUILD_PLAN.md` are resolved with Carey — several of them (the scoring
algorithm, IP licensing scope) change how earlier steps above should have
been built, so it's worth a deliberate check-in before building further on
top of assumptions.
