import Link from "next/link";

import { AddTemplateDialog } from "@/components/add-template-dialog";
import { DeleteTemplateDialog } from "@/components/delete-template-dialog";
import { prisma } from "@/lib/prisma";
import { templateSerializer } from "@/lib/serializers/template";

export default async function TemplatesPage() {
  const templates = (
    await prisma.template.findMany({ orderBy: { createdAt: "desc" } })
  ).map(templateSerializer);

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Handlebars templates you can fill in and generate PDFs from.
          </p>
        </div>
        <AddTemplateDialog />
      </div>

      {templates.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No templates yet. Create your first one to get started.
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4 text-card-foreground hover:bg-card/80 transition-colors"
            >
              <Link href={`/templates/${template.id}`} className="flex-1 cursor-pointer">
                <p className="font-medium">{template.name}</p>
                {template.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {template.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {template.variables.length} variable
                  {template.variables.length === 1 ? "" : "s"} · updated{" "}
                  {new Date(template.updatedAt).toLocaleDateString()}
                </p>
              </Link>
              <div className="flex flex-shrink-0 gap-2">
                <DeleteTemplateDialog templateId={template.id} templateName={template.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
