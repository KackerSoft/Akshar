"use client";

import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API } from "@/lib/api";
import type { AssetSerialized } from "@/lib/serializers/asset";

function extensionOf(filename: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
  return match ? `.${match[1]}` : "";
}

async function uploadAsset(file: File, name: string): Promise<AssetSerialized> {
  const { token, signedUrl } = await API.assets.initiate();

  const putResponse = await fetch(signedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!putResponse.ok) throw new Error("Failed to upload file");

  const apiEndpoint = process.env.NEXT_PUBLIC_MAALGAADI_API_ENDPOINT;
  if (!apiEndpoint) throw new Error("Maalgaadi is not configured");

  // Confirm directly with Maalgaadi using the per-upload token.
  const confirmResponse = await fetch(apiEndpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!confirmResponse.ok) throw new Error("Failed to confirm upload");
  const { id: fileId } = (await confirmResponse.json()) as {
    id: string;
    extension: string;
  };

  // Keep the original extension so the CDN URL/content-type are derived
  // correctly, even though the display name is user-chosen.
  const filename = `${name}${extensionOf(file.name)}`;

  return API.assets.create({
    fileId,
    filename,
    contentType: file.type,
    size: file.size,
  });
}

export function UploadAssetButton() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [name, setName] = useState("");

  const uploadMutation = useMutation({
    mutationFn: (args: { file: File; name: string }) => uploadAsset(args.file, args.name),
    onSuccess: (asset) => {
      toast.success(`${asset.filename} uploaded`);
      setPendingFile(null);
      router.refresh();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to upload asset";
      toast.error(message);
    },
  });

  function nameWithoutExtension(filename: string): string {
    return filename.replace(/\.[a-zA-Z0-9]+$/, "");
  }

  return (
    <>
      <Button onClick={() => fileInputRef.current?.click()}>
        <Upload />
        Upload asset
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            setPendingFile(file);
            setName(nameWithoutExtension(file.name));
          }
          event.target.value = "";
        }}
      />
      <Dialog
        open={pendingFile !== null}
        onOpenChange={(open) => {
          if (!open) setPendingFile(null);
        }}
      >
        <DialogContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (pendingFile) uploadMutation.mutate({ file: pendingFile, name });
            }}
          >
            <DialogHeader>
              <DialogTitle>Name this asset</DialogTitle>
              <DialogDescription>
                Choose a name to identify this asset in templates.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-4">
              <Label htmlFor="asset-name">Asset name</Label>
              <Input
                id="asset-name"
                autoFocus
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g., Company logo"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? "Uploading…" : "Upload asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
