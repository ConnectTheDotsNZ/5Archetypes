# Questions for Carey — content library + open decisions

**Purpose.** The platform is now built end to end: scores go in, and both
reports come out as web pages and PDFs. Every number, every ranking and every
structural statement works. What is deliberately missing is the writing, and
three decisions only Carey can make.

This document is meant to be sent to Carey more or less as-is. Part A is the
content she needs to author. Part B is the questions that change how the
platform behaves.

Two things worth saying up front, because they shape everything below:

- **Nothing in the platform interprets an archetype.** No psychological
  content has been written by us or by an AI. Where interpretation belongs,
  the reports currently print `[PLACEHOLDER — pending Carey's content
  library]` and name what is missing. That is a deliberate constraint, not an
  oversight.
- **Nothing from the book is reproduced.** Not assessment items, not needs
  lists, not the distortion wording, not the Ayurvedic charts — because the
  licensing scope isn't settled (Part B, question 3).

---

## Part A — the content library

### A.1 What we mean by a "content library"

The platform is not an AI that writes personality reports. It is a template
engine: it computes the facts (rankings, gaps, Sheng/Ke relationships, bridge
elements) and then slots in copy Carey has written **once** per archetype or
per archetype-pair. The same paragraph about a Wood/Earth pairing is reused
for every Wood-led and Earth-led pair of colleagues on every team, forever.

That's what makes it a product rather than a consulting deliverable, and it's
why the writing is a fixed, finite job rather than an endless one.

Concretely: **161 blocks of copy** in total. Once they exist, every report the
platform will ever produce is fully written.

### A.2 Individual Archetype Profile — 20 blocks

Per element (Wood, Fire, Earth, Metal, Water) — **15 blocks**:

| Block | What it is | Appears |
|---|---|---|
| `needs` | What this archetype needs to stay at its best | In that element's card, for all five elements |
| `stressPatterns` | How it shows up under stress | Same card |
| `selfCare` | Self-care / regulation guidance | Same card |

Report-level framing — **5 blocks**:

| Block | What it is |
|---|---|
| `introduction` | Opening framing: what this document is, how to hold it |
| `primaryArchetype` | What it means to *lead* with your primary — written generically, since the platform inserts which element it is |
| `lowestArchetype` | How to work with your lowest element |
| `sequencing` | What the sequencing roles are and why they matter |
| `closing` | Where to go next |

### A.3 Workplace Pairwise Relationship Report — 141 blocks

**The seven-section template, per archetype pair — 105 blocks.**

Fifteen unordered pairs (same-lead pairs included) × seven sections:

`Wood+Wood`, `Wood+Fire`, `Wood+Earth`, `Wood+Metal`, `Wood+Water`,
`Fire+Fire`, `Fire+Earth`, `Fire+Metal`, `Fire+Water`,
`Earth+Earth`, `Earth+Metal`, `Earth+Water`,
`Metal+Metal`, `Metal+Water`, `Water+Water`

| Section | What it is |
|---|---|
| Core dynamic | What this pairing is like at its best, and what it costs when it goes wrong |
| In practice | How the dynamic shows up in day-to-day work |
| Score impact | How to read the two people's specific numbers — the platform supplies the numbers and the gaps; this block says what to make of a large vs small gap |
| Predictable escalation loop | The step-by-step cycle where each person's stress response triggers the other's next stage |
| Risks | What to watch for if the loop keeps running |
| Calibration tools | Practices that keep the pairing working before it needs repair |
| Direct script | Words to use in the moment — ideally one for each side of the pair |

**The Fields layer — 33 blocks:**

| Block | Count | What it is |
|---|---|---|
| Blame Loop | 15 (per pair) | The named escalation cycle for that specific pairing |
| Bridge tending | 5 (per element) | How to tend the bridge element that sits between a Ke-challenger pair. Keyed by the bridge element itself, so Fire's practice is reused wherever Fire is the bridge |
| Water Doorway | 5 (per element) | Each archetype's personalised trigger point and reset script |
| Distortion | 5 (per element) | The false belief that archetype's stress state runs on |
| Three pillars | 3 | Understand / Tend / Regulate, explained for a workplace pair |

**Framing — 3 blocks:** `introduction`, `fieldExplainer` (what the Field is,
for a workplace audience), `closing`.

### A.4 Questions about the content library

1. **Does any of this already exist in a form we can use?** The Earth/Wood
   Fields report and the individual profiles suggest a lot of it is written
   somewhere. If so, the job may be closer to extraction and approval than
   authoring from scratch. Which of the 161 blocks are already drafted?
2. **What's the natural authoring order?** Our suggestion: the five
   individual-profile elements first (15 blocks — it makes one whole report
   complete and demonstrable), then the Fields layer (33 blocks, mostly
   per-element and reusable), then the 105 pair-section blocks. Does that
   match how Carey would rather work?
3. **How long should each block be?** For layout: is a block one paragraph,
   three paragraphs, or a bulleted list? Our templates handle paragraphs and
   bullets, but the PDF page count depends on the answer.
4. **Is the seven-section pairwise template right as-is?** It's taken from
   the Glenn Personalised Guide. Should any section be dropped, renamed, or
   added now that it's going to be reused for every pair?
5. **Are same-lead pairs (Wood+Wood, Fire+Fire, …) genuinely different
   content**, or should they share one "two people leading with the same
   element" treatment? Five of the fifteen pairs are same-lead.
6. **Should "Direct script" be two scripts?** One for each side of the pair
   reads more usefully than one shared script, but that doubles that
   section's writing.
7. **Who signs off, and how do we record it?** The platform stores a
   `sourceRef` against approved copy (e.g. "content-library v1") so any
   report can be traced to a version Carey approved. What should that
   versioning look like in practice?
