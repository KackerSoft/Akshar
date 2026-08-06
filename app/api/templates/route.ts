import { NextRequest, NextResponse } from "next/server";

import { isAuthenticatedRequest } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { createTemplateSchema, updateTemplateSchema } from "@/lib/schemas/template";
import { templateSerializer } from "@/lib/serializers/template";
import { zodErrorSerializer } from "@/lib/serializers/zod-error";

export async function GET() {
  if (!(await isAuthenticatedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates.map(templateSerializer));
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(zodErrorSerializer(parsed.error), { status: 400 });

  const template = await prisma.template.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      content: parsed.data.content,
      headerContent: parsed.data.headerContent,
      footerContent: parsed.data.footerContent,
      helpersScript: parsed.data.helpersScript,
      variables: parsed.data.variables,
    },
  });

  return NextResponse.json(templateSerializer(template), { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticatedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(zodErrorSerializer(parsed.error), { status: 400 });

  const existing = await prisma.template.findUnique({ where: { id: parsed.data.id } });
  if (!existing)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const updated = await prisma.template.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      content: parsed.data.content,
      headerContent: parsed.data.headerContent,
      footerContent: parsed.data.footerContent,
      helpersScript: parsed.data.helpersScript,
      variables: parsed.data.variables,
    },
  });

  return NextResponse.json(templateSerializer(updated));
}
