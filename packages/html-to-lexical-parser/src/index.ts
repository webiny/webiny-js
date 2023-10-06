import { createHeadlessEditor } from "@lexical/headless";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $getSelection } from "lexical";
import { allNodes } from "@webiny/lexical-editor/nodes/allNodes";
import { $createParagraphNode } from "@webiny/lexical-editor/nodes/ParagraphNode";
import { ParserConfigurationOptions } from "~/types";

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

/**
 * Parse html string to lexical JSON object.
 */
// // convert in factory - createHtmlToLexicalParser(config)
export const createHtmlToLexicalParser =
    (config?: ParserConfigurationOptions) =>
    (htmlString: string): Record<string, any> | null => {
        if (!htmlString?.length) {
            return null;
        }

        const editor = createHeadlessEditor({
            ...config?.editorConfig,
            nodes: [...allNodes, ...(config?.editorConfig?.nodes || [])]
        });

        editor.update(
            () => {
                // Generate dom tree
                const dom = new JSDOM(htmlString);
                // Convert to lexical node objects that can be stored in db.
                const lexicalNodes = $generateNodesFromDOM(editor, dom.window.document).map(
                    node => {
                        /**
                         * Text node alone without parent element node(like paragraph) is not valid node. In that case
                         * lexical will throw an error.
                         * To fix this issue, we append the text node inside the paragraph node(parent element).
                         *
                         * The case when text node doesn't have parent element:
                         * When we parse the DOM, sometimes, 'span' html tag doesn't have parent elements that match the
                         * lexical node elements, like paragraph or headings. In that case lexical will parse the 'span' tag
                         * as text node, but without parent element.
                         */
                        if (node.getType() === "text" && node.getParent() === null) {
                            const paragraphNode = $createParagraphNode();
                            paragraphNode.append(node);
                            return paragraphNode;
                        }
                        return node;
                    }
                );

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
