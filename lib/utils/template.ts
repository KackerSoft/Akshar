import Handlebars from "handlebars";
import vm from "node:vm";

import type { TemplateVariable } from "@/lib/types/template";

export type HelperMap = Record<string, Handlebars.HelperDelegate>;

/** Runs an author-supplied helpers script (assigning to `helpers.*`) in a throwaway vm context. */
export function buildHelpers(script: string): { helpers: HelperMap; error?: string } {
  if (!script.trim()) return { helpers: {} };

  const sandbox: { helpers: Record<string, unknown> } = { helpers: {} };
  const context = vm.createContext(sandbox);
  try {
    new vm.Script(script).runInContext(context, { timeout: 1000 });
  } catch (error) {
    return {
      helpers: {},
      error: error instanceof Error ? error.message : "Failed to evaluate helpers script",
    };
  }

  const helpers: HelperMap = {};
  for (const [name, value] of Object.entries(sandbox.helpers)) {
    if (typeof value === "function") helpers[name] = value as Handlebars.HelperDelegate;
  }
  return { helpers };
}

export function renderTemplate(
  content: string,
  variables: Record<string, string>,
  helpers: HelperMap = {},
): { html: string; error?: string } {
  const instance = Handlebars.create();
  for (const [name, fn] of Object.entries(helpers)) instance.registerHelper(name, fn);

  try {
    const compiled = instance.compile(content);
    return { html: compiled(variables) };
  } catch (error) {
    return {
      html: "",
      error: error instanceof Error ? error.message : "Failed to render template",
    };
  }
}

/** Build a variables record from a template's variable definitions, using their defaults. */
export function getDefaultVariableValues(
  variables: TemplateVariable[],
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const variable of variables) values[variable.key] = variable.defaultValue ?? "";
  return values;
}
