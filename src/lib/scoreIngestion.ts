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
 *
 * Both units occur in practice: Carey's platform reports an individual's
 * results as percentages ("Earth: 85.5%"), while the client-side company
 * record of the same scores keeps 0–1 decimals ("0.855").
 */
export const SCORE_SCALES = ["DECIMAL_0_1", "PERCENT_0_100"] as const;
export type ScoreScale = (typeof SCORE_SCALES)[number];

export const SCORE_SCALE_LABELS: Record<ScoreScale, string> = {
  DECIMAL_0_1: "Decimals from 0 to 1 (e.g. 0.855)",
  PERCENT_0_100: "Percentages from 0 to 100 (e.g. 85.5 or 85.5%)",
};

/** Column index meaning "the admin hasn't mapped this field yet". */
export const UNMAPPED = -1;

/**
 * Upload ceiling, shared by the wizard's client-side check and the server
 * action. Ingestion files are team-sized (one row per member), so this is
 * generous — it exists to stop a 50MB paste reaching the action.
 */
export const MAX_CSV_CHARS = 512 * 1024;

/** How many leading rows guessMapping() will consider as the header row. */
const HEADER_SEARCH_DEPTH = 10;

export type ColumnMapping = {
  /** 1-based row holding column headers, or null when the file has none. */
  headerRow: number | null;
  /**
   * 1-based row where member data starts. Real exports often carry a title
   * and a blank line above the header row, so this can't be assumed to be 2.
   */
  firstDataRow: number;
  scale: ScoreScale;
  /**
   * Column holding the member's email — the preferred match key, since a
   * team can hold two people with the same name but not the same address.
   * May be UNMAPPED: exports produced for humans often omit it.
   */
  email: number;
  /** Column holding the member's name. Used to match when email is absent. */
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

const NAME_HEADER_HINTS = ["name", "member", "employee", "person", "team", "staff"];
const EMAIL_HEADER_HINTS = ["email", "e-mail", "mail address"];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

/** First column matching a hint that no other field has claimed. Exact header match wins. */
function findColumn(headers: string[], hints: string[], taken: Set<number>): number {
  const pick = (predicate: (header: string) => boolean): number => {
    for (let index = 0; index < headers.length; index++) {
      if (taken.has(index)) continue;
      if (predicate(headers[index])) return index;
    }
    return UNMAPPED;
  };

  const exact = pick((header) => hints.includes(header));
  const found =
    exact !== UNMAPPED ? exact : pick((header) => hints.some((hint) => header.includes(hint)));
  if (found !== UNMAPPED) taken.add(found);
  return found;
}

/** Maps one candidate header row, without deciding whether it *is* the header row. */
function mapHeaderRow(row: string[]): Omit<ColumnMapping, "headerRow" | "firstDataRow" | "scale"> {
  const headers = row.map(normalizeHeader);
  const taken = new Set<number>();

  // Elements first: they're the least ambiguous, and claiming them stops a
  // header like "Water source" being taken as the name column.
  const scores = {} as Record<Element, number>;
  for (const element of ELEMENTS) {
    scores[element] = findColumn(headers, [element.toLowerCase()], taken);
  }

  const email = findColumn(headers, EMAIL_HEADER_HINTS, taken);
  const name = findColumn(headers, NAME_HEADER_HINTS, taken);

  return { email, name, scores };
}

function countMapped(mapped: ReturnType<typeof mapHeaderRow>): number {
  return (
    ELEMENTS.filter((element) => mapped.scores[element] !== UNMAPPED).length +
    (mapped.email !== UNMAPPED ? 1 : 0) +
    (mapped.name !== UNMAPPED ? 1 : 0)
  );
}

/**
 * Best-effort auto-mapping, so the common case needs no clicks.
 *
 * Scans the leading rows rather than assuming row 1 holds the headers: real
 * exports routinely carry a report title and a blank line above them (the
 * sample company record has its header on row 3). Everything guessed here is
 * shown back to the admin for confirmation on the mapping step — never
 * applied blind, which is what makes the positional fallback safe.
 */
export function guessMapping(rows: string[][]): ColumnMapping {
  let bestRow = -1;
  let best: ReturnType<typeof mapHeaderRow> | null = null;
  let bestScore = 0;

  const depth = Math.min(rows.length, HEADER_SEARCH_DEPTH);
  for (let index = 0; index < depth; index++) {
    if (isBlankRow(rows[index])) continue;
    const mapped = mapHeaderRow(rows[index]);
    const score = countMapped(mapped);
    if (score > bestScore) {
      bestRow = index;
      best = mapped;
      bestScore = score;
    }
  }

  if (best && bestScore > 0) {
    return {
      headerRow: bestRow + 1,
      firstDataRow: bestRow + 2,
      scale: "DECIMAL_0_1",
      ...best,
    };
  }

  // Nothing matched by text: most likely a headerless export, so fall back to
  // this file's own column order (name first, then ELEMENTS order). Element
  // order genuinely varies between real exports, so this is a starting point
  // for the admin to correct, not a convention we rely on.
  const firstNonBlank = rows.findIndex((row) => !isBlankRow(row));
  const columns = firstNonBlank >= 0 ? rows[firstNonBlank].length : 0;
  if (columns >= ELEMENTS.length + 1) {
    return {
      headerRow: null,
      firstDataRow: firstNonBlank + 1,
      scale: "DECIMAL_0_1",
      email: UNMAPPED,
      name: 0,
      scores: Object.fromEntries(ELEMENTS.map((element, index) => [element, index + 1])) as Record<
        Element,
        number
      >,
    };
  }

  return {
    headerRow: null,
    firstDataRow: Math.max(firstNonBlank + 1, 1),
    scale: "DECIMAL_0_1",
    email: UNMAPPED,
    name: UNMAPPED,
    scores: Object.fromEntries(ELEMENTS.map((element) => [element, UNMAPPED])) as Record<
      Element,
      number
    >,
  };
}

/** Problems that must be fixed on the mapping step before a preview makes sense. */
export function describeMappingProblems(mapping: ColumnMapping): string[] {
  const problems: string[] = [];

  const unmappedElements = ELEMENTS.filter((element) => mapping.scores[element] === UNMAPPED);
  if (unmappedElements.length > 0) {
    problems.push(`Choose a column for: ${unmappedElements.join(", ")}.`);
  }

  if (mapping.email === UNMAPPED && mapping.name === UNMAPPED) {
    problems.push("Choose an email column, a name column, or both: rows are matched on those.");
  }

  if (!Number.isInteger(mapping.firstDataRow) || mapping.firstDataRow < 1) {
    problems.push("The first data row must be row 1 or later.");
  }

  const assignments: { field: string; index: number }[] = [
    { field: "Email", index: mapping.email },
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

export type MemberForMatching = { id: string; name: string; email: string | null };

/** How a row found its member — surfaced in the preview so matching is never a black box. */
export type MatchBasis = "EMAIL" | "NAME" | "MANUAL";

export type ResolvedRow = {
  /** 1-based position in the file, so messages line up with what the admin sees in Excel. */
  rowNumber: number;
  rawName: string;
  rawEmail: string;
  /** Raw cell text per element, kept for the preview table. */
  cells: Record<Element, string>;
  memberId: string | null;
  memberName: string | null;
  matchedBy: MatchBasis | null;
  scores: ScoreProfile | null;
  /** Empty means the row is ready to import. */
  issues: string[];
  /** Worth the admin's eye, but not blocking. */
  warnings: string[];
};

export type IngestionPreview = {
  rows: ResolvedRow[];
  readyRows: ResolvedRow[];
  skippedRows: ResolvedRow[];
  /** Rows the admin could still rescue by assigning a member by hand. */
  unmatchedRows: ResolvedRow[];
};

/** Loose name matching: case- and whitespace-insensitive, nothing cleverer. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildIndex<T>(items: T[], key: (item: T) => string | null): Map<string, T[]> {
  const index = new Map<string, T[]>();
  for (const item of items) {
    const value = key(item);
    if (!value) continue;
    index.set(value, [...(index.get(value) ?? []), item]);
  }
  return index;
}

/**
 * Resolves parsed CSV rows against the team's existing members.
 *
 * Matching prefers the email column and falls back to the name column, since
 * score exports built for humans often carry first names only ("Anna") while
 * the platform holds full names. Rows are never allowed to create a member:
 * ingestion is about scores, and silently inventing people from a typo'd
 * spreadsheet is worse than making the admin resolve it. `overrides` is how
 * an admin resolves one explicitly, by picking the member in the preview.
 */
export function resolveRows({
  rows,
  mapping,
  members,
  overrides = {},
}: {
  rows: string[][];
  mapping: ColumnMapping;
  members: MemberForMatching[];
  /** rowNumber -> memberId, from the preview's per-row member picker. */
  overrides?: Record<number, string>;
}): IngestionPreview {
  const byEmail = buildIndex(members, (member) =>
    member.email ? normalizeEmail(member.email) : null
  );
  const byName = buildIndex(members, (member) => normalizeName(member.name));
  const byId = new Map(members.map((member) => [member.id, member]));

  const dataRows = rows
    .map((cells, index) => ({ cells, rowNumber: index + 1 }))
    .filter((row) => row.rowNumber >= mapping.firstDataRow)
    .filter((row) => row.rowNumber !== mapping.headerRow)
    .filter((row) => !isBlankRow(row.cells));

  /** memberId -> the first row number that claimed it, for duplicate detection. */
  const claimedBy = new Map<string, number>();
  const resolved: ResolvedRow[] = [];

  for (const { cells, rowNumber } of dataRows) {
    const issues: string[] = [];
    const warnings: string[] = [];
    const rawName = (cells[mapping.name] ?? "").trim();
    const rawEmail = (cells[mapping.email] ?? "").trim();

    const elementCells = Object.fromEntries(
      ELEMENTS.map((element) => [element, cells[mapping.scores[element]] ?? ""])
    ) as Record<Element, string>;

    let member: MemberForMatching | null = null;
    let matchedBy: MatchBasis | null = null;

    const override = overrides[rowNumber];
    if (override) {
      const overridden = byId.get(override);
      if (overridden) {
        member = overridden;
        matchedBy = "MANUAL";
      } else {
        issues.push("The person chosen for this row is no longer on this team.");
      }
    }

    let emailLookupFailed = false;
    if (!member && rawEmail !== "") {
      const matches = byEmail.get(normalizeEmail(rawEmail)) ?? [];
      if (matches.length === 1) {
        member = matches[0];
        matchedBy = "EMAIL";
      } else if (matches.length > 1) {
        issues.push(`More than one member on this team uses the email “${rawEmail}”.`);
      } else {
        emailLookupFailed = true;
      }
    }

    if (!member && matchedBy === null && issues.length === 0 && rawName !== "") {
      const matches = byName.get(normalizeName(rawName)) ?? [];
      if (matches.length === 1) {
        member = matches[0];
        matchedBy = "NAME";
      } else if (matches.length > 1) {
        issues.push(
          `More than one member on this team is named “${rawName}”. Map an email column, or pick the right person below.`
        );
      }
    }

    if (!member && issues.length === 0) {
      const identifier = rawEmail || rawName;
      issues.push(
        identifier === ""
          ? "This row has no name or email to match on."
          : `No member on this team matches “${identifier}”. Pick the right person below, or add them to the team first.`
      );
    }

    // Matched on something other than the email in the file — often a personal
    // address in the export vs a work address on the record. Worth showing.
    if (member && emailLookupFailed) {
      warnings.push(`“${rawEmail}” isn’t on ${member.name}’s record. Matched another way.`);
    }

    // A name that disagrees with the matched member is worth flagging without
    // blocking: "Anna" vs "Anna Cherkashina" is fine, a different person isn't.
    if (member && matchedBy !== "NAME" && rawName !== "") {
      const memberName = normalizeName(member.name);
      const rowName = normalizeName(rawName);
      if (memberName !== rowName && !memberName.startsWith(`${rowName} `)) {
        warnings.push(`File says “${rawName}”, matched to ${member.name}.`);
      }
    }

    const parsedScores = parseScoreProfileCells(elementCells, mapping.scale);
    if (!parsedScores.ok) issues.push(...parsedScores.issues);

    if (member) {
      const firstClaim = claimedBy.get(member.id);
      if (firstClaim !== undefined) {
        issues.push(`Duplicate: row ${firstClaim} already has scores for ${member.name}.`);
      } else if (issues.length === 0) {
        claimedBy.set(member.id, rowNumber);
      }
    }

    resolved.push({
      rowNumber,
      rawName,
      rawEmail,
      cells: elementCells,
      memberId: member?.id ?? null,
      memberName: member?.name ?? null,
      matchedBy,
      scores: parsedScores.ok ? parsedScores.scores : null,
      issues,
      warnings,
    });
  }

  return {
    rows: resolved,
    readyRows: resolved.filter((row) => row.issues.length === 0),
    skippedRows: resolved.filter((row) => row.issues.length > 0),
    unmatchedRows: resolved.filter((row) => row.memberId === null),
  };
}
