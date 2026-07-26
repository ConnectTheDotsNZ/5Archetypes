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
  Rows match existing members by **email first, then name**, and never create
  people — an admin resolves an unmatched row with a per-row picker in the
  preview. Real exports drove this: score sheets carry title rows above the
  header, element columns in their own order, and often first names only.
- Member-facing email: an org `ADMIN` can tick "notify" / "send their report"
  during a save, which queues a PENDING `MemberNotification` and/or sets
  `Member.sendReportsToMember`. `src/lib/memberNotifications.ts` drains the
  outbox through the `EmailProvider` seam in `src/lib/email/provider.ts` —
  Gmail SMTP (Google Workspace on connectthedots.co.nz, App Password) for
  testing, `console` for local dev, and **nothing sent at all unless
  `EMAIL_PROVIDER` is set**, by design. Sending is triggered by an admin
  button on the scores page; a scheduled drain replaces it later.
  `SCORES_RECEIVED` is the only sendable kind — `REPORT_READY` stays queued
  until report generation exists (Steps 5–6) and should honour
  `sendReportsToMember`. Rows are claimed (`SENDING`) before the provider is
  called, so a drain can't double-send; a row stuck in `SENDING` is surfaced,
  never auto-retried.
- Consent is **deliberately unbuilt** for the MVP (owner's call): no opt-in
  gate, no unsubscribe. The audit trail on `MemberNotification` (who asked,
  which address, when) is what stands in for it. Consent belongs at org
  signup, and is a prerequisite for the GDPR/EU work in Phase 2 — don't ship
  member email to EU orgs before it exists.
- Member emails carry no interpretive content: the templates say scores were
  recorded and by whom, and omit the scores themselves. Anything that
  explains an archetype must come from Carey's approved library.
- Individual Archetype Profile report + PDF export. One React template
  (`src/components/reports/IndividualProfileReport.tsx`) renders both the web
  view (`/teams/[teamId]/members/[memberId]`, and the demo equivalent) and the
  PDF (`.../pdf` route), so the download can't drift from the preview. The
  model is assembled by `src/lib/reports/individualProfile.ts` — the
  "template engine" of BUILD_PLAN 7.3 — from computed data plus the content
  library. PDF goes through the `PdfRenderer` seam in `src/lib/pdf/renderer.ts`,
  which supports both hosting shapes: a container/VPS's installed Chromium via
  puppeteer-core, and Vercel's serverless runtime via `@sparticuz/chromium`
  (auto-selected from Vercel's own `VERCEL` env var — see `docs/DEPLOYMENT.md`).
- **All report narrative copy is still a placeholder.**
  `src/lib/content/individualProfile.ts` is the structured content library:
  every block is `{ status: "PLACEHOLDER", awaiting }` and renders as
  `[PLACEHOLDER: pending Carey's content library]` in the report. Approving
  copy means changing data in that file, not the template. Do not fill those
  blocks in with invented psychological content or book text.
- Report styles are plain CSS in `src/components/reports/reportStyles.ts`, not
  Tailwind — Chromium renders the PDF from `renderToStaticMarkup` output with
  no Tailwind build attached, so one inlined stylesheet is what keeps PDF and
  web identical. App chrome still uses Tailwind.
- Workplace Pairwise Relationship Report + PDF, same architecture as the
  individual one (`src/components/reports/PairwiseRelationshipReport.tsx`,
  model in `src/lib/reports/pairwiseReport.ts`). Structure is BUILD_PLAN 3.2's
  merged template — Core Dynamic, In Practice, Score Impact, Escalation Loop,
  Risks, Calibration Tools, Direct Script — plus the Fields layer (Blame Loop,
  Bridge element, Water Doorway, Distortions, three pillars) where it applies.
  Pairwise copy lives in `src/lib/content/pairwiseReport.ts`, keyed by the
  **pair of primary archetypes** (15 unordered pairs, same-lead included),
  since that's the unit Carey approves once and the platform reuses for every
  pair of people leading with those elements. All placeholders.
- `src/lib/content/blocks.ts` holds the shared `ContentBlock` type used by both
  libraries. Bridge/Blame-Loop/Distortion wording quoted in BUILD_PLAN 2.3 is
  from Carey's own report and is deliberately **not** reproduced in the library.
- Both report pages (`/teams/[teamId]/...` and the `/teams/demo/...` mirrors)
  render the same components as their `.../pdf` routes. The demo PDF routes are
  intentionally unauthenticated: they render `sampleData.ts` only, which makes
  the export path testable without a login or a database.
- Phase 1's build order (docs/CLAUDE_CODE_KICKOFF.md Steps 1–7) is complete.
  The team heatmap at `/teams/[teamId]` already carried the Sheng/Ke flag table
  and report links from Step 1, so Step 7 needed no further work.

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
