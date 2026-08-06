import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DeleteAssetDialog } from "@/components/delete-asset-dialog";
import { UploadAssetButton } from "@/components/upload-asset-button";
import { prisma } from "@/lib/prisma";
import { assetSerializer } from "@/lib/serializers/asset";
import { isMaalgaadiConfigured } from "@/lib/server/maalgaadi";

export default async function AssetsPage() {
  const configured = isMaalgaadiConfigured();
  const assets = configured
    ? (await prisma.asset.findMany({ orderBy: { createdAt: "desc" } })).map(assetSerializer)
    : [];

  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Assets</h1>
          <p className="text-sm text-muted-foreground">
            Images stored on Maalgaadi that you can insert into templates.
          </p>
        </div>
        {configured && <UploadAssetButton />}
      </div>

      {!configured ? (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Maalgaadi is not configured</AlertTitle>
          <AlertDescription>
            Set NEXT_PUBLIC_MAALGAADI_ENDPOINT, NEXT_PUBLIC_MAALGAADI_API_ENDPOINT
            and MAALGAADI_API_KEY in your .env file to enable asset uploads.
          </AlertDescription>
        </Alert>
      ) : assets.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No assets yet. Upload an image to get started.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {assets.map((asset) => (
            <div key={asset.id} className="group relative overflow-hidden rounded-lg border bg-card">
              <div className="flex aspect-square items-center justify-center bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- external Maalgaadi CDN URL */}
                <img
                  src={asset.url}
                  alt={asset.filename}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <p className="truncate text-xs font-medium" title={asset.filename}>
                  {asset.filename}
                </p>
                <DeleteAssetDialog assetId={asset.id} assetName={asset.filename} />
              </div>
              <div className="absolute inset-0 -z-10" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
