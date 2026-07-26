import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-ink">Phase 1 scaffold</h1>
      <p className="max-w-2xl text-muted">
        This is a starting skeleton, not a finished product. It demonstrates the
        core archetype relationship logic (src/lib/archetypes.ts) end-to-end
        against fictional demo data. No database connection required yet.
        Read <code className="rounded bg-blush px-1">CLAUDE.md</code> and{" "}
        <code className="rounded bg-blush px-1">docs/BUILD_PLAN.md</code> before
        extending this.
      </p>
      <Link
        href="/teams/demo"
        className="inline-block rounded bg-gold px-5 py-3 font-semibold text-white hover:opacity-90"
      >
        View demo team →
      </Link>
    </div>
  );
}
