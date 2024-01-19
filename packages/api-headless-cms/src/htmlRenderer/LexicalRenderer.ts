import { createLexicalStateTransformer, SerializedEditorState } from "@webiny/lexical-converter";
// @ts-expect-error jsdom types are messing with the repo, so they're disabled in the root package.json.
import jsdom from "jsdom";

export class LexicalRenderer {
    constructor() {
        if (!global.window) {
            const dom = new jsdom.JSDOM();
            global.window = dom.window;
            global.document = dom.window.document;
            global.DocumentFragment = dom.window.DocumentFragment;
        }
    }

    render(contents: SerializedEditorState): string {
        const transformer = createLexicalStateTransformer();
        return transformer.toHtml(contents);
    }
}
