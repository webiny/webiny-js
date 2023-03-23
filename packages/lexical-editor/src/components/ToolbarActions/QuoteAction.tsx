import React, {useEffect, useState} from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {formatToQuote} from "~/utils/nodes/formatToQuote";
import {formatToParagraph} from "~/utils/nodes/formatToParagraph";
import {useRichTextEditor} from "~/hooks/useRichTextEditor";
export const QuoteAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isActive, setIsActive] = useState<boolean>(false);
    const { textBlockSelection } = useRichTextEditor();
    const isQuoteSelected = !!textBlockSelection?.state?.quote.isSelected;

    const formatText = () => {
        if (!isActive) {
            formatToQuote(editor);
            setIsActive(true);
            return;
        }
        formatToParagraph(editor);
        setIsActive(false);
    };

    useEffect(() => {
        setIsActive(isQuoteSelected);
    }, [isQuoteSelected])

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
