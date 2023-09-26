/*
 * @description Checks for valid lexical data.
 */
export const isValidLexicalData = (editorStateValue: Record<string, any>): boolean => {
    if (!editorStateValue) {
        return false;
    }
    return !!editorStateValue["root"];
};
