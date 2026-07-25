import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Five Archetypes Platform (dev scaffold)",
  description: "Phase 1 MVP scaffold — see CLAUDE.md and docs/BUILD_PLAN.md",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body text-ink">
        <header className="border-b border-blush bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <div>
              <span className="font-display text-lg font-bold text-brick">
                THE FIVE ARCHETYPES
              </span>{" "}
              <span className="text-muted">— internal build scaffold</span>
            </div>
            <Link href="/admin/teams" className="text-sm font-semibold text-gold hover:underline">
              Manage teams
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
