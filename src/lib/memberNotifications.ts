/**
 * Rendering and delivery for the member notification outbox.
 *
 * The outbox exists because an admin's "tell these people" tick and the
 * actual send are separate concerns: the tick happens inside the score-save
 * transaction, delivery happens here and can fail without losing the scores.
 */

import { MemberNotificationKind, MemberNotificationStatus, type PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";
import {
  EmailNotConfiguredError,
  getEmailProvider,
  type EmailMessage,
  type EmailProvider,
} from "./email/provider";

/**
 * Copy for the member-facing email.
 *
 * Deliberately factual, and deliberately thin: it says scores were recorded
 * and by whom, and nothing about what any archetype means. Interpretive copy
 * belongs to Carey's approved content library (docs/BUILD_PLAN.md Section
 * 11, item 3), and the scores themselves are left out of the body — an
 * unauthenticated mailbox isn't where someone's profile data should land.
 */
export function renderMemberNotification({
  kind,
  memberName,
  organizationName,
}: {
  kind: MemberNotificationKind;
  memberName: string;
  organizationName: string;
}): EmailMessage {
  const firstName = memberName.trim().split(/\s+/)[0] || memberName;

  if (kind === MemberNotificationKind.SCORES_RECEIVED) {
    // [PLACEHOLDER: pending Carey's content library] final wording.
    const lines = [
      `Hi ${firstName},`,
      "",
      `${organizationName} has recorded your Five Archetypes assessment scores.`,
      "",
      "Your individual profile will follow once it has been prepared. There's nothing you need to do in the meantime.",
      "",
      "The Five Archetypes platform",
    ];
    return {
      to: "", // filled in by the caller from the queued address
      subject: "Your Five Archetypes scores have been recorded",
      text: lines.join("\n"),
      html: lines
        .map((line) => (line === "" ? "<p></p>" : `<p>${escapeHtml(line)}</p>`))
        .join("\n"),
    };
  }

  throw new Error(`No template yet for ${kind}. Report generation lands in Steps 5-6.`);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Kinds this drain pass knows how to send. REPORT_READY waits on Steps 5-6. */
const SENDABLE_KINDS: MemberNotificationKind[] = [MemberNotificationKind.SCORES_RECEIVED];

export type DrainSummary = {
  sent: number;
  failed: number;
  /** Queued, but of a kind we can't send yet — left PENDING on purpose. */
  deferred: number;
  providerName: string | null;
  /** Set when no provider is configured; nothing was touched. */
  notConfiguredReason?: string;
};

/**
 * The slice of the client this module touches. Injectable so the drain logic
 * can be exercised against a plain Postgres connection — the app's own client
 * is bound to the Neon serverless driver.
 */
type NotificationDb = Pick<PrismaClient, "memberNotification">;

export async function countPendingNotifications(
  organizationId: string,
  teamId?: string,
  db: NotificationDb = prisma
) {
  const where = {
    organizationId,
    status: MemberNotificationStatus.PENDING,
    ...(teamId ? { member: { teamId } } : {}),
  };

  const [sendable, deferred] = await Promise.all([
    db.memberNotification.count({ where: { ...where, kind: { in: SENDABLE_KINDS } } }),
    db.memberNotification.count({ where: { ...where, kind: { notIn: SENDABLE_KINDS } } }),
  ]);

  return { sendable, deferred };
}

/**
 * Sends what's queued, one row at a time.
 *
 * Each row is claimed with a conditional update before the provider is
 * called, so two concurrent drains can't both send the same message. A row
 * left in SENDING means the process died mid-send — that's surfaced rather
 * than retried, because a retry might be a second copy in someone's inbox.
 */
export async function drainMemberNotifications({
  organizationId,
  teamId,
  limit = 50,
  provider: injectedProvider,
  db = prisma,
}: {
  organizationId: string;
  teamId?: string;
  limit?: number;
  /** Injected in tests; production resolves from EMAIL_PROVIDER. */
  provider?: EmailProvider;
  db?: NotificationDb;
}): Promise<DrainSummary> {
  const { deferred } = await countPendingNotifications(organizationId, teamId, db);

  let provider: EmailProvider;
  try {
    provider = injectedProvider ?? (await getEmailProvider());
  } catch (error) {
    if (error instanceof EmailNotConfiguredError) {
      return { sent: 0, failed: 0, deferred, providerName: null, notConfiguredReason: error.message };
    }
    throw error;
  }

  const queued = await db.memberNotification.findMany({
    where: {
      organizationId,
      status: MemberNotificationStatus.PENDING,
      kind: { in: SENDABLE_KINDS },
      ...(teamId ? { member: { teamId } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      member: { select: { name: true } },
      organization: { select: { name: true } },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const notification of queued) {
    const claim = await db.memberNotification.updateMany({
      where: { id: notification.id, status: MemberNotificationStatus.PENDING },
      data: { status: MemberNotificationStatus.SENDING },
    });
    if (claim.count === 0) continue; // another pass got there first

    try {
      const message = renderMemberNotification({
        kind: notification.kind,
        memberName: notification.member.name,
        organizationName: notification.organization.name,
      });
      await provider.send({ ...message, to: notification.emailAtRequest });

      await db.memberNotification.update({
        where: { id: notification.id },
        data: { status: MemberNotificationStatus.SENT, sentAt: new Date(), failureReason: null },
      });
      sent++;
    } catch (error) {
      await db.memberNotification.update({
        where: { id: notification.id },
        data: {
          status: MemberNotificationStatus.FAILED,
          failureReason: (error instanceof Error ? error.message : String(error)).slice(0, 500),
        },
      });
      failed++;
    }
  }

  return { sent, failed, deferred, providerName: provider.name };
}
