import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React, { useState } from "react";

/**
 * Toolbar action. On toolbar, you can see the button that is underline.
 */
export const UnderlineAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isUnderline, setIsUnderline] = useState(false);
    const handleClick = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        setIsUnderline(!isUnderline);
    };

    return (
        <button
            onClick={() => handleClick()}
            className={"popup-item spaced " + (isUnderline ? "active" : "")}
            aria-label="Format text as italic"
        >
            <i className="format italic" />
        </button>
    );
};
