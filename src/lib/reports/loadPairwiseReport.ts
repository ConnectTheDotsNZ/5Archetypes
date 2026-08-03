/**
 * Loads the data a Workplace Pairwise Relationship Report needs, for the real
 * (Prisma-backed) and demo (in-memory) sources. The page and the PDF route
 * both go through here so they can't disagree.
 */

import { prisma } from "../prisma";
import { getDemoMember } from "../sampleData";
import { allPairKeys, type PairwiseContent, type PairKey } from "../content/pairwiseReport";
import { buildDemoPairwiseContent, DEMO_PAIRWISE_FRAMING } from "../content/demoNarrative";
import { buildPairwiseReport, type PairwiseReportModel } from "./pairwiseReport";

/**
 * Builds a full 15-key content map for one specific demo pair. Only the key
 * matching this pair's actual archetypes is ever read by buildPairwiseReport,
 * but the override parameter is typed as the full record, so the other 14
 * entries exist purely to satisfy that shape.
 */
function demoContentLibraryFor(nameA: string, nameB: string): Record<PairKey, PairwiseContent> {
  return Object.fromEntries(
    allPairKeys().map((key) => [key, buildDemoPairwiseContent(key, nameA, nameB)])
  ) as Record<PairKey, PairwiseContent>;
}

export async function loadPairwiseReportModel({
  teamId,
  memberAId,
  memberBId,
  organizationId,
  generatedAt,
}: {
  teamId: string;
  memberAId: string;
  memberBId: string;
  organizationId: string;
  generatedAt: Date;
}): Promise<PairwiseReportModel | null> {
  // A pair report about one person compared to themselves is meaningless.
  if (memberAId === memberBId) return null;

  const members = await prisma.member.findMany({
    where: { id: { in: [memberAId, memberBId] }, teamId, team: { organizationId } },
    include: {
      team: { select: { name: true, organization: { select: { name: true } } } },
      assessments: { orderBy: { takenAt: "desc" }, take: 1 },
    },
  });

  const a = members.find((member) => member.id === memberAId);
  const b = members.find((member) => member.id === memberBId);

  // Both people must be on this team, in this org, and have scores.
  if (!a || !b || a.assessments.length === 0 || b.assessments.length === 0) return null;

  const scoresOf = (row: (typeof a)["assessments"][number]) => ({
    Wood: row.wood,
    Fire: row.fire,
    Earth: row.earth,
    Metal: row.metal,
    Water: row.water,
  });

  return buildPairwiseReport({
    subjectA: { name: a.name, roleTitle: a.roleTitle },
    subjectB: { name: b.name, roleTitle: b.roleTitle },
    scoresA: scoresOf(a.assessments[0]),
    scoresB: scoresOf(b.assessments[0]),
    provenanceA: {
      source: a.assessments[0].source,
      takenAt: a.assessments[0].takenAt,
      rawImportRef: a.assessments[0].rawImportRef,
    },
    provenanceB: {
      source: b.assessments[0].source,
      takenAt: b.assessments[0].takenAt,
      rawImportRef: b.assessments[0].rawImportRef,
    },
    teamName: a.team.name,
    organizationName: a.team.organization.name,
    generatedAt,
  });
}

/** Same model, built from the fictional demo team (no database involved). */
export function loadDemoPairwiseReportModel({
  memberAId,
  memberBId,
  generatedAt,
}: {
  memberAId: string;
  memberBId: string;
  generatedAt: Date;
}): PairwiseReportModel | null {
  if (memberAId === memberBId) return null;

  const a = getDemoMember(memberAId);
  const b = getDemoMember(memberBId);
  if (!a || !b) return null;

  return buildPairwiseReport({
    subjectA: { name: a.name, roleTitle: a.roleTitle },
    subjectB: { name: b.name, roleTitle: b.roleTitle },
    scoresA: a.scores,
    scoresB: b.scores,
    teamName: "Legal & Admin Team",
    organizationName: "LawFam",
    generatedAt,
    contentLibrary: demoContentLibraryFor(a.name, b.name),
    framing: DEMO_PAIRWISE_FRAMING,
  });
}
