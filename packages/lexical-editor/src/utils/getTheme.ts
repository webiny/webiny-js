import { WebinyEditorTheme, webinyEditorTheme } from "~/themes/webinyLexicalTheme";
import { EditorThemeClasses } from "lexical";

/**
 * Get webiny theme used for lexical editor
 */
export const getTheme = (): EditorThemeClasses | WebinyEditorTheme => {
    return webinyEditorTheme;
};
