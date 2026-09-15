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
