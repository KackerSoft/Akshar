import { GenerationForm } from "@/components/generation-form";
import { prisma } from "@/lib/prisma";
import { templateSerializer } from "@/lib/serializers/template";

export default async function NewGenerationPage() {
  const templates = (
    await prisma.template.findMany({ orderBy: { createdAt: "desc" } })
  ).map(templateSerializer);

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">New generation</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a template, fill in the variables, and save.
      </p>
      <div className="mt-6">
        <GenerationForm templates={templates} />
      </div>
    </div>
  );
}
