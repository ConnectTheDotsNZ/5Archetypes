"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ELEMENTS, type Element } from "@/lib/archetypes";
import { isBlankRow, parseCsv } from "@/lib/csv";
import {
  MAX_CSV_CHARS,
  SCORE_SCALES,
  SCORE_SCALE_LABELS,
  UNMAPPED,
  describeMappingProblems,
  guessMapping,
  resolveRows,
  type ColumnMapping,
  type MatchBasis,
  type MemberForMatching,
} from "@/lib/scoreIngestion";
import { saveCsvAssessments } from "@/app/admin/teams/[teamId]/scores/actions";

/**
 * Three-step CSV ingestion wizard: choose a file → map its columns → preview
 * every parsed row, then save.
 *
 * The file is parsed and validated here purely to render the preview; the
 * original file text, the chosen mapping and any manual row assignments are
 * what get sent to saveCsvAssessments, which re-runs the same shared
 * validation server-side before writing. Nothing is stored until the admin
 * confirms the preview.
 */

type Step = "upload" | "map" | "preview";

const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "1. Choose file" },
  { id: "map", label: "2. Map columns" },
  { id: "preview", label: "3. Preview & save" },
];

type MappableField = "email" | "name" | Element;

const FIELDS: { key: MappableField; label: string; optional?: boolean }[] = [
  { key: "email", label: "Email", optional: true },
  { key: "name", label: "Member name", optional: true },
  ...ELEMENTS.map((element) => ({ key: element as MappableField, label: `${element} score` })),
];

const MATCH_LABELS: Record<MatchBasis, string> = {
  EMAIL: "by email",
  NAME: "by name",
  MANUAL: "chosen by you",
};

