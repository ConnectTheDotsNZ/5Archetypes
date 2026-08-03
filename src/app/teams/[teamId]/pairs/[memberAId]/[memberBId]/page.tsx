import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentOrganization } from "@/lib/auth";
import { loadPairwiseReportModel } from "@/lib/reports/loadPairwiseReport";
import { PairwiseRelationshipReport } from "@/components/reports/PairwiseRelationshipReport";

export default async function TeamPairwiseReportPage({
  params,
}: {
  params: { teamId: string; memberAId: string; memberBId: string };
}) {
  const org = await requireCurrentOrganization();

  const model = await loadPairwiseReportModel({
    teamId: params.teamId,
    memberAId: params.memberAId,
    memberBId: params.memberBId,
    organizationId: org.id,
    generatedAt: new Date(),
  });
  if (!model) return notFound();

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
          href={`/teams/${params.teamId}/pairs/${params.memberAId}/${params.memberBId}/pdf`}
          className="rounded bg-gold px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Download PDF
        </a>
      </div>

      {/* Same component the PDF renders, so this page is a true preview. */}
      <PairwiseRelationshipReport model={model} />
    </div>
  );
}
