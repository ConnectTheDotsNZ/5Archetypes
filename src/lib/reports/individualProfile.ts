/**
 * Assembles the Individual Archetype Profile report model.
 *
 * This is the "template engine" half of docs/BUILD_PLAN.md Section 7.3: it
 * combines computed data (ranked profile, Sheng/Ke position, sequencing
 * roles) with the structured content library, and hands the result to a dumb
 * presentational component. Pure and side-effect free, so the same model
 * drives the web view, the PDF, and tests.
 */

import {
  ARCHETYPES,
  SEQUENCING_ROLE,
  SHENG_CYCLE,
  isKeChallenger,
  isShengNeighbor,
  rankProfile,
  type Element,
  type RankedElement,
  type ScoreProfile,
} from "../archetypes";
import {
  INDIVIDUAL_PROFILE_CONTENT,
  INDIVIDUAL_PROFILE_FRAMING,
  type ContentBlock,
  type IndividualProfileContent,
} from "../content/individualProfile";

export type ReportSubject = {
  name: string;
  roleTitle: string | null;
  teamName: string | null;
  organizationName: string | null;
};

export type AssessmentProvenance = {
  /** AssessmentSource on the row the scores came from, when known. */
  source: string | null;
  takenAt: Date | null;
  rawImportRef: string | null;
};

export type ProfileSection = {
  element: Element;
  rank: RankedElement["rank"];
  label: RankedElement["label"];
  score: number;
  nickname: string;
  essence: string;
  stressState: string;
  sequencingRole: string;
  content: IndividualProfileContent;
};

export type IndividualProfileReportModel = {
  subject: ReportSubject;
  provenance: AssessmentProvenance;
  generatedAt: Date;
  scores: ScoreProfile;
  ranked: RankedElement[];
  sections: ProfileSection[];
  primary: ProfileSection;
  lowest: ProfileSection;
  /** The two elements adjacent to the primary on the Sheng cycle — its natural allies. */
  shengNeighboursOfPrimary: Element[];
  /** The element the primary is a natural button-pusher with, in both directions. */
  keChallengersOfPrimary: Element[];
  framing: typeof INDIVIDUAL_PROFILE_FRAMING;
  /** True while no Carey-approved copy exists, so the template can say so once. */
  awaitingContentLibrary: boolean;
};

function neighboursOf(element: Element): Element[] {
  return SHENG_CYCLE.filter((other) => isShengNeighbor(element, other));
}

function challengersOf(element: Element): Element[] {
  return SHENG_CYCLE.filter((other) => isKeChallenger(element, other));
}

function toSection(ranked: RankedElement): ProfileSection {
  const archetype = ARCHETYPES[ranked.element];
  return {
    element: ranked.element,
    rank: ranked.rank,
    label: ranked.label,
    score: ranked.score,
    nickname: archetype.nickname,
    essence: archetype.essence,
    stressState: archetype.stressState,
    sequencingRole: SEQUENCING_ROLE[ranked.element],
    content: INDIVIDUAL_PROFILE_CONTENT[ranked.element],
  };
}

export function buildIndividualProfileReport({
  subject,
  scores,
  provenance = { source: null, takenAt: null, rawImportRef: null },
  generatedAt,
}: {
  subject: ReportSubject;
  scores: ScoreProfile;
  provenance?: AssessmentProvenance;
  /** Passed in rather than read from the clock, so renders are reproducible. */
  generatedAt: Date;
}): IndividualProfileReportModel {
  const ranked = rankProfile(scores);
  const sections = ranked.map(toSection);

  const primary = sections[0];
  const lowest = sections[sections.length - 1];

  // `framing.structural` is our own wording, not a content block — skip it.
  const framingBlocks = Object.values(INDIVIDUAL_PROFILE_FRAMING).filter(
    (value): value is ContentBlock => "status" in value
  );
  const contentBlocks = sections.flatMap((section) => [
    section.content.needs,
    section.content.stressPatterns,
    section.content.selfCare,
  ]);

  return {
    subject,
    provenance,
    generatedAt,
    scores,
    ranked,
    sections,
    primary,
    lowest,
    shengNeighboursOfPrimary: neighboursOf(primary.element),
    keChallengersOfPrimary: challengersOf(primary.element),
    framing: INDIVIDUAL_PROFILE_FRAMING,
    awaitingContentLibrary: [...framingBlocks, ...contentBlocks].every(
      (block) => block.status === "PLACEHOLDER"
    ),
  };
}

/** Filename for a downloaded PDF, safe across operating systems. */
export function individualProfileFileName(memberName: string): string {
  const safe = memberName
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${safe || "member"}-five-archetypes-profile.pdf`;
}