export function CsvUploadWizard({
  teamId,
  teamName,
  members,
  canRequestNotifications,
}: {
  teamId: string;
  teamName: string;
  members: MemberForMatching[];
  /** Only an org ADMIN may ask for member-facing email. */
  canRequestNotifications: boolean;
}) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [fileText, setFileText] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [notifyScoresReceived, setNotifyScoresReceived] = useState(false);
  const [sendReportWhenReady, setSendReportWhenReady] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<{ error: string; issues?: string[] } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const nonBlankRows = useMemo(() => rows.filter((row) => !isBlankRow(row)), [rows]);
  const columnCount = useMemo(
    () => rows.reduce((max, row) => Math.max(max, row.length), 0),
    [rows]
  );

  const headerCells = useMemo(
    () => (mapping?.headerRow ? rows[mapping.headerRow - 1] : undefined),
    [rows, mapping]
  );

  /** First row that will actually be imported — used for the "e.g. …" hints. */
  const sampleRow = useMemo(() => {
    if (!mapping) return undefined;
    return rows.find(
      (row, index) =>
        index + 1 >= mapping.firstDataRow && index + 1 !== mapping.headerRow && !isBlankRow(row)
    );
  }, [rows, mapping]);

  const mappingProblems = useMemo(
    () => (mapping ? describeMappingProblems(mapping) : []),
    [mapping]
  );

  const preview = useMemo(
    () => (mapping ? resolveRows({ rows, mapping, members, overrides }) : null),
    [rows, mapping, members, overrides]
  );

  const membersWithoutEmail = useMemo(() => {
    if (!preview) return 0;
    const emailById = new Map(members.map((member) => [member.id, member.email]));
    return preview.readyRows.filter((row) => !(emailById.get(row.memberId!) ?? "").trim()).length;
  }, [preview, members]);

  async function handleFileChange(file: File | undefined) {
    setFileError(null);
    setSaveError(null);
    if (!file) return;

    const text = await file.text();
    if (text.length > MAX_CSV_CHARS) {
      setFileError("That file is too large to import. Export just this team's rows and retry.");
      return;
    }

    const parsed = parseCsv(text);
    if (parsed.every((row) => isBlankRow(row))) {
      setFileError("That file has no rows in it.");
      return;
    }

    setFileName(file.name);
    setFileText(text);
    setRows(parsed);
    setMapping(guessMapping(parsed));
    setOverrides({});
    setStep("map");
  }

  function updateMapping(field: MappableField, columnIndex: number) {
    setMapping((current) => {
      if (!current) return current;
      if (field === "email") return { ...current, email: columnIndex };
      if (field === "name") return { ...current, name: columnIndex };
      return { ...current, scores: { ...current.scores, [field]: columnIndex } };
    });
  }

  async function handleSave() {
    if (!mapping || !preview || preview.readyRows.length === 0) return;
    setSaveError(null);
    setIsSaving(true);

    try {
      const result = await saveCsvAssessments({
        teamId,
        fileName,
        fileText,
        mapping,
        overrides: Object.fromEntries(
          Object.entries(overrides).map(([rowNumber, memberId]) => [String(rowNumber), memberId])
        ),
        notifications: { notifyScoresReceived, sendReportWhenReady },
      });
      if (!result.ok) {
        setSaveError({ error: result.error, issues: result.issues });
        return;
      }

      const parts = [`Imported scores for ${result.savedCount} member(s) from ${fileName}.`];
      if (result.skippedCount > 0) parts.push(`${result.skippedCount} row(s) were skipped.`);
      if (result.queued > 0) parts.push(`${result.queued} notification(s) queued.`);
      if (result.skippedNoEmail > 0) {
        parts.push(`${result.skippedNoEmail} had no email on file, so nothing was queued for them.`);
      }
      router.push(`/admin/teams/${teamId}/scores?saved=${encodeURIComponent(parts.join(" "))}`);
    } catch {
      setSaveError({ error: "Something went wrong saving those scores. Please try again." });
    } finally {
      setIsSaving(false);
    }
  }

  function restart() {
    setStep("upload");
    setFileName("");
    setFileText("");
    setRows([]);
    setMapping(null);
    setOverrides({});
    setFileError(null);
    setSaveError(null);
  }

  function columnLabel(index: number): string {
    const header = headerCells?.[index]?.trim();
    const sample = sampleRow?.[index]?.trim();
    const base = header ? `Column ${index + 1}: ${header}` : `Column ${index + 1}`;
    return sample ? `${base} (e.g. ${sample})` : base;
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2 text-sm">
        {STEPS.map((entry) => {
          const isCurrent = entry.id === step;
          return (
            <li
              key={entry.id}
              className={`rounded border px-3 py-1 font-semibold ${
                isCurrent ? "border-gold bg-gold/10 text-gold" : "border-blush text-muted"
              }`}
            >
              {entry.label}
            </li>
          );
        })}
      </ol>

      {step === "upload" && (
        <div className="space-y-4 rounded-lg border border-blush bg-white p-4">
          <div>
            <h2 className="font-display text-lg font-bold">Choose a CSV file</h2>
            <p className="mt-1 text-sm text-muted">
              One row per person, with a column for their email and/or name and one for each of the
              five element scores. Column order, header names and any title rows above the headers
              don&apos;t matter. You&apos;ll confirm all of that next.
            </p>
          </div>

          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(event) => void handleFileChange(event.target.files?.[0])}
            className="block w-full rounded border border-blush px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-gold file:px-3 file:py-1 file:text-sm file:font-semibold file:text-white"
          />

          {fileError && (
            <p className="rounded border border-fire/30 bg-fire/10 p-3 text-sm text-fire">
              {fileError}
            </p>
          )}

          <div className="rounded border border-blush bg-cream p-3 text-sm text-muted">
            <p className="font-semibold text-ink">Two things to know</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                Rows are matched to people already on <strong>{teamName}</strong>, by email first,
                falling back to name. Nobody is created automatically; you can assign an unmatched
                row to the right person in the preview, or add them to the team first.
              </li>
              <li>
                Scores are stored exactly as supplied. The platform doesn&apos;t compute or rescale
                them, so upload the scores the assessment produced.
              </li>
            </ul>
          </div>
        </div>
      )}

      {step === "map" && mapping && (
        <div className="space-y-4 rounded-lg border border-blush bg-white p-4">
          <div>
            <h2 className="font-display text-lg font-bold">Map the columns</h2>
            <p className="mt-1 text-sm text-muted">
              {fileName} · {nonBlankRows.length} non-empty{" "}
              {nonBlankRows.length === 1 ? "row" : "rows"} · {columnCount}{" "}
              {columnCount === 1 ? "column" : "columns"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-ink">Header row</span>
              <select
                value={mapping.headerRow ?? UNMAPPED}
                onChange={(event) => {
                  const headerRow = Number(event.target.value);
                  setMapping({
                    ...mapping,
                    headerRow: headerRow === UNMAPPED ? null : headerRow,
                    firstDataRow:
                      headerRow === UNMAPPED ? mapping.firstDataRow : Math.max(headerRow + 1, 1),
                  });
                }}
                className="w-full rounded border border-blush px-3 py-2 text-sm focus:border-gold focus:outline-none"
              >
                <option value={UNMAPPED}>No header row</option>
                {rows.slice(0, 10).map((row, index) => (
                  <option key={index} value={index + 1}>
                    Row {index + 1}
                    {row.some((cell) => cell.trim())
                      ? `: ${row
                          .filter((cell) => cell.trim())
                          .slice(0, 4)
                          .join(", ")
                          .slice(0, 60)}`
                      : " (empty)"}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-ink">First row of member data</span>
              <input
                type="number"
                min={1}
                value={mapping.firstDataRow}
                onChange={(event) =>
                  setMapping({
                    ...mapping,
                    firstDataRow: Math.max(1, Number(event.target.value) || 1),
                  })
                }
                className="w-full rounded border border-blush px-3 py-2 text-sm tabular-nums focus:border-gold focus:outline-none"
              />
              <span className="mt-1 block text-xs text-muted">
                Skips report titles or notes above the data.
              </span>
            </label>
          </div>

          <label className="block max-w-md text-sm">
            <span className="mb-1 block font-semibold text-ink">Score format</span>
            <select
              value={mapping.scale}
              onChange={(event) =>
                setMapping({ ...mapping, scale: event.target.value as ColumnMapping["scale"] })
              }
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
            {FIELDS.map(({ key, label, optional }) => {
              const value =
                key === "email" ? mapping.email : key === "name" ? mapping.name : mapping.scores[key];
              return (
                <label key={key} className="block text-sm">
                  <span className="mb-1 block font-semibold text-ink">
                    {label}
                    {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
                  </span>
                  <select
                    value={value}
                    onChange={(event) => updateMapping(key, Number(event.target.value))}
                    className="w-full rounded border border-blush px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  >
                    <option value={UNMAPPED}>(not mapped)</option>
                    {Array.from({ length: columnCount }, (_, index) => (
                      <option key={index} value={index}>
                        {columnLabel(index)}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>

          {mappingProblems.length > 0 && (
            <ul className="list-disc space-y-1 rounded border border-fire/30 bg-fire/10 p-3 pl-8 text-sm text-fire">
              {mappingProblems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep("preview")}
              disabled={mappingProblems.length > 0}
              className="rounded bg-gold px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Preview rows
            </button>
            <button
              type="button"
              onClick={restart}
              className="text-sm font-semibold text-muted hover:underline"
            >
              Choose a different file
            </button>
          </div>
        </div>
      )}

      {step === "preview" && mapping && preview && (
        <div className="space-y-4 rounded-lg border border-blush bg-white p-4">
          <div>
            <h2 className="font-display text-lg font-bold">Preview</h2>
            <p className="mt-1 text-sm text-muted">
              {preview.readyRows.length} of {preview.rows.length}{" "}
              {preview.rows.length === 1 ? "row" : "rows"} ready to import
              {preview.skippedRows.length > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-semibold text-fire">
                    {preview.skippedRows.length} with problems, which will be skipped
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-blush text-left">
                  <th className="p-2">Row</th>
                  <th className="p-2">In file</th>
                  <th className="p-2">Member</th>
                  {ELEMENTS.map((element) => (
                    <th key={element} className="p-2 text-right">
                      {element}
                    </th>
                  ))}
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => {
                  const isReady = row.issues.length === 0;
                  return (
                    <tr
                      key={row.rowNumber}
                      className={`border-b border-blush last:border-0 ${isReady ? "" : "bg-fire/5"}`}
                    >
                      <td className="p-2 align-top text-muted">{row.rowNumber}</td>
                      <td className="p-2 align-top">
                        {row.rawName || row.rawEmail ? (
                          <>
                            {row.rawName && <span className="block">{row.rawName}</span>}
                            {row.rawEmail && (
                              <span className="block text-xs text-muted">{row.rawEmail}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted">(none)</span>
                        )}
                      </td>
                      <td className="p-2 align-top">
                        {row.memberName ? (
                          <>
                            <span className="block font-semibold">{row.memberName}</span>
                            {row.matchedBy && (
                              <span className="block text-xs text-muted">
                                {MATCH_LABELS[row.matchedBy]}
                              </span>
                            )}
                          </>
                        ) : (
                          <select
                            value={overrides[row.rowNumber] ?? ""}
                            onChange={(event) =>
                              setOverrides((current) => {
                                const next = { ...current };
                                if (event.target.value === "") delete next[row.rowNumber];
                                else next[row.rowNumber] = event.target.value;
                                return next;
                              })
                            }
                            className="w-40 rounded border border-blush px-2 py-1 text-xs focus:border-gold focus:outline-none"
                          >
                            <option value="">(pick a person)</option>
                            {members.map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      {ELEMENTS.map((element) => (
                        <td key={element} className="p-2 align-top text-right tabular-nums">
                          {row.scores ? (
                            row.scores[element].toFixed(3)
                          ) : (
                            <span className="text-fire">{row.cells[element].trim() || "(none)"}</span>
                          )}
                        </td>
                      ))}
                      <td className="p-2 align-top">
                        {isReady && <span className="font-semibold text-wood">Ready</span>}
                        {row.issues.length > 0 && (
                          <ul className="list-disc space-y-0.5 pl-4 text-xs text-fire">
                            {row.issues.map((issue) => (
                              <li key={issue}>{issue}</li>
                            ))}
                          </ul>
                        )}
                        {row.warnings.length > 0 && (
                          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted">
                            {row.warnings.map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {canRequestNotifications && (
            <fieldset className="rounded border border-blush bg-cream p-3 text-sm">
              <legend className="px-1 font-semibold text-ink">Tell these people (optional)</legend>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={notifyScoresReceived}
                  onChange={(event) => setNotifyScoresReceived(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-gold"
                />
                <span>Let each person know their scores have been recorded</span>
              </label>
              <label className="mt-2 flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={sendReportWhenReady}
                  onChange={(event) => setSendReportWhenReady(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-gold"
                />
                <span>Email each person their own report once one is generated</span>
              </label>
              <p className="mt-2 text-xs text-muted">
                Requests are recorded against each person now and sent once report generation and an
                email provider are in place. Nothing is emailed today.
                {membersWithoutEmail > 0 && (
                  <>
                    {" "}
                    {membersWithoutEmail} of the matched people have no email on file and will be
                    skipped.
                  </>
                )}
              </p>
            </fieldset>
          )}

          {saveError && (
            <div className="rounded border border-fire/30 bg-fire/10 p-3 text-sm text-fire">
              <p className="font-semibold">{saveError.error}</p>
              {saveError.issues && saveError.issues.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {saveError.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving || preview.readyRows.length === 0}
              className="rounded bg-gold px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSaving
                ? "Importing…"
                : `Import ${preview.readyRows.length} ${
                    preview.readyRows.length === 1 ? "row" : "rows"
                  }`}
            </button>
            <button
              type="button"
              onClick={() => setStep("map")}
              disabled={isSaving}
              className="text-sm font-semibold text-gold hover:underline disabled:opacity-40"
            >
              Back to mapping
            </button>
            <button
              type="button"
              onClick={restart}
              disabled={isSaving}
              className="text-sm font-semibold text-muted hover:underline disabled:opacity-40"
            >
              Start over
            </button>
          </div>

          {preview.readyRows.length === 0 && (
            <p className="text-sm text-muted">
              Nothing can be imported yet. Assign the unmatched rows above, fix the values, or go
              back and change the column mapping.
            </p>
          )}
        </div>
      )}

      <p className="text-sm">
        <Link
          href={`/admin/teams/${teamId}/scores`}
          className="font-semibold text-muted hover:underline"
        >
          ← Back to scores
        </Link>
      </p>
    </div>
  );
}
