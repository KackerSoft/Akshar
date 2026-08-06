import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/auth/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout-level guard: signed-in users never see the auth screens.
  if (await isAuthenticated()) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      {children}
    </div>
  );
}
