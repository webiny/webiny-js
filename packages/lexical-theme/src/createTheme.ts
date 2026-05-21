import type { ColorValue, EditorTheme, TypographyValue, FontSizes } from "~/types.js";
import { createLexicalTokens } from "~/createLexicalEditorTokens.js";

export interface CreateThemeParams {
    colors: ColorValue[];
    typography: Record<string, TypographyValue[]>;
    lexicalTokenPrefix: string;
    fontSizes: FontSizes | null;
}

export const createTheme = (params: CreateThemeParams): EditorTheme => {
    return {
        colors: params.colors,
        typography: params.typography,
        tokens: createLexicalTokens(params.lexicalTokenPrefix),
        fontSizes: params.fontSizes ?? []
    };
};
