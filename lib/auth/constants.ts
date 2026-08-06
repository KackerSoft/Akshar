/** Name of the cookie that stores the signed auth token. */
export const AUTH_COOKIE = "aksharAuthToken";

/** Session lifetime in milliseconds (30 days). */
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

/** Auth cookie max-age in seconds. */
export const AUTH_COOKIE_MAX_AGE = Math.floor(SESSION_TTL_MS / 1000);
