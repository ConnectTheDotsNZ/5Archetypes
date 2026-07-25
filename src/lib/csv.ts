/**
 * Minimal dependency-free CSV reader.
 *
 * Deliberately not a library dependency: ingestion input is small (roughly
 * one row per team member) and this module has to run unchanged in two
 * places — the client-side mapping/preview step and the server action that
 * re-parses the same file text before writing anything. Sharing one parser
 * is what makes the preview an honest picture of what will be saved.
 *
 * Handles the RFC 4180 shape: double-quoted fields, "" as an escaped quote,
 * embedded newlines/delimiters inside quotes, CRLF or LF line endings, and a
 * leading UTF-8 BOM (Excel on Windows writes one).
 */

export const CSV_DELIMITERS = [",", ";", "\t"] as const;
export type CsvDelimiter = (typeof CSV_DELIMITERS)[number];

/**
 * Picks the delimiter by counting candidates outside quoted sections of the
 * first line. Semicolon matters for Excel exports on EU locales, which is a
 * market we've said we'll support (see the `region` field on Organization).
 */
export function detectDelimiter(input: string): CsvDelimiter {
  const text = stripBom(input);
  let best: CsvDelimiter = ",";
  let bestCount = 0;

  for (const delimiter of CSV_DELIMITERS) {
    let count = 0;
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (inQuotes) continue;
      if (ch === "\n" || ch === "\r") break;
      if (ch === delimiter) count++;
    }
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }

  return best;
}

function stripBom(input: string): string {
  return input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
}

/** Parses CSV text into rows of raw (untrimmed) cell strings. */
export function parseCsv(input: string, delimiter: CsvDelimiter = detectDelimiter(input)): string[][] {
  const text = stripBom(input);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let fieldWasQuoted = false;

  const endField = () => {
    row.push(field);
    field = "";
    fieldWasQuoted = false;
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    // An opening quote only counts at the start of a field; a stray quote
    // mid-field is kept verbatim rather than treated as an error.
    if (ch === '"' && field === "" && !fieldWasQuoted) {
      inQuotes = true;
      fieldWasQuoted = true;
      i++;
      continue;
    }
    if (ch === delimiter) {
      endField();
      i++;
      continue;
    }
    if (ch === "\r") {
      if (text[i + 1] === "\n") i++;
      endRow();
      i++;
      continue;
    }
    if (ch === "\n") {
      endRow();
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  // Trailing content without a final newline still forms a row; a file that
  // ends with a newline does not get a phantom empty row.
  if (field !== "" || row.length > 0) endRow();

  return rows;
}

/** True for rows that are entirely empty cells — blank lines and trailing separators. */
export function isBlankRow(row: string[]): boolean {
  return row.every((cell) => cell.trim() === "");
}
