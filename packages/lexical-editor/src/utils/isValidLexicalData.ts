import { isValidJSON } from "~/utils/isValidJSON";
import { has } from "lodash";
import { SerializedEditorState } from "lexical";
/*
 * @description Checks for valid lexical data.
 *
 * Check for first level of properties that empty editor state data need to have.
 * Note: Base empty editor state data can getEmptyEditorStateJSONString utility function.
 */
export const isValidLexicalData = (
    editorStateValue: string | null | undefined | SerializedEditorState
): boolean => {
    if (!editorStateValue) {
        return false;
    }
    if (!isValidJSON(editorStateValue as string)) {
        return false;
    }
    const data = JSON.parse(editorStateValue as string);
    return has(data, "root.children");
};
