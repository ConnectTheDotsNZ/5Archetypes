import { NextResponse } from "next/server";
import { requireCurrentOrganization } from "@/lib/auth";
import { loadPairwiseReportModel } from "@/lib/reports/loadPairwiseReport";
import { renderPairwiseReportHtml } from "@/lib/reports/renderReportHtml";
import { pairwiseReportFileName } from "@/lib/reports/pairwiseReport";
import { PdfNotConfiguredError, getPdfRenderer } from "@/lib/pdf/renderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { teamId: string; memberAId: string; memberBId: string } }
) {
  const { organization: org } = await requireCurrentOrganization();

  const model = await loadPairwiseReportModel({
    teamId: params.teamId,
    memberAId: params.memberAId,
    memberBId: params.memberBId,
    organizationId: org.id,
    generatedAt: new Date(),
  });
  if (!model) {
    return new NextResponse("Both people need to be on this team and have scores on file.", {
      status: 404,
    });
  }

  try {
    const renderer = await getPdfRenderer();
    const pdf = await renderer.render(await renderPairwiseReportHtml(model));

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pairwiseReportFileName(
          model.a.name,
          model.b.name
        )}"`,
        // Personal data about two people: never let a proxy or browser cache it.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof PdfNotConfiguredError) {
      return new NextResponse(error.message, { status: 503 });
    }
    throw error;
  }
}
