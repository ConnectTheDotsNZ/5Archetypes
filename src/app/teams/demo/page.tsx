import Link from "next/link";
import { demoTeam } from "@/lib/sampleData";
import { rankProfile } from "@/lib/archetypes";
import { ArchetypeBadge } from "@/components/ArchetypeBadge";
import { ScoreBar } from "@/components/ScoreBar";

export default function DemoTeamPage() {
  const withPrimary = demoTeam.map((m) => ({ ...m, primary: rankProfile(m.scores)[0].element }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">LawFam: heatmap</h1>
        <p className="text-muted">
          Example data: role titles and element scores from a real small team&apos;s assessment
          results, used with permission, with every name replaced by a fake one. Open a
          member&apos;s profile to see their pairwise flags with the rest of the team.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {withPrimary.map((m) => (
          <Link
            key={m.id}
            href={`/teams/demo/members/${m.id}`}
            className="rounded-lg border border-blush bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{m.name}</div>
                <div className="text-sm text-muted">{m.roleTitle}</div>
              </div>
              <ArchetypeBadge element={m.primary} />
            </div>
            <div className="mt-3">
              <ScoreBar scores={m.scores} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
