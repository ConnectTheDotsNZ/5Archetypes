/**
 * Content library for the Individual Archetype Profile report.
 *
 * docs/BUILD_PLAN.md Section 7.3 sets the direction: a structured library
 * Carey authors and approves once per archetype, assembled by a template
 * engine — *not* an LLM writing the report. This file is that library's
 * Phase 1 shape, with every interpretive block still empty.
 *
 * Nothing here invents psychological content, and nothing quotes Carey's
 * book (docs/BUILD_PLAN.md Section 11, item 3 — licensing scope is still
 * unconfirmed). Each block is either an explicit PLACEHOLDER or copy Carey
 * has approved; the report template renders both, so swapping one for the
 * other is a data change in this file rather than a change to the template.
 */

import { ELEMENTS, type Element, type RankedElement } from "../archetypes";
import { allPlaceholders, pending, type ContentBlock } from "./blocks";

export type { ContentBlock };

export type IndividualProfileContent = {
  /** What this archetype needs to stay at its best. */
  needs: ContentBlock;
  /** How it shows up under stress. */
  stressPatterns: ContentBlock;
  /** Self-care / regulation guidance. */
  selfCare: ContentBlock;
};

/**
 * How strongly an element's narrative should read, based on where it ranks
 * in a person's profile — not just which element it is. A person's lowest
 * element shouldn't read with the same certainty ("X tends to...") as their
 * primary; it's a lens they rarely reach for, not a second personality.
 * Primary/Secondary get full-strength "this is how you operate" language,
 * Third is framed as situational, Fourth/Lowest as rare and faint.
 */
export type ContentIntensityTier = "dominant" | "moderate" | "minor";

export const INTENSITY_TIERS: ContentIntensityTier[] = ["dominant", "moderate", "minor"];

const TIER_BY_RANK_LABEL: Record<RankedElement["label"], ContentIntensityTier> = {
  Primary: "dominant",
  Secondary: "dominant",
  Third: "moderate",
  Fourth: "minor",
  Lowest: "minor",
};

export function tierForRankLabel(label: RankedElement["label"]): ContentIntensityTier {
  return TIER_BY_RANK_LABEL[label];
}

/** Per-element, per-intensity-tier copy — see IndividualProfileContentLibrary. */
export type IndividualProfileContentLibrary = Record<
  Element,
  Record<ContentIntensityTier, IndividualProfileContent>
>;

/**
 * Per-element, per-rank-tier copy. Every block is a placeholder until Carey's
 * content library v1 is approved — see docs/BUILD_PLAN.md Section 10 (Phase 0).
 */
export const INDIVIDUAL_PROFILE_CONTENT: IndividualProfileContentLibrary = Object.fromEntries(
  ELEMENTS.map((element) => [
    element,
    Object.fromEntries(
      INTENSITY_TIERS.map((tier) => [
        tier,
        {
          needs: pending(`${element} needs list (${tier})`),
          stressPatterns: pending(`${element} stress patterns (${tier})`),
          selfCare: pending(`${element} self-care guidance (${tier})`),
        },
      ])
    ),
  ])
) as IndividualProfileContentLibrary;

/**
 * Report-level copy that isn't tied to one element.
 *
 * `structural` entries are ours: they describe how to read the document and
 * carry no claim about what any archetype means. Interpretive framing stays a
 * placeholder.
 */
export const INDIVIDUAL_PROFILE_FRAMING = {
  structural: {
    howToRead:
      "Your five element scores are listed from highest to lowest. The highest is your primary archetype; the lowest points at where you have the most room to grow.",
    scoreNote:
      "Scores come from your assessment exactly as it reported them. They are a snapshot of how you answered, not a fixed measure of who you are.",
  },
  introduction: pending("opening framing for the individual profile"),
  primaryArchetype: pending("what it means to lead with your primary archetype"),
  lowestArchetype: pending("how to work with your lowest element"),
  sequencing: pending("explanation of the sequencing roles"),
  /**
   * Generic (not per-person) explainer for the new "Your sequencing
   * architecture" section: why rank position — not just which element —
   * determines whether a function is instinctive/early or deliberate/late
   * for this person. Distinct from `sequencing` above, which explains what
   * each role label (Activate, Express, ...) means; this explains why WHERE
   * that role sits in the person's own chain changes how readily it fires.
   */
  sequencingArchitecture: pending(
    "what a personal sequencing chain is and why rank position changes how a function shows up"
  ),
  closing: pending("closing guidance / next steps"),
} satisfies Record<string, ContentBlock | Record<string, string>>;

/** True when every block in the library is still a placeholder. */
export function contentLibraryIsUnapproved(): boolean {
  const elementBlocks = ELEMENTS.flatMap((element) =>
    INTENSITY_TIERS.flatMap((tier) => [
      INDIVIDUAL_PROFILE_CONTENT[element][tier].needs,
      INDIVIDUAL_PROFILE_CONTENT[element][tier].stressPatterns,
      INDIVIDUAL_PROFILE_CONTENT[element][tier].selfCare,
    ])
  );
  const framingBlocks = Object.values(INDIVIDUAL_PROFILE_FRAMING).filter(
    (value): value is ContentBlock => "status" in value
  );
  return allPlaceholders([...elementBlocks, ...framingBlocks]);
}
