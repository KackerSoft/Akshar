import type { TemplateModel } from "@/lib/generated/prisma/models";
import type { TemplateVariable } from "@/lib/types/template";

export function templateSerializer(template: TemplateModel) {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    content: template.content,
    headerContent: template.headerContent,
    footerContent: template.footerContent,
    helpersScript: template.helpersScript,
    variables: (template.variables as unknown as TemplateVariable[]) ?? [],
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

export type TemplateSerialized = ReturnType<typeof templateSerializer>;
