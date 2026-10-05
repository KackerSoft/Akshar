import Handlebars from "handlebars";
import vm from "node:vm";

import type { TemplateVariable, VariableValues } from "@/lib/types/template";

export type HelperMap = Record<string, Handlebars.HelperDelegate>;

/** Runs an author-supplied helpers script (assigning to `helpers.*`) in a throwaway vm context. */
export function buildHelpers(script: string): {
  helpers: HelperMap;
  error?: string;
} {
  if (!script.trim()) return { helpers: {} };

  const sandbox: { helpers: Record<string, unknown> } = { helpers: {} };
  const context = vm.createContext(sandbox);
  try {
    new vm.Script(script).runInContext(context, { timeout: 1000 });
  } catch (error) {
    return {
      helpers: {},
      error:
        error instanceof Error
          ? error.message
          : "Failed to evaluate helpers script",
    };
  }

  const helpers: HelperMap = {};
  for (const [name, value] of Object.entries(sandbox.helpers)) {
    if (typeof value === "function")
      helpers[name] = value as Handlebars.HelperDelegate;
  }
  return { helpers };
}

export function renderTemplate(
  content: string,
  variables: VariableValues,
  helpers: HelperMap = {},
): { html: string; error?: string } {
  const instance = Handlebars.create();
  for (const [name, fn] of Object.entries(helpers))
    instance.registerHelper(name, fn);

  try {
    const compiled = instance.compile(content);
    return { html: compiled(variables) };
  } catch (error) {
    return {
      html: "",
      error:
        error instanceof Error ? error.message : "Failed to render template",
    };
  }
}

/** Build an empty variables record from a template's variable definitions. */
export function getEmptyVariableValues(
  variables: TemplateVariable[],
): VariableValues {
  const values: VariableValues = {};
  for (const variable of variables) {
    if (variable.type === "array") {
      values[variable.key] = [
        Object.fromEntries(variable.columns.map((column) => [column.key, ""])),
      ];
    } else {
      values[variable.key] = "";
    }
  }
  return values;
}

/** Variables filled with each variable's/column's example value, for previewing a template. */
export function getExampleVariableValues(
  variables: TemplateVariable[],
): VariableValues {
  const values: VariableValues = {};
  for (const variable of variables) {
    if (variable.type === "array") {
      values[variable.key] = [
        Object.fromEntries(
          variable.columns.map((column) => [column.key, column.example ?? ""]),
        ),
      ];
    } else {
      values[variable.key] = variable.example ?? "";
    }
  }
  return values;
}

/** Overlay preset values onto an empty record, ignoring keys/columns the template no longer defines. */
export function applyPresetValues(
  variables: TemplateVariable[],
  preset: VariableValues,
): VariableValues {
  const values = getEmptyVariableValues(variables);
  for (const variable of variables) {
    const saved = preset[variable.key];
    if (variable.type === "array") {
      if (!Array.isArray(saved)) continue;
      values[variable.key] = saved.map((row) =>
        Object.fromEntries(
          variable.columns.map((column) => [column.key, row[column.key] ?? ""]),
        ),
      );
    } else if (typeof saved === "string") {
      values[variable.key] = saved;
    }
  }
  return values;
}
