import { request } from "./client";
import type { AssetSerialized } from "@/lib/serializers/asset";

export const assetsApi = {
  list: () => request<AssetSerialized[]>("/assets"),
  initiate: () =>
    request<{ token: string; signedUrl: string }>("/assets/initiate", "POST"),
  create: (data: { fileId: string; filename: string; contentType: string; size: number }) =>
    request<AssetSerialized>("/assets", "POST", data),
  delete: (id: string) => request<void>(`/assets/${id}`, "DELETE"),
};
