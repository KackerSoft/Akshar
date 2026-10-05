import { z } from "zod";

export const variableValueSchema = z.union([
  z.string(),
  z.array(z.record(z.string(), z.string())),
]);

export const createGenerationSchema = z.object({
  name: z.string().min(1, "Generation name is required").max(150),
  templateId: z.string().min(1, "Template is required"),
  variables: z.record(z.string(), variableValueSchema).default({}),
});

export type CreateGenerationPayload = z.infer<typeof createGenerationSchema>;
