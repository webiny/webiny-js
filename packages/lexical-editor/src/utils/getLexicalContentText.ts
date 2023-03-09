import { LexicalValue } from "~/types";
import { $getRoot } from "lexical";
import { createHeadlessEditor } from "@lexical/headless";
import { WebinyNodes } from "~/nodes/webinyNodes";
import { theme } from "~/themes/webinyLexicalTheme";
import { isValidLexicalData } from "~/utils/isValidLexicalData";

/**
 * Extract plain text with spaces and new lines from lexical JSON data structure.
 * Note: This method use the lexical headless library so can be used for back-end processing.
 * @param value
 */
export const getLexicalContentText = (value: LexicalValue | null): string | null => {
    if (!value) {
        return value;
    }

    if (!isValidLexicalData(value)) {
        return value;
    }

    const config = {
        namespace: "webiny",
        nodes: [...WebinyNodes],
        onError: (error: Error) => {
            throw error;
        },
        theme: theme
    };

    const editor = createHeadlessEditor(config);
    const newEditorState = editor.parseEditorState(value);

    return newEditorState.read(() => $getRoot().getTextContent());
};
