import Link from "next/link";
import { demoTeam } from "@/lib/sampleData";
import { rankProfile, isShengNeighbor, isKeChallenger } from "@/lib/archetypes";
import { ArchetypeBadge } from "@/components/ArchetypeBadge";
import { ScoreBar } from "@/components/ScoreBar";

export default function DemoTeamPage() {
  const withPrimary = demoTeam.map((m) => ({ ...m, primary: rankProfile(m.scores)[0].element }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Leadership Team: heatmap</h1>
        <p className="text-muted">Fictional demo data. Click any two members for a pairwise report.</p>
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

      <div>
        <h2 className="font-display text-xl font-bold">Pairwise flags</h2>
        <p className="mb-3 text-sm text-muted">
          Natural-ally pairs and natural-challenger pairs (natural button-pushers), based
          on each person&apos;s Primary element.
        </p>
        <table className="w-full border-collapse overflow-hidden rounded-lg border border-blush bg-white text-sm">
          <thead>
            <tr className="bg-blush text-left">
              <th className="p-2">Pair</th>
              <th className="p-2">Relationship</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {withPrimary.flatMap((a, i) =>
              withPrimary.slice(i + 1).map((b) => {
                const neighbor = isShengNeighbor(a.primary, b.primary);
                const challenger = isKeChallenger(a.primary, b.primary);
                return (
                  <tr key={`${a.id}-${b.id}`} className="border-t border-blush">
                    <td className="p-2">
                      {a.name} &amp; {b.name}
                    </td>
                    <td className="p-2">
                      {neighbor && <span className="text-wood">Natural allies</span>}
                      {challenger && <span className="text-fire">Natural challengers: button-pushers</span>}
                      {!neighbor && !challenger && <span className="text-muted">No direct cycle link</span>}
                    </td>
                    <td className="p-2 text-right">
                      <Link
                        className="font-semibold text-gold hover:underline"
                        href={`/teams/demo/pairs/${a.id}/${b.id}`}
                      >
                        View report →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
