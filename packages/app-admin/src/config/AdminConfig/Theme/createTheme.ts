import type { Theme } from "./types.js";

/**
 * Authoring helper for admin UI themes. Use it in a theme file, then register the theme from
 * an admin extension via `<AdminConfig.Theme.Register theme={...} />`.
 *
 * @example
 * import { createTheme, darkThemeBase } from "@webiny/app-admin";
 *
 * export const dracula = createTheme({
 *     id: "dracula",
 *     name: "Dracula",
 *     variables: { ...darkThemeBase, "--color-neutral-900": "#282a36", ... }
 * });
 */
export const createTheme = (theme: Theme): Theme => theme;
