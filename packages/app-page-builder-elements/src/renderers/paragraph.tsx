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
        // Additional note: alternatively, instead of adding the `p-wrap` wrapper tag, we tried
        // removing the wrapper `p` tags from the received text. But that wasn't enough. There
        // were cases where the received text was not just one `p` tag, but an array of `p` tags.
        // In that case, we still need a separate wrapper element. So, we're leaving this solution.
        if (__html.startsWith("<p")) {
            // @ts-ignore We don't need type-checking here.
            return <p-wrap dangerouslySetInnerHTML={{ __html }} />;
        }

        return <p dangerouslySetInnerHTML={{ __html }} />;
    });
};
