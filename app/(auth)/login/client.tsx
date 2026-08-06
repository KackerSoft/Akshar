"use client";

import { useMutation } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API, type FieldErrors } from "@/lib/api";
import { authTokenAtom } from "@/lib/storage";

export default function LoginClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const setAuthToken = useSetAtom(authTokenAtom);
  const [password, setPassword] = useState("");

  const loginMutation = useMutation<{ token: string }, FieldErrors, void>({
    mutationFn: () => API.auth.login({ password }),
    onSuccess: (data) => {
      setAuthToken(data.token);
      router.push("/");
      router.refresh();
    },
  });

  const errors: FieldErrors = loginMutation.error ?? {};

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{t("log_in")}</CardTitle>
        <CardDescription>{t("login_subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            loginMutation.mutate();
          }}
        >
          {errors.form?.[0] && (
            <p className="text-sm text-destructive">{errors.form[0]}</p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {errors.password?.[0] && (
              <p className="text-sm text-destructive">{errors.password[0]}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? t("logging_in") : t("log_in")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
