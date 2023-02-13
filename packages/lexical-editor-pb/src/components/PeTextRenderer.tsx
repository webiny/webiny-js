import React from "react";
import { createRenderer, useRenderer } from "@webiny/app-page-builder-elements";
import { useElementVariableValue } from "@webiny/app-page-builder/editor/hooks/useElementVariableValue";
import { LexicalHtmlRenderer } from "@webiny/lexical-editor/components/LexicalHtmlRenderer";

/**
 * @description Render lexical content for all text components like Headings and Paragraph
 */
export const PeTextRenderer = createRenderer(() => {
    const { getElement } = useRenderer();
    const element = getElement();
    const variableValue = useElementVariableValue(element);

    if (element.type === "paragraph") {
        console.log("PeTextRenderer - paragraph", JSON.parse(variableValue));
    }

    const __html = variableValue || element.data.text.data.text;
    return <LexicalHtmlRenderer editorState={__html} />;
});
