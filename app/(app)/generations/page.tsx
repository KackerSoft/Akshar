import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DeleteGenerationDialog } from "@/components/delete-generation-dialog";
import { DownloadGenerationButton } from "@/components/download-generation-button";
import { prisma } from "@/lib/prisma";
import { generationSerializer } from "@/lib/serializers/generation";

export default async function GenerationsPage() {
  const generations = (
    await prisma.generation.findMany({
      orderBy: { createdAt: "desc" },
      include: { template: { select: { name: true } } },
    })
  ).map(generationSerializer);

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Generations</h1>
          <p className="text-sm text-muted-foreground">
            Filled-in templates, ready to download as PDF.
          </p>
        </div>
        <Button asChild>
          <Link href="/generations/new">
            <Plus />
            New generation
          </Link>
        </Button>
      </div>

      {generations.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No generations yet. Create one from a template to get started.
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {generations.map((generation) => (
            <li
              key={generation.id}
              className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4 text-card-foreground"
            >
              <div className="flex-1">
                <p className="font-medium">{generation.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {generation.templateName ?? "Unknown template"} ·{" "}
                  {new Date(generation.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <DownloadGenerationButton generationId={generation.id} />
                <DeleteGenerationDialog
                  generationId={generation.id}
                  generationName={generation.name}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
