import { NextResponse } from "next/server";
import { loadDemoPairwiseReportModel } from "@/lib/reports/loadPairwiseReport";
import { renderPairwiseReportHtml, injectDemoDisclaimer } from "@/lib/reports/renderReportHtml";
import { pairwiseReportFileName } from "@/lib/reports/pairwiseReport";
import { PdfNotConfiguredError, getPdfRenderer } from "@/lib/pdf/renderer";
import { DEMO_NARRATIVE_DISCLAIMER } from "@/lib/content/demoNarrative";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PDF export for the fictional demo pair. Unauthenticated like the rest of
 * /teams/demo — it renders sampleData.ts, never client data.
 */
export async function GET(
  _request: Request,
  { params }: { params: { memberAId: string; memberBId: string } }
) {
  const model = loadDemoPairwiseReportModel({
    memberAId: params.memberAId,
    memberBId: params.memberBId,
    generatedAt: new Date(),
  });
  if (!model) return new NextResponse("Unknown demo pair.", { status: 404 });

  try {
    const renderer = await getPdfRenderer();
    const html = injectDemoDisclaimer(await renderPairwiseReportHtml(model), DEMO_NARRATIVE_DISCLAIMER);
    const pdf = await renderer.render(html);

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pairwiseReportFileName(
          model.a.name,
          model.b.name
        )}"`,
      },
    });
  } catch (error) {
    if (error instanceof PdfNotConfiguredError) {
      return new NextResponse(error.message, { status: 503 });
    }
    throw error;
  }
}
