import { isValidJSON } from "~/utils/isValidJSON";
import { LexicalValue } from "~/types";
/*
 * @description Checks for valid lexical data.
 *
 * Check for first level of properties that empty editor state data need to have.
 * @see generateInitialLexicalValue
 */
export const isValidLexicalData = (editorStateValue: LexicalValue | null): boolean => {
    if (!editorStateValue) {
        return false;
    }
    if (!isValidJSON(editorStateValue)) {
        return false;
    }
    const data = JSON.parse(editorStateValue);
    return !!data["root"];
};
