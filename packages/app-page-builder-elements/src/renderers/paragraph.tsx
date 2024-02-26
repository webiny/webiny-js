import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { isValidLexicalData, LexicalHtmlRenderer } from "@webiny/lexical-editor";
import { usePageElements } from "~/hooks/usePageElements";
import { assignStyles } from "~/utils";

const getDynamicParagraphValue = (content?: string, dynamicValue?: string) => {
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

type CreateParagraphProps = {
    dynamicSourceContext: React.Context<any>;
};

export const createParagraph = (props: CreateParagraphProps) => {
    return createRenderer(() => {
        const { getElement } = useRenderer();
        const element = getElement();
        const elementContent = element?.data?.text?.data?.text;
        const { theme, useDynamicValue } = usePageElements();
        const dynamicValue = useDynamicValue(
            props.dynamicSourceContext,
            element.data?.dynamicSource?.resolvedPath
        );
        const dynamicParagraphValue = getDynamicParagraphValue(elementContent, dynamicValue);

        const __html = dynamicParagraphValue || elementContent;
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

        // If the text already contains `p` tags (happens when c/p-ing text into the editor),
        // we don't want to wrap it with another pair of `p` tag.
        // Additional note: alternatively, instead of adding the `p-wrap` wrapper tag, we tried
        // removing the wrapper `p` tags from the received text. But that wasn't enough. There
        // were cases where the received text was not just one `p` tag, but an array of `p` tags.
        // In that case, we still need a separate wrapper element. So, we're leaving this solution.
        if (__html.startsWith("<p")) {
            // @ts-expect-error We don't need type-checking here.
            return <p-wrap dangerouslySetInnerHTML={{ __html }} />;
        }

        return <p dangerouslySetInnerHTML={{ __html }} />;
    });
};
