"use client";

import { useMutation } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API, type FieldErrors } from "@/lib/api";
import type { GenerationSerialized } from "@/lib/serializers/generation";
import type { TemplateSerialized } from "@/lib/serializers/template";
import { buildHelpers, getDefaultVariableValues, renderTemplate } from "@/lib/utils/template";

export function GenerationForm({ templates }: { templates: TemplateSerialized[] }) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>(() =>
    getDefaultVariableValues(templates[0]?.variables ?? []),
  );

  const template = templates.find((t) => t.id === templateId);

  function selectTemplate(id: string) {
    setTemplateId(id);
    const selected = templates.find((t) => t.id === id);
    setValues(getDefaultVariableValues(selected?.variables ?? []));
  }

  const preview = useMemo(() => {
    if (!template) return { html: "", error: undefined };
    const { helpers, error: helpersError } = buildHelpers(template.helpersScript ?? "");
    if (helpersError) return { html: "", error: `Script: ${helpersError}` };

    const main = renderTemplate(template.content, values, helpers);
    if (main.error) return { html: "", error: `Content: ${main.error}` };

    const header = template.headerContent
      ? renderTemplate(template.headerContent, values, helpers)
      : { html: "", error: undefined };
    if (header.error) return { html: "", error: `Header: ${header.error}` };

    const footer = template.footerContent
      ? renderTemplate(template.footerContent, values, helpers)
      : { html: "", error: undefined };
    if (footer.error) return { html: "", error: `Footer: ${footer.error}` };

    const html = [header.html, main.html, footer.html].filter(Boolean).join("\n");
    return { html, error: undefined };
  }, [template, values]);

  const createMutation = useMutation<GenerationSerialized, FieldErrors, void>({
    mutationFn: () => API.generations.create({ name, templateId, variables: values }),
    onSuccess: () => router.push("/generations"),
  });

  const errors: FieldErrors = createMutation.error ?? {};

  if (templates.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You need at least one template before you can create a generation.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        createMutation.mutate();
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="generation-name">Generation name</Label>
        <Input
          id="generation-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g., Invoice #1042"
        />
        {errors.name?.[0] && <p className="text-sm text-destructive">{errors.name[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Template</Label>
        <Select value={templateId} onValueChange={selectTemplate}>
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {template && template.variables.length > 0 && (
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <h3 className="text-sm font-medium">Variables</h3>
          {template.variables.map((variable) => (
            <div key={variable.key} className="flex flex-col gap-2">
              <Label htmlFor={`var-${variable.key}`}>{variable.label || variable.key}</Label>
              <Input
                id={`var-${variable.key}`}
                value={values[variable.key] ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, [variable.key]: event.target.value }))
                }
              />
            </div>
          ))}
        </div>
      )}

      {template && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Preview</h3>
          <div className="overflow-hidden rounded-lg border bg-white">
            {preview.error ? (
              <Alert variant="destructive" className="m-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{preview.error}</AlertDescription>
              </Alert>
            ) : (
              <iframe
                srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:0;padding:16px;color:#333;}</style></head><body>${preview.html}</body></html>`}
                className="h-96 w-full border-none"
              />
            )}
          </div>
        </div>
      )}

      {errors.form?.[0] && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.form[0]}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={createMutation.isPending || !template}>
          {createMutation.isPending ? "Saving…" : "Save generation"}
        </Button>
      </div>
    </form>
  );
}
