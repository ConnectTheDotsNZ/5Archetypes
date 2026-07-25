import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrganization } from "@/lib/auth";
import { CsvUploadWizard } from "@/components/CsvUploadWizard";

export default async function CsvUploadPage({ params }: { params: { teamId: string } }) {
  const org = await requireCurrentOrganization();

  const team = await prisma.team.findFirst({
    where: { id: params.teamId, organizationId: org.id },
    include: { members: { orderBy: { name: "asc" }, select: { id: true, name: true } } },
  });
  if (!team) return notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/teams/${team.id}/scores`}
          className="text-sm font-semibold text-gold hover:underline"
        >
          ← Back to scores
        </Link>
        <h1 className="font-display text-3xl font-bold">Import scores from CSV</h1>
        <p className="text-muted">{team.name}</p>
      </div>

      {team.members.length === 0 ? (
        <div className="rounded-lg border border-blush bg-white p-4 text-sm">
          <p className="font-semibold text-ink">This team has no members yet.</p>
          <p className="mt-1 text-muted">
            CSV rows are matched to existing members by name, so{" "}
            <Link href={`/admin/teams/${team.id}`} className="font-semibold text-gold hover:underline">
              add the team&apos;s members
            </Link>{" "}
            before importing their scores.
          </p>
        </div>
      ) : (
        // The wizard needs the member list client-side to match names while
        // rendering its preview. Ids + names only — no scores leave the server
        // for this step.
        <CsvUploadWizard teamId={team.id} teamName={team.name} members={team.members} />
      )}
    </div>
  );
}
