"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { API } from "@/lib/api";
import { PAGE_FORMAT_LABELS, PAGE_FORMATS } from "@/lib/types/pdf";

export function DownloadGenerationButton({ generationId }: { generationId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5" />
          Download PDF
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {PAGE_FORMATS.map((format) => (
          <DropdownMenuItem key={format} asChild>
            <a href={API.generations.downloadUrl(generationId, format)}>
              {PAGE_FORMAT_LABELS[format]}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
