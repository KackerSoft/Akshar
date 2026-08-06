import { redirect } from "next/navigation";

import { TemplateEditor } from "@/components/template-editor";
import { prisma } from "@/lib/prisma";
import { assetSerializer } from "@/lib/serializers/asset";
import { templateSerializer } from "@/lib/serializers/template";
import { isMaalgaadiConfigured } from "@/lib/server/maalgaadi";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) redirect("/templates");

  const assets = isMaalgaadiConfigured()
    ? (await prisma.asset.findMany({ orderBy: { createdAt: "desc" } })).map(assetSerializer)
    : [];

  return (
    <div className="h-full">
      <TemplateEditor template={templateSerializer(template)} assets={assets} />
    </div>
  );
}
