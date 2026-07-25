/**
 * Validation + column-mapping logic for assessment score ingestion (CSV
 * upload and manual entry).
 *
 * IMPORTANT (docs/BUILD_PLAN.md Section 11, item 1): nothing in here derives
 * scores from raw assessment answers. The five element scores arrive
 * already computed and are treated as an opaque input — this module only
 * checks that what arrived is a well-formed number in the expected range,
 * and converts between the two units an admin can explicitly declare
 * (0–1 decimal, or 0–100 percent). Do not grow this file into a scoring
 * algorithm before Carey confirms one.
 *
 * Pure functions only, no DB and no React: the CSV wizard runs these on the
 * client to render its preview, and the server action runs the same
 * functions over the same file text as the authoritative check before
 * writing. Keep it isomorphic.
 */

import { ELEMENTS, type Element, type ScoreProfile } from "./archetypes";
import { isBlankRow } from "./csv";

/**
 * The unit the numbers in the file/form are expressed in. This is an
 * explicit admin declaration in the wizard, never inferred from the data —
 * guessing between "0.42" and "42" silently would be a scoring assumption,
 * which is exactly what we're not allowed to make yet.
 */
export const SCORE_SCALES = ["DECIMAL_0_1", "PERCENT_0_100"] as const;
export type ScoreScale = (typeof SCORE_SCALES)[number];

export const SCORE_SCALE_LABELS: Record<ScoreScale, string> = {
  DECIMAL_0_1: "Decimals from 0 to 1 (e.g. 0.42)",
  PERCENT_0_100: "Percentages from 0 to 100 (e.g. 42 or 42%)",
};

/** Column index meaning "the admin hasn't mapped this field yet". */
export const UNMAPPED = -1;

/**
 * Upload ceiling, shared by the wizard's client-side check and the server
 * action. Ingestion files are team-sized (one row per member), so this is
 * generous — it exists to stop a 50MB paste reaching the action.
 */
export const MAX_CSV_CHARS = 512 * 1024;

export type ColumnMapping = {
  /** Whether row 1 of the file holds column headers rather than data. */
  hasHeaderRow: boolean;
  scale: ScoreScale;
  /** Column index holding the member name. */
  name: number;
  /** Column index per element. */
  scores: Record<Element, number>;
};

export type ScoreCellResult = { ok: true; value: number } | { ok: false; error: string };

/** Strict numeric literal: rejects "12abc", "NaN", "Infinity", "0x1", "". */
const NUMERIC = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;

/**
 * Normalises to 4 decimal places. Scores are displayed to 3dp, so this is
 * below display precision; its real job is keeping percent→decimal division
 * from storing float artefacts like 0.28000000000000003.
 */
function normalizeScore(value: number): number {
  return Number(value.toFixed(4));
}

/**
 * Parses one score cell. Accepts a trailing "%" (which pins the unit for
 * that cell regardless of the declared scale) and a decimal comma, which is
 * what Excel writes in EU locales alongside a semicolon delimiter.
 */
export function parseScoreCell(raw: string, scale: ScoreScale): ScoreCellResult {
  const text = raw.trim();
  if (text === "") return { ok: false, error: "missing value" };

  const hasPercentSign = text.endsWith("%");
  let numericText = (hasPercentSign ? text.slice(0, -1) : text).trim();

  // A lone comma with no dot is a decimal separator ("0,42"), not a
  // thousands separator — scores never reach 1,000.
  if (!numericText.includes(".") && (numericText.match(/,/g)?.length ?? 0) === 1) {
    numericText = numericText.replace(",", ".");
  }

  if (!NUMERIC.test(numericText)) {
    return { ok: false, error: `“${text}” is not a number` };
  }

  const parsed = Number(numericText);
  const isPercent = hasPercentSign || scale === "PERCENT_0_100";
  const max = isPercent ? 100 : 1;

  if (parsed < 0 || parsed > max) {
    return { ok: false, error: `“${text}” is outside the expected 0–${max} range` };
  }

  return { ok: true, value: normalizeScore(isPercent ? parsed / 100 : parsed) };
}

