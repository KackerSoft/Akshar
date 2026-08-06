import type { ZodError } from "zod";

/**
 * Turn a ZodError into a field-keyed map of messages, e.g.
 * `{ name: ["Required"] }`. The client reads `errors.<field>?.[0]` to render
 * inline messages.
 */
export function zodErrorSerializer(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "form";
    (errors[key] ??= []).push(issue.message);
  }

  return errors;
}
