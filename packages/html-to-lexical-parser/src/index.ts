// @ts-ignore "@types/jsdom" is disabled in the root package.json resolutions.
import jsdom from "jsdom";
import { createHeadlessEditor } from "@lexical/headless";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $getSelection } from "lexical";
import { allNodes } from "@webiny/lexical-editor/nodes/allNodes";
import { $createParagraphNode } from "@webiny/lexical-editor/nodes/ParagraphNode";
import { NodeMapper, ParserConfigurationOptions } from "~/types";

/**
 * Text node alone, without parent element node (like "paragraph"), is not a valid node, and Lexical will throw an error.
 * To fix this issue, we wrap the text node with a paragraph node (create a parent element for it).
 *
 * EXAMPLE:
 * When we parse the DOM, sometimes, 'span' html tag doesn't have parent elements that match the
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
    return (htmlString: string): Record<string, any> | null => {
        if (!htmlString?.length) {
            return null;
        }

        const normalizeTextNodes = config.normalizeTextNodes ?? true;
        const textNodeNormalizer = normalizeTextNodes
            ? textNodeParentNormalizer
            : passthroughMapper;

        const customNodeMapper: NodeMapper = config.nodeMapper ?? passthroughMapper;

        const editor = createHeadlessEditor({
            ...config.editorConfig,
            nodes: [...allNodes, ...(config.editorConfig?.nodes || [])]
        });

        editor.update(
            () => {
                // Generate dom tree
                const dom = new jsdom.JSDOM(htmlString);

                // Convert to lexical node objects that can be stored in db.
                const lexicalNodes = $generateNodesFromDOM(editor, dom.window.document)
                    .map(node => textNodeNormalizer(node))
                    .map(node => customNodeMapper(node, editor));

                // Select the root
                $getRoot().select();

                // Insert the nodes at a selection.
                const selection = $getSelection();
                if (selection) {
                    selection.insertNodes(lexicalNodes);
                }
            },
            /**
             * Prevents this update from being batched, forcing it to run synchronously.
             */
            { discrete: true }
        );

        return editor.getEditorState().toJSON();
    };
};
