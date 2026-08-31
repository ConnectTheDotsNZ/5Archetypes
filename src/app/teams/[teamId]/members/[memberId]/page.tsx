import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentOrganization } from "@/lib/auth";
import { loadIndividualProfileModel } from "@/lib/reports/loadIndividualProfile";
import { IndividualProfileReport } from "@/components/reports/IndividualProfileReport";
import { getTeamWithScores } from "@/lib/teamData";
import { rankProfile } from "@/lib/archetypes";
import { PairwiseFlagsSection } from "@/components/PairwiseFlagsSection";

export default async function TeamMemberProfilePage({
  params,
}: {
  params: { teamId: string; memberId: string };
}) {
  const org = await requireCurrentOrganization();

  const model = await loadIndividualProfileModel({
    teamId: params.teamId,
    memberId: params.memberId,
    organizationId: org.id,
    generatedAt: new Date(),
  });
  if (!model) return notFound();

  const team = await getTeamWithScores(params.teamId, org.id);
  const teammates = (team?.members ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    primary: rankProfile(m.scores)[0].element,
  }));
  const primary = model.primary.element;

  return (
    <div className="space-y-6">
      <div className="fa-no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/teams/${params.teamId}`}
          className="text-sm font-semibold text-gold hover:underline"
        >
          ← Back to team
        </Link>
        <a
          href={`/teams/${params.teamId}/members/${params.memberId}/pdf`}
          className="rounded bg-gold px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Download PDF
        </a>
      </div>

      {/* Same component the PDF renders, so this page is a true preview. */}
      <IndividualProfileReport model={model} />

      <PairwiseFlagsSection
        memberId={params.memberId}
        memberName={model.subject.name}
        primary={primary}
        teammates={teammates}
        pairsBasePath={`/teams/${params.teamId}/pairs`}
      />
    </div>
  );
}
