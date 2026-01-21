import type { ColorValue, EditorTheme, TypographyValue } from "~/types.js";
import { createLexicalTokens } from "~/createLexicalEditorTokens.js";

export interface CreateThemeParams {
    colors: ColorValue[];
    typography: Record<string, TypographyValue[]>;
    lexicalTokenPrefix: string;
}

export const createTheme = (params: CreateThemeParams): EditorTheme => {
    return {
        colors: params.colors,
        typography: params.typography,
        tokens: createLexicalTokens(params.lexicalTokenPrefix)
    };
};
