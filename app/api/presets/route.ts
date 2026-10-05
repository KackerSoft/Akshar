import { NextRequest, NextResponse } from "next/server";

import { isAuthenticatedRequest } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { createPresetSchema, updatePresetSchema } from "@/lib/schemas/preset";
import { presetSerializer } from "@/lib/serializers/preset";
import { zodErrorSerializer } from "@/lib/serializers/zod-error";

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = createPresetSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(zodErrorSerializer(parsed.error), { status: 400 });

  const template = await prisma.template.findUnique({
    where: { id: parsed.data.templateId },
  });
  if (!template)
    return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const preset = await prisma.preset.create({
    data: {
      name: parsed.data.name,
      templateId: template.id,
      values: parsed.data.values,
    },
  });

  return NextResponse.json(presetSerializer(preset), { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticatedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = updatePresetSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(zodErrorSerializer(parsed.error), { status: 400 });

  const existing = await prisma.preset.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const updated = await prisma.preset.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name, values: parsed.data.values },
  });

  return NextResponse.json(presetSerializer(updated));
}
