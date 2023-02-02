import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export type ParagraphRenderer = ReturnType<typeof createParagraph>;

export const createParagraph = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();
        const element = getElement();

        const __html = element.data.text.data.text;

        // If the text already contains `p` tags (happens when c/p-ing text into the editor),
        // we don't want to wrap it with another pair of `p` tag.
        if (__html.startsWith("<p")) {
            // @ts-ignore We don't need type-checking here.
            return <p-wrap dangerouslySetInnerHTML={{ __html }} />;
        }

        return <p dangerouslySetInnerHTML={{ __html }} />;
    });
};
