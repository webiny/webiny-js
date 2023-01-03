import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export type ParagraphRenderer = ReturnType<typeof createParagraph>;

export const createParagraph = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();
        const element = getElement();

        const __html = element.data.text.data.text;
        return <p dangerouslySetInnerHTML={{ __html }} />;
    });
};
