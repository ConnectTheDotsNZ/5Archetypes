import type { Metadata } from "next";
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
          <div className="mx-auto max-w-5xl px-6 py-4">
            <span className="font-display text-lg font-bold text-brick">
              THE FIVE ARCHETYPES
            </span>{" "}
            <span className="text-muted">— internal build scaffold</span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
