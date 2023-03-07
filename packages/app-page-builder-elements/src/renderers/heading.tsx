import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { isValidLexicalData, LexicalHtmlRenderer } from "@webiny/lexical-editor";

export type HeadingRenderer = ReturnType<typeof createHeading>;

export const createHeading = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();
        const element = getElement();

        const tag = element.data.text.desktop.tag || "h1";
        const __html = element.data.text.data.text;

        if (isValidLexicalData(__html)) {
            return <LexicalHtmlRenderer value={__html} />;
        }
        return React.createElement(tag, {
            dangerouslySetInnerHTML: { __html }
        });
    }, {});
};
