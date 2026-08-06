import { createHmac, timingSafeEqual } from "node:crypto";

import { SESSION_TTL_MS } from "@/lib/auth/constants";

/**
 * Akshar has a single global password (the `PASSWORD` env var) instead of
 * per-user accounts, so there's no database-backed session to check against.
 * Auth tokens are self-contained and stateless: `<expiresAt>.<hmac>`, signed
 * with the password itself. Verifying just means recomputing the HMAC and
 * checking the expiry — no DB round-trip required.
 */
function getSecret(): string {
  const password = process.env.PASSWORD;
  if (!password) throw new Error("PASSWORD env var is not set");
  return password;
}

function sign(expiresAt: number): string {
  return createHmac("sha256", getSecret()).update(String(expiresAt)).digest("hex");
}

/** Check a plaintext password against the configured `PASSWORD` env var. */
export function verifyPassword(candidate: string): boolean {
  const expected = Buffer.from(getSecret());
  const actual = Buffer.from(candidate);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

/** Create a new signed auth token, valid for `SESSION_TTL_MS`. */
export function createAuthToken(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  return `${expiresAt}.${sign(expiresAt)}`;
}

/** Verify a signed auth token's signature and expiry. */
export function verifyAuthToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const [expiresAtRaw, signature] = token.split(".");
  if (!expiresAtRaw || !signature) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const expected = Buffer.from(sign(expiresAt));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
