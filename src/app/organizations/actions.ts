"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ACTIVE_ORG_COOKIE, getAvailableMemberships } from "@/lib/auth";

/**
 * Sets the active-org cookie for this session, after confirming the chosen
 * org is actually one this identity can access — a tampered/stale form value
 * is silently ignored rather than trusted, since getCurrentOrganization()
 * would fail closed on it anyway (see src/lib/orgScope.ts's guards).
 */
export async function switchOrganization(formData: FormData) {
  const organizationId = formData.get("organizationId");
  if (typeof organizationId !== "string" || !organizationId) return;

  const memberships = await getAvailableMemberships();
  const allowed = memberships.some((m) => m.organization.id === organizationId);
  if (!allowed) return;

  (await cookies()).set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");

  const returnTo = formData.get("returnTo");
  // The previous path's team/member ids may not exist in the new org;
  // orgScope's guards 404 on that rather than leaking data, so this is a
  // safe default even when the destination turns out to be invalid there.
  redirect(typeof returnTo === "string" && returnTo ? returnTo : "/admin/teams");
}
