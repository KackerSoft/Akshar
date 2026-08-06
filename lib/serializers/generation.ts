import type { GenerationModel } from "@/lib/generated/prisma/models";

export function generationSerializer(
  generation: GenerationModel & { template?: { name: string } | null },
) {
  return {
    id: generation.id,
    name: generation.name,
    templateId: generation.templateId,
    templateName: generation.template?.name ?? null,
    variables: generation.variables as Record<string, string>,
    html: generation.html,
    createdAt: generation.createdAt,
  };
}

export type GenerationSerialized = ReturnType<typeof generationSerializer>;
