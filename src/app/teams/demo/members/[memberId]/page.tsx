import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDemoIndividualProfileModel } from "@/lib/reports/loadIndividualProfile";
import { IndividualProfileReport } from "@/components/reports/IndividualProfileReport";
import { DEMO_NARRATIVE_DISCLAIMER } from "@/lib/content/demoNarrative";

export default function DemoMemberProfilePage({ params }: { params: { memberId: string } }) {
  const model = loadDemoIndividualProfileModel({
    memberId: params.memberId,
    generatedAt: new Date(),
  });
  if (!model) return notFound();

  return (
    <div className="space-y-6">
      <div className="fa-no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/teams/demo" className="text-sm font-semibold text-gold hover:underline">
          ← Demo team
        </Link>
        <a
          href={`/teams/demo/members/${params.memberId}/pdf`}
          className="rounded bg-gold px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Download PDF
        </a>
      </div>

      <p className="rounded border border-gold bg-cream p-3 text-xs text-muted">
        <strong className="text-ink">Example narrative.</strong> {DEMO_NARRATIVE_DISCLAIMER}
      </p>

      {/* Same component the PDF renders, so this page is a true preview. */}
      <IndividualProfileReport model={model} />
    </div>
  );
}
