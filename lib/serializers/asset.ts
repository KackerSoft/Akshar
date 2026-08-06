import type { AssetModel } from "@/lib/generated/prisma/models";
import { getAssetUrl } from "@/lib/server/maalgaadi";

function extensionFromFilename(filename: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
  return (match?.[1] ?? "bin").toLowerCase();
}

export function assetSerializer(asset: AssetModel) {
  return {
    id: asset.id,
    filename: asset.filename,
    contentType: asset.contentType,
    size: asset.size,
    url: getAssetUrl(asset.fileId, extensionFromFilename(asset.filename)),
    createdAt: asset.createdAt,
  };
}

export type AssetSerialized = ReturnType<typeof assetSerializer>;
