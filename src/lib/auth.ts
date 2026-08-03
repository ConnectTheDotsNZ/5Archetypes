import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { MembershipRole, Organization } from "@prisma/client";
import { prisma } from "./prisma";
import { auth0 } from "./auth0";
import { ensureUserForSession, type CurrentUser } from "./userProvisioning";

export const ACTIVE_ORG_COOKIE = "activeOrgId";

export type CurrentMembership = { organization: Organization; role: MembershipRole };

/**
 * The logged-in user (and their org), scoped to the current request's Auth0
 * session. Every org-scoped query in the app should ultimately go through
 * this — never re-derive "the current org" from a request param.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth0.getSession();
  if (!session) return null;
  return ensureUserForSession(session.user);
}

/** Same as getCurrentUser(), but redirects to login instead of returning null. */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/login");
  return user;
}

/**
 * Every organization this identity can act as. A platform superuser
 * (ConnectTheDots staff, Carey) gets every org in the database, including
 * ones created after the flag was set — not one OrganizationMembership row
 * per org, which would need a background job to stay current. Everyone else
 * gets exactly the orgs they hold an explicit membership row for.
 */
export async function getAvailableMemberships(): Promise<CurrentMembership[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  if (user.isPlatformSuperuser) {
    const organizations = await prisma.organization.findMany({ orderBy: { name: "asc" } });
    return organizations.map((organization) => ({ organization, role: "ADMIN" as const }));
  }

  const rows = await prisma.organizationMembership.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { organization: { name: "asc" } },
  });
  return rows.map((row) => ({ organization: row.organization, role: row.role }));
}

/**
 * Resolves the org this request is acting against. Single-membership users
 * (the common case today) get that membership with no cookie or param
 * involved — zero behaviour change from the pre-multi-org singular lookup.
 * A user with 2+ memberships is resolved from the active-org cookie, falling
 * back to their home org (`User.organizationId`), then to their first
 * membership; `requireCurrentOrganization` sends them to pick one if none of
 * that resolves (no cookie yet and their home org isn't among their
 * memberships, which shouldn't happen but is handled rather than assumed).
 */
export async function getCurrentOrganization(): Promise<CurrentMembership | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const memberships = await getAvailableMemberships();
  if (memberships.length === 0) return null;
  if (memberships.length === 1) return memberships[0];

  const activeOrgId = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  const active = memberships.find((m) => m.organization.id === activeOrgId);
  if (active) return active;

  const home = memberships.find((m) => m.organization.id === user.organizationId);
  return home ?? memberships[0] ?? null;
}

/**
 * Records that a superuser viewed an org they hold no explicit membership
 * in — the one access pattern here with no per-row business justification,
 * on HR/people data. Routine same-org membership access is never logged.
 */
async function recordSuperuserAccessIfNeeded(userId: string, organizationId: string): Promise<void> {
  const explicitMembership = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (explicitMembership) return;
  await prisma.orgAccessAudit.create({ data: { userId, organizationId } });
}

/**
 * Same as getCurrentOrganization(), but redirects rather than returning
 * null — either to login (no session) or to /select-organization (a
 * multi-org user with no resolvable active org, e.g. no cookie set yet).
 */
export async function requireCurrentOrganization(): Promise<CurrentMembership> {
  const user = await requireCurrentUser();
  const memberships = await getAvailableMemberships();
  if (memberships.length === 0) {
    throw new Error("User has no organization membership.");
  }

  const resolved = await (async () => {
    if (memberships.length === 1) return memberships[0];
    const activeOrgId = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
    const active = memberships.find((m) => m.organization.id === activeOrgId);
    if (active) return active;
    const home = memberships.find((m) => m.organization.id === user.organizationId);
    if (home) return home;
    return null;
  })();

  if (!resolved) redirect("/select-organization");

  if (user.isPlatformSuperuser) {
    await recordSuperuserAccessIfNeeded(user.id, resolved.organization.id);
  }
  return resolved;
}
