import { z } from "zod";

const identifierSchema = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(
      /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
      "Use a JS-style identifier: letters, numbers, _ or $, starting with a letter, _ or $ (e.g. myVariable)",
    );

export const templateColumnSchema = z.object({
  key: identifierSchema("Column key"),
  label: z.string().min(1, "Column label is required"),
  example: z.string().optional(),
});

// Array variant checked first since it requires the "array" literal; a plain
// object with no `type` (legacy templates) falls through to the text variant.
export const templateVariableSchema = z.union([
  z.object({
    type: z.literal("array"),
    key: identifierSchema("Variable key"),
    label: z.string().min(1, "Variable label is required"),
    columns: z.array(templateColumnSchema).min(1, "Add at least one column"),
  }),
  z.object({
    type: z.literal("text").optional(),
    key: identifierSchema("Variable key"),
    label: z.string().min(1, "Variable label is required"),
    example: z.string().optional(),
  }),
]);

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
