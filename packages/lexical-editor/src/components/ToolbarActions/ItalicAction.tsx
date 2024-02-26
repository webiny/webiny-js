import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { useCurrentSelection } from "~/hooks/useCurrentSelection";

export const ItalicAction = () => {
    const [editor] = useLexicalComposerContext();
    const { rangeSelection } = useCurrentSelection();
    const isItalicSelected = rangeSelection ? rangeSelection.hasFormat("italic") : false;

    const handleClick = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
    };

    return (
        <button
            onClick={handleClick}
            className={"popup-item spaced " + (isItalicSelected ? "active" : "")}
            aria-label="Format text as italic"
        >
            <i className="format italic" />
        </button>
    );
};
