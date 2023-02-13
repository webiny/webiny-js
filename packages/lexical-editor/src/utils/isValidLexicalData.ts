import { isValidJSON } from "~/utils/isValidJSON";
import { has } from "lodash";
/*
 * @description Checks for valid lexical data.
 *
 * Check for first level of properties that empty editor state data need to have.
 * Note: Base empty editor state data can getEmptyEditorStateJSONString utility function.
 */
export const isValidLexicalData = (editorStateValue: string | null | undefined): boolean => {
    if (!editorStateValue) {
        return false;
    }
    if (!isValidJSON(editorStateValue)) {
        return false;
    }
    const data = JSON.parse(editorStateValue);
    return has(data, "root.children");
};
