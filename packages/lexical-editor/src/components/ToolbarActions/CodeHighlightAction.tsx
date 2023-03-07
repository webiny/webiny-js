import React, { useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";

/**
 * Toolbar action. User can highlight the selected text.
 * - Gray background will be visible on selected text after clicking on the button.
 */
export const CodeHighlightAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isCode, setIsCode] = useState(false);
    const handleClick = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
        setIsCode(!isCode);
    };

    return (
        <button
            onClick={() => handleClick()}
            className={"popup-item spaced " + (isCode ? "active" : "")}
            aria-label="Text code highlight"
        >
            <i className="format code" />
        </button>
    );
};
