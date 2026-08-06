"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { AUTH_COOKIE, AUTH_COOKIE_MAX_AGE } from "@/lib/auth/constants";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getCookie(key: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${key}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
}

function setCookie(key: string, value: string, maxAge = COOKIE_MAX_AGE): void {
  if (typeof document === "undefined") return;
  document.cookie = `${key}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
}

function deleteCookie(key: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${key}=; path=/; max-age=0; samesite=lax`;
}

function serialize<T>(value: T): string {
  if (typeof value === "string") return value;
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  return JSON.stringify(value);
}

function deserialize(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * A Jotai atom backed by a cookie (readable by both client JS and the server).
 */
export function atomWithCookie<T>(
  key: string,
  initialValue: T,
  maxAge = COOKIE_MAX_AGE,
) {
  const getInitialValue = (): T => {
    const cookieValue = getCookie(key);
    if (cookieValue === undefined) return initialValue;
    return deserialize(cookieValue) as T;
  };

  return atomWithStorage<T>(key, getInitialValue(), {
    getItem: (storageKey, defaultValue) => {
      const cookieValue = getCookie(storageKey);
      if (cookieValue === undefined) return defaultValue;
      return deserialize(cookieValue) as T;
    },
    setItem: (storageKey, value) => setCookie(storageKey, serialize(value), maxAge),
    removeItem: (storageKey) => deleteCookie(storageKey),
  });
}

export const authTokenAtom = atomWithCookie<string | null>(
  AUTH_COOKIE,
  null,
  AUTH_COOKIE_MAX_AGE,
);
export const themeAtom = atomWithCookie<string | null>("aksharTheme", null);
export const languageAtom = atomWithCookie<string | null>("aksharLanguage", null);
export const titleAtom = atom<string | null>(null);
