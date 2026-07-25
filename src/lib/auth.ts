import { prisma } from "./prisma";

/**
 * Stand-in for real auth. Session-based login (Clerk/Auth0) is
 * docs/CLAUDE_CODE_KICKOFF.md Step 2 and hasn't been wired up yet. Until
 * then, treat the first Organization row as "the logged-in admin's org" —
 * every admin page/action should resolve the org through this function so
 * swapping in a real session lookup later is a one-file change, not a
 * find-and-replace across every page.
 */
export async function getCurrentOrganization() {
  return prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
}
