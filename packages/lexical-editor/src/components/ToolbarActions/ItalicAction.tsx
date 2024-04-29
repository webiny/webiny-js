import React from "react";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { useCurrentSelection } from "~/hooks/useCurrentSelection";
import { useRichTextEditor } from "~/hooks";

export const ItalicAction = () => {
    const { editor } = useRichTextEditor();
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
