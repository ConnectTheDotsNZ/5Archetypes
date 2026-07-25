# The Five Archetypes Platform — Build Plan (v1)

Prepared for Glenn Marvin (ConnectTheDots) · For review with Carey Davidson.
This is the markdown copy of `Five_Archetypes_Platform_Build_Plan_v2.docx`,
kept in-repo so Claude Code always has it on hand.

## 1. Vision & Scope

A web-based platform that lets HR specialists and middle managers at
corporate clients upload or enter their team's Five Archetypes assessment
results, and instantly get back a team relationship map and individual,
colleague-specific guidance — so people understand why they clash with
certain colleagues, what actually helps, and how to communicate better day
to day.

Built on Carey Davidson's Five Archetypes system (Wood, Fire, Earth, Metal,
Water), the two report styles already prototyped by hand, and Carey's new
"Fields" theory, which is what makes this genuinely useful for a corporate
audience rather than a personality-quiz novelty.

Launch model: self-serve, multi-tenant SaaS. HR teams sign up, create a
workspace for their organisation, add their people, feed in results, and
generate reports themselves — with Carey formally involved as content
partner and quality gate, not a manual bottleneck in every report.

Approach: pilot first with a small number of design-partner clients on a
lean MVP, built on foundations that don't need to be re-architected when
self-serve signup and scale-out open up.

## 2. What We Learned From the Source Material

### 2.1 The five archetypes

Adapted from Traditional Chinese Medicine's Five Element theory. Everyone
carries all five in a personal rank order — Primary, Secondary, Third,
Fourth, Lowest — not a single "type."

- **Wood** — "The Trailblazer." Decisive, driven, protective. Under stress:
  pushy, "my way or the highway."
- **Fire** — "The Optimist." Joyful, connective, playful. Under stress:
  scattered, fears losing love/connection.
- **Earth** — "The Caregiver." Empathetic, the team's "glue." Under stress:
  over-pleasing, can't say no, fears being taken for granted.
- **Metal** — "The Architect." Precise, structured, high standards. Under
  stress: overly critical, stuck on minutiae.
- **Water** — "The Philosopher." Reflective, patient, deep-thinking. Under
  stress: withdraws, fears becoming irrelevant.

### 2.2 How archetypes relate to each other

Carey's book is explicit that there are no inherently "bad" pairings —
friction is information, not incompatibility. Two fixed cycles drive all
relationship logic, and both are directly reusable as lookup tables in
software (see `src/lib/archetypes.ts`):

- **Generating/Soothing cycle (Sheng)**: Wood → Fire → Earth → Metal →
  Water → back to Wood. Neighbours in this cycle calm and replenish each
  other — a natural, low-effort support system.
- **Controlling/Challenging cycle (Ke)**: Wood↔Earth, Earth↔Water,
  Water↔Fire, Fire↔Metal, Metal↔Wood. Natural "button-pushers" —
  productive friction, a diagnostic clue rather than a warning sign.

### 2.3 The "Fields" theory — Carey's new layer

New since the book, introduced in the Earth_Wood report. Core building
blocks:

- **The Field** — the shared, dynamic space between two people that
  reorganises the moment either person changes what they put into it.
- **Three Pillars** — Understand (recognise the pattern), Tend (daily
  preventive practice), Regulate (in-the-moment reset).
