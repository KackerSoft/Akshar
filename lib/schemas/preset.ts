import { z } from "zod";

import { variableValueSchema } from "./generation";

const valuesSchema = z.record(z.string(), variableValueSchema);

export const createPresetSchema = z.object({
  name: z.string().min(1, "Preset name is required").max(150),
  templateId: z.string().min(1, "Template is required"),
  values: valuesSchema,
});

export type CreatePresetPayload = z.infer<typeof createPresetSchema>;

export const updatePresetSchema = z.object({
  id: z.string().min(1, "Preset ID is required"),
  name: z.string().min(1, "Preset name is required").max(150),
  values: valuesSchema,
});

export type UpdatePresetPayload = z.infer<typeof updatePresetSchema>;
