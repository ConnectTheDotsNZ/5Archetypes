"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrganization } from "@/lib/auth";

const MEMBERS_PATH = "/admin/organization/members";

const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["ADMIN", "MANAGER"]),
});

/**
 * Grants a person access to the current org. If they've never logged in
 * before, this creates their User row up front (auth0Sub stays null until
 * their first login backfills it — the same pre-provisioning path
 * ensureUserForSession has always supported). If they already have an
 * account (a returning consultant, Carey, an existing staff member), only
 * the membership row is written or updated — their existing auth0Sub, home
 * org and account-level role are left untouched.
 */
export async function inviteMember(formData: FormData) {
  const { organization, role: actingRole } = await requireCurrentOrganization();
  if (actingRole !== "ADMIN") {
    redirect(`${MEMBERS_PATH}?error=${encodeURIComponent("Only an organisation admin can invite people.")}`);
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    redirect(
      `${MEMBERS_PATH}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input")}`
    );
  }

  const { email, role } = parsed.data;

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      auth0Sub: null,
      role,
      organizationId: organization.id,
    },
  });

  await prisma.organizationMembership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: organization.id } },
    update: { role },
    create: {
      userId: user.id,
      organizationId: organization.id,
      role,
    },
  });

  revalidatePath(MEMBERS_PATH);
  redirect(`${MEMBERS_PATH}?saved=${encodeURIComponent(`Invited ${email} as ${role.toLowerCase()}.`)}`);
}

export async function removeMember(membershipId: string) {
  const { organization, role: actingRole } = await requireCurrentOrganization();
  if (actingRole !== "ADMIN") {
    redirect(`${MEMBERS_PATH}?error=${encodeURIComponent("Only an organisation admin can remove people.")}`);
  }

  const target = await prisma.organizationMembership.findFirst({
    where: { id: membershipId, organizationId: organization.id },
  });
  if (!target) redirect(MEMBERS_PATH);

  if (target.role === "ADMIN") {
    const remainingAdmins = await prisma.organizationMembership.count({
      where: { organizationId: organization.id, role: "ADMIN", id: { not: membershipId } },
    });
    if (remainingAdmins === 0) {
      redirect(
        `${MEMBERS_PATH}?error=${encodeURIComponent("Can't remove the last admin of an organisation.")}`
      );
    }
  }

  await prisma.organizationMembership.delete({ where: { id: membershipId } });

  revalidatePath(MEMBERS_PATH);
  redirect(MEMBERS_PATH);
}
