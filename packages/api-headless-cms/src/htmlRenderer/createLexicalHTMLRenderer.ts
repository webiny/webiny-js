import type { SerializedEditorState } from "@webiny/lexical-converter";
import { CmsRichTextRendererPlugin, RichTextContents } from "~/plugins";

const isLexicalContents = (contents: RichTextContents): contents is SerializedEditorState => {
    return contents.hasOwnProperty("root");
};

export const createLexicalHTMLRenderer = () => {
    return new CmsRichTextRendererPlugin("html", contents => {
        if (!isLexicalContents(contents)) {
            return undefined;
        }

        return import(/* webpackChunkName: "LexicalRenderer" */ "./LexicalRenderer").then(
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
