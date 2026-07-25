"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AssessmentSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTeamInOrg, requireMemberInOrg } from "@/lib/orgScope";
import { parseCsv } from "@/lib/csv";
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
  const member = await requireMemberInOrg(memberId);
  const manualPath = `/admin/teams/${member.teamId}/members/${memberId}/scores`;

  const parsedForm = manualEntrySchema.safeParse({
    scale: formData.get("scale"),
    Wood: formData.get("Wood") ?? "",
    Fire: formData.get("Fire") ?? "",
    Earth: formData.get("Earth") ?? "",
    Metal: formData.get("Metal") ?? "",
    Water: formData.get("Water") ?? "",
  });
  if (!parsedForm.success) {
    redirect(
      `${manualPath}?error=${encodeURIComponent("Choose a score format and enter all five scores.")}`
    );
  }

  const { scale, ...cells } = parsedForm.data;
  const parsedScores = parseScoreProfileCells(cells, scale);
  if (!parsedScores.ok) {
    redirect(`${manualPath}?error=${encodeURIComponent(parsedScores.issues.join(" "))}`);
  }

  await prisma.assessment.create({
    data: {
      memberId,
      source: AssessmentSource.MANUAL_ENTRY,
      wood: parsedScores.scores.Wood,
      fire: parsedScores.scores.Fire,
      earth: parsedScores.scores.Earth,
      metal: parsedScores.scores.Metal,
      water: parsedScores.scores.Water,
    },
  });

  revalidateScoreViews(member.teamId);
  redirect(
    `${scoresPath(member.teamId)}?saved=${encodeURIComponent(`Saved scores for ${member.name}.`)}`
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
    hasHeaderRow: z.boolean(),
    scale: z.enum(SCORE_SCALES),
    name: columnIndex,
    scores: z.object({
      Wood: columnIndex,
      Fire: columnIndex,
      Earth: columnIndex,
      Metal: columnIndex,
      Water: columnIndex,
    }),
  }),
});

export type CsvImportInput = z.input<typeof csvImportSchema>;

export type CsvImportResult =
  | { ok: true; savedCount: number; skippedCount: number }
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

  const { teamId, fileName, fileText, mapping } = parsedInput.data;
  await requireTeamInOrg(teamId);

  const mappingProblems = describeMappingProblems(mapping);
  if (mappingProblems.length > 0) {
    return { ok: false, error: "The column mapping is incomplete.", issues: mappingProblems };
  }

  const rows = parseCsv(fileText);
  const members = await prisma.member.findMany({
    where: { teamId },
    select: { id: true, name: true },
  });

  const preview = resolveRows({ rows, mapping, members });

  if (preview.rows.length === 0) {
    return { ok: false, error: "That file has no data rows to import." };
  }
  if (preview.readyRows.length === 0) {
    return {
      ok: false,
      error: "No rows could be imported — every row still has a problem.",
      issues: preview.skippedRows.slice(0, 5).map((row) => `Row ${row.rowNumber}: ${row.issues[0]}`),
    };
  }

  await prisma.assessment.createMany({
    data: preview.readyRows.map((row) => {
      // resolveRows only clears a row's issues once it has both a unique
      // member match and five valid scores, so these are non-null here.
      const memberId = row.memberId!;
      const scores = row.scores!;
      return {
        memberId,
        source: AssessmentSource.CSV_UPLOAD,
        wood: scores.Wood,
        fire: scores.Fire,
        earth: scores.Earth,
        metal: scores.Metal,
        water: scores.Water,
        rawImportRef: `${fileName} row ${row.rowNumber}`,
      };
    }),
  });

  revalidateScoreViews(teamId);

  return {
    ok: true,
    savedCount: preview.readyRows.length,
    skippedCount: preview.skippedRows.length,
  };
}
