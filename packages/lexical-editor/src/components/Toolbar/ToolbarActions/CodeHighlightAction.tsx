import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React, { useState } from "react";

/**
 * Toolbar action. On toolbar, you can see the button that is italic.
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
