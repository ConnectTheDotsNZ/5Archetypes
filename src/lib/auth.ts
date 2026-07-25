import { redirect } from "next/navigation";
import type { Organization } from "@prisma/client";
import { auth0 } from "./auth0";
import { ensureUserForSession, type CurrentUser } from "./userProvisioning";

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

export async function getCurrentOrganization(): Promise<Organization | null> {
  const user = await getCurrentUser();
  return user?.organization ?? null;
}

/** Same as getCurrentUser(), but redirects to login instead of returning null. */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/api/auth/login");
  return user;
}

export async function requireCurrentOrganization(): Promise<Organization> {
  return (await requireCurrentUser()).organization;
}
