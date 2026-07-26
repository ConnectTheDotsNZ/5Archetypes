import { NextResponse } from "next/server";
import { loadDemoIndividualProfileModel } from "@/lib/reports/loadIndividualProfile";
import { renderIndividualProfileHtml } from "@/lib/reports/renderReportHtml";
import { individualProfileFileName } from "@/lib/reports/individualProfile";
import { PdfNotConfiguredError, getPdfRenderer } from "@/lib/pdf/renderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PDF export for the fictional demo team. Unauthenticated on purpose, like the
 * rest of /teams/demo — it renders `sampleData.ts`, never client data, and
 * makes the export path reviewable without a login or a database.
 */
export async function GET(_request: Request, { params }: { params: { memberId: string } }) {
  const model = loadDemoIndividualProfileModel({
    memberId: params.memberId,
    generatedAt: new Date(),
  });
  if (!model) return new NextResponse("Unknown demo member.", { status: 404 });

  try {
    const renderer = await getPdfRenderer();
    const pdf = await renderer.render(await renderIndividualProfileHtml(model));

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${individualProfileFileName(
          model.subject.name
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
