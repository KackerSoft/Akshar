"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import i18n from "@/lib/i18n";
import { languageAtom } from "@/lib/storage";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { staleTime: 5000 } } }),
  );

  const [language] = useAtom(languageAtom);

  useEffect(() => {
    const selected = language || "en";
    if (i18n.language !== selected) i18n.changeLanguage(selected);
  }, [language]);

  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration>
      </TooltipProvider>
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
