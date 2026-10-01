"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  Code2,
  ImagePlus,
  Info,
  PanelBottom,
  PanelTop,
  Plus,
  Save,
  Terminal,
  Trash2,
} from "lucide-react";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DuplicateTemplateDialog } from "@/components/duplicate-template-dialog";
import { API, type FieldErrors } from "@/lib/api";
import { templateVariableSchema } from "@/lib/schemas/template";
import type { AssetSerialized } from "@/lib/serializers/asset";
import type { TemplateSerialized } from "@/lib/serializers/template";
import type { TemplateColumn, TemplateVariable } from "@/lib/types/template";
import {
  buildHelpers,
  getDefaultVariableValues,
  renderTemplate,
} from "@/lib/utils/template";

type EditorField = "content" | "header" | "footer" | "script";

export function TemplateEditor({
  template,
  assets,
}: {
  template: TemplateSerialized;
  assets: AssetSerialized[];
}) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [content, setContent] = useState(template.content);
  const [headerContent, setHeaderContent] = useState(
    template.headerContent ?? "",
  );
  const [footerContent, setFooterContent] = useState(
    template.footerContent ?? "",
  );
  const [helpersScript, setHelpersScript] = useState(
    template.helpersScript ?? "",
  );
  const [variables, setVariables] = useState<TemplateVariable[]>(
    template.variables,
  );
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [activeField, setActiveField] = useState<EditorField>("content");
  const [variablesMode, setVariablesMode] = useState<"list" | "json">("list");
  const [variablesJsonText, setVariablesJsonText] = useState(() =>
    JSON.stringify(template.variables, null, 2),
  );
  const [variablesJsonError, setVariablesJsonError] = useState<string | null>(
    null,
  );

  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const updateMutation = useMutation<TemplateSerialized, FieldErrors, void>({
    mutationFn: () =>
      API.templates.update({
        id: template.id,
        name,
        description: description || undefined,
        content,
        headerContent: headerContent || undefined,
        footerContent: footerContent || undefined,
        helpersScript: helpersScript || undefined,
        variables,
      }),
    onSuccess: () => toast.success("Template saved"),
  });

  const errors: FieldErrors = updateMutation.error ?? {};

  const fieldConfig: Record<
    EditorField,
    {
      value: string;
      setValue: (value: string) => void;
      label: string;
      hint: ReactNode;
      language: string;
      error?: string;
    }
  > = {
    content: {
      value: content,
      setValue: setContent,
      label: "Template code (Handlebars)",
      language: "html",
      hint: (
        <>
          Force a new PDF page with{" "}
          <code>{'<div style="break-after: page;"></div>'}</code>. Add{" "}
          <code>{'style="break-inside: avoid;"'}</code> to elements (tables,
          cards) that shouldn&apos;t be split across pages.
        </>
      ),
      error: errors.content?.[0],
    },
    header: {
      value: headerContent,
      setValue: setHeaderContent,
      label: "Page header (optional, repeats on every PDF page)",
      language: "html",
      hint: (
        <>
          Shares the main content&apos;s stylesheet and repeats at the top of
          every printed page.
        </>
      ),
      error: errors.headerContent?.[0],
    },
    footer: {
      value: footerContent,
      setValue: setFooterContent,
      label: "Page footer (optional, repeats on every PDF page)",
      language: "html",
      hint: (
        <>
          Shares the main content&apos;s stylesheet and repeats at the bottom of
          every printed page.
        </>
      ),
      error: errors.footerContent?.[0],
    },
    script: {
      value: helpersScript,
      setValue: setHelpersScript,
      label: "Helpers script (optional, shared by content, header & footer)",
      language: "javascript",
      hint: (
        <>
          Assign functions to <code>helpers.*</code>, e.g.{" "}
          <code>{"helpers.addDays = (date, days) => ..."}</code>, then call it
          as <code>{"{{addDays date durationDays}}"}</code> anywhere in the
          content, header, or footer. Runs server-side in a sandboxed context,
          so only add code you trust.
        </>
      ),
      error: errors.helpersScript?.[0],
    },
  };
  const current = fieldConfig[activeField];

  const { html: previewHtml, error: renderError } = useMemo(() => {
    const values = getDefaultVariableValues(variables);
    const { helpers, error: helpersError } = buildHelpers(helpersScript);
    if (helpersError) return { html: "", error: `Script: ${helpersError}` };

    const main = renderTemplate(content, values, helpers);
    if (main.error) return { html: "", error: `Content: ${main.error}` };

    const header = headerContent
      ? renderTemplate(headerContent, values, helpers)
      : { html: "", error: undefined };
    if (header.error) return { html: "", error: `Header: ${header.error}` };

    const footer = footerContent
      ? renderTemplate(footerContent, values, helpers)
      : { html: "", error: undefined };
    if (footer.error) return { html: "", error: `Footer: ${footer.error}` };

    const html = [header.html, main.html, footer.html]
      .filter(Boolean)
      .join("\n");

    return { html, error: undefined };
  }, [content, headerContent, footerContent, helpersScript, variables]);

  function addVariable() {
    setVariables((prev) => [
      ...prev,
      { type: "text", key: "", label: "", defaultValue: "" },
    ]);
  }

  function updateVariable(index: number, patch: Partial<TemplateVariable>) {
    setVariables((prev) =>
      prev.map((v, i) =>
        i === index ? ({ ...v, ...patch } as TemplateVariable) : v,
      ),
    );
  }

  function setVariableType(index: number, type: "text" | "array") {
    setVariables((prev) =>
      prev.map((v, i) => {
        if (i !== index) return v;
        if (type === "array") {
          return {
            type: "array",
            key: v.key,
            label: v.label,
            columns: [{ key: "", label: "", defaultValue: "" }],
          };
        }
        return { type: "text", key: v.key, label: v.label, defaultValue: "" };
      }),
    );
  }

  function removeVariable(index: number) {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  }

  function addColumn(variableIndex: number) {
    setVariables((prev) =>
      prev.map((v, i) =>
        i === variableIndex && v.type === "array"
          ? { ...v, columns: [...v.columns, { key: "", label: "", defaultValue: "" }] }
          : v,
      ),
    );
  }

  function updateColumn(
    variableIndex: number,
    columnIndex: number,
    patch: Partial<TemplateColumn>,
  ) {
    setVariables((prev) =>
      prev.map((v, i) =>
        i === variableIndex && v.type === "array"
          ? {
              ...v,
              columns: v.columns.map((c, ci) =>
                ci === columnIndex ? { ...c, ...patch } : c,
              ),
            }
          : v,
      ),
    );
  }

  function removeColumn(variableIndex: number, columnIndex: number) {
    setVariables((prev) =>
      prev.map((v, i) =>
        i === variableIndex && v.type === "array"
          ? { ...v, columns: v.columns.filter((_, ci) => ci !== columnIndex) }
          : v,
      ),
    );
  }

  function switchVariablesMode(mode: "list" | "json") {
    if (mode === "json") {
      setVariablesJsonText(JSON.stringify(variables, null, 2));
      setVariablesJsonError(null);
    }
    setVariablesMode(mode);
  }

  function handleVariablesJsonChange(text: string) {
    setVariablesJsonText(text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setVariablesJsonError("Invalid JSON");
      return;
    }
    const result = z.array(templateVariableSchema).safeParse(parsed);
    if (!result.success) {
      setVariablesJsonError(
        result.error.issues[0]?.message ?? "Invalid variables",
      );
      return;
    }
    setVariablesJsonError(null);
    setVariables(result.data);
  }

  function insertAsset() {
    const asset = assets.find((a) => a.id === selectedAssetId);
    if (!asset) return;
    const snippet = `<img src="${asset.url}" alt="${asset.filename}" style="max-width: 100%;" />`;

    const editorInstance = editorRef.current;
    if (editorInstance) {
      const selection = editorInstance.getSelection();
      const range = selection ?? editorInstance.getModel()?.getFullModelRange();
      if (range) {
        editorInstance.executeEdits("insert-asset", [{ range, text: snippet }]);
        editorInstance.focus();
        current.setValue(editorInstance.getValue());
        return;
      }
    }
    current.setValue(`${current.value}\n${snippet}`);
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent text-2xl font-semibold outline-none"
            placeholder="Template name"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 w-full bg-transparent text-sm text-muted-foreground outline-none"
            placeholder="Description (optional)"
          />
        </div>
        <DuplicateTemplateDialog
          sourceName={name}
          sourceDescription={description}
          content={content}
          headerContent={headerContent}
          footerContent={footerContent}
          helpersScript={helpersScript}
          variables={variables}
        />
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      {errors.name?.[0] && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.name[0]}</AlertDescription>
        </Alert>
      )}

      {/* Variables */}
      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Variables</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border p-0.5">
              <Button
                type="button"
                variant={variablesMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-7"
                onClick={() => switchVariablesMode("list")}
              >
                List
              </Button>
              <Button
                type="button"
                variant={variablesMode === "json" ? "secondary" : "ghost"}
                size="sm"
                className="h-7"
                onClick={() => switchVariablesMode("json")}
              >
                JSON
              </Button>
            </div>
            {variablesMode === "list" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariable}
              >
                <Plus className="h-3.5 w-3.5" />
                Add variable
              </Button>
            )}
          </div>
        </div>
        {variablesMode === "list" ? (
          variables.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No variables yet. Add one and reference it in the template as{" "}
              <code>{"{{key}}"}</code>, or add a table variable and loop over
              its rows with <code>{"{{#each key}}...{{/each}}"}</code>.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {variables.map((variable, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 rounded-md border p-2"
                >
                  <div className="flex items-center gap-2">
                    <Select
                      value={variable.type ?? "text"}
                      onValueChange={(value) =>
                        setVariableType(index, value as "text" | "array")
                      }
                    >
                      <SelectTrigger className="w-28 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="array">Table</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={variable.key}
                      onChange={(e) =>
                        updateVariable(index, { key: e.target.value })
                      }
                      placeholder="key (e.g. customerName)"
                      className="font-mono text-sm"
                    />
                    <Input
                      value={variable.label}
                      onChange={(e) =>
                        updateVariable(index, { label: e.target.value })
                      }
                      placeholder="Label shown in generation form"
                    />
                    {variable.type !== "array" && (
                      <Input
                        value={variable.defaultValue ?? ""}
                        onChange={(e) =>
                          updateVariable(index, { defaultValue: e.target.value })
                        }
                        placeholder="Default value (optional)"
                      />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => removeVariable(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {variable.type === "array" && (
                    <div className="flex flex-col gap-2 rounded-md bg-muted/40 p-2 pl-4">
                      <p className="text-xs text-muted-foreground">
                        Each row is available inside{" "}
                        <code>{`{{#each ${variable.key || "…"}}}`}</code> as{" "}
                        <code>{"{{this.columnKey}}"}</code>.
                      </p>
                      {variable.columns.map((column, columnIndex) => (
                        <div key={columnIndex} className="flex items-center gap-2">
                          <Input
                            value={column.key}
                            onChange={(e) =>
                              updateColumn(index, columnIndex, {
                                key: e.target.value,
                              })
                            }
                            placeholder="column key (e.g. description)"
                            className="font-mono text-sm"
                          />
                          <Input
                            value={column.label}
                            onChange={(e) =>
                              updateColumn(index, columnIndex, {
                                label: e.target.value,
                              })
                            }
                            placeholder="Column label"
                          />
                          <Input
                            value={column.defaultValue ?? ""}
                            onChange={(e) =>
                              updateColumn(index, columnIndex, {
                                defaultValue: e.target.value,
                              })
                            }
                            placeholder="Default value (optional)"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-destructive hover:text-destructive"
                            disabled={variable.columns.length === 1}
                            onClick={() => removeColumn(index, columnIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="self-start"
                        onClick={() => addColumn(index)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add column
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col gap-2">
            <div className="h-60 overflow-hidden rounded-lg border">
              <Editor
                height="100%"
                language="json"
                value={variablesJsonText}
                onChange={(value) => handleVariablesJsonChange(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  wordWrap: "on",
                  automaticLayout: true,
                }}
              />
            </div>
            {variablesJsonError && (
              <p className="text-xs text-destructive">{variablesJsonError}</p>
            )}
          </div>
        )}
        {errors.variables?.[0] && (
          <p className="text-sm text-destructive">{errors.variables[0]}</p>
        )}
      </div>

      {/* Asset picker */}
      <div className="flex items-center gap-2">
        <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Insert an asset…" />
          </SelectTrigger>
          <SelectContent>
            {assets.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No assets uploaded yet
              </div>
            ) : (
              assets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.filename}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!selectedAssetId || activeField === "script"}
          onClick={insertAsset}
        >
          <ImagePlus className="h-3.5 w-3.5" />
          Insert into template
        </Button>
      </div>

      <div className="flex flex-col gap-2" style={{ height: "90vh" }}>
        {/* Field tabs */}
        <Tabs
          value={activeField}
          onValueChange={(value) => setActiveField(value as EditorField)}
          orientation="horizontal"
        >
          <TabsList>
            <TabsTrigger value="content">
              <Code2 className="h-3.5 w-3.5" />
              Content
            </TabsTrigger>
            <TabsTrigger value="header">
              <PanelTop className="h-3.5 w-3.5" />
              Header
            </TabsTrigger>
            <TabsTrigger value="footer">
              <PanelBottom className="h-3.5 w-3.5" />
              Footer
            </TabsTrigger>
            <TabsTrigger value="script">
              <Terminal className="h-3.5 w-3.5" />
              Script
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid flex-1 grid-cols-2 gap-4 min-h-0">
          {/* Editor */}
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-medium">{current.label}</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  {/* TooltipContent is inline-flex; wrap in a block span so multi-node hints wrap as one paragraph */}
                  <span className="block whitespace-normal">
                    {current.hint}
                  </span>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex-1 overflow-hidden rounded-lg border">
              <Editor
                height="100%"
                language={current.language}
                value={current.value}
                onChange={(value) => current.setValue(value || "")}
                onMount={(editorInstance) => {
                  editorRef.current = editorInstance;
                }}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  wordWrap: "on",
                  automaticLayout: true,
                }}
              />
            </div>
            {current.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{current.error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Preview */}
          <div className="flex flex-col gap-2 min-h-0">
            <h3 className="text-sm font-medium">
              Preview (using default values)
            </h3>
            <div className="flex-1 overflow-hidden rounded-lg border bg-white">
              {renderError ? (
                <div className="flex h-full items-center justify-center p-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{renderError}</AlertDescription>
                  </Alert>
                </div>
              ) : (
                <iframe
                  srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:0;padding:16px;background:white;color:#333;}</style></head><body>${previewHtml}</body></html>`}
                  className="h-full w-full border-none"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
