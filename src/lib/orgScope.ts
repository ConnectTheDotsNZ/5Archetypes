/**
 * Guards that resolve a route param to a row the *current* organization
 * actually owns. Every mutation must go through one of these before it
 * touches a Team, Member or Assessment — see CLAUDE.md on multi-tenancy.
 *
 * Kept out of the "use server" action files on purpose: exports from those
 * modules become callable server endpoints, and these helpers are internal
 * plumbing rather than actions.
 */

import { prisma } from "./prisma";
import { requireCurrentOrganization } from "./auth";

export async function requireOrgId(): Promise<string> {
  const { organization } = await requireCurrentOrganization();
  return organization.id;
}

/** Confirms a team belongs to the current org before any mutation touches it. */
export async function requireTeamInOrg(teamId: string): Promise<{ id: string; name: string }> {
  const orgId = await requireOrgId();
  const team = await prisma.team.findFirst({
    where: { id: teamId, organizationId: orgId },
    select: { id: true, name: true },
  });
  if (!team) throw new Error("Team not found in this organization.");
  return team;
}

/** Confirms a member's team belongs to the current org before any mutation touches it. */
export async function requireMemberInOrg(
  memberId: string
): Promise<{ id: string; teamId: string; name: string }> {
  const orgId = await requireOrgId();
  const member = await prisma.member.findFirst({
    where: { id: memberId, team: { organizationId: orgId } },
    select: { id: true, teamId: true, name: true },
  });
  if (!member) throw new Error("Member not found in this organization.");
  return member;
}
