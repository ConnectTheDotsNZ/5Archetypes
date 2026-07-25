/**
 * Core Five Archetypes reference data + relationship logic.
 *
 * This encodes the two fixed cycles from Carey Davidson's book (see
 * docs/BUILD_PLAN.md Section 2.2) as lookup tables, plus the sequencing
 * profile mapping seen in the Glenn Personalised Guide example (Section
 * 3.1). None of the archetype descriptions below quote the book — they're
 * original short summaries for engineering/reference purposes only. Do not
 * treat wording in this file as customer-facing copy.
 *
 * OPEN QUESTION (docs/BUILD_PLAN.md Section 11, item 2): is the functional
 * role in SEQUENCING_ROLE tied to the *element itself*, or to its *rank
 * position* (1st/2nd/3rd/4th/5th) in a person's profile? The source
 * material only shows one worked example (Glenn's own profile), which is
 * consistent with either reading. Coded here as element-based; flip to
 * rank-based if Carey confirms otherwise — it's a one-table change.
 */

export const ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"] as const;
export type Element = (typeof ELEMENTS)[number];

export type ScoreProfile = Record<Element, number>;

export const ARCHETYPES: Record<
  Element,
  { nickname: string; essence: string; stressState: string }
> = {
  Wood: {
    nickname: "The Trailblazer",
    essence: "Decisive, driven, protective of the people and goals it commits to.",
    stressState: "Pushy, impatient, “my way or the highway.”",
  },
  Fire: {
    nickname: "The Optimist",
    essence: "Joyful, connective, brings warmth and momentum to a room.",
    stressState: "Scattered, avoids hard feelings, fears losing connection.",
  },
  Earth: {
    nickname: "The Caregiver",
    essence: "Empathetic, steady, the glue that holds a team together.",
    stressState: "Over-pleasing, can't say no, fears being taken for granted.",
  },
  Metal: {
    nickname: "The Architect",
    essence: "Precise, structured, holds a high bar for quality and follow-through.",
    stressState: "Overly critical, stuck on minutiae, rigid.",
  },
  Water: {
    nickname: "The Philosopher",
    essence: "Reflective, patient, thinks deeply before acting.",
    stressState: "Withdraws, isolates, fears becoming irrelevant.",
  },
};

// Wood -> Fire -> Earth -> Metal -> Water -> (back to Wood)
export const SHENG_CYCLE: Element[] = ["Wood", "Fire", "Earth", "Metal", "Water"];

// Skip-one pairs on the Sheng ring: natural "button-pusher" / challenge pairs.
export const KE_PAIRS: [Element, Element][] = [
  ["Wood", "Earth"],
  ["Earth", "Water"],
  ["Water", "Fire"],
  ["Fire", "Metal"],
  ["Metal", "Wood"],
];

export const SEQUENCING_ROLE: Record<Element, string> = {
  Wood: "Activate",
  Earth: "Absorb / sustain",
  Fire: "Express",
  Water: "Model downstream consequences",
  Metal: "Specify thresholds / quality gate",
};

function ringIndex(el: Element): number {
  return SHENG_CYCLE.indexOf(el);
}

/** True if `a` and `b` are adjacent on the Sheng (generating/soothing) cycle. */
export function isShengNeighbor(a: Element, b: Element): boolean {
  if (a === b) return false;
  const diff = Math.abs(ringIndex(a) - ringIndex(b));
  return diff === 1 || diff === SHENG_CYCLE.length - 1;
}

/** True if `a` and `b` are a Ke (controlling/challenging) "button-pusher" pair. */
export function isKeChallenger(a: Element, b: Element): boolean {
  return KE_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/**
 * The element that sits between `a` and `b` on the Sheng cycle — the
 * natural "Bridge" engagement style for a Ke-challenger pair (e.g. Fire
 * bridges Earth and Wood). Only meaningful when `a`/`b` are two ring-steps
 * apart; returns null otherwise.
 */
export function getBridgeElement(a: Element, b: Element): Element | null {
  const ia = ringIndex(a);
  const ib = ringIndex(b);
  const n = SHENG_CYCLE.length;
  const forwardDist = (ib - ia + n) % n;
  const backwardDist = (ia - ib + n) % n;
  if (forwardDist === 2) return SHENG_CYCLE[(ia + 1) % n];
  if (backwardDist === 2) return SHENG_CYCLE[(ib + 1) % n];
  return null;
}

export type RankedElement = {
  element: Element;
  score: number;
  rank: 1 | 2 | 3 | 4 | 5;
  label: "Primary" | "Secondary" | "Third" | "Fourth" | "Lowest";
};

const RANK_LABELS: RankedElement["label"][] = ["Primary", "Secondary", "Third", "Fourth", "Lowest"];

/** Ranks a person's five scores from Primary (highest) to Lowest. Ties are not split. */
export function rankProfile(scores: ScoreProfile): RankedElement[] {
  return ELEMENTS.map((element) => ({ element, score: scores[element] }))
    .sort((a, b) => b.score - a.score)
    .map((entry, i) => ({
      ...entry,
      rank: (i + 1) as RankedElement["rank"],
      label: RANK_LABELS[i],
    }));
}

export type RelationshipComputation = {
  deltas: Record<Element, number>; // scores[a] - scores[b], per element
  primaryA: Element;
  primaryB: Element;
  sameLead: boolean;
  shengNeighbors: boolean; // primaries are natural allies
  keChallengers: boolean; // primaries are natural button-pushers
  bridgeElement: Element | null;
};

/** Computes the full relationship comparison between two people's score profiles. */
export function computeRelationship(a: ScoreProfile, b: ScoreProfile): RelationshipComputation {
  const deltas = Object.fromEntries(
    ELEMENTS.map((el) => [el, +(a[el] - b[el]).toFixed(3)])
  ) as Record<Element, number>;

  const primaryA = rankProfile(a)[0].element;
  const primaryB = rankProfile(b)[0].element;

  return {
    deltas,
    primaryA,
    primaryB,
    sameLead: primaryA === primaryB,
    shengNeighbors: isShengNeighbor(primaryA, primaryB),
    keChallengers: isKeChallenger(primaryA, primaryB),
    bridgeElement: getBridgeElement(primaryA, primaryB),
  };
}
