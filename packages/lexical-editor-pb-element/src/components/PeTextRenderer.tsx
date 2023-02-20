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
    const __html = variableValue || element.data.text.data.text;
    return <LexicalHtmlRenderer value={__html} />;
});