export type ScoreProfileResult =
  | { ok: true; scores: ScoreProfile }
  | { ok: false; issues: string[] };

/** Parses all five element cells, collecting every problem rather than stopping at the first. */
export function parseScoreProfileCells(
  cells: Record<Element, string>,
  scale: ScoreScale
): ScoreProfileResult {
  const scores = {} as ScoreProfile;
  const issues: string[] = [];

  for (const element of ELEMENTS) {
    const result = parseScoreCell(cells[element] ?? "", scale);
    if (result.ok) {
      scores[element] = result.value;
    } else {
      issues.push(`${element}: ${result.error}`);
    }
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true, scores };
}

// --- Column mapping -------------------------------------------------------

const NAME_HEADER_HINTS = ["name", "member", "employee", "person", "team member", "full name"];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

/**
 * Best-effort auto-mapping from the file's first row, so the common case
 * ("Name, Wood, Fire, Earth, Metal, Water") needs no clicks. Always shown
 * back to the admin for confirmation on the mapping step — never applied
 * blind, which is what makes the positional fallback below safe.
 */
export function guessMapping(firstRow: string[]): ColumnMapping {
  const headers = firstRow.map(normalizeHeader);
  const taken = new Set<number>();

  const claim = (index: number): number => {
    if (index < 0 || taken.has(index)) return UNMAPPED;
    taken.add(index);
    return index;
  };

  const scores = {} as Record<Element, number>;
  for (const element of ELEMENTS) {
    const needle = element.toLowerCase();
    const exact = headers.findIndex((h) => h === needle);
    const partial = exact >= 0 ? exact : headers.findIndex((h) => h.includes(needle));
    scores[element] = claim(partial);
  }

  const nameExact = headers.findIndex((h) => NAME_HEADER_HINTS.includes(h));
  const nameIndex =
    nameExact >= 0
      ? nameExact
      : headers.findIndex((h) => NAME_HEADER_HINTS.some((hint) => h.includes(hint)));

  const mapping: ColumnMapping = {
    hasHeaderRow: true,
    scale: "DECIMAL_0_1",
    name: claim(nameIndex),
    scores,
  };

  // Nothing matched by text: most likely a headerless export, so fall back to
  // this file's own column order (name first, then ELEMENTS order). A wrong
  // guess costs the admin a couple of dropdowns on the mapping step.
  const matchedNothing =
    mapping.name === UNMAPPED && ELEMENTS.every((element) => mapping.scores[element] === UNMAPPED);
  if (matchedNothing && firstRow.length >= ELEMENTS.length + 1) {
    return {
      hasHeaderRow: false,
      scale: "DECIMAL_0_1",
      name: 0,
      scores: Object.fromEntries(
        ELEMENTS.map((element, index) => [element, index + 1])
      ) as Record<Element, number>,
    };
  }

  return mapping;
}

/** Problems that must be fixed on the mapping step before a preview makes sense. */
export function describeMappingProblems(mapping: ColumnMapping): string[] {
  const problems: string[] = [];

  const unmapped = [
    ...(mapping.name === UNMAPPED ? ["Member name"] : []),
    ...ELEMENTS.filter((element) => mapping.scores[element] === UNMAPPED),
  ];
  if (unmapped.length > 0) {
    problems.push(`Choose a column for: ${unmapped.join(", ")}.`);
  }

  const assignments: { field: string; index: number }[] = [
    { field: "Member name", index: mapping.name },
    ...ELEMENTS.map((element) => ({ field: element, index: mapping.scores[element] })),
  ].filter((entry) => entry.index !== UNMAPPED);

  const byIndex = new Map<number, string[]>();
  for (const { field, index } of assignments) {
    byIndex.set(index, [...(byIndex.get(index) ?? []), field]);
  }
  for (const [index, fields] of byIndex) {
    if (fields.length > 1) {
      problems.push(`Column ${index + 1} is mapped to more than one field: ${fields.join(", ")}.`);
    }
  }

  return problems;
}

