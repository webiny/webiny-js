import type { EditorThemeClasses } from "lexical";

export type ColorValue = {
    id: string;
    label: string;
    value: string;
};

/**
 * A selectable font size.
 *
 * `value` is what lands in the `font-size` declaration, so it can be a plain length or a
 * `var(--wby-text-…)` reference into the active theme's ramp. `label` is what the dropdown shows —
 * without it a themed entry would read as the raw variable string.
 */
export type FontSizeOption = {
    value: string;
    label: string;
};

/**
 * Bare strings remain valid, so a project that configured plain sizes keeps working unchanged.
 */
export type FontSizes = Array<string | FontSizeOption>;

export type TypographyValue = {
    id: string;
    tag: string;
    label: string;
    className: string;
};

export type EditorTheme = {
    colors: ColorValue[];
    typography: Record<string, TypographyValue[]>;
    tokens: EditorThemeClasses;
    fontSizes: FontSizes;
    /**
     * When false the colour picker offers only `colors` and hides the free colour wheel. The Theme app
     * drives this from the active theme's colour policy; undefined means "leave it to the caller".
     */
    allowCustomColors?: boolean;
};

export type TypographyMap = Record<string, TypographyValue>;
