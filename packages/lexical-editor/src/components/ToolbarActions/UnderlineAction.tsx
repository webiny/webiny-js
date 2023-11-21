import React from "react";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { useCurrentSelection } from "~/hooks/useCurrentSelection";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export const UnderlineAction = () => {
    const [editor] = useLexicalComposerContext();
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
