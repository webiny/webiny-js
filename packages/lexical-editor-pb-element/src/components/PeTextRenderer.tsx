import React from "react";
import { createRenderer, usePageElements, useRenderer } from "@webiny/app-page-builder-elements";
import { assignStyles } from "@webiny/app-page-builder-elements/utils";
import { useElementVariableValue } from "@webiny/app-page-builder/editor/hooks/useElementVariableValue";
import { LexicalHtmlRenderer } from "@webiny/lexical-editor/components/LexicalHtmlRenderer";

/**
 * @description Render lexical content for all text components like Headings and Paragraph
 */
export const PeTextRenderer = createRenderer(() => {
    const { getElement } = useRenderer();
    const element = getElement();
    const variableValue = useElementVariableValue(element);
    const { theme } = usePageElements();
    const __html = variableValue || element.data.text.data.text;
    return (
        <LexicalHtmlRenderer
            theme={theme}
            value={__html}
            themeStylesTransformer={styles => {
                return assignStyles({
                    breakpoints: theme.breakpoints,
                    styles
                });
            }}
        />
    );
});
