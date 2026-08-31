import Link from "next/link";
import { isShengNeighbor, isKeChallenger, type Element } from "@/lib/archetypes";

export type PairwiseFlagsTeammate = {
  id: string;
  name: string;
  primary: Element;
};

/**
 * A member's natural-ally / natural-challenger pairs with the rest of their
 * team. Scoped to one member (not a full team-wide pair table) so the list
 * stays a handful of rows regardless of team size — see CLAUDE.md.
 */
export function PairwiseFlagsSection({
  memberId,
  memberName,
  primary,
  teammates,
  pairsBasePath,
}: {
  memberId: string;
  memberName: string;
  primary: Element;
  teammates: PairwiseFlagsTeammate[];
  pairsBasePath: string;
}) {
  const others = teammates.filter((t) => t.id !== memberId);
  if (others.length === 0) return null;

  return (
    <div>
      <h2 className="font-display text-xl font-bold">Pairwise flags</h2>
      <p className="mb-3 text-sm text-muted">
        {memberName}&apos;s natural-ally and natural-challenger (button-pusher) pairs with
        the rest of the team, based on each person&apos;s Primary element.
      </p>
      <table className="w-full border-collapse overflow-hidden rounded-lg border border-blush bg-white text-sm">
        <thead>
          <tr className="bg-blush text-left">
            <th className="p-2">Teammate</th>
            <th className="p-2">Relationship</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {others.map((teammate) => {
            const neighbor = isShengNeighbor(primary, teammate.primary);
            const challenger = isKeChallenger(primary, teammate.primary);
            return (
              <tr key={teammate.id} className="border-t border-blush">
                <td className="p-2">{teammate.name}</td>
                <td className="p-2">
                  {neighbor && <span className="text-wood">Natural allies</span>}
                  {challenger && <span className="text-fire">Natural challengers: button-pushers</span>}
                  {!neighbor && !challenger && <span className="text-muted">No direct cycle link</span>}
                </td>
                <td className="p-2 text-right">
                  <Link
                    className="font-semibold text-gold hover:underline"
                    href={`${pairsBasePath}/${memberId}/${teammate.id}`}
                  >
                    View report →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
