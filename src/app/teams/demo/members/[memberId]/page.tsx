import { notFound } from "next/navigation";
import { getDemoMember } from "@/lib/sampleData";
import { rankProfile, ARCHETYPES, SEQUENCING_ROLE } from "@/lib/archetypes";
import { ScoreBar } from "@/components/ScoreBar";
import { ArchetypeBadge } from "@/components/ArchetypeBadge";

export default function MemberProfilePage({ params }: { params: { memberId: string } }) {
  const member = getDemoMember(params.memberId);
  if (!member) return notFound();

  const ranked = rankProfile(member.scores);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{member.name}</h1>
        <p className="text-muted">{member.roleTitle}</p>
      </div>

      <ScoreBar scores={member.scores} />

      <div className="space-y-3">
        <h2 className="font-display text-xl font-bold">Ranked profile</h2>
        {ranked.map((r) => (
          <div key={r.element} className="rounded-lg border border-blush bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">
                {r.label} — {r.element}
              </div>
              <ArchetypeBadge element={r.element} />
            </div>
            <p className="mt-1 text-sm text-muted">{ARCHETYPES[r.element].essence}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-gold">
              Sequencing role: {SEQUENCING_ROLE[r.element]}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted">
        This is a placeholder Individual Profile view — it is not the final
        report template. See docs/BUILD_PLAN.md Section 3.2 for the intended
        content (needs list, stress patterns, self-care guidance) and
        docs/CLAUDE_CODE_KICKOFF.md for build order.
      </p>
    </div>
  );
}
