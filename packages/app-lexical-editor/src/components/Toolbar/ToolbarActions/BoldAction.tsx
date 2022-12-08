import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import React, { useEffect, useState } from "react";
export const BOLD_TEXT_ACTION_VALUE = "isBold";

/**
 * Toolbar action. On toolbar you can see as button that is bold.
 */
export const BoldAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isBold, setIsBold] = useState(false);

    useEffect(() => {
        editor.getEditorState().read(() => {
            // TODO
        });
    }, [editor]);

    return (
        <button
            onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            }}
            className={"popup-item spaced " + (actions[BOLD_TEXT_ACTION_VALUE] ? "active" : "")}
            aria-label="Format text as bold"
        >
            <i className="format bold" />
        </button>
    );
};
