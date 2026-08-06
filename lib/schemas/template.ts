import { z } from "zod";

export const templateVariableSchema = z.object({
  key: z
    .string()
    .min(1, "Variable key is required")
    .regex(
      /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
      "Use a JS-style identifier: letters, numbers, _ or $, starting with a letter, _ or $ (e.g. myVariable)",
    ),
  label: z.string().min(1, "Variable label is required"),
  defaultValue: z.string().optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(150),
  description: z.string().max(500).optional(),
  content: z.string().min(1, "Template content is required"),
  headerContent: z.string().optional(),
  footerContent: z.string().optional(),
  helpersScript: z.string().optional(),
  variables: z.array(templateVariableSchema).default([]),
});

export type CreateTemplatePayload = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = createTemplateSchema.extend({
  id: z.string().min(1, "Template ID is required"),
});

export type UpdateTemplatePayload = z.infer<typeof updateTemplateSchema>;
