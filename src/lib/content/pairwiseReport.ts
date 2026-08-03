/**
 * Content library for the Workplace Pairwise Relationship Report.
 *
 * The report is the merged template of docs/BUILD_PLAN.md Section 3.2: the
 * seven-part operational structure from the Glenn Personalised Guide (Core
 * Dynamic → Direct Script) blended with the Fields vocabulary from Section
 * 2.3 (Blame Loop, Bridge element, Water Doorway, Distortions).
 *
 * Copy is keyed by the *pair of primary archetypes*, because that's the unit
 * Carey authors and approves once and the platform then reuses for every pair
 * of people who happen to lead with those two elements. 15 unordered pairs
 * cover every combination, same-lead pairs included.
 *
 * Everything is a placeholder. In particular the Distortion and Blame Loop
 * wording in BUILD_PLAN Section 2.3 is quoted from Carey's own report and is
 * NOT reproduced here — licensing scope is still unconfirmed (Section 11,
 * item 3), and the whole point of this file is that she authors it.
 */

import { ELEMENTS, type Element } from "../archetypes";
import { allPlaceholders, pending, type ContentBlock } from "./blocks";

/** Canonical key for an unordered element pair, e.g. "Earth+Wood". */
export type PairKey = string;

export function pairKey(a: Element, b: Element): PairKey {
  return [a, b].sort((x, y) => ELEMENTS.indexOf(x) - ELEMENTS.indexOf(y)).join("+");
}

/** Every unordered pair of elements, same-lead pairs included. */
export function allPairKeys(): PairKey[] {
  const keys = new Set<PairKey>();
  for (const a of ELEMENTS) {
    for (const b of ELEMENTS) {
      keys.add(pairKey(a, b));
    }
  }
  return [...keys];
}

export const PAIRWISE_SECTION_KEYS = [
  "coreDynamic",
  "inPractice",
  "scoreImpact",
  "escalationLoop",
  "risks",
  "calibrationTools",
  "directScript",
] as const;

export type PairwiseSectionKey = (typeof PAIRWISE_SECTION_KEYS)[number];

/** Headings and intent, straight from the Section 3.2 merged template. */
export const PAIRWISE_SECTIONS: {
  key: PairwiseSectionKey;
  heading: string;
  /** Ours, not Carey's: says what the section is for, claims nothing about archetypes. */
  purpose: string;
}[] = [
  {
    key: "coreDynamic",
    heading: "Core dynamic",
    purpose: "What this pairing is like at its best, and what it costs when it goes wrong.",
  },
  {
    key: "inPractice",
    heading: "In practice",
    purpose: "How the dynamic shows up in day-to-day work.",
  },
  {
    key: "scoreImpact",
    heading: "Score impact",
    purpose: "What these two people's specific numbers change about the general pattern.",
  },
  {
    key: "escalationLoop",
    heading: "Predictable escalation loop",
    purpose: "The step-by-step cycle each person's stress response triggers in the other.",
  },
  {
    key: "risks",
    heading: "Risks",
    purpose: "What to watch for if the loop keeps running unaddressed.",
  },
  {
    key: "calibrationTools",
    heading: "Calibration tools",
    purpose: "Practices that keep the pairing working before it needs repair.",
  },
  {
    key: "directScript",
    heading: "Direct script",
    purpose: "Words to use in the moment, for each person.",
  },
];

export type PairwiseContent = Record<PairwiseSectionKey, ContentBlock>;

function placeholderSections(key: PairKey): PairwiseContent {
  return Object.fromEntries(
    PAIRWISE_SECTIONS.map((section) => [
      section.key,
      pending(`${section.heading} for ${key.replace("+", " / ")}`),
    ])
  ) as PairwiseContent;
}

export const PAIRWISE_CONTENT: Record<PairKey, PairwiseContent> = Object.fromEntries(
  allPairKeys().map((key) => [key, placeholderSections(key)])
);

/**
 * The Fields layer (BUILD_PLAN Section 2.3). Blame Loops are per pair; Bridge
 * tending is per bridge element; Water Doorway and Distortions are per person's
 * own archetype.
 */
export const FIELDS_CONTENT = {
  /** The named escalation cycle between two specific archetypes. */
  blameLoop: Object.fromEntries(
    allPairKeys().map((key) => [key, pending(`Blame Loop for ${key.replace("+", " / ")}`)])
  ) as Record<PairKey, ContentBlock>,

  /** How to tend the Bridge element that sits between a Ke-challenger pair. */
  bridgeTending: Object.fromEntries(
    ELEMENTS.map((element) => [element, pending(`Bridge tending practice for ${element}`)])
  ) as Record<Element, ContentBlock>,

  /** Each archetype's personalised trigger-point and reset script. */
  waterDoorway: Object.fromEntries(
    ELEMENTS.map((element) => [element, pending(`Water Doorway script for ${element}`)])
  ) as Record<Element, ContentBlock>,

  /** The false belief each archetype's stress state runs on. */
  distortion: Object.fromEntries(
    ELEMENTS.map((element) => [element, pending(`${element} distortion`)])
  ) as Record<Element, ContentBlock>,

  /** Understand / Tend / Regulate — the three pillars, explained. */
  understand: pending("the Understand pillar, explained for a workplace pair"),
  tend: pending("the Tend pillar: daily preventive practice"),
  regulate: pending("the Regulate pillar: in-the-moment reset"),
};

/**
 * Framing text. `structural` entries are ours: they describe how to read the
 * document and make no claim about what any archetype means.
 */
export const PAIRWISE_FRAMING = {
  structural: {
    howToRead:
      "This report describes a working relationship, not a verdict on either person. It pairs what is generally true of these two archetypes with what these two particular sets of scores change about it.",
    fieldNote:
      "Both people shape the space between them, so either one can change the dynamic without waiting for the other.",
    frictionNote:
      "Friction between two archetypes is information about the pairing, not a fault in either person.",
  },
  introduction: pending("opening framing for a workplace pair"),
  fieldExplainer: pending("what the Field is, for a workplace audience"),
  closing: pending("closing guidance / next steps for a pair"),
};

export function pairwiseLibraryIsUnapproved(): boolean {
  const blocks: ContentBlock[] = [
    ...Object.values(PAIRWISE_CONTENT).flatMap((sections) => Object.values(sections)),
    // FIELDS_CONTENT mixes single blocks (the three pillars) with per-element
    // and per-pair maps, so flatten both shapes.
    ...Object.values(FIELDS_CONTENT).flatMap((value): ContentBlock[] =>
      "status" in value ? [value as ContentBlock] : Object.values(value)
    ),
    ...Object.values(PAIRWISE_FRAMING).filter(
      (value): value is ContentBlock => "status" in value
    ),
  ];
  return allPlaceholders(blocks);
}
