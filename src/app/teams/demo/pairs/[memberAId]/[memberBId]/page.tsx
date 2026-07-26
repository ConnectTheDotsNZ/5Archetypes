import { notFound } from "next/navigation";
import { getDemoMember } from "@/lib/sampleData";
import { computeRelationship, ARCHETYPES, ELEMENTS } from "@/lib/archetypes";
import { ScoreBar } from "@/components/ScoreBar";
import { ArchetypeBadge } from "@/components/ArchetypeBadge";

export default function PairwiseReportPage({
  params,
}: {
  params: { memberAId: string; memberBId: string };
}) {
  const a = getDemoMember(params.memberAId);
  const b = getDemoMember(params.memberBId);
  if (!a || !b) return notFound();

  const rel = computeRelationship(a.scores, b.scores);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">
          {a.name} &amp; {b.name}
        </h1>
        <p className="text-muted">Workplace pairwise relationship report: draft placeholder</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-blush bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">{a.name}</span>
            <ArchetypeBadge element={rel.primaryA} />
          </div>
          <ScoreBar scores={a.scores} />
        </div>
        <div className="rounded-lg border border-blush bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">{b.name}</span>
            <ArchetypeBadge element={rel.primaryB} />
          </div>
          <ScoreBar scores={b.scores} />
        </div>
      </div>

      <section className="rounded-lg border border-blush bg-white p-4">
        <h2 className="font-display text-xl font-bold">Core dynamic</h2>
        <p className="mt-2 text-sm text-muted">
          {rel.sameLead
            ? `Both share ${rel.primaryA} as their Primary. Likely to reinforce each other's blind spots as much as their strengths.`
            : `${a.name} leads with ${rel.primaryA} (${ARCHETYPES[rel.primaryA].nickname}); ${b.name} leads with ${rel.primaryB} (${ARCHETYPES[rel.primaryB].nickname}).`}
        </p>
        {(rel.shengNeighbors || rel.keChallengers) && (
          <p className="mt-2 rounded border border-blush bg-cream p-2 text-xs text-muted">
            <strong className="text-ink">Sheng</strong> and <strong className="text-ink">Ke</strong> are
            two fixed patterns from the Five Elements framework this system is built on, not typos: Sheng
            neighbours support each other easily, Ke challengers naturally create friction.
          </p>
        )}
        {rel.shengNeighbors && (
          <p className="mt-2 text-sm text-wood">
            These are Sheng-cycle neighbours: a natural, low-effort support pairing.
          </p>
        )}
        {rel.keChallengers && (
          <p className="mt-2 text-sm text-fire">
            These are Ke-cycle challengers: expect productive friction, not a problem to fix. Bridge
            element: <strong>{rel.bridgeElement}</strong>.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-blush bg-white p-4">
        <h2 className="font-display text-xl font-bold">Score deltas</h2>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {ELEMENTS.map((el) => (
              <tr key={el} className="border-t border-blush">
                <td className="py-1 pr-4 font-medium">{el}</td>
                <td className="py-1 pr-4">{a.scores[el].toFixed(3)}</td>
                <td className="py-1 pr-4">{b.scores[el].toFixed(3)}</td>
                <td className="py-1 font-semibold">
                  {rel.deltas[el] > 0 ? "+" : ""}
                  {rel.deltas[el].toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="text-xs text-muted">
        This placeholder shows the computed inputs only. The real Workplace
        Pairwise Report template (Core Dynamic / In Practice / Score Impact /
        Escalation Loop / Risks / Calibration Tools / Direct Script, blended
        with the Fields vocabulary) still needs to be authored with Carey and
        wired into a content/templating layer. See docs/BUILD_PLAN.md Section
        3.2 and 7.3, and docs/CLAUDE_CODE_KICKOFF.md.
      </p>
    </div>
  );
}
