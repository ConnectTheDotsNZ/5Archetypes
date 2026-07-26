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

import { ELEMENTS, type Element } from "../archetypes";

export type ContentBlock =
  | {
      status: "PLACEHOLDER";
      /** What Carey still owes us, shown verbatim in the rendered report. */
      awaiting: string;
    }
  | {
      status: "APPROVED";
      paragraphs?: string[];
      bullets?: string[];
      /** Where the approved copy came from, for audit (e.g. "content-library v1"). */
      sourceRef?: string;
    };

export type IndividualProfileContent = {
  /** What this archetype needs to stay at its best. */
  needs: ContentBlock;
  /** How it shows up under stress. */
  stressPatterns: ContentBlock;
  /** Self-care / regulation guidance. */
  selfCare: ContentBlock;
};

function pending(awaiting: string): ContentBlock {
  return { status: "PLACEHOLDER", awaiting };
}

/**
 * Per-element copy. Every block is a placeholder until Carey's content
 * library v1 is approved — see docs/BUILD_PLAN.md Section 10 (Phase 0).
 */
export const INDIVIDUAL_PROFILE_CONTENT: Record<Element, IndividualProfileContent> =
  Object.fromEntries(
    ELEMENTS.map((element) => [
      element,
      {
        needs: pending(`${element} needs list`),
        stressPatterns: pending(`${element} stress patterns`),
        selfCare: pending(`${element} self-care guidance`),
      },
    ])
  ) as Record<Element, IndividualProfileContent>;

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
    // "Sheng" and "Ke" read as unexplained jargon (or typos) without this —
    // they're the original Chinese names for the two fixed relationship
    // types in Wu Xing, the Five Phase theory Traditional Chinese Medicine
    // is built on. Carey's book draws its five elements from that same
    // tradition, but describes both patterns in plain English rather than
    // by their Chinese names — using the original terms here is a platform
    // choice, not something quoted from her.
    shengExplainer:
      "“Sheng” (生, shēng, roughly “generating”) and “Ke” (克, kè, roughly “controlling”) aren't typos or something specific to any one person's results. They're the two named relationship types from Wu Xing, the Chinese Five Phase theory that Traditional Chinese Medicine is built on. Carey Davidson's Five Archetypes method explicitly draws its five elements (Wood, Fire, Earth, Metal, Water) from that same tradition, even though her own book describes these two patterns in plain English rather than by their Chinese names; this platform uses the original terms, the way “yin and yang” usually isn't translated either. The five elements sit on a repeating cycle: Wood → Fire → Earth → Metal → Water → back to Wood. “Sheng” names the generating relationship between neighbours on that cycle: each one traditionally feeds the next (wood fuels fire, fire's ash enriches earth, earth yields metal ore, metal collects and channels water, water feeds wood's growth), so neighbouring pairs tend to support each other with little effort.",
    keExplainer:
      "“Ke” names the cycle's other fixed relationship: pairs two steps apart, where one element traditionally restrains or checks the other (wood's roots break up earth, earth dams water, water douses fire, fire melts metal, metal's edge cuts wood). A Ke pairing isn't a conflict to avoid. It's a predictable, structural kind of friction, worth noticing and working with rather than a sign that something is wrong.",
  },
  introduction: pending("opening framing for the individual profile"),
  primaryArchetype: pending("what it means to lead with your primary archetype"),
  lowestArchetype: pending("how to work with your lowest element"),
  sequencing: pending("explanation of the sequencing roles"),
  closing: pending("closing guidance / next steps"),
} satisfies Record<string, ContentBlock | Record<string, string>>;

/** True when every block in the library is still a placeholder. */
export function contentLibraryIsUnapproved(): boolean {
  const elementBlocks = ELEMENTS.flatMap((element) => [
    INDIVIDUAL_PROFILE_CONTENT[element].needs,
    INDIVIDUAL_PROFILE_CONTENT[element].stressPatterns,
    INDIVIDUAL_PROFILE_CONTENT[element].selfCare,
  ]);
  const framingBlocks = Object.values(INDIVIDUAL_PROFILE_FRAMING).filter(
    (value): value is ContentBlock => "status" in value
  );
  return [...elementBlocks, ...framingBlocks].every((block) => block.status === "PLACEHOLDER");
}
