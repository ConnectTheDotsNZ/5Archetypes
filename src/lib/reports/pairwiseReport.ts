/**
 * Assembles the Workplace Pairwise Relationship Report model.
 *
 * Same split as the individual profile: computed relationship data (from
 * computeRelationship in src/lib/archetypes.ts) joined to the pairwise content
 * library, handed to a presentational component. Everything this file states
 * as fact is derived from the two people's own scores — the interpretation all
 * lives in content blocks Carey still owns.
 */

import {
  ARCHETYPES,
  ELEMENTS,
  SEQUENCING_ROLE,
  computeRelationship,
  rankProfile,
  type Element,
  type RankedElement,
  type ScoreProfile,
} from "../archetypes";
import {
  FIELDS_CONTENT,
  PAIRWISE_CONTENT,
  PAIRWISE_FRAMING,
  PAIRWISE_SECTIONS,
  pairKey,
  type PairwiseContent,
} from "../content/pairwiseReport";
import { allPlaceholders, type ContentBlock } from "../content/blocks";
import type { AssessmentProvenance, ReportSubject } from "./individualProfile";

export type PairPerson = {
  name: string;
  roleTitle: string | null;
  scores: ScoreProfile;
  ranked: RankedElement[];
  primary: Element;
  primaryNickname: string;
  lowest: Element;
  provenance: AssessmentProvenance;
  /** This person's own Fields blocks, keyed off their primary archetype. */
  distortion: ContentBlock;
  waterDoorway: ContentBlock;
};

export type ElementComparison = {
  element: Element;
  scoreA: number;
  scoreB: number;
  /** scoreA - scoreB, as computeRelationship reports it. */
  delta: number;
  /** Which person sits higher, or null when the two are equal to 3dp. */
  higher: "A" | "B" | null;
  sequencingRole: string;
};

export type PairwiseReportModel = {
  organizationName: string | null;
  teamName: string | null;
  generatedAt: Date;
  a: PairPerson;
  b: PairPerson;
  /** Canonical content key for this pairing, e.g. "Earth+Wood". */
  pairKey: string;
  sameLead: boolean;
  shengNeighbours: boolean;
  keChallengers: boolean;
  bridgeElement: Element | null;
  comparisons: ElementComparison[];
  /** Elements where the two are furthest apart, largest gap first. */
  widestGaps: ElementComparison[];
  /** Elements both people rank in their top two — shared strengths. */
  sharedStrengths: Element[];
  /** Elements both people rank last — a shared blind spot. */
  sharedBlindSpots: Element[];
  sections: { key: string; heading: string; purpose: string; content: ContentBlock }[];
  fields: {
    blameLoop: ContentBlock;
    bridgeTending: ContentBlock | null;
    understand: ContentBlock;
    tend: ContentBlock;
    regulate: ContentBlock;
  };
  framing: typeof PAIRWISE_FRAMING;
  awaitingContentLibrary: boolean;
};

function toPerson(
  subject: { name: string; roleTitle: string | null },
  scores: ScoreProfile,
  provenance: AssessmentProvenance
): PairPerson {
  const ranked = rankProfile(scores);
  const primary = ranked[0].element;
  const lowest = ranked[ranked.length - 1].element;

  return {
    name: subject.name,
    roleTitle: subject.roleTitle,
    scores,
    ranked,
    primary,
    primaryNickname: ARCHETYPES[primary].nickname,
    lowest,
    provenance,
    distortion: FIELDS_CONTENT.distortion[primary],
    waterDoorway: FIELDS_CONTENT.waterDoorway[primary],
  };
}

const EMPTY_PROVENANCE: AssessmentProvenance = { source: null, takenAt: null, rawImportRef: null };

export function buildPairwiseReport({
  subjectA,
  subjectB,
  scoresA,
  scoresB,
  provenanceA = EMPTY_PROVENANCE,
  provenanceB = EMPTY_PROVENANCE,
  teamName,
  organizationName,
  generatedAt,
}: {
  subjectA: { name: string; roleTitle: string | null };
  subjectB: { name: string; roleTitle: string | null };
  scoresA: ScoreProfile;
  scoresB: ScoreProfile;
  provenanceA?: AssessmentProvenance;
  provenanceB?: AssessmentProvenance;
  teamName: string | null;
  organizationName: string | null;
  generatedAt: Date;
}): PairwiseReportModel {
  const relationship = computeRelationship(scoresA, scoresB);
  const a = toPerson(subjectA, scoresA, provenanceA);
  const b = toPerson(subjectB, scoresB, provenanceB);

  const key = pairKey(a.primary, b.primary);
  const pairContent: PairwiseContent = PAIRWISE_CONTENT[key];

  const comparisons: ElementComparison[] = ELEMENTS.map((element) => {
    const delta = relationship.deltas[element];
    return {
      element,
      scoreA: scoresA[element],
      scoreB: scoresB[element],
      delta,
      higher: delta === 0 ? null : delta > 0 ? "A" : "B",
      sequencingRole: SEQUENCING_ROLE[element],
    };
  });

  const widestGaps = [...comparisons]
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
    .slice(0, 2);

  const topTwo = (person: PairPerson) => person.ranked.slice(0, 2).map((r) => r.element);
  const sharedStrengths = topTwo(a).filter((element) => topTwo(b).includes(element));

  const sharedBlindSpots = a.lowest === b.lowest ? [a.lowest] : [];

  const sections = PAIRWISE_SECTIONS.map((section) => ({
    key: section.key,
    heading: section.heading,
    purpose: section.purpose,
    content: pairContent[section.key],
  }));

  const fields = {
    blameLoop: FIELDS_CONTENT.blameLoop[key],
    // Only Ke-challenger pairs have a Bridge element between them.
    bridgeTending: relationship.bridgeElement
      ? FIELDS_CONTENT.bridgeTending[relationship.bridgeElement]
      : null,
    understand: FIELDS_CONTENT.understand,
    tend: FIELDS_CONTENT.tend,
    regulate: FIELDS_CONTENT.regulate,
  };

  const allBlocks: ContentBlock[] = [
    ...sections.map((section) => section.content),
    ...Object.values(fields).filter((block): block is ContentBlock => block !== null),
    a.distortion,
    a.waterDoorway,
    b.distortion,
    b.waterDoorway,
    ...Object.values(PAIRWISE_FRAMING).filter(
      (value): value is ContentBlock => "status" in value
    ),
  ];

  return {
    organizationName,
    teamName,
    generatedAt,
    a,
    b,
    pairKey: key,
    sameLead: relationship.sameLead,
    shengNeighbours: relationship.shengNeighbors,
    keChallengers: relationship.keChallengers,
    bridgeElement: relationship.bridgeElement,
    comparisons,
    widestGaps,
    sharedStrengths,
    sharedBlindSpots,
    sections,
    fields,
    framing: PAIRWISE_FRAMING,
    awaitingContentLibrary: allPlaceholders(allBlocks),
  };
}

/** Filename for a downloaded pairwise PDF, safe across operating systems. */
export function pairwiseReportFileName(nameA: string, nameB: string): string {
  const slug = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  return `${slug(nameA) || "person-a"}-and-${slug(nameB) || "person-b"}-workplace-report.pdf`;
}

/** Re-exported so report loaders can share one subject shape. */
export type { ReportSubject };
