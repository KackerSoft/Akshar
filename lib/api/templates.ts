import { request } from "./client";
import type { CreateTemplatePayload, UpdateTemplatePayload } from "@/lib/schemas/template";
import type { TemplateSerialized } from "@/lib/serializers/template";

export const templatesApi = {
  list: () => request<TemplateSerialized[]>("/templates"),
  create: (data: CreateTemplatePayload) =>
    request<TemplateSerialized>("/templates", "POST", data),
  update: (data: UpdateTemplatePayload) =>
    request<TemplateSerialized>("/templates", "PUT", data),
  delete: (id: string) => request<void>(`/templates/${id}`, "DELETE"),
};
