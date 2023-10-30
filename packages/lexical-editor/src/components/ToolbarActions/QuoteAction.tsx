import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isQuoteNode, formatToQuote, formatToParagraph } from "@webiny/lexical-nodes";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { useCurrentElement } from "~/hooks/useCurrentElement";

export const QuoteAction = () => {
    const [editor] = useLexicalComposerContext();
    const { themeEmotionMap } = useRichTextEditor();
    const { element } = useCurrentElement();
    const isQuote = $isQuoteNode(element);

    const formatText = () => {
        if (!isQuote) {
            // Try to set default quote style, when the action button is clicked for first time
            const DEFAULT_QUOTE_ID = "quote";
            const hasQuoteStyles = themeEmotionMap && themeEmotionMap[DEFAULT_QUOTE_ID];
            formatToQuote(editor, hasQuoteStyles ? DEFAULT_QUOTE_ID : undefined);
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
