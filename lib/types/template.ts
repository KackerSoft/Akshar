export interface TemplateColumn {
  /** Key within each row object, e.g. "description". */
  key: string;
  /** Human-friendly column header shown in the generation form. */
  label: string;
  defaultValue?: string;
}

export interface TextTemplateVariable {
  type?: "text";
  /** Handlebars variable name, e.g. "customerName". */
  key: string;
  /** Human-friendly label shown in the generation form. */
  label: string;
  defaultValue?: string;
}

/** A repeatable table of rows, e.g. invoice line items. Rendered with `{{#each key}}...{{/each}}`. */
export interface ArrayTemplateVariable {
  type: "array";
  key: string;
  label: string;
  columns: TemplateColumn[];
}

export type TemplateVariable = TextTemplateVariable | ArrayTemplateVariable;

/** One row's values within an array variable, keyed by column key. */
export type TemplateRow = Record<string, string>;

export type VariableValue = string | TemplateRow[];

/** Values passed into `renderTemplate`, keyed by variable key. */
export type VariableValues = Record<string, VariableValue>;
