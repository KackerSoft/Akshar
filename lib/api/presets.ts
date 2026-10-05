import { request } from "./client";
import type {
  CreatePresetPayload,
  UpdatePresetPayload,
} from "@/lib/schemas/preset";
import type { PresetSerialized } from "@/lib/serializers/preset";

export const presetsApi = {
  create: (data: CreatePresetPayload) =>
    request<PresetSerialized>("/presets", "POST", data),
  update: (data: UpdatePresetPayload) =>
    request<PresetSerialized>("/presets", "PUT", data),
  delete: (id: string) => request<void>(`/presets/${id}`, "DELETE"),
};
