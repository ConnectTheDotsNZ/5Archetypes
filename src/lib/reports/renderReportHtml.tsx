/**
 * Wraps a report component in a standalone HTML document for Chromium.
 *
 * The same React component renders the web view and this document, so the PDF
 * can't drift from what the admin previewed — that's the whole reason Step 5
 * asks for component reuse rather than a second template. The document inlines
 * its own CSS and fetches nothing, which keeps rendering hermetic (and means
 * Chromium never needs network access).
 */

import { REPORT_CSS, REPORT_PRINT_CSS } from "@/components/reports/reportStyles";
import { IndividualProfileReport } from "@/components/reports/IndividualProfileReport";
import type { IndividualProfileReportModel } from "./individualProfile";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function documentShell({ title, body }: { title: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>${REPORT_PRINT_CSS}</style>
<style>${REPORT_CSS}</style>
</head>
<body>${body}</body>
</html>`;
}

export async function renderIndividualProfileHtml(
  model: IndividualProfileReportModel
): Promise<string> {
  // Imported here, not at module scope: the App Router rejects a static
  // `react-dom/server` import anywhere in the RSC graph, and this module is
  // reachable from a route handler.
  const { renderToStaticMarkup } = await import("react-dom/server");

  const body = renderToStaticMarkup(
    // Styles live in the document head instead of the component.
    <IndividualProfileReport model={model} omitStyles />
  );

  return documentShell({
    title: `${model.subject.name}: Individual Archetype Profile`,
    body,
  });
}
