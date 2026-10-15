import type { COLOR_PALLETS, COLOR_SHADES } from "./consts.js";

export type ColorPalette = (typeof COLOR_PALLETS)[number];
export type ColorShade = (typeof COLOR_SHADES)[number];

/**
 * A selectable admin UI theme. `variables` is a map of CSS custom properties (e.g.
 * `{ "--color-neutral-900": "#282a36" }`) applied to `<html>` at runtime when the theme is
 * active. The built-in "light" theme uses an empty map (the default `@theme` palette).
 */
export interface Theme {
    id: string;
    name: string;
    variables: Record<string, string>;
}

/**
 * A brand color registered via `<AdminConfig.Theme.Color />`. Without `shade`, the full 0-900
 * ramp is derived from `color`; with it, only that one shade is overridden. These are resolved
 * into CSS custom properties and layered on top of the active theme, so branding survives a
 * theme switch.
 *
 * Every palette takes the same shades, so `shade` does not depend on `palette`.
 */
export interface ThemeColorConfig {
    palette: ColorPalette;
    color: string;
    shade?: ColorShade;
}
