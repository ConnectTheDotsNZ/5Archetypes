# Five Archetypes Platform — project memory

Read this file first in every session. Full background lives in
`docs/BUILD_PLAN.md` (product plan) and `docs/CLAUDE_CODE_KICKOFF.md`
(recommended build order/prompts) — read both before making architectural
changes.

## What this is

A multi-tenant SaaS platform for corporate HR/middle managers: they upload
or enter their team's Five Archetypes assessment scores, and the platform
generates (a) individual archetype profiles and (b) pairwise workplace
relationship reports for any two people on a team, plus a team-level
heatmap. Built on Carey Davidson's Five Archetypes system (Wood, Fire,
Earth, Metal, Water) and her newer "Fields" relational theory. Carey is a
formal content partner — she reviews/approves the underlying content
library, not individual generated reports.

Owner: Glenn Marvin (ConnectTheDots, glenn@connectthedots.co.nz).
Primary market: US at launch; GDPR/EU support is an explicit Phase 2 item,
not an afterthought — don't hard-code assumptions that make that hard later
(see the `region` field on `Organization`).

## Current status

This is a **Phase 1 scaffold**, not a working product yet. What exists:

- `src/lib/archetypes.ts` — the core reference data and relationship logic
  (Sheng/Ke cycles, bridge element, rank profile, relationship computation).
  This is the one file that should be treated as closest to "correct" —
  everything else is UI scaffolding around it.
- `prisma/schema.prisma` — data model (Organization/User/Team/Member/
  Assessment/GeneratedReport), connected via `/teams/[teamId]` and
  `/admin/teams/**`.
- Demo pages under `src/app/teams/demo/**` — render the real logic above
  against fictional in-memory data (`src/lib/sampleData.ts`), so the
  architecture is visibly provable without a database. These stay
  unauthenticated on purpose; every other `/teams/**` and `/admin/**` route
  requires login.
- Real Auth0 session auth (`src/lib/auth0.ts`, `src/middleware.ts`). Signing in
  for the first time provisions an `Organization` + `User` row
  (`src/lib/userProvisioning.ts`); `getCurrentOrganization()`/
  `requireCurrentOrganization()` in `src/lib/auth.ts` are how every org-scoped
  query resolves "the current org" — always go through those rather than
  reading a param.
- Score ingestion (`src/app/admin/teams/[teamId]/scores/**`): manual entry per
  member plus a CSV upload wizard (map columns → preview every row → save).
  The parsing/validation rules live in `src/lib/scoreIngestion.ts` and
  `src/lib/csv.ts` and are shared verbatim by the client-side preview and the
  server action, so the preview is a true dry run and the server stays
  authoritative. Ingestion is append-only — each save adds an `Assessment`
  row (tagged `MANUAL_ENTRY`/`CSV_UPLOAD`) and reports read the latest one.
  Rows are matched to existing members by name and never create people.
- No PDF generation, no real report copy yet.

## Non-negotiable open questions — do not silently resolve these

These are flagged in `docs/BUILD_PLAN.md` Section 11 and are **not yet
answered by Carey**. Where the code has to make an assumption to keep
moving, it's commented inline — do not quietly firm these up as if they
were confirmed:

1. **Scoring algorithm**: how raw assessment answers become the 0–1 decimal
   scores used everywhere (`Assessment.wood..water`). Not documented in any
   source material. Treat incoming scores as an opaque input for now — do
   not invent a scoring formula.
2. **Sequencing role mapping** (`SEQUENCING_ROLE` in `archetypes.ts`):
   coded as element-based (Wood is always "Activate," etc.). Might actually
   be rank-position-based. One-table change if Carey corrects it — don't
   let it spread across the codebase before it's confirmed.
3. **IP/licensing scope**: don't reproduce verbatim text from Carey's book
   (assessment item wording, needs lists, Ayurvedic charts) anywhere in
   customer-facing copy or seed/demo data until licensing is confirmed.
   Original short paraphrases (as used in `archetypes.ts`) are fine for
   internal/engineering reference; they are not appropriate as final
   customer-facing report copy.

## Conventions

- TypeScript, App Router, Tailwind. Brand tokens (`brick`, `gold`, `cream`,
  `blush`, plus one colour per element) are in `tailwind.config.ts`, pulled
  from fivearchetypes.com — **not yet signed off by Carey**, treat as
  provisional.
- Multi-tenancy: every domain table carries (or descends from) an
  `organizationId`. Do not introduce a table that can't be scoped to an org.
- Report generation direction (see BUILD_PLAN Section 7.3): the long-term
  approach is a structured, Carey-approved content library assembled by a
  template engine, with LLM use limited to smoothing connective prose — not
  a "prompt an LLM to write the whole report" approach. Don't build toward
  the latter by default.
- Never invent or reproduce Carey's actual assessment questionnaire items —
  ingestion assumes scores arrive already computed (CSV/manual entry).

## Where to look for more detail

- `docs/BUILD_PLAN.md` — the full product/technical plan (vision, phased
  feature set, data model reasoning, branding, compliance flags, roadmap).
- `docs/CLAUDE_CODE_KICKOFF.md` — the ordered list of build tasks/prompts
  for turning this scaffold into the real Phase 1 MVP.