- **Distortions** — each archetype's stress state runs on a specific false
  belief (e.g. Earth's is "Nobody notices I am the glue holding this
  together"; Wood's is "Why are we still talking about this?").
- **The Blame Loop** — a named, step-by-step escalation cycle between two
  specific archetypes, where each person's stress response triggers the
  other's next stage.
- **The Bridge element** — for any pair, the element sitting between them
  on the Sheng cycle is their natural, low-strain meeting point (e.g. Fire
  bridges Earth and Wood).
- **The Water Pause / Water Doorway** — a universal regulation capacity
  available to everyone, with a personalised trigger-point and reset script
  per archetype.

Carey's report notes that across roughly 98,000 assessments she's
analysed, about 70% of people score Water as their lowest or second-lowest
element. Worth asking Carey directly whether that dataset exists digitally
— if so, it's a genuine benchmarking asset later (see Section 9).

### 2.4 Three report "species" already exist

1. **Individual profile report** (book style) — one person, ranked profile,
   needs list, stress patterns, self-care guidance. No counterpart needed.
2. **One-to-many workplace relationship guide** (Glenn Personalised Guide
   style) — one anchor person's numeric scores (5 decimals) compared
   against each named colleague's scores, 7-part template per relationship:
   Core Dynamic, In Practice, Score Impact, Predictable Escalation Loop,
   Risks, Calibration Tools, Direct Script.
3. **Generic archetype-pair relational report** (Earth_Wood "Fields"
   style) — not tied to named individuals, built around the Field/Blame
   Loop/Bridge/Water Doorway vocabulary, across 9 sections ending in a
   quick-reference card.

The platform's core job is to generalise report species 2 and 3 into an
engine that can produce them for any two people on any team, on demand.

## 3. Product Definition

### 3.1 Data model foundations

- **Assessment scores** — five decimal scores (0–1) per person, one per
  element, from which the ranked profile (Primary→Lowest) is derived.
- **Sequencing profile** — a narrative role attached to each element
  (Wood: Activate, Earth: Absorb/Sustain, Fire: Express, Water: Model
  downstream consequences, Metal: Specify thresholds/quality). Confirm with
  Carey whether this is element-based or rank-position-based (see
  CLAUDE.md open questions).
- **Relationship computation** — for any two people: per-element score
  deltas, shared vs. contrasting lead/trail elements, Sheng-neighbour vs.
  Ke-challenger status, and the Bridge element.

### 3.2 Report species in the MVP

Phase 1 targets two report types, delivered as polished PDFs to start:

- **Individual Archetype Profile** — book-style summary for one person.
- **Workplace Pairwise Relationship Report** — a merged format combining
  Glenn's Guide's operational rigour (named individuals, real score
  deltas, escalation loop, calibration tools, direct scripts) with the
  Fields vocabulary (Blame Loop, Bridge element, Water Doorway, Empathy
  moves). Becomes the single template used for every pair on a team.

The full generic "Fields" report (all archetype-pair combinations) is a
strong Phase 2/3 candidate once the merged pairwise template is validated.

## 4. User Roles & Core Journeys

- **HR Admin/Manager** (primary user) — owns the org workspace, adds team
  members, uploads/enters results, views team + pairwise reports.
- **Individual team member** — no access in Phase 1; self-service login to
  view one's own profile is a natural Phase 2 addition.
- **Carey/content reviewer** (internal) — owns and approves the content
  library the template engine draws from; no direct access to client data.

Core Phase 1 journey: sign up → create team → add members → feed in
scores (CSV or manual) → view team heatmap → drill into pairs → generate
Individual Profile / Pairwise Report → export PDFs.

## 5. Feature Set by Phase

| Phase | Features | Why here |
|---|---|---|
| **Phase 1 — Pilot MVP** | Org signup (manual/invite-only), team + member management, CSV upload + manual score entry, Individual Profile report (PDF), Workplace Pairwise Report (PDF), team heatmap with Sheng/Ke flags, Carey's content library v1, a handful of design-partner clients. | Fastest path to a real, working product without building auth-at-scale or billing yet. |
| **Phase 2 — Self-serve & compliance** | Public self-serve signup + billing, interactive web dashboard, individual self-view login, native assessment delivery, GDPR readiness (EU hosting, DPA workflow, data subject rights), full generic Fields report for all archetype-pair combinations. | Needed once past hand-holding a few pilots into an actual product people can find and buy. |
| **Phase 3 — Expansion** | Connectors to external assessment tools, org-wide analytics/benchmarking, manager coaching workflows, integrations (Slack/Teams), white-label option. | Growth features once product-market fit is proven. |

## 6. The Team & Relationship Matrix

**Team-level view**: a grid/heatmap of the whole team, colour-coded by
Primary archetype, with an aggregate "team elemental balance" indicator.

**Pairwise drill-down**: clicking any two people opens the Workplace
Pairwise Relationship Report, generated on demand. Sheng-neighbour pairs
(natural allies) and Ke-challenger pairs (natural button-pushers) should be
visually flagged directly on the grid.

## 7. Technical Architecture

### 7.1 Multi-tenancy

Row-level multi-tenancy: every table carries an `organizationId`, enforced
via row-level security. Each organisation carries a `region` field from day
one so EU tenants can be routed to EU infrastructure in Phase 2 without a
re-architecture.

### 7.2 Suggested stack

| Layer | Recommendation |
|---|---|
| Frontend | Next.js (React) + Tailwind |
| Backend/API | Node/TypeScript, Next.js API routes to start |
| Database | PostgreSQL with row-level security; Prisma ORM |
| Auth | Managed provider (Clerk or Auth0) |
| Report rendering | Shared React report-template components → PDF via headless Chromium (Puppeteer); same components reused for the Phase 2 web view |
| Ingestion | CSV upload with column-mapping/validation/preview wizard, plus manual entry forms |
| Background jobs | Lightweight queue (Inngest or BullMQ) |
| Hosting | Vercel or AWS, US region at launch, EU region added in Phase 2 |
| Analytics/observability | PostHog + Sentry |

### 7.3 Report generation approach

Hybrid, not a raw "ask an LLM to write a personality report" approach: a
structured content library (definitions, needs lists, distortions, Blame
Loop scripts, Bridge tending practices, Water Doorway scripts, calibration
tools) that Carey authors and approves once per archetype/pair, assembled
by a templating engine driven by the computed data model, with an optional
LLM pass only for smoothing connective narrative sentences.

## 8. Branding Direction

Pulled from fivearchetypes.com (Carey has no formal brand guide yet):

- **Colour**: deep brick/crimson red (book cover, primary accent) + warm
  gold/tan (CTAs, icon rings) over a cream/off-white base, with a soft
  blush-pink section colour used sparingly.
- **Typography**: a classic serif for headlines/wordmark, paired with a
  clean sans-serif for body copy — "published author," credible-but-warm
  rather than generic tech-SaaS.
- **Iconography**: thin-line circular badge icons per element, gold-outlined
  on the marketing site. Worth deciding whether the platform gives each
  element its own colour internally (useful for the heatmap) even if the
  marketing site stays monochrome.
- **Tone**: "a change model, not a label" — practical and outcomes-focused.

Reserve final palette/typography sign-off for Carey — the reports carry her
name.

## 9. Content, IP & Compliance Considerations

1. **IP scope with Carey** — the book credits assessment item wording to
   Harriet Beinfield/Efrem Korngold and Dr. Stephen Cowan. Confirm what
   Carey is licensed/willing to let the platform use verbatim vs. what
   needs re-authoring, before any assessment questions are reproduced
   digitally.
2. **The scoring algorithm gap** — the book's assessment produces simple
   0–4 Likert totals ranked ordinally; Glenn's Guide uses continuous 0–1
   decimal scores to three places, and that conversion isn't documented
   anywhere. Needs to come directly from Carey before the assessment/
   scoring engine can be built.
3. **US positioning** — the platform should be explicitly framed/disclaimed
   as a team-development and communication tool, not an employment-decision
   tool. Personality/behavioural assessment tools used in US employment
   contexts can draw EEOC/disparate-impact scrutiny — worth a short legal
   review before launch, even for a pilot.
4. **Data sensitivity** — behavioural/personality data about named
   employees. Handle with HR-grade care: consent/notice, org-level
   retention controls, export/delete capability from day one.
5. **GDPR readiness for Phase 2** — lawful basis, DPAs per org, EU hosting
   option, data-subject-rights workflow. Flagging now so the Phase 1 data
   model doesn't need rework later.
6. **Carey's aggregate dataset** — ~98,000 assessments cited in the Fields
   report. Confirm whether it exists digitally; if so, scope benchmarking
   features into Phase 2/3.

## 10. Roadmap & Milestones

| Phase | Milestone | Key deliverables |
|---|---|---|
| Phase 0 | Foundations | IP/licensing agreement finalised; scoring algorithm confirmed; content library v1 drafted and approved by Carey; brand palette/typography signed off. |
| Phase 1 | Pilot MVP | Org/team/member management; CSV + manual ingestion; Individual Profile and Workplace Pairwise Report as PDF; team heatmap with Sheng/Ke flags; live with a handful of design-partner clients. |
| Phase 2 | Self-serve launch | Public signup + billing; interactive web dashboard; individual self-view; native assessment delivery; GDPR readiness; full generic Fields report. |
| Phase 3 | Scale | External assessment connectors; benchmarking analytics; manager coaching workflows; integrations; white-label option. |

## 11. Open Questions for You & Carey

1. What is the actual algorithm behind the 0–1 decimal scores used in
   Glenn's Guide, and can it be documented/formalised?
2. Is the Wood=Activate/Earth=Absorb-Sustain/Fire=Express/Water=Model-
   consequences/Metal=Specify-thresholds mapping tied to the element
   itself, or to its rank position in a person's profile?
3. What exactly is Carey licensed/willing to let the platform reproduce
   from the book — assessment wording, needs lists, Ayurvedic charts —
   versus what needs re-authoring?
4. Does Carey's ~98,000-assessment dataset exist in usable digital form?
5. Should the Workplace Pairwise Report default to Glenn's Guide's
   operational tone, the Fields report's more emotional tone, or a blend —
   and does that differ for peer/peer vs. manager/report pairs?
6. Who are the pilot design-partner clients, and is there a target date?
7. What's the realistic budget/dev resourcing for Phase 1?

## 12. Recommended Next Steps

1. Schedule a working session with Carey to close out the Section 9 items.
2. Confirm the pilot client list and target timeline.
3. Stand up the data model and the merged Workplace Pairwise Report
   template as the first build milestone.
4. Firm up the brand palette/typography with Carey's sign-off before UI or
   PDF template work starts.
