import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { ELEMENTS } from "@/lib/archetypes";
import { AssessmentSourceBadge } from "@/components/AssessmentSourceBadge";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { sendQueuedNotifications } from "./actions";

/** US is the launch market (see docs/BUILD_PLAN.md Section 8). */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function TeamScoresPage({
  params,
  searchParams,
}: {
  params: { teamId: string };
  searchParams: { error?: string; saved?: string };
}) {
  const user = await requireCurrentUser();

  const team = await prisma.team.findFirst({
    where: { id: params.teamId, organizationId: user.organizationId },
    include: {
      members: {
        orderBy: { createdAt: "asc" },
        include: {
          assessments: { orderBy: { takenAt: "desc" }, take: 1 },
          _count: { select: { assessments: true } },
        },
      },
    },
  });
  if (!team) return notFound();

  const withScores = team.members.filter((member) => member.assessments.length > 0);

  // Queued member-facing email for this team, newest first.
  const notifications = await prisma.memberNotification.findMany({
    where: { organizationId: user.organizationId, member: { teamId: team.id } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { member: { select: { name: true } } },
  });
  const pendingCount = notifications.filter((n) => n.status === "PENDING").length;
  const sendForTeam = sendQueuedNotifications.bind(null, team.id);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/teams/${team.id}`}
          className="text-sm font-semibold text-gold hover:underline"
        >
          ← Back to team
        </Link>
        <h1 className="font-display text-3xl font-bold">Assessment scores</h1>
        <p className="text-muted">{team.name}</p>
      </div>

      {searchParams.saved && (
        <p className="rounded border border-wood/30 bg-wood/10 p-3 text-sm text-wood">
          {searchParams.saved}
        </p>
      )}
      {searchParams.error && (
        <p className="rounded border border-fire/30 bg-fire/10 p-3 text-sm text-fire">
          {searchParams.error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blush bg-white p-4">
        <div className="text-sm">
          <p className="font-semibold text-ink">
            {withScores.length} of {team.members.length}{" "}
            {team.members.length === 1 ? "member has" : "members have"} scores on file
          </p>
          <p className="text-muted">
            Scores arrive already computed — enter them per member, or import a whole team from CSV.
          </p>
        </div>
        <div className="flex gap-3">
          {withScores.length >= 2 && (
            <Link
              href={`/teams/${team.id}`}
              className="rounded border border-gold px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/10"
            >
              View team heatmap
            </Link>
          )}
          <Link
            href={`/admin/teams/${team.id}/scores/upload`}
            className="rounded bg-gold px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Upload CSV
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-blush bg-white p-4">
        <h2 className="font-display text-lg font-bold">Latest scores by member</h2>
        {team.members.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No members on this team yet —{" "}
            <Link href={`/admin/teams/${team.id}`} className="font-semibold text-gold hover:underline">
              add members first
            </Link>
            , then come back to enter their scores.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-blush text-left">
                  <th className="p-2">Member</th>
                  {ELEMENTS.map((element) => (
                    <th key={element} className="p-2 text-right font-semibold">
                      {element}
                    </th>
                  ))}
                  <th className="p-2">Source</th>
                  <th className="p-2">Taken</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {team.members.map((member) => {
                  const latest = member.assessments[0];
                  return (
                    <tr key={member.id} className="border-b border-blush last:border-0">
                      <td className="p-2">
                        <span className="font-semibold">{member.name}</span>
                        {member.roleTitle && (
                          <span className="block text-xs text-muted">{member.roleTitle}</span>
                        )}
                      </td>
                      {latest ? (
                        <>
                          <td className="p-2 text-right tabular-nums">{latest.wood.toFixed(3)}</td>
                          <td className="p-2 text-right tabular-nums">{latest.fire.toFixed(3)}</td>
                          <td className="p-2 text-right tabular-nums">{latest.earth.toFixed(3)}</td>
                          <td className="p-2 text-right tabular-nums">{latest.metal.toFixed(3)}</td>
                          <td className="p-2 text-right tabular-nums">{latest.water.toFixed(3)}</td>
                          <td className="p-2">
                            <AssessmentSourceBadge source={latest.source} />
                          </td>
                          <td className="p-2 text-muted">
                            {formatDate(latest.takenAt)}
                            {member._count.assessments > 1 && (
                              <span className="block text-xs">
                                {member._count.assessments} on file
                              </span>
                            )}
                          </td>
                        </>
                      ) : (
                        <td colSpan={7} className="p-2 text-muted">
                          No scores yet
                        </td>
                      )}
                      <td className="p-2 text-right">
                        <Link
                          href={`/admin/teams/${team.id}/members/${member.id}/scores`}
                          className="whitespace-nowrap font-semibold text-gold hover:underline"
                        >
                          {latest ? "Update scores" : "Enter scores"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="rounded-lg border border-blush bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">Member emails</h2>
              <p className="text-sm text-muted">
                {pendingCount > 0
                  ? `${pendingCount} queued and not yet sent.`
                  : "Nothing queued right now."}
              </p>
            </div>
            {user.role === "ADMIN" && pendingCount > 0 && (
              <form action={sendForTeam}>
                <ConfirmSubmitButton
                  confirmMessage={`Send ${pendingCount} email(s) to members of ${team.name}?`}
                  className="rounded bg-gold px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Send queued emails
                </ConfirmSubmitButton>
              </form>
            )}
          </div>

          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-blush text-left">
                <th className="p-2">Member</th>
                <th className="p-2">Sent to</th>
                <th className="p-2">Kind</th>
                <th className="p-2">Status</th>
                <th className="p-2">Requested</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr key={notification.id} className="border-b border-blush last:border-0">
                  <td className="p-2 font-semibold">{notification.member.name}</td>
                  <td className="p-2 text-muted">{notification.emailAtRequest}</td>
                  <td className="p-2 text-muted">
                    {notification.kind === "SCORES_RECEIVED" ? "Scores recorded" : "Report ready"}
                  </td>
                  <td className="p-2">
                    <span
                      className={
                        notification.status === "SENT"
                          ? "font-semibold text-wood"
                          : notification.status === "FAILED"
                            ? "font-semibold text-fire"
                            : "text-muted"
                      }
                    >
                      {notification.status.toLowerCase()}
                    </span>
                    {notification.failureReason && (
                      <span className="block text-xs text-fire">{notification.failureReason}</span>
                    )}
                  </td>
                  <td className="p-2 text-muted">{formatDate(notification.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-3 text-xs text-muted">
            &ldquo;Report ready&rdquo; emails stay queued until report generation exists (Steps
            5&ndash;6). Sending is manual for now — a scheduled drain replaces this button later.
          </p>
        </div>
      )}
    </div>
  );
}
