import parseColor, { type Instance as TcColorInstance } from "tinycolor2";
import type { ColorPalette, ColorShade, ThemeColorConfig } from "./types.js";

/**
 * The ramp derived from a single brand color: one step of lightness per 100 shades, centred on
 * `500`. `0` and `50` continue that scale (`+50` and `+45`), which clamps to white for most
 * inputs — the same thing `theme.css` does, where every palette's `-0` is white.
 */
const generateShades = (color: TcColorInstance): Array<[ColorShade, TcColorInstance]> => {
    return [
        [0, color.clone().lighten(50)],
        [50, color.clone().lighten(45)],
        [100, color.clone().lighten(40)],
        [200, color.clone().lighten(30)],
        [300, color.clone().lighten(20)],
        [400, color.clone().lighten(10)],
        [500, color.clone()],
        [600, color.clone().darken(10)],
        [700, color.clone().darken(20)],
        [800, color.clone().darken(30)],
        [900, color.clone().darken(40)]
    ];
};

const cssVarName = (palette: ColorPalette, shade: ColorShade) => `--color-${palette}-${shade}`;

const cssVarValue = (color: TcColorInstance) => {
    const hsl = color.toHsl();
    return `hsla(${hsl.h}, ${hsl.s * 100}%, ${hsl.l * 100}%)`;
};

/**
 * Resolves the brand colors registered via `<AdminConfig.Theme.Color />` into a flat map of CSS
 * custom properties.
 *
 * Pure by design: `ThemeModeApplier` composes this with the active theme's variables and owns
 * the single write to `<html>`. Keeping brand colors as config data (rather than a DOM write in
 * `Theme.Color`'s render body) is what lets branding and themes share one applier instead of
 * fighting over the same inline style declaration.
 *
 * Entries are resolved in registration order, so a later shade-specific `Theme.Color` refines an
 * earlier full-palette one.
 */
export const resolveBrandVariables = (colors: ThemeColorConfig[]): Record<string, string> => {
    const variables: Record<string, string> = {};

    for (const { palette, color, shade } of colors) {
        const parsed = parseColor(color);

        // `0` is a valid shade, so this cannot be a truthiness check.
        if (shade !== undefined) {
            variables[cssVarName(palette, shade)] = cssVarValue(parsed);
            continue;
        }

        for (const [shadeLevel, shadeColor] of generateShades(parsed)) {
            variables[cssVarName(palette, shadeLevel)] = cssVarValue(shadeColor);
        }
    }

    return variables;
};
