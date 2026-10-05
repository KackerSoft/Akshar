import type { PresetModel } from "@/lib/generated/prisma/models";
import type { VariableValues } from "@/lib/types/template";

export function presetSerializer(preset: PresetModel) {
  return {
    id: preset.id,
    name: preset.name,
    templateId: preset.templateId,
    values: preset.values as VariableValues,
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt,
  };
}

export type PresetSerialized = ReturnType<typeof presetSerializer>;
