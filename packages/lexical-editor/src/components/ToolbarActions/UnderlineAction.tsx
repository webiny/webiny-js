import React from "react";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { useCurrentSelection, useRichTextEditor } from "~/hooks";

export const UnderlineAction = () => {
    const { editor } = useRichTextEditor();
    const { rangeSelection } = useCurrentSelection();
    const isUnderlineSelected = rangeSelection ? rangeSelection.hasFormat("underline") : false;

    const handleClick = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
    };

    return (
        <button
            onClick={handleClick}
            className={"popup-item spaced " + (isUnderlineSelected ? "active" : "")}
            aria-label="Format text as italic"
        >
            <i className="format underline" />
        </button>
    );
};
