import { NextRequest, NextResponse } from "next/server";

import { isAuthenticatedRequest } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { unclaimAsset } from "@/lib/server/maalgaadi";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticatedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    await unclaimAsset(asset.fileId);
  } catch (error) {
    console.error("Maalgaadi unclaim failed", error);
    return NextResponse.json(
      { error: "Failed to remove file from storage" },
      { status: 502 },
    );
  }

  await prisma.asset.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
