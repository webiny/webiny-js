import React, { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { formatToBaseQuote } from "~/utils/nodes/formatToBaseQuote";
import { formatToParagraph } from "~/utils/nodes/formatToParagraph";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
export const QuoteAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isActive, setIsActive] = useState<boolean>(false);
    const { textBlockSelection, themeEmotionMap } = useRichTextEditor();
    const isQuoteSelected = !!textBlockSelection?.state?.quote.isSelected;

    const formatText = () => {
        if (!isActive) {
            // Try to set default quote style, when the action button is clicked for first time
            const DEFAULT_QUOTE_ID = "quote";
            const hasQuoteStyles = themeEmotionMap && themeEmotionMap[DEFAULT_QUOTE_ID];

            formatToBaseQuote(editor, hasQuoteStyles ? DEFAULT_QUOTE_ID : undefined);
            setIsActive(true);
            return;
        }
        formatToParagraph(editor);
        setIsActive(false);
    };

    useEffect(() => {
        setIsActive(isQuoteSelected);
    }, [isQuoteSelected]);

    return (
        <button
            onClick={() => formatText()}
            className={"popup-item " + (isActive ? "active" : "")}
            aria-label="Format text as quote"
        >
            <i className="icon quote" />
        </button>
    );
};
