import { request } from "./client";
import type { CreateGenerationPayload } from "@/lib/schemas/generation";
import type { GenerationSerialized } from "@/lib/serializers/generation";
import type { PageFormat } from "@/lib/types/pdf";

export const generationsApi = {
  list: () => request<GenerationSerialized[]>("/generations"),
  create: (data: CreateGenerationPayload) =>
    request<GenerationSerialized>("/generations", "POST", data),
  delete: (id: string) => request<void>(`/generations/${id}`, "DELETE"),
  downloadUrl: (id: string, format: PageFormat) =>
    `/api/generations/${id}/pdf?format=${format}`,
};
