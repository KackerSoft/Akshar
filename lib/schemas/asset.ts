import { z } from "zod";

export const createAssetSchema = z.object({
  fileId: z.string().min(1, "File id is required"),
  filename: z.string().min(1, "Filename is required").max(255),
  contentType: z.string().min(1, "Content type is required"),
  size: z.number().int().positive(),
});

export type CreateAssetPayload = z.infer<typeof createAssetSchema>;
