import React from "react";
import { createRenderer, usePageElements, useRenderer } from "@webiny/app-page-builder-elements";
import { useElementVariableValue } from "@webiny/app-page-builder/editor/hooks/useElementVariableValue";
import { LexicalHtmlRenderer } from "@webiny/lexical-editor/components/LexicalHtmlRenderer";
import { useDynamicValue } from "@webiny/app-dynamic-pages/hooks/useDynamicValue";

const useDynamicHeadingValue = (content?: string, path?: string) => {
    const dynamicValue = useDynamicValue(path);

    if (!dynamicValue || !content) {
        return content;
    }

    const contentObject = JSON.parse(content);
    const firstChild = contentObject.root.children[0];
    firstChild.children = [
        {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: dynamicValue,
            type: "text",
            version: 1
        }
    ];

    contentObject.root.children = [firstChild];

    return JSON.stringify(contentObject);
};
/**
 * @description Render lexical content for all text components like Headings and Paragraph
 */
export const PeTextRenderer = createRenderer(() => {
    const { getElement } = useRenderer();
    const element = getElement();

    const elementContent = element?.data?.text?.data?.text;

    const variableValue = useElementVariableValue(element);
    const { theme } = usePageElements();
    const dynamicValue = useDynamicHeadingValue(elementContent, element.data?.dynamicSource?.path);
    const __html = dynamicValue || variableValue || elementContent;
    return <LexicalHtmlRenderer theme={theme} value={__html} />;
});
