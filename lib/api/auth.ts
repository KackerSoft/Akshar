import { request } from "./client";
import type { LoginPayload } from "@/lib/schemas/auth";

export const authApi = {
  login: (data: LoginPayload) =>
    request<{ token: string }>("/auth/login", "POST", data, { auth: false }),
  logout: () => request<{ success: boolean }>("/auth/logout", "POST"),
};
