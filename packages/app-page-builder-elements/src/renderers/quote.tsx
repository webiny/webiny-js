import React from "react";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";

export type QuoteRenderer = ReturnType<typeof createQuote>;

export const createQuote = () => {
    return createRenderer(() => {
        const { getElement } = useRenderer();
        const element = getElement();
        const __html = element.data.text.data.text;
        return <div dangerouslySetInnerHTML={{ __html }} />;
    });
};
