import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrganization } from "@/lib/auth";
import { ELEMENTS, type Element } from "@/lib/archetypes";
import { SCORE_SCALES, SCORE_SCALE_LABELS } from "@/lib/scoreIngestion";
import { AssessmentSourceBadge } from "@/components/AssessmentSourceBadge";
import { saveManualAssessment } from "@/app/admin/teams/[teamId]/scores/actions";

const ELEMENT_DOT: Record<Element, string> = {
  Wood: "bg-wood",
  Fire: "bg-fire",
  Earth: "bg-earth",
  Metal: "bg-metal",
  Water: "bg-water",
};

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ManualScoreEntryPage({
  params,
  searchParams,
}: {
  params: { teamId: string; memberId: string };
  searchParams: { error?: string };
}) {
  const org = await requireCurrentOrganization();

  const member = await prisma.member.findFirst({
    where: { id: params.memberId, teamId: params.teamId, team: { organizationId: org.id } },
    include: {
      team: { select: { name: true } },
      assessments: { orderBy: { takenAt: "desc" }, take: 10 },
    },
  });
  if (!member) return notFound();

  const latest = member.assessments[0];
  const latestByElement: Record<Element, number> | null = latest
    ? {
        Wood: latest.wood,
        Fire: latest.fire,
        Earth: latest.earth,
        Metal: latest.metal,
        Water: latest.water,
      }
    : null;

  const saveScoresForMember = saveManualAssessment.bind(null, member.id);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/teams/${params.teamId}/scores`}
          className="text-sm font-semibold text-gold hover:underline"
        >
          ← Back to scores
        </Link>
        <h1 className="font-display text-3xl font-bold">
          {latest ? "Update scores" : "Enter scores"}
        </h1>
        <p className="text-muted">
          {member.name}
          {member.roleTitle ? ` — ${member.roleTitle}` : ""} · {member.team.name}
        </p>
      </div>

      {searchParams.error && (
        <p className="rounded border border-fire/30 bg-fire/10 p-3 text-sm text-fire">
          {searchParams.error}
        </p>
      )}

      <form
        action={saveScoresForMember}
        className="max-w-xl space-y-4 rounded-lg border border-blush bg-white p-4"
      >
        <div>
          <h2 className="font-display text-lg font-bold">Five element scores</h2>
          {/*
            The platform does not compute these from raw assessment answers —
            the scoring algorithm is still an open question (docs/BUILD_PLAN.md
            Section 11, item 1). Scores are entered as already-computed values.
          */}
          <p className="mt-1 text-sm text-muted">
            Enter the scores as they came out of the assessment. The platform stores them as
            given — it doesn&apos;t recompute or rescale them.
          </p>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-ink">Score format</span>
          <select
            name="scale"
            defaultValue={SCORE_SCALES[0]}
            className="w-full rounded border border-blush px-3 py-2 text-sm focus:border-gold focus:outline-none"
          >
            {SCORE_SCALES.map((scale) => (
              <option key={scale} value={scale}>
                {SCORE_SCALE_LABELS[scale]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          {ELEMENTS.map((element) => (
            <label key={element} className="block text-sm">
              <span className="mb-1 flex items-center gap-2 font-semibold text-ink">
                <span className={`inline-block h-3 w-3 rounded-full ${ELEMENT_DOT[element]}`} />
                {element}
              </span>
              <input
                type="text"
                name={element}
                required
                inputMode="decimal"
                placeholder="0.000"
                defaultValue={latestByElement ? latestByElement[element].toFixed(3) : ""}
                className="w-full rounded border border-blush px-3 py-2 text-sm tabular-nums focus:border-gold focus:outline-none"
              />
            </label>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded bg-gold px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Save scores
          </button>
          <Link
            href={`/admin/teams/${params.teamId}/scores`}
            className="text-sm font-semibold text-muted hover:underline"
          >
            Cancel
          </Link>
        </div>

        {latest && (
          <p className="text-xs text-muted">
            Saving adds a new assessment rather than overwriting the one from{" "}
            {formatDateTime(latest.takenAt)}. Reports always use the most recent scores.
          </p>
        )}
      </form>

      {member.assessments.length > 0 && (
        <div className="rounded-lg border border-blush bg-white p-4">
          <h2 className="font-display text-lg font-bold">Score history</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-blush text-left">
                  <th className="p-2">Taken</th>
                  {ELEMENTS.map((element) => (
                    <th key={element} className="p-2 text-right">
                      {element}
                    </th>
                  ))}
                  <th className="p-2">Source</th>
                  <th className="p-2">Import ref</th>
                </tr>
              </thead>
              <tbody>
                {member.assessments.map((assessment, index) => (
                  <tr key={assessment.id} className="border-b border-blush last:border-0">
                    <td className="p-2 whitespace-nowrap text-muted">
                      {formatDateTime(assessment.takenAt)}
                      {index === 0 && (
                        <span className="ml-2 text-xs font-semibold text-wood">current</span>
                      )}
                    </td>
                    <td className="p-2 text-right tabular-nums">{assessment.wood.toFixed(3)}</td>
                    <td className="p-2 text-right tabular-nums">{assessment.fire.toFixed(3)}</td>
                    <td className="p-2 text-right tabular-nums">{assessment.earth.toFixed(3)}</td>
                    <td className="p-2 text-right tabular-nums">{assessment.metal.toFixed(3)}</td>
                    <td className="p-2 text-right tabular-nums">{assessment.water.toFixed(3)}</td>
                    <td className="p-2">
                      <AssessmentSourceBadge source={assessment.source} />
                    </td>
                    <td className="p-2 text-xs text-muted">{assessment.rawImportRef ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
