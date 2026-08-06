import "server-only";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
const MAX_ASSET_SIZE = 10 * 1024 * 1024; // 10MB
/** Width (px) requested from Maalgaadi and used when building delivery URLs. */
const ASSET_SIZE = 1600;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} env var is not set`);
  return value;
}

/** Whether the Maalgaadi env vars needed for asset uploads are set. */
export function isMaalgaadiConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_MAALGAADI_ENDPOINT &&
      process.env.NEXT_PUBLIC_MAALGAADI_API_ENDPOINT &&
      process.env.MAALGAADI_API_KEY,
  );
}

async function maalgaadiFetch(
  path: string,
  options: { method: string; authorization: string; body?: unknown },
): Promise<Response> {
  const baseUrl = requireEnv("NEXT_PUBLIC_MAALGAADI_API_ENDPOINT");
  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers: {
      Authorization: options.authorization,
      "Content-Type": "application/json",
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok)
    throw new Error(`Maalgaadi ${path} failed: ${res.status} ${await res.text()}`);
  return res;
}

export interface InitiateUploadResult {
  token: string;
  signedUrl: string;
}

/** Ask Maalgaadi for a signed upload URL + token for a new image asset. */
export async function initiateAssetUpload(): Promise<InitiateUploadResult> {
  const apiKey = requireEnv("MAALGAADI_API_KEY");
  const res = await maalgaadiFetch("/initiate", {
    method: "POST",
    authorization: `Bearer ${apiKey}`,
    body: {
      allowedExtensions: IMAGE_EXTENSIONS,
      maxFileSize: MAX_ASSET_SIZE,
      sizes: [ASSET_SIZE],
    },
  });
  return res.json();
}

/** Claim an uploaded file so Maalgaadi keeps it permanently. */
export async function claimAsset(fileId: string): Promise<void> {
  const apiKey = requireEnv("MAALGAADI_API_KEY");
  await maalgaadiFetch(`/${fileId}/claim`, {
    method: "POST",
    authorization: `Bearer ${apiKey}`,
  });
}

/** Unclaim a file so Maalgaadi cleans it up after a grace period. */
export async function unclaimAsset(fileId: string): Promise<void> {
  const apiKey = requireEnv("MAALGAADI_API_KEY");
  await maalgaadiFetch(`/${fileId}/unclaim`, {
    method: "POST",
    authorization: `Bearer ${apiKey}`,
  });
}

/** Public delivery URL for a stored file: `<endpoint>/<fileId>_<size>.<extension>`. */
export function getAssetUrl(fileId: string, extension: string): string {
  const endpoint = requireEnv("NEXT_PUBLIC_MAALGAADI_ENDPOINT");
  return `${endpoint}/${fileId}_${ASSET_SIZE}.${extension}`;
}
