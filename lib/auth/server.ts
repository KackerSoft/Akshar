import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";

import { AUTH_COOKIE } from "@/lib/auth/constants";
import { verifyAuthToken } from "@/lib/auth/token";

/**
 * Layout-level auth. Reads the signed token from the auth cookie. Deduped
 * per request via React cache so a layout and its pages share one check.
 */
export const isAuthenticated = cache(async (): Promise<boolean> => {
  const cookieStore = await cookies();
  return verifyAuthToken(cookieStore.get(AUTH_COOKIE)?.value);
});

/**
 * API-level auth. Reads the bearer token from the `Authorization` header.
 */
export async function isAuthenticatedRequest(): Promise<boolean> {
  const headersList = await headers();
  const authHeader = headersList.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  return verifyAuthToken(authHeader.slice("Bearer ".length).trim());
}
