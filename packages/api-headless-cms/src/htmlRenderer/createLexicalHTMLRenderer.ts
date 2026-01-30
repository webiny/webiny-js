import type { SerializedEditorState } from "@webiny/lexical-converter";
import type { RichTextContents } from "~/plugins/index.js";
import { CmsRichTextRendererPlugin } from "~/plugins/index.js";

const isLexicalContents = (contents: RichTextContents): contents is SerializedEditorState => {
    return contents.hasOwnProperty("root");
};

export const createLexicalHTMLRenderer = () => {
    return new CmsRichTextRendererPlugin("html", async contents => {
        if (!isLexicalContents(contents)) {
            return undefined;
        }

        return import(/* webpackChunkName: "LexicalRenderer" */ "./LexicalRenderer.js").then(
            ({ LexicalRenderer }) => {
                try {
                    const renderer = new LexicalRenderer();
                    return renderer.render(contents);
                } catch (err) {
                    console.log(err);
                    return undefined;
                }
            }
        );
    });
};
