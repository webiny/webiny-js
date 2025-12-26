import parseColor, { type Instance as TcColorInstance } from "tinycolor2";
import type { ColorPalette, ColorShade } from "./types.js";

const generateShades = (color: TcColorInstance): Array<[ColorShade, TcColorInstance]> => {
    return [
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

const assignColorToCssVar = (
    palette: ColorPalette,
    shadeLevel: ColorShade,
    color: TcColorInstance
) => {
    const varName = `--color-${palette}-${shadeLevel}`;

    const hsl = color.toHsl();
    const varValue = `hsla(${hsl.h}, ${hsl.s * 100}%, ${hsl.l * 100}%)`;
    document.documentElement.style.setProperty(varName, varValue);
};

export const assignColor = (palette: ColorPalette, color: string, shade?: ColorShade) => {
    const colorInstance = parseColor(color);

    if (shade) {
        assignColorToCssVar(palette, shade, colorInstance);
        return;
    }

    generateShades(colorInstance).forEach(([shadeLevel, shade]) => {
        assignColorToCssVar(palette, shadeLevel, shade);
    });
};
