import { NextResponse } from "next/server";
import { requireCurrentOrganization } from "@/lib/auth";
import { loadIndividualProfileModel } from "@/lib/reports/loadIndividualProfile";
import { renderIndividualProfileHtml } from "@/lib/reports/renderReportHtml";
import { individualProfileFileName } from "@/lib/reports/individualProfile";
import { PdfNotConfiguredError, getPdfRenderer } from "@/lib/pdf/renderer";

// Chromium and react-dom/server both need the Node runtime, and a report is
// always specific to the signed-in org, so there's nothing to prerender.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { teamId: string; memberId: string } }
) {
  const org = await requireCurrentOrganization();

  const model = await loadIndividualProfileModel({
    teamId: params.teamId,
    memberId: params.memberId,
    organizationId: org.id,
    generatedAt: new Date(),
  });
  if (!model) {
    return new NextResponse("No scores on file for that member.", { status: 404 });
  }

  try {
    const renderer = await getPdfRenderer();
    const pdf = await renderer.render(await renderIndividualProfileHtml(model));

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${individualProfileFileName(
          model.subject.name
        )}"`,
        // A profile is personal data: never let a proxy or browser cache it.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof PdfNotConfiguredError) {
      // Says what's wrong instead of a bare 500 — this is the failure an
      // operator hits on a host without Chromium installed.
      return new NextResponse(error.message, { status: 503 });
    }
    throw error;
  }
}
