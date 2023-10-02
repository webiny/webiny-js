import {
    generateInitialLexicalValue,
    getSupportedNodeList,
    getTheme
} from "@webiny/lexical-editor";
import { createHeadlessEditor } from "@lexical/headless";
import { $generateNodesFromDOM } from "@lexical/html";
import { TextEncoder } from "util";

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

global.TextEncoder = TextEncoder;

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
        onError: onError,
        theme: getTheme()
    });

    const dom = new JSDOM(htmlString);

    // Convert to lexical node objects format that can be stored in db.
    const nodesData = $generateNodesFromDOM(editor, dom).map(node => node.exportJSON());
    return nodesData;
};
