"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AssessmentSource, MemberNotificationKind, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { requireTeamInOrg, requireMemberInOrg } from "@/lib/orgScope";
import { parseCsv } from "@/lib/csv";
import { drainMemberNotifications } from "@/lib/memberNotifications";
import {
  MAX_CSV_CHARS,
  SCORE_SCALES,
  UNMAPPED,
  describeMappingProblems,
  parseScoreProfileCells,
  resolveRows,
} from "@/lib/scoreIngestion";

/**
 * Ingestion is deliberately append-only: every save writes a new Assessment
 * row rather than editing the last one, so a re-upload leaves an auditable
 * history and the reports simply read the most recent row per member
 * (see getTeamWithScores in src/lib/teamData.ts).
 */

function scoresPath(teamId: string): string {
  return `/admin/teams/${teamId}/scores`;
}

/** Keeps report/heatmap pages in step with newly ingested scores. */
function revalidateScoreViews(teamId: string): void {
  revalidatePath(scoresPath(teamId));
  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath(`/teams/${teamId}`);
}

// --- Member notifications -------------------------------------------------

/**
 * What an admin asked for alongside a score save. Nothing is delivered here:
 * `notifyScoresReceived` queues a PENDING MemberNotification, and
 * `sendReportWhenReady` records the preference on the Member for report
 * generation (Steps 5-6) to honour. There is no email provider wired up yet.
 */
const notificationOptionsSchema = z
  .object({
    notifyScoresReceived: z.boolean(),
    sendReportWhenReady: z.boolean(),
  })
  .default({ notifyScoresReceived: false, sendReportWhenReady: false });

type NotificationOptions = z.infer<typeof notificationOptionsSchema>;

export type NotificationOutcome = {
  queued: number;
  /** Members who couldn't be notified because we hold no address for them. */
  skippedNoEmail: number;
};

/**
 * Records the admin's notification choices inside the same transaction as the
 * assessments they relate to. Members without an email are skipped and
 * counted rather than failing the import — the scores still matter.
 */
async function applyNotificationRequests({
  tx,
  organizationId,
  requestedById,
  options,
  targets,
}: {
  tx: Prisma.TransactionClient;
  organizationId: string;
  requestedById: string;
  options: NotificationOptions;
  targets: { memberId: string; email: string | null; assessmentId: string }[];
}): Promise<NotificationOutcome> {
  if (!options.notifyScoresReceived && !options.sendReportWhenReady) {
    return { queued: 0, skippedNoEmail: 0 };
  }

  const reachable = targets.filter((target) => (target.email ?? "").trim() !== "");
  const skippedNoEmail = targets.length - reachable.length;

  if (options.sendReportWhenReady && reachable.length > 0) {
    await tx.member.updateMany({
      where: { id: { in: reachable.map((target) => target.memberId) } },
      data: { sendReportsToMember: true },
    });
  }

  if (!options.notifyScoresReceived) {
    return { queued: 0, skippedNoEmail };
  }

  await tx.memberNotification.createMany({
    data: reachable.map((target) => ({
      organizationId,
      memberId: target.memberId,
      assessmentId: target.assessmentId,
      kind: MemberNotificationKind.SCORES_RECEIVED,
      emailAtRequest: target.email!.trim(),
      requestedById,
    })),
  });

  return { queued: reachable.length, skippedNoEmail };
}

/** Member notifications are an org ADMIN's call, not a MANAGER's. */
function notificationsRequested(options: NotificationOptions): boolean {
  return options.notifyScoresReceived || options.sendReportWhenReady;
}

/**
 * Sends this team's queued member emails.
 *
 * Manual for now — an admin presses the button and sees the result. A cron or
 * queue worker calling drainMemberNotifications() is the obvious next step,
 * but a visible button is the right shape while the provider is still being
 * proven against a real mailbox.
 */
