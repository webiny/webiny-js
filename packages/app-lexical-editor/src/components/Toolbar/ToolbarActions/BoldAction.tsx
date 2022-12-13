import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React, { useState } from "react";

/**
 * Toolbar action. On toolbar, you can see as button that is bold.
 */
export const BoldAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isBold, setIsBold] = useState(false);
    const handleClick = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        setIsBold(!isBold);
    };

    return (
        <button
            onClick={() => handleClick()}
            className={"popup-item spaced " + (isBold ? "active" : "")}
            aria-label="Format text as bold"
        >
            <i className="format bold" />
        </button>
    );
};
