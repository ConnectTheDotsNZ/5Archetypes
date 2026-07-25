"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrganization } from "@/lib/auth";

async function requireOrgId(): Promise<string> {
  const org = await requireCurrentOrganization();
  return org.id;
}

/** Confirms a team belongs to the current org before any mutation touches it. */
async function requireTeamInOrg(teamId: string): Promise<void> {
  const orgId = await requireOrgId();
  const team = await prisma.team.findFirst({ where: { id: teamId, organizationId: orgId } });
  if (!team) throw new Error("Team not found in this organization.");
}

/** Confirms a member's team belongs to the current org before any mutation touches it. */
async function requireMemberInOrg(memberId: string): Promise<{ teamId: string }> {
  const orgId = await requireOrgId();
  const member = await prisma.member.findFirst({
    where: { id: memberId, team: { organizationId: orgId } },
    select: { teamId: true },
  });
  if (!member) throw new Error("Member not found in this organization.");
  return member;
}

const teamSchema = z.object({
  name: z.string().trim().min(1, "Team name is required"),
});

const memberSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  roleTitle: z.string().trim().optional(),
  email: z.union([z.string().trim().email("Enter a valid email"), z.literal("")]).optional(),
});

function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

export async function createTeam(formData: FormData) {
  const orgId = await requireOrgId();
  const parsed = teamSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    redirect(`/admin/teams?error=${encodeURIComponent(firstIssueMessage(parsed.error))}`);
  }

  const team = await prisma.team.create({
    data: { name: parsed.data.name, organizationId: orgId },
  });

  revalidatePath("/admin/teams");
  redirect(`/admin/teams/${team.id}`);
}

export async function createMember(teamId: string, formData: FormData) {
  await requireTeamInOrg(teamId);
  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    roleTitle: formData.get("roleTitle"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    redirect(`/admin/teams/${teamId}?error=${encodeURIComponent(firstIssueMessage(parsed.error))}`);
  }

  await prisma.member.create({
    data: {
      teamId,
      name: parsed.data.name,
      roleTitle: parsed.data.roleTitle || null,
      email: parsed.data.email || null,
    },
  });

  revalidatePath(`/admin/teams/${teamId}`);
  redirect(`/admin/teams/${teamId}`);
}

export async function updateMember(memberId: string, formData: FormData) {
  const { teamId } = await requireMemberInOrg(memberId);
  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    roleTitle: formData.get("roleTitle"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    redirect(
      `/admin/teams/${teamId}/members/${memberId}/edit?error=${encodeURIComponent(
        firstIssueMessage(parsed.error)
      )}`
    );
  }

  await prisma.member.update({
    where: { id: memberId },
    data: {
      name: parsed.data.name,
      roleTitle: parsed.data.roleTitle || null,
      email: parsed.data.email || null,
    },
  });

  revalidatePath(`/admin/teams/${teamId}`);
  redirect(`/admin/teams/${teamId}`);
}

export async function deleteMember(memberId: string) {
  const { teamId } = await requireMemberInOrg(memberId);
  await prisma.member.delete({ where: { id: memberId } });
  revalidatePath(`/admin/teams/${teamId}`);
  redirect(`/admin/teams/${teamId}`);
}
