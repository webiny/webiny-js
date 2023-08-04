import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { useDynamicValue } from "@webiny/app-dynamic-pages/hooks/useDynamicValue";
import { isValidLexicalData, LexicalHtmlRenderer } from "@webiny/lexical-editor";
import { usePageElements } from "~/hooks/usePageElements";
import { assignStyles } from "~/utils";

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

export type HeadingRenderer = ReturnType<typeof createHeading>;

export const createHeading = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();
        const element = getElement();
        const elementContent = element?.data?.text?.data?.text;
        const { theme } = usePageElements();
        const dynamicValue = useDynamicHeadingValue(
            elementContent,
            element.data?.dynamicSource?.resolvedPath
        );

        const tag = element.data.text.desktop.tag || "h1";
        const __html = dynamicValue || elementContent;

        if (isValidLexicalData(__html)) {
            return (
                <LexicalHtmlRenderer
                    theme={theme}
                    themeStylesTransformer={styles => {
                        return assignStyles({
                            breakpoints: theme.breakpoints,
                            styles
                        });
                    }}
                    value={__html}
                />
            );
        }
        return React.createElement(tag, {
            dangerouslySetInnerHTML: { __html }
        });
    }, {});
};
