import { NextRequest, NextResponse } from "next/server";

import { isAuthenticatedRequest } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { createGenerationSchema } from "@/lib/schemas/generation";
import { generationSerializer } from "@/lib/serializers/generation";
import { zodErrorSerializer } from "@/lib/serializers/zod-error";
import { buildHelpers, renderTemplate } from "@/lib/utils/template";

export async function GET() {
  if (!(await isAuthenticatedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const generations = await prisma.generation.findMany({
    orderBy: { createdAt: "desc" },
    include: { template: { select: { name: true } } },
  });

  return NextResponse.json(generations.map(generationSerializer));
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedRequest()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = createGenerationSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(zodErrorSerializer(parsed.error), { status: 400 });

  const template = await prisma.template.findUnique({
    where: { id: parsed.data.templateId },
  });
  if (!template)
    return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const { helpers, error: helpersError } = buildHelpers(template.helpersScript ?? "");
  if (helpersError)
    return NextResponse.json({ form: [`Failed to evaluate helpers: ${helpersError}`] }, { status: 400 });

  const { html, error } = renderTemplate(template.content, parsed.data.variables, helpers);
  if (error)
    return NextResponse.json({ form: [`Failed to render template: ${error}`] }, { status: 400 });

  let headerHtml: string | null = null;
  if (template.headerContent) {
    const rendered = renderTemplate(template.headerContent, parsed.data.variables, helpers);
    if (rendered.error)
      return NextResponse.json(
        { form: [`Failed to render page header: ${rendered.error}`] },
        { status: 400 },
      );
    headerHtml = rendered.html;
  }

  let footerHtml: string | null = null;
  if (template.footerContent) {
    const rendered = renderTemplate(template.footerContent, parsed.data.variables, helpers);
    if (rendered.error)
      return NextResponse.json(
        { form: [`Failed to render page footer: ${rendered.error}`] },
        { status: 400 },
      );
    footerHtml = rendered.html;
  }

  const generation = await prisma.generation.create({
    data: {
      name: parsed.data.name,
      templateId: template.id,
      variables: parsed.data.variables,
      html,
      headerHtml,
      footerHtml,
    },
    include: { template: { select: { name: true } } },
  });

  return NextResponse.json(generationSerializer(generation), { status: 201 });
}
