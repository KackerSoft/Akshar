import { NextRequest, NextResponse } from "next/server";

import { isAuthenticatedRequest } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { createAssetSchema } from "@/lib/schemas/asset";
import { assetSerializer } from "@/lib/serializers/asset";
import { zodErrorSerializer } from "@/lib/serializers/zod-error";
import { claimAsset } from "@/lib/server/maalgaadi";

export async function GET() {
  if (!(await isAuthenticatedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const assets = await prisma.asset.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(assets.map(assetSerializer));
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = createAssetSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(zodErrorSerializer(parsed.error), { status: 400 });

  // The browser already confirmed the upload directly with Maalgaadi; we just
  // claim it (so it isn't cleaned up) and record it.
  try {
    await claimAsset(parsed.data.fileId);
  } catch (error) {
    console.error("Maalgaadi claim failed", error);
    return NextResponse.json({ error: "Failed to claim upload" }, { status: 502 });
  }

  const asset = await prisma.asset.create({
    data: {
      fileId: parsed.data.fileId,
      filename: parsed.data.filename,
      contentType: parsed.data.contentType,
      size: parsed.data.size,
    },
  });

  return NextResponse.json(assetSerializer(asset), { status: 201 });
}
