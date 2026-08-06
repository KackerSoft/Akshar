"use client";

import { useMutation } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { RESET } from "jotai/utils";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { API } from "@/lib/api";
import { authTokenAtom } from "@/lib/storage";

export function LogoutButton() {
  const { t } = useTranslation();
  const router = useRouter();
  const setAuthToken = useSetAtom(authTokenAtom);

  const logoutMutation = useMutation({
    mutationFn: () => API.auth.logout(),
    onSettled: () => {
      setAuthToken(RESET);
      router.push("/login");
      router.refresh();
    },
  });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="size-4" />
          {logoutMutation.isPending ? t("logging_out") : t("log_out")}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
