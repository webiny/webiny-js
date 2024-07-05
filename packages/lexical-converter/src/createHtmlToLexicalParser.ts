import { createHeadlessEditor } from "@lexical/headless";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $getSelection } from "lexical";
import { allNodes } from "@webiny/lexical-nodes";
import { NodeMapper, ParserConfigurationOptions } from "~/types";

const passthroughMapper: NodeMapper = node => node;

/**
 * Parse html string to lexical JSON object.
 */
export const createHtmlToLexicalParser = (config: ParserConfigurationOptions = {}) => {
    return (domDocument: Document): Record<string, any> | null => {
        const customNodeMapper: NodeMapper = config.nodeMapper ?? passthroughMapper;

        const editor = createHeadlessEditor({
            ...config.editorConfig,
            nodes: [...allNodes, ...(config.editorConfig?.nodes || [])]
        });

        let parsingError;

        editor.update(
            () => {
                // Convert to lexical node objects that can be stored in db.
                const lexicalNodes = $generateNodesFromDOM(editor, domDocument).map(
                    customNodeMapper
                );

                // Select the root
                $getRoot().select();

                // Insert the nodes at a selection.
                const selection = $getSelection();
                if (selection) {
                    try {
                        selection.insertNodes(lexicalNodes);
                    } catch (err) {
                        parsingError = err;
                    }
                }
            },
            /**
             * Prevents this update from being batched, forcing it to run synchronously.
             */
            { discrete: true }
        );

        if (parsingError) {
            throw parsingError;
        }

        return editor.getEditorState().toJSON();
    };
};
