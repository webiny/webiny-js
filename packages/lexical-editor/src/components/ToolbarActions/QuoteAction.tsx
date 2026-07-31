import React from "react";
import { $isQuoteNode, formatToQuote, formatToParagraph } from "@webiny/lexical-nodes";
import { useRichTextEditor } from "~/hooks/useRichTextEditor.js";
import { useCurrentElement } from "~/hooks/useCurrentElement.js";

const QUOTE_TAG = "quote";

export const QuoteAction = () => {
    const { editor, theme } = useRichTextEditor();
    const { element } = useCurrentElement();
    const isQuote = $isQuoteNode(element);

    const formatText = () => {
        if (!isQuote) {
            // Try to set default quote style, when the action button is clicked for first time
            const hasQuoteStyles = theme.getTypographyByTag(QUOTE_TAG);
            formatToQuote(editor, hasQuoteStyles ? QUOTE_TAG : undefined);
            return;
        }
        formatToParagraph(editor);
    };

    return (
        <button
            onClick={formatText}
            className={"popup-item " + (isQuote ? "active" : "")}
            aria-label="Format text as quote"
        >
            <i className="icon quote" />
        </button>
    );
};
