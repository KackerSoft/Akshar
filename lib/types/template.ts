export interface TemplateVariable {
  /** Handlebars variable name, e.g. "customerName". */
  key: string;
  /** Human-friendly label shown in the generation form. */
  label: string;
  defaultValue?: string;
}
