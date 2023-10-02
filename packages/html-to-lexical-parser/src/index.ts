import { generateInitialLexicalValue, getSupportedNodeList } from "@webiny/lexical-editor";
import { createHeadlessEditor } from "@lexical/headless";
import { JSDOM } from "jsdom";
import { $generateNodesFromDOM } from "@lexical/html";

/**
 * Parse html string to lexical object.
 * This parser by default uses the Webiny lexical nodes.
 */
export const parseToLexicalObject = (
    htmlString: string,
    onError?: (onError: Error) => void
): Record<string, any> => {
    if (!htmlString?.length) {
        return JSON.parse(generateInitialLexicalValue());
    }

    const editor = createHeadlessEditor({
        nodes: getSupportedNodeList(),
        onError: onError
    });

    const dom = new JSDOM(htmlString);

    // Convert to lexical node objects format that can be stored in db.
    const nodesData = $generateNodesFromDOM(editor, dom).map(node => node.get());
    return nodesData;
};
