/**
 * Single source of truth for the app's colors. Each theme is one flat palette
 * of CSS custom properties (shadcn token names). The palette is injected into
 * the document as CSS variables and the UI reads *only* those variables — there
 * are no `dark:` utilities anywhere. Dark mode is selected from the OS via a
 * `prefers-color-scheme` media query (see `themeStyles`).
 */
export type ThemePalette = Record<string, string>;

export type Theme = {
  name: string;
  type: "light" | "dark";
  colors: ThemePalette;
};

export const lightTheme: Theme = {
  name: "light",
  type: "light",
  colors: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0 0)",
    card: "oklch(1 0 0)",
    "card-foreground": "oklch(0.145 0 0)",
    popover: "oklch(1 0 0)",
    "popover-foreground": "oklch(0.145 0 0)",
    primary: "oklch(0.205 0 0)",
    "primary-foreground": "oklch(0.985 0 0)",
    secondary: "oklch(0.97 0 0)",
    "secondary-foreground": "oklch(0.205 0 0)",
    muted: "oklch(0.97 0 0)",
    "muted-foreground": "oklch(0.556 0 0)",
    accent: "oklch(0.97 0 0)",
    "accent-foreground": "oklch(0.205 0 0)",
    destructive: "oklch(0.577 0.245 27.325)",
    border: "oklch(0.922 0 0)",
    input: "oklch(0.922 0 0)",
    ring: "oklch(0.708 0 0)",
    "chart-1": "oklch(0.87 0 0)",
    "chart-2": "oklch(0.556 0 0)",
    "chart-3": "oklch(0.439 0 0)",
    "chart-4": "oklch(0.371 0 0)",
    "chart-5": "oklch(0.269 0 0)",
    sidebar: "oklch(0.985 0 0)",
    "sidebar-foreground": "oklch(0.145 0 0)",
    "sidebar-primary": "oklch(0.205 0 0)",
    "sidebar-primary-foreground": "oklch(0.985 0 0)",
    "sidebar-accent": "oklch(0.97 0 0)",
    "sidebar-accent-foreground": "oklch(0.205 0 0)",
    "sidebar-border": "oklch(0.922 0 0)",
    "sidebar-ring": "oklch(0.708 0 0)",
  },
};

export const darkTheme: Theme = {
  name: "dark",
  type: "dark",
  colors: {
    background: "oklch(0.145 0 0)",
    foreground: "oklch(0.985 0 0)",
    card: "oklch(0.205 0 0)",
    "card-foreground": "oklch(0.985 0 0)",
    popover: "oklch(0.205 0 0)",
    "popover-foreground": "oklch(0.985 0 0)",
    primary: "oklch(0.922 0 0)",
    "primary-foreground": "oklch(0.205 0 0)",
    secondary: "oklch(0.269 0 0)",
    "secondary-foreground": "oklch(0.985 0 0)",
    muted: "oklch(0.269 0 0)",
    "muted-foreground": "oklch(0.708 0 0)",
    accent: "oklch(0.269 0 0)",
    "accent-foreground": "oklch(0.985 0 0)",
    destructive: "oklch(0.704 0.191 22.216)",
    border: "oklch(1 0 0 / 10%)",
    input: "oklch(1 0 0 / 15%)",
    ring: "oklch(0.556 0 0)",
    "chart-1": "oklch(0.87 0 0)",
    "chart-2": "oklch(0.556 0 0)",
    "chart-3": "oklch(0.439 0 0)",
    "chart-4": "oklch(0.371 0 0)",
    "chart-5": "oklch(0.269 0 0)",
    sidebar: "oklch(0.205 0 0)",
    "sidebar-foreground": "oklch(0.985 0 0)",
    "sidebar-primary": "oklch(0.488 0.243 264.376)",
    "sidebar-primary-foreground": "oklch(0.985 0 0)",
    "sidebar-accent": "oklch(0.269 0 0)",
    "sidebar-accent-foreground": "oklch(0.985 0 0)",
    "sidebar-border": "oklch(1 0 0 / 10%)",
    "sidebar-ring": "oklch(0.556 0 0)",
  },
};

export const themes: Theme[] = [lightTheme, darkTheme];

function paletteToVars(colors: ThemePalette): string {
  return Object.entries(colors)
    .map(([key, value]) => `--${key}: ${value};`)
    .join(" ");
}

/**
 * CSS that installs the palette as CSS variables on `:root`. Light is the
 * default; the dark palette applies automatically when the OS is in dark mode.
 * Injected once, server-side, in the root layout — so there is no flash.
 */
export const themeStyles = `:root { ${paletteToVars(
  lightTheme.colors,
)} }\n@media (prefers-color-scheme: dark) { :root { ${paletteToVars(
  darkTheme.colors,
)} } }`;

/**
 * Client-side: force a specific theme by name, overriding the system default
 * by setting the variables inline on `<html>`. (Not used yet — the theme is
 * system-driven for now — but ready for a future theme switcher.)
 */
export function setTheme(name: string): void {
  const theme = themes.find((t) => t.name === name);
  if (!theme) throw new Error(`Theme not found: ${name}`);
  for (const [key, value] of Object.entries(theme.colors)) {
    document.documentElement.style.setProperty(`--${key}`, value);
  }
}

/** Get the CSS-variable map for a theme (for inline `style` injection). */
export function getThemeVariables(name: string): Record<string, string> {
  const theme = themes.find((t) => t.name === name);
  if (!theme) throw new Error(`Theme not found: ${name}`);
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme.colors)) {
    vars[`--${key}`] = value;
  }
  return vars;
}