8. **What is the delivery format?** A spreadsheet with one row per block
   (pair key / block name / body) is easiest for us to ingest correctly. A
   document works too, but the block boundaries need to be unambiguous.

---

## Part B — the three open questions

These are flagged in `docs/BUILD_PLAN.md` Section 11. Each one is currently
handled by an explicit, commented assumption in the code. None have been
quietly resolved.

### B.1 The scoring algorithm

**What we know.** Assessment results arrive as five numbers. Carey's platform
emails an individual their results as percentages to one decimal place
(e.g. `Fire: 77.4%`, `Earth: 85.5%`). The company-side spreadsheet holds the
same quantities as decimals to three places (`0.774`, `0.855`).

**What we've done.** The platform treats the five scores as an opaque,
already-computed input. It validates that a number is well-formed and in
range, and converts between the two units when an admin explicitly says which
unit a file uses. **It does not derive scores from anything.**

**Questions:**

1. How are the five numbers produced from a person's raw answers? Is it a sum,
   an average, a weighted formula, a normalisation against a population?
2. Is the scale genuinely 0–100%, or is a floor/ceiling built in? Every real
   score we've seen sits between roughly 35% and 90% — is 0% or 100% possible?
3. Are the five scores independent, or do they interact (e.g. normalised so
   they sum to a constant)? This matters for whether "Wood went up" can happen
   without something else going down.
4. Can two people's scores be compared directly, or are they only meaningful
   ranked within one person? The pairwise report currently shows per-element
   gaps between two people — that's only valid if the scores are comparable
   across people.
5. Is a score stable over time, or expected to move? The platform keeps every
   assessment ever recorded, so re-testing is supported — but should a report
   ever show change over time, or is that misleading?
6. What is the minimum meaningful difference? We display three decimal places
   because the source data does, but if anything under (say) 5 points is noise,
   the reports shouldn't draw attention to a 2-point gap.
7. **Could the platform eventually run the assessment itself?** That's Phase 2
   ("native assessment delivery"), and it needs both the item wording and this
   algorithm.

### B.2 Sequencing roles — element-based or rank-based?

**What we know.** One worked example (the Glenn Personalised Guide) shows
these role labels: Wood = Activate, Earth = Absorb/sustain, Fire = Express,
Water = Model downstream consequences, Metal = Specify thresholds/quality
gate.

**The ambiguity.** That single example is consistent with two different rules:

- **Element-based** — Wood always means "Activate", for everybody.
- **Rank-based** — the person's *highest* element means "Activate", their
  second means something else, and so on, whichever elements those happen to
  be.

Glenn's own profile happens to fit both readings, so the example can't settle
it.

**What we've done.** Coded as element-based, in a single lookup table, with a
comment saying it's an assumption. It's a one-table change if it's wrong — but
only if we fix it before reports go out, because the sequencing table appears
in every individual profile.

**Questions:**

1. Which is it — element or rank position?
2. If element-based: are those five labels the final wording? They currently
   appear verbatim in the reports.
3. If rank-based: what are the five role labels by position (1st through 5th)?
4. Is the role list meant to be read as a sequence — i.e. does work actually
   flow Activate → Express → Absorb → Model → Specify, or is the order
   incidental?

### B.3 IP and licensing scope

**Why this blocks things.** The reports are commercial documents delivered to
paying corporate clients. We need to know exactly what may appear in them.

**Questions:**

1. What may the platform reproduce **verbatim** from the book? Specifically:
   the archetype descriptions, the needs lists, the stress-state
   descriptions, the Ayurvedic/food charts.
2. What about the **assessment items** themselves? (Not needed for Phase 1 —
   scores are imported — but required for Phase 2 native delivery.)
3. Is the **Fields** material (Field, Three Pillars, Blame Loop, Bridge
   element, Water Doorway, Distortions) licensed on the same terms as the
   book, or separately? It's newer and not in the book.
4. How should Carey be **credited** in the reports? The footer currently says
   "Built on Carey Davidson's Five Archetypes system" — is that the right
   form, and should a logo, trademark notice or copyright line appear?
5. Are the archetype **nicknames** ("The Trailblazer", "The Optimist", "The
   Caregiver", "The Architect", "The Philosopher") hers to license? They're
   used prominently in both reports.
6. Does the platform's content need Carey's **review per client**, or is
   approving the library once sufficient? (Our assumption: once, at the
   library level — she reviews the content, not individual generated reports.)
7. Is there any use the platform must **not** put the system to — for example,
   hiring decisions, performance management, or promotion decisions? Worth
   stating explicitly in our terms of service, and possibly on the reports.

### B.4 One further question, not in the BUILD_PLAN

**The 98,000-assessment dataset.** Carey's Fields report mentions having
analysed roughly 98,000 assessments, and that about 70% of people score Water
lowest or second-lowest. If that dataset exists in a digital form, it is a
genuine asset: it would let the platform tell a client how their team compares
to a real population, which nothing else in this market can do. Does it exist
as data, and would she be open to it being used that way?

---

## What happens once these are answered

- **Content library** → the blocks are entered into two files
  (`src/lib/content/individualProfile.ts`,
  `src/lib/content/pairwiseReport.ts`) and the placeholders disappear from the
  reports. No template or code changes needed.
- **Scoring algorithm** → mostly confirms what's already built; may add a
  "minimum meaningful difference" threshold to how gaps are displayed.
- **Sequencing** → either no change, or one lookup table is rewritten.
- **Licensing** → determines final report copy, credit lines, and terms of
  service. Also gates Phase 2's native assessment delivery.
