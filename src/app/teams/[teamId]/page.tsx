import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamWithScores } from "@/lib/teamData";
import { rankProfile } from "@/lib/archetypes";
import { ArchetypeBadge } from "@/components/ArchetypeBadge";
import { ScoreBar } from "@/components/ScoreBar";
import { requireCurrentOrganization } from "@/lib/auth";

export default async function TeamPage({ params }: { params: { teamId: string } }) {
  const org = await requireCurrentOrganization();
  const team = await getTeamWithScores(params.teamId, org.id);
  if (!team) return notFound();

  const withPrimary = team.members.map((m) => ({ ...m, primary: rankProfile(m.scores)[0].element }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">{team.name}: heatmap</h1>
        <p className="text-muted">
          Open a member&apos;s profile to see their pairwise flags with the rest of the team.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {withPrimary.map((m) => (
          <Link
            key={m.id}
            href={`/teams/${team.id}/members/${m.id}`}
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
