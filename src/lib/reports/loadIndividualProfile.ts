/**
 * Loads the data an Individual Archetype Profile needs, for the real
 * (Prisma-backed) and demo (in-memory) sources alike, and hands it to
 * buildIndividualProfileReport. The page and the PDF route both go through
 * here so they can't disagree about what the report says.
 */

import { prisma } from "../prisma";
import { getDemoMember } from "../sampleData";
import { buildDemoIndividualContent, DEMO_INDIVIDUAL_FRAMING } from "../content/demoNarrative";
import {
  buildIndividualProfileReport,
  type IndividualProfileReportModel,
} from "./individualProfile";

export async function loadIndividualProfileModel({
  teamId,
  memberId,
  organizationId,
  generatedAt,
}: {
  teamId: string;
  memberId: string;
  organizationId: string;
  generatedAt: Date;
}): Promise<IndividualProfileReportModel | null> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, teamId, team: { organizationId } },
    include: {
      team: { select: { name: true, organization: { select: { name: true } } } },
      assessments: { orderBy: { takenAt: "desc" }, take: 1 },
    },
  });

  // No scores means no report — an empty profile would be misleading rather
  // than merely incomplete.
  if (!member || member.assessments.length === 0) return null;

  const latest = member.assessments[0];

  return buildIndividualProfileReport({
    subject: {
      name: member.name,
      roleTitle: member.roleTitle,
      teamName: member.team.name,
      organizationName: member.team.organization.name,
    },
    scores: {
      Wood: latest.wood,
      Fire: latest.fire,
      Earth: latest.earth,
      Metal: latest.metal,
      Water: latest.water,
    },
    provenance: {
      source: latest.source,
      takenAt: latest.takenAt,
      rawImportRef: latest.rawImportRef,
    },
    generatedAt,
  });
}

/** Same model, built from the fictional demo team (no database involved). */
export function loadDemoIndividualProfileModel({
  memberId,
  generatedAt,
}: {
  memberId: string;
  generatedAt: Date;
}): IndividualProfileReportModel | null {
  const member = getDemoMember(memberId);
  if (!member) return null;

  return buildIndividualProfileReport({
    subject: {
      name: member.name,
      roleTitle: member.roleTitle,
      teamName: "Legal & Admin Team",
      organizationName: "LawFam",
    },
    scores: member.scores,
    generatedAt,
    contentLibrary: buildDemoIndividualContent(member.name),
    framing: DEMO_INDIVIDUAL_FRAMING,
  });
}
