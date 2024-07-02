import React from "react";
import { createRenderer, usePageElements, useRenderer } from "@webiny/app-page-builder-elements";
import { assignStyles } from "@webiny/app-page-builder-elements/utils";
import { useElementVariableValue } from "@webiny/app-page-builder/editor/hooks/useElementVariableValue";
import { LexicalHtmlRenderer } from "@webiny/lexical-editor/components/LexicalHtmlRenderer";
import { usePage } from "@webiny/app-page-builder/pageEditor";
import { TranslationItem } from "@webiny/app-page-builder/translations";

/**
 * @description Render lexical content for all text components like Headings and Paragraph
 */
export const PeTextRenderer = createRenderer(() => {
    const { getElement } = useRenderer();
    const element = getElement();
    const [page] = usePage();
    const variableValue = useElementVariableValue(element);
    const { theme } = usePageElements();
    const value = variableValue || element.data.text.data.text;

    return (
        <>
            <LexicalHtmlRenderer
                theme={theme}
                value={value}
                themeStylesTransformer={styles => {
                    return assignStyles({
                        breakpoints: theme.breakpoints,
                        styles
                    });
                }}
            />
            <TranslationItem collection={`page:${page.id}`} itemId={element.id} source={value} />
        </>
    );
});
