import { prisma } from "./prisma";
import type { ScoreProfile } from "./archetypes";

export type TeamMemberWithScores = {
  id: string;
  name: string;
  roleTitle: string | null;
  scores: ScoreProfile;
};

export type TeamWithScores = {
  id: string;
  name: string;
  members: TeamMemberWithScores[];
};

function latestAssessmentToScores(assessment: {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}): ScoreProfile {
  return {
    Wood: assessment.wood,
    Fire: assessment.fire,
    Earth: assessment.earth,
    Metal: assessment.metal,
    Water: assessment.water,
  };
}

/** Loads a team and its members' latest assessment scores. Members without any assessment are omitted. */
export async function getTeamWithScores(teamId: string, organizationId: string): Promise<TeamWithScores | null> {
  const team = await prisma.team.findFirst({
    where: { id: teamId, organizationId },
    include: {
      members: {
        include: {
          assessments: { orderBy: { takenAt: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!team) return null;

  return {
    id: team.id,
    name: team.name,
    members: team.members
      .filter((m) => m.assessments.length > 0)
      .map((m) => ({
        id: m.id,
        name: m.name,
        roleTitle: m.roleTitle,
        scores: latestAssessmentToScores(m.assessments[0]),
      })),
  };
}

/** Loads a single member's latest assessment scores, scoped to a team within an organization. */
export async function getTeamMemberWithScores(
  teamId: string,
  memberId: string,
  organizationId: string
): Promise<TeamMemberWithScores | null> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, teamId, team: { organizationId } },
    include: {
      assessments: { orderBy: { takenAt: "desc" }, take: 1 },
    },
  });

  if (!member || member.assessments.length === 0) return null;

  return {
    id: member.id,
    name: member.name,
    roleTitle: member.roleTitle,
    scores: latestAssessmentToScores(member.assessments[0]),
  };
}
