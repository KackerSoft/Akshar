import type { GenerationModel } from "@/lib/generated/prisma/models";
import type { VariableValues } from "@/lib/types/template";

export function generationSerializer(
  generation: GenerationModel & { template?: { name: string } | null },
) {
  return {
    id: generation.id,
    name: generation.name,
    templateId: generation.templateId,
    templateName: generation.template?.name ?? null,
    variables: generation.variables as VariableValues,
    html: generation.html,
    createdAt: generation.createdAt,
  };
}

export type GenerationSerialized = ReturnType<typeof generationSerializer>;
