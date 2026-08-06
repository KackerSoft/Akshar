import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { renderHtmlToPdf } from "@/lib/server/pdf";
import { PAGE_FORMATS, type PageFormat } from "@/lib/types/pdf";

// Downloaded via a plain browser navigation (an <a href> click), so this
// checks the auth cookie directly rather than the Authorization header.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  const formatParam = request.nextUrl.searchParams.get("format") ?? "A4";
  if (!PAGE_FORMATS.includes(formatParam as PageFormat))
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  const format = formatParam as PageFormat;

  const generation = await prisma.generation.findUnique({ where: { id } });
  if (!generation)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  let pdf: Buffer;
  try {
    pdf = await renderHtmlToPdf(generation.html, format, {
      headerHtml: generation.headerHtml,
      footerHtml: generation.footerHtml,
    });
  } catch (error) {
    console.error("PDF render failed", error);
    return NextResponse.json({ error: "Failed to render PDF" }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${sanitizeFilename(generation.name)}.pdf"`,
    },
  });
}

/** Strip characters that aren't safe inside a Content-Disposition filename. */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "generation";
}
