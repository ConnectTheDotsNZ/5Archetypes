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
  type MemberForMatching,
} from "@/lib/scoreIngestion";
import { saveCsvAssessments } from "@/app/admin/teams/[teamId]/scores/actions";

/**
 * Three-step CSV ingestion wizard: choose a file → map its columns → preview
 * every parsed row, then save.
 *
 * The file is parsed and validated here purely to render the preview; the
 * original file text and the chosen mapping are what get sent to
 * saveCsvAssessments, which re-runs the same shared validation server-side
 * before writing. Nothing is stored until the admin confirms the preview.
 */

type Step = "upload" | "map" | "preview";

const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "1. Choose file" },
  { id: "map", label: "2. Map columns" },
  { id: "preview", label: "3. Preview & save" },
];

const FIELD_LABELS: { key: "name" | Element; label: string }[] = [
  { key: "name", label: "Member name" },
  ...ELEMENTS.map((element) => ({ key: element, label: `${element} score` })),
];

export function CsvUploadWizard({
  teamId,
  teamName,
  members,
}: {
  teamId: string;
  teamName: string;
  members: MemberForMatching[];
}) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [fileText, setFileText] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<{ error: string; issues?: string[] } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const dataRows = useMemo(() => rows.filter((row) => !isBlankRow(row)), [rows]);
  const columnCount = useMemo(
    () => dataRows.reduce((max, row) => Math.max(max, row.length), 0),
    [dataRows]
  );

  /** First row that will actually be imported — used for the "e.g. …" hints. */
  const sampleRow = useMemo(() => {
    if (!mapping) return undefined;
    return mapping.hasHeaderRow ? dataRows[1] : dataRows[0];
  }, [dataRows, mapping]);

  const mappingProblems = useMemo(
    () => (mapping ? describeMappingProblems(mapping) : []),
    [mapping]
  );

  const preview = useMemo(
    () => (mapping ? resolveRows({ rows, mapping, members }) : null),
    [rows, mapping, members]
  );

  async function handleFileChange(file: File | undefined) {
    setFileError(null);
    setSaveError(null);
    if (!file) return;

    const text = await file.text();
    if (text.length > MAX_CSV_CHARS) {
      setFileError("That file is too large to import — export just this team's rows and retry.");
      return;
    }

    const parsed = parseCsv(text);
    const nonBlank = parsed.filter((row) => !isBlankRow(row));
    if (nonBlank.length === 0) {
      setFileError("That file has no rows in it.");
      return;
    }

    setFileName(file.name);
    setFileText(text);
    setRows(parsed);
    setMapping(guessMapping(nonBlank[0]));
    setStep("map");
  }

  function updateMapping(field: "name" | Element, columnIndex: number) {
    setMapping((current) =>
      !current
        ? current
        : field === "name"
          ? { ...current, name: columnIndex }
          : { ...current, scores: { ...current.scores, [field]: columnIndex } }
    );
  }

  async function handleSave() {
    if (!mapping || !preview || preview.readyRows.length === 0) return;
    setSaveError(null);
    setIsSaving(true);

    try {
      const result = await saveCsvAssessments({ teamId, fileName, fileText, mapping });
      if (!result.ok) {
        setSaveError({ error: result.error, issues: result.issues });
        return;
      }

      const skipped =
        result.skippedCount > 0 ? ` ${result.skippedCount} row(s) were skipped.` : "";
      const message = `Imported scores for ${result.savedCount} member(s) from ${fileName}.${skipped}`;
      router.push(`/admin/teams/${teamId}/scores?saved=${encodeURIComponent(message)}`);
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
    setFileError(null);
    setSaveError(null);
  }

  function columnLabel(index: number): string {
    const header = mapping?.hasHeaderRow ? dataRows[0]?.[index]?.trim() : "";
    const sample = sampleRow?.[index]?.trim();
    const base = header ? `Column ${index + 1} — ${header}` : `Column ${index + 1}`;
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
              One row per person, with a column for their name and one for each of the five element
              scores. Column order and header names don&apos;t matter — you&apos;ll map them next.
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
                Rows are matched to people already on <strong>{teamName}</strong> by name. Anyone not
                on the team yet is reported as a problem rather than created automatically — add them
                on the team page first.
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
              {fileName} · {dataRows.length} non-empty {dataRows.length === 1 ? "row" : "rows"} ·{" "}
              {columnCount} {columnCount === 1 ? "column" : "columns"}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mapping.hasHeaderRow}
              onChange={(event) =>
                setMapping({ ...mapping, hasHeaderRow: event.target.checked })
              }
              className="h-4 w-4 accent-gold"
            />
            <span className="font-semibold text-ink">First row contains column headers</span>
          </label>

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
            {FIELD_LABELS.map(({ key, label }) => {
              const value = key === "name" ? mapping.name : mapping.scores[key];
              return (
                <label key={key} className="block text-sm">
                  <span className="mb-1 block font-semibold text-ink">{label}</span>
                  <select
                    value={value}
                    onChange={(event) => updateMapping(key, Number(event.target.value))}
                    className="w-full rounded border border-blush px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  >
                    <option value={UNMAPPED}>— not mapped —</option>
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
                  · <span className="font-semibold text-fire">
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
                  <th className="p-2">Name in file</th>
                  <th className="p-2">Matched member</th>
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
                      <td className="p-2 text-muted">{row.rowNumber}</td>
                      <td className="p-2">{row.rawName || <span className="text-muted">—</span>}</td>
                      <td className="p-2">
                        {row.memberName ?? <span className="text-muted">not matched</span>}
                      </td>
                      {ELEMENTS.map((element) => (
                        <td key={element} className="p-2 text-right tabular-nums">
                          {row.scores ? (
                            row.scores[element].toFixed(3)
                          ) : (
                            <span className="text-fire">{row.cells[element].trim() || "—"}</span>
                          )}
                        </td>
                      ))}
                      <td className="p-2">
                        {isReady ? (
                          <span className="font-semibold text-wood">Ready</span>
                        ) : (
                          <ul className="list-disc space-y-0.5 pl-4 text-xs text-fire">
                            {row.issues.map((issue) => (
                              <li key={issue}>{issue}</li>
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
              Nothing can be imported yet — fix the problems above (or go back and change the column
              mapping) and preview again.
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
