import { createHeadlessEditor } from "@lexical/headless";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $getSelection } from "lexical";
import { allNodes, $createParagraphNode } from "@webiny/lexical-nodes";
import { NodeMapper, ParserConfigurationOptions } from "~/types";

/**
 * By itself, "text" node without a parent node (like "paragraph"), is not a valid node. Lexical will simply ignore these elements.
 * To fix this issue, we wrap the text node with a paragraph node.
 *
 * EXAMPLE:
 * When we parse DOM, sometimes, 'span' html tag doesn't have parent elements that match the
 * lexical node elements (there's no Node class that can handle that HTML element), like paragraph or headings.
 * In this case, Lexical will parse the 'span' tag as a text node, but without a parent element.
 */
const textNodeParentNormalizer: NodeMapper = node => {
    if (node.getType() === "text" && node.getParent() === null) {
        return $createParagraphNode().append(node);
    }
    return node;
};

const passthroughMapper: NodeMapper = node => node;

/**
 * Parse html string to lexical JSON object.
 */
export const createHtmlToLexicalParser = (config: ParserConfigurationOptions = {}) => {
    return (domDocument: Document): Record<string, any> | null => {
        const normalizeTextNodes = config.normalizeTextNodes ?? true;
        const textNodeNormalizer = normalizeTextNodes
            ? textNodeParentNormalizer
            : passthroughMapper;

        const customNodeMapper: NodeMapper = config.nodeMapper ?? passthroughMapper;

        const editor = createHeadlessEditor({
            ...config.editorConfig,
            nodes: [...allNodes, ...(config.editorConfig?.nodes || [])]
        });

        let parsingError;

        editor.update(
            () => {
                // Convert to lexical node objects that can be stored in db.
                const lexicalNodes = $generateNodesFromDOM(editor, domDocument)
                    .map(textNodeNormalizer)
                    .map(customNodeMapper);

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
