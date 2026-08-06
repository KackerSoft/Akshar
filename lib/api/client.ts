import { AUTH_COOKIE } from "@/lib/auth/constants";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  /** Attach the bearer token from the auth cookie. Defaults to true. */
  auth?: boolean;
  headers?: Record<string, string>;
};

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${AUTH_COOKIE}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(AUTH_COOKIE.length + 1)) || null;
}

/**
 * Thin fetch wrapper for the app's own `/api` routes. Reads the bearer token
 * from the auth cookie and sends it as `Authorization: Bearer <token>`. On a
 * non-2xx response it throws the parsed JSON body (a field-keyed error map)
 * so callers can surface inline errors.
 */
export async function request<T = unknown>(
  endpoint: `/${string}`,
  method: Method = "GET",
  data?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, headers } = options;
  const token = auth ? getTokenFromCookie() : null;

  const isFormData = data instanceof FormData;

  const init: RequestInit = {
    method,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (method !== "GET" && data !== undefined) {
    init.body = isFormData ? data : JSON.stringify(data);
  }

  const response = await fetch(`/api${endpoint}`, init);
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) throw body;
  return body as T;
}

/** Field-keyed validation/error map returned by the API on failure. */
export type FieldErrors = Record<string, string[] | undefined>;