export async function sendQueuedNotifications(teamId: string) {
  const user = await requireCurrentUser();
  await requireTeamInOrg(teamId);

  if (user.role !== "ADMIN") {
    redirect(
      `${scoresPath(teamId)}?error=${encodeURIComponent(
        "Only an organisation admin can send member notifications."
      )}`
    );
  }

  const summary = await drainMemberNotifications({
    organizationId: user.organizationId,
    teamId,
  });

  revalidatePath(scoresPath(teamId));

  if (summary.notConfiguredReason) {
    redirect(
      `${scoresPath(teamId)}?error=${encodeURIComponent(
        `Email isn't configured yet, so nothing was sent. ${summary.notConfiguredReason}`
      )}`
    );
  }

  const parts = [`Sent ${summary.sent} member email(s) via ${summary.providerName}.`];
  if (summary.failed > 0) parts.push(`${summary.failed} failed. See the queue below.`);
  if (summary.deferred > 0) {
    parts.push(`${summary.deferred} still waiting on report generation.`);
  }
  redirect(`${scoresPath(teamId)}?saved=${encodeURIComponent(parts.join(" "))}`);
}

// --- Manual entry ---------------------------------------------------------

const manualEntrySchema = z.object({
  scale: z.enum(SCORE_SCALES),
  Wood: z.string(),
  Fire: z.string(),
  Earth: z.string(),
  Metal: z.string(),
  Water: z.string(),
});

export async function saveManualAssessment(memberId: string, formData: FormData) {
  const user = await requireCurrentUser();
  const member = await requireMemberInOrg(memberId);
  const manualPath = `/admin/teams/${member.teamId}/members/${memberId}/scores`;
  const fail = (message: string): never =>
    redirect(`${manualPath}?error=${encodeURIComponent(message)}`);

  const parsedForm = manualEntrySchema.safeParse({
    scale: formData.get("scale"),
    Wood: formData.get("Wood") ?? "",
    Fire: formData.get("Fire") ?? "",
    Earth: formData.get("Earth") ?? "",
    Metal: formData.get("Metal") ?? "",
    Water: formData.get("Water") ?? "",
  });
  if (!parsedForm.success) {
    fail("Choose a score format and enter all five scores.");
    return;
  }

  const options: NotificationOptions = {
    notifyScoresReceived: formData.get("notifyScoresReceived") === "on",
    sendReportWhenReady: formData.get("sendReportWhenReady") === "on",
  };
  if (notificationsRequested(options) && user.role !== "ADMIN") {
    fail("Only an organisation admin can request member notifications.");
    return;
  }

  const { scale, ...cells } = parsedForm.data;
  const parsedScores = parseScoreProfileCells(cells, scale);
  if (!parsedScores.ok) {
    fail(parsedScores.issues.join(" "));
    return;
  }

  const memberRecord = await prisma.member.findUniqueOrThrow({
    where: { id: memberId },
    select: { email: true },
  });

  const outcome = await prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.create({
      data: {
        memberId,
        source: AssessmentSource.MANUAL_ENTRY,
        wood: parsedScores.scores.Wood,
        fire: parsedScores.scores.Fire,
        earth: parsedScores.scores.Earth,
        metal: parsedScores.scores.Metal,
        water: parsedScores.scores.Water,
      },
      select: { id: true },
    });

    return applyNotificationRequests({
      tx,
      organizationId: user.organizationId,
      requestedById: user.id,
      options,
      targets: [{ memberId, email: memberRecord.email, assessmentId: assessment.id }],
    });
  });

  revalidateScoreViews(member.teamId);

  const notice =
    outcome.skippedNoEmail > 0
      ? ` No email on file for ${member.name}, so nothing was queued to send.`
      : outcome.queued > 0
        ? " A notification is queued for them."
        : "";
  redirect(
    `${scoresPath(member.teamId)}?saved=${encodeURIComponent(
      `Saved scores for ${member.name}.${notice}`
    )}`
  );
}

// --- CSV upload -----------------------------------------------------------

const columnIndex = z.number().int().min(UNMAPPED);

const csvImportSchema = z.object({
  teamId: z.string().min(1),
  // Truncated rather than rejected: an unusually long filename shouldn't
  // block an import, it just gets shortened in rawImportRef.
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(1024)
    .transform((name) => name.slice(0, 200)),
  fileText: z.string().min(1).max(MAX_CSV_CHARS, "That file is too large to import."),
  mapping: z.object({
    headerRow: z.number().int().min(1).nullable(),
    firstDataRow: z.number().int().min(1),
    scale: z.enum(SCORE_SCALES),
    email: columnIndex,
    name: columnIndex,
    scores: z.object({
      Wood: columnIndex,
      Fire: columnIndex,
      Earth: columnIndex,
      Metal: columnIndex,
      Water: columnIndex,
    }),
  }),
  /**
   * Rows the admin matched to a member by hand in the preview, as
   * rowNumber -> memberId. Only ids on this team are honoured (resolveRows is
   * handed the team's members, so an id from elsewhere simply won't resolve).
   */
  overrides: z.record(z.string().regex(/^\d+$/), z.string().min(1)).default({}),
  notifications: notificationOptionsSchema,
});

export type CsvImportInput = z.input<typeof csvImportSchema>;

export type CsvImportResult =
  | ({ ok: true; savedCount: number; skippedCount: number } & NotificationOutcome)
  | { ok: false; error: string; issues?: string[] };

/**
 * Saves the valid rows of an already-previewed CSV.
 *
 * The client sends the original file text plus the chosen mapping rather
 * than the numbers it parsed, and this action re-parses and re-validates
 * from scratch with the same shared functions the preview used. That way the
 * preview is a faithful dry run, and the authoritative validation still
 * happens server-side over the original file — a tampered or stale client
 * can't write a score we wouldn't accept.
 */
export async function saveCsvAssessments(input: CsvImportInput): Promise<CsvImportResult> {
  const parsedInput = csvImportSchema.safeParse(input);
  if (!parsedInput.success) {
    return { ok: false, error: parsedInput.error.issues[0]?.message ?? "Invalid upload." };
  }

  const { teamId, fileName, fileText, mapping, overrides, notifications } = parsedInput.data;
  const user = await requireCurrentUser();
  await requireTeamInOrg(teamId);

  if (notificationsRequested(notifications) && user.role !== "ADMIN") {
    return { ok: false, error: "Only an organisation admin can request member notifications." };
  }

  const mappingProblems = describeMappingProblems(mapping);
  if (mappingProblems.length > 0) {
    return { ok: false, error: "The column mapping is incomplete.", issues: mappingProblems };
  }

  const rows = parseCsv(fileText);
  const members = await prisma.member.findMany({
    where: { teamId },
    select: { id: true, name: true, email: true },
  });

  const preview = resolveRows({
    rows,
    mapping,
    members,
    overrides: Object.fromEntries(
      Object.entries(overrides).map(([rowNumber, memberId]) => [Number(rowNumber), memberId])
    ),
  });

  if (preview.rows.length === 0) {
    return { ok: false, error: "That file has no data rows to import." };
  }
  if (preview.readyRows.length === 0) {
    return {
      ok: false,
      error: "No rows could be imported. Every row still has a problem.",
      issues: preview.skippedRows.slice(0, 5).map((row) => `Row ${row.rowNumber}: ${row.issues[0]}`),
    };
  }

  const emailByMemberId = new Map(members.map((member) => [member.id, member.email]));

  // One transaction, one assessment row per ready row. Rows are created
  // individually (rather than createMany) so each notification can point at
  // the assessment that prompted it.
  const outcome = await prisma.$transaction(async (tx) => {
    const targets: { memberId: string; email: string | null; assessmentId: string }[] = [];

    for (const row of preview.readyRows) {
      // resolveRows only clears a row's issues once it has both a member and
      // five valid scores, so these are non-null here.
      const memberId = row.memberId!;
      const scores = row.scores!;
      const assessment = await tx.assessment.create({
        data: {
          memberId,
          source: AssessmentSource.CSV_UPLOAD,
          wood: scores.Wood,
          fire: scores.Fire,
          earth: scores.Earth,
          metal: scores.Metal,
          water: scores.Water,
          rawImportRef: `${fileName} row ${row.rowNumber}`,
        },
        select: { id: true },
      });
      targets.push({
        memberId,
        email: emailByMemberId.get(memberId) ?? null,
        assessmentId: assessment.id,
      });
    }

    return applyNotificationRequests({
      tx,
      organizationId: user.organizationId,
      requestedById: user.id,
      options: notifications,
      targets,
    });
  });

  revalidateScoreViews(teamId);

  return {
    ok: true,
    savedCount: preview.readyRows.length,
    skippedCount: preview.skippedRows.length,
    ...outcome,
  };
}
