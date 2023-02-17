import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { isValidLexicalData, LexicalHtmlRenderer } from "@webiny/lexical-editor";

export type ParagraphRenderer = ReturnType<typeof createParagraph>;

export const createParagraph = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();
        const element = getElement();

        const __html = element.data.text.data.text;
        if (isValidLexicalData(__html)) {
            return <LexicalHtmlRenderer value={__html} />;
        }
        return <p dangerouslySetInnerHTML={{ __html }} />;
    });
};