// --- Row resolution -------------------------------------------------------

export type MemberForMatching = { id: string; name: string };

export type ResolvedRow = {
  /** 1-based position in the file, so messages line up with what the admin sees in Excel. */
  rowNumber: number;
  rawName: string;
  /** Raw cell text per element, kept for the preview table. */
  cells: Record<Element, string>;
  memberId: string | null;
  memberName: string | null;
  scores: ScoreProfile | null;
  /** Empty means the row is ready to import. */
  issues: string[];
};

export type IngestionPreview = {
  rows: ResolvedRow[];
  readyRows: ResolvedRow[];
  skippedRows: ResolvedRow[];
};

/** Loose name matching: case- and whitespace-insensitive, nothing cleverer. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildNameIndex(members: MemberForMatching[]): Map<string, MemberForMatching[]> {
  const index = new Map<string, MemberForMatching[]>();
  for (const member of members) {
    const key = normalizeName(member.name);
    index.set(key, [...(index.get(key) ?? []), member]);
  }
  return index;
}

/**
 * Resolves parsed CSV rows against the team's existing members.
 *
 * Rows are matched to members by name and are never allowed to create a
 * member: ingestion is about scores, and silently inventing people from a
 * typo'd spreadsheet is worse than making the admin add them explicitly on
 * the team page.
 */
export function resolveRows({
  rows,
  mapping,
  members,
}: {
  rows: string[][];
  mapping: ColumnMapping;
  members: MemberForMatching[];
}): IngestionPreview {
  const nameIndex = buildNameIndex(members);
  const dataRows = rows
    .map((cells, index) => ({ cells, rowNumber: index + 1 }))
    .filter((row) => !isBlankRow(row.cells))
    .filter((row) => !(mapping.hasHeaderRow && row.rowNumber === 1));

  /** memberId -> the first row number that claimed it, for duplicate detection. */
  const claimedBy = new Map<string, number>();
  const resolved: ResolvedRow[] = [];

  for (const { cells, rowNumber } of dataRows) {
    const issues: string[] = [];
    const rawName = (cells[mapping.name] ?? "").trim();

    const elementCells = Object.fromEntries(
      ELEMENTS.map((element) => [element, cells[mapping.scores[element]] ?? ""])
    ) as Record<Element, string>;

    let memberId: string | null = null;
    let memberName: string | null = null;

    if (rawName === "") {
      issues.push("Member name is empty.");
    } else {
      const matches = nameIndex.get(normalizeName(rawName)) ?? [];
      if (matches.length === 0) {
        issues.push(
          `No member on this team is named “${rawName}” — add them to the team first, then re-upload.`
        );
      } else if (matches.length > 1) {
        issues.push(
          `More than one member on this team is named “${rawName}” — rename one of them so this row can be matched.`
        );
      } else {
        memberId = matches[0].id;
        memberName = matches[0].name;
      }
    }

    const parsedScores = parseScoreProfileCells(elementCells, mapping.scale);
    if (!parsedScores.ok) issues.push(...parsedScores.issues);

    if (memberId) {
      const firstClaim = claimedBy.get(memberId);
      if (firstClaim !== undefined) {
        issues.push(`Duplicate — row ${firstClaim} already has scores for ${memberName}.`);
      } else if (issues.length === 0) {
        claimedBy.set(memberId, rowNumber);
      }
    }

    resolved.push({
      rowNumber,
      rawName,
      cells: elementCells,
      memberId,
      memberName,
      scores: parsedScores.ok ? parsedScores.scores : null,
      issues,
    });
  }

  return {
    rows: resolved,
    readyRows: resolved.filter((row) => row.issues.length === 0),
    skippedRows: resolved.filter((row) => row.issues.length > 0),
  };
}
