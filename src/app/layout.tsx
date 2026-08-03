import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser, getCurrentOrganization, getAvailableMemberships } from "@/lib/auth";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";

export const metadata: Metadata = {
  title: "Five Archetypes Platform (dev scaffold)",
  description: "Phase 1 MVP scaffold. See CLAUDE.md and docs/BUILD_PLAN.md",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const memberships = user ? await getAvailableMemberships() : [];
  const currentOrganization = user ? await getCurrentOrganization() : null;

  return (
    <html lang="en">
      <body className="font-body text-ink">
        <header className="border-b border-blush bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <div>
              <span className="font-display text-lg font-bold text-brick">
                THE FIVE ARCHETYPES
              </span>{" "}
              <span className="text-muted">(internal build scaffold)</span>
            </div>
            <div className="flex items-center gap-4 text-sm font-semibold">
              <Link href="/admin/teams" className="text-gold hover:underline">
                Manage teams
              </Link>
              {user ? (
                <>
                  <Link href="/admin/organization/members" className="text-gold hover:underline">
                    People
                  </Link>
                  <OrganizationSwitcher
                    memberships={memberships}
                    currentOrganizationId={currentOrganization?.organization.id ?? null}
                  />
                  <a href="/api/auth/logout" className="text-fire hover:underline">
                    Log out
                  </a>
                </>
              ) : (
                <a href="/api/auth/login" className="text-gold hover:underline">
                  Log in
                </a>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
