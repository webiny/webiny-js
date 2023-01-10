import React, {useState} from "react";
import {$wrapNodes} from "@lexical/selection";
import {$createParagraphNode, $getSelection, $isRangeSelection, DEPRECATED_$isGridSelection} from "lexical";
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {
    QuoteNode
} from '@lexical/rich-text';

export function $createQuoteNode(): QuoteNode {
    return new QuoteNode();
}

export const QuoteAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isActive, setIsActive] = useState<boolean>(false);

    const formatToParagraph = () => {
            editor.update(() => {
                const selection = $getSelection();

                if (
                    $isRangeSelection(selection) ||
                    DEPRECATED_$isGridSelection(selection)
                ) {
                    $wrapNodes(selection, () => $createParagraphNode());
                }
            });
        }

    const formatToQuote = () => {
        editor.update(() => {
            const selection = $getSelection();
            if (
                $isRangeSelection(selection) ||
                DEPRECATED_$isGridSelection(selection)
            ) {
                $wrapNodes(selection, () => $createQuoteNode());
            }
        });
    }

    const formatText = () => {
        if(!isActive) {
            formatToQuote();
            setIsActive(true);
            return;
        }
        formatToParagraph()
        setIsActive(false);
    }

    return (
        <button
            onClick={() => formatText()}
            className={"popup-item " + (isActive ? "active" : "")}
            aria-label="Format text as quote"
        >
            <i className="icon quote"/>
        </button>
    )
};
