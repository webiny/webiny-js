import { createHeadlessEditor } from "@lexical/headless";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $getSelection } from "lexical";
import { allNodes } from "@webiny/lexical-editor/nodes/allNodes";

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

/**
 * Parse html string to lexical object.
 * This parser by default uses the Webiny lexical nodes.
 */
export const parseToLexicalObject = (
    htmlString: string,
    onSuccess: (data: Record<string, any>) => void,
    onError?: (onError: Error) => void
): void => {
    if (!htmlString?.length) {
        return;
    }

    const editor = createHeadlessEditor({
        nodes: allNodes,
        onError: onError
    });

    editor.update(
        async () => {
            // Generate dom tree
            const dom = new JSDOM(htmlString);
            // Convert to lexical node objects format that can be stored in db.
            const lexicalNodes = $generateNodesFromDOM(editor, dom.window.document);

            // Select the root
            $getRoot().select();

            // Insert them at a selection.
            const selection = $getSelection();
            if (selection) {
                selection.insertNodes(lexicalNodes);
            }
        },
        /**
         * discrete – If true, prevents this update from being batched, forcing it to run synchronously.
         */
        { discrete: true }
    );

    editor.getEditorState().read(() => {
        onSuccess(editor.getEditorState().toJSON());
    });
};
