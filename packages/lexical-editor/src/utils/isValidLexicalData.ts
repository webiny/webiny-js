import { isValidJSON } from "~/utils/isValidJSON";
import { has } from "lodash";
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
    if (!isValidJSON(editorStateValue as string)) {
        return false;
    }
    const data = JSON.parse(editorStateValue as string);
    return has(data, "root.children");
};
