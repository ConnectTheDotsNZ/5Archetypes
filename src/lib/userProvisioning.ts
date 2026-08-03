import { prisma } from "./prisma";
import type { User as Auth0User } from "@auth0/nextjs-auth0/types";
import type { Organization, User } from "@prisma/client";

export type CurrentUser = User & { organization: Organization };

function organizationNameFor(auth0User: Auth0User): string {
  const label = auth0User.name || auth0User.email || "New";
  return `${label}'s organization`;
}

/**
 * Resolves the Prisma User row for an Auth0 session, provisioning a new
 * Organization + User on a person's first-ever login. Matches on `auth0Sub`
 * first, then falls back to `email` so a MANAGER pre-provisioned by an admin
 * (future invite flow) gets linked to their existing org instead of getting
 * a second one.
 */
export async function ensureUserForSession(auth0User: Auth0User): Promise<CurrentUser> {
  const existingBySub = await prisma.user.findUnique({
    where: { auth0Sub: auth0User.sub },
    include: { organization: true },
  });
  if (existingBySub) return existingBySub;

  if (!auth0User.email) {
    throw new Error("Auth0 profile has no email. Cannot provision an account.");
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: auth0User.email },
    include: { organization: true },
  });
  if (existingByEmail) {
    // Pre-provisioned by an admin invite (src/app/admin/organization/members):
    // that action already created the OrganizationMembership row for their
    // home org, so only auth0Sub needs backfilling here.
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: { auth0Sub: auth0User.sub },
      include: { organization: true },
    });
  }

  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: organizationNameFor(auth0User) },
    });
    const user = await tx.user.create({
      data: {
        auth0Sub: auth0User.sub,
        email: auth0User.email!,
        role: "ADMIN",
        organizationId: organization.id,
      },
      include: { organization: true },
    });
    await tx.organizationMembership.create({
      data: { userId: user.id, organizationId: organization.id, role: "ADMIN" },
    });
    return user;
  });
}
