import type { EditorThemeClasses } from "lexical";

export type ColorValue = {
    id: string;
    label: string;
    value: string;
};

export type FontSizes = string[];

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
};

export type TypographyMap = Record<string, TypographyValue>;
