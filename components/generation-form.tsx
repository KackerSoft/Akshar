"use client";

import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import type { PresetSerialized } from "@/lib/serializers/preset";
import type { TemplateSerialized } from "@/lib/serializers/template";
import type {
  TemplateColumn,
  TemplateRow,
  VariableValues,
} from "@/lib/types/template";
import {
  applyPresetValues,
  buildHelpers,
  getEmptyVariableValues,
  renderTemplate,
} from "@/lib/utils/template";

const NO_PRESET = "__none__";

function errorMessage(error: FieldErrors) {
  return error.name?.[0] ?? error.form?.[0] ?? "Something went wrong";
}

export function GenerationForm({
  templates,
  presets: initialPresets,
}: {
  templates: TemplateSerialized[];
  presets: PresetSerialized[];
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [name, setName] = useState("");
  const [values, setValues] = useState<VariableValues>(() =>
    getEmptyVariableValues(templates[0]?.variables ?? []),
  );
  const [presets, setPresets] = useState(initialPresets);
  const [presetId, setPresetId] = useState(NO_PRESET);
  const [newPresetName, setNewPresetName] = useState("");

  const template = templates.find((t) => t.id === templateId);
  const templatePresets = presets.filter((p) => p.templateId === templateId);
  const activePreset = templatePresets.find((p) => p.id === presetId);

  function selectTemplate(id: string) {
    setTemplateId(id);
    setPresetId(NO_PRESET);
    const selected = templates.find((t) => t.id === id);
    setValues(getEmptyVariableValues(selected?.variables ?? []));
  }

  function selectPreset(id: string) {
    setPresetId(id);
    const variables =
      templates.find((t) => t.id === templateId)?.variables ?? [];
    const preset = templatePresets.find((p) => p.id === id);
    setValues(
      preset
        ? applyPresetValues(variables, preset.values)
        : getEmptyVariableValues(variables),
    );
  }

  function updateTextValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addRow(key: string, columns: TemplateColumn[]) {
    setValues((prev) => {
      const rows = Array.isArray(prev[key]) ? (prev[key] as TemplateRow[]) : [];
      const row = Object.fromEntries(columns.map((c) => [c.key, ""]));
      return { ...prev, [key]: [...rows, row] };
    });
  }

  function removeRow(key: string, rowIndex: number) {
    setValues((prev) => {
      const rows = Array.isArray(prev[key]) ? (prev[key] as TemplateRow[]) : [];
      return { ...prev, [key]: rows.filter((_, i) => i !== rowIndex) };
    });
  }

  function updateCell(
    key: string,
    rowIndex: number,
    columnKey: string,
    value: string,
  ) {
    setValues((prev) => {
      const rows = Array.isArray(prev[key]) ? (prev[key] as TemplateRow[]) : [];
      return {
        ...prev,
        [key]: rows.map((row, i) =>
          i === rowIndex ? { ...row, [columnKey]: value } : row,
        ),
      };
    });
  }

  const preview = useMemo(() => {
    if (!template) return { html: "", error: undefined };
    const { helpers, error: helpersError } = buildHelpers(
      template.helpersScript ?? "",
    );
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

    const html = [header.html, main.html, footer.html]
      .filter(Boolean)
      .join("\n");
    return { html, error: undefined };
  }, [template, values]);

  const createMutation = useMutation<GenerationSerialized, FieldErrors, void>({
    mutationFn: () =>
      API.generations.create({ name, templateId, variables: values }),
    onSuccess: () => router.push("/generations"),
  });

  const createPresetMutation = useMutation<
    PresetSerialized,
    FieldErrors,
    VariableValues
  >({
    mutationFn: (presetValues) =>
      API.presets.create({
        name: newPresetName,
        templateId,
        values: presetValues,
      }),
    onSuccess: (preset) => {
      setPresets((prev) => [...prev, preset]);
      setPresetId(preset.id);
      setNewPresetName("");
      toast.success("Preset saved");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const updatePresetMutation = useMutation<
    PresetSerialized,
    FieldErrors,
    { preset: PresetSerialized; presetValues: VariableValues }
  >({
    mutationFn: ({ preset, presetValues }) =>
      API.presets.update({
        id: preset.id,
        name: preset.name,
        values: presetValues,
      }),
    onSuccess: (preset) => {
      setPresets((prev) => prev.map((p) => (p.id === preset.id ? preset : p)));
      toast.success("Preset updated");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const deletePresetMutation = useMutation<void, FieldErrors, string>({
    mutationFn: (id) => API.presets.delete(id),
    onSuccess: (_, id) => {
      setPresets((prev) => prev.filter((p) => p.id !== id));
      setPresetId(NO_PRESET);
      toast.success("Preset deleted");
    },
    onError: (error) => toast.error(errorMessage(error)),
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
        {errors.name?.[0] && (
          <p className="text-sm text-destructive">{errors.name[0]}</p>
        )}
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

          <div className="flex flex-col gap-3 rounded-md bg-muted/40 p-3">
            <div className="flex flex-col gap-2">
              <Label>Preset</Label>
              <div className="flex items-center gap-2">
                <Select value={presetId} onValueChange={selectPreset}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="No preset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PRESET}>No preset</SelectItem>
                    {templatePresets.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activePreset && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={updatePresetMutation.isPending}
                      onClick={() =>
                        updatePresetMutation.mutate({
                          preset: activePreset,
                          presetValues: values,
                        })
                      }
                    >
                      <Save className="h-3.5 w-3.5" />
                      Update preset
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      disabled={deletePresetMutation.isPending}
                      onClick={() =>
                        deletePresetMutation.mutate(activePreset.id)
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={newPresetName}
                onChange={(event) => setNewPresetName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  if (newPresetName.trim()) createPresetMutation.mutate(values);
                }}
                placeholder="Save current values as a new preset…"
              />
              <Button
                type="button"
                variant="outline"
                disabled={
                  !newPresetName.trim() || createPresetMutation.isPending
                }
                onClick={() => createPresetMutation.mutate(values)}
              >
                <Plus className="h-3.5 w-3.5" />
                Save as preset
              </Button>
            </div>
          </div>
          {template.variables.map((variable) =>
            variable.type === "array" ? (
              <div key={variable.key} className="flex flex-col gap-2">
                <Label>{variable.label || variable.key}</Label>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {variable.columns.map((column) => (
                          <th
                            key={column.key}
                            className="p-2 text-left font-medium"
                          >
                            {column.label || column.key}
                          </th>
                        ))}
                        <th className="w-10 p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {((values[variable.key] as TemplateRow[]) ?? []).map(
                        (row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="border-b last:border-b-0"
                          >
                            {variable.columns.map((column) => (
                              <td key={column.key} className="p-1.5">
                                <Input
                                  value={row[column.key] ?? ""}
                                  placeholder={column.example}
                                  onChange={(event) =>
                                    updateCell(
                                      variable.key,
                                      rowIndex,
                                      column.key,
                                      event.target.value,
                                    )
                                  }
                                />
                              </td>
                            ))}
                            <td className="p-1.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-destructive hover:text-destructive"
                                onClick={() =>
                                  removeRow(variable.key, rowIndex)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => addRow(variable.key, variable.columns)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add row
                </Button>
              </div>
            ) : (
              <div key={variable.key} className="flex flex-col gap-2">
                <Label htmlFor={`var-${variable.key}`}>
                  {variable.label || variable.key}
                </Label>
                <Input
                  id={`var-${variable.key}`}
                  value={(values[variable.key] as string) ?? ""}
                  placeholder={variable.example}
                  onChange={(event) =>
                    updateTextValue(variable.key, event.target.value)
                  }
                />
              </div>
            ),
          )}
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
