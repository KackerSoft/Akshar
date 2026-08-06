import { NextRequest, NextResponse } from "next/server";

import { isAuthenticatedRequest } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticatedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.template.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.template.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
