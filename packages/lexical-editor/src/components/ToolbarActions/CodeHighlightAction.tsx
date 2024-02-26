import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { useCurrentSelection } from "~/hooks/useCurrentSelection";

export const CodeHighlightAction = () => {
    const [editor] = useLexicalComposerContext();
    const { rangeSelection } = useCurrentSelection();
    const isCodeSelected = rangeSelection ? rangeSelection.hasFormat("code") : false;

    const handleClick = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
    };

    return (
        <button
            onClick={handleClick}
            className={"popup-item spaced " + (isCodeSelected ? "active" : "")}
            aria-label="Text code highlight"
        >
            <i className="format code" />
        </button>
    );
};
