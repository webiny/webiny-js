import React, { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";

/**
 * Toolbar action. On toolbar, you can see the button that is underline.
 */
export const UnderlineAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isUnderline, setIsUnderline] = useState(false);
    const { textBlockSelection } = useRichTextEditor();
    const isUnderlineSelected = !!textBlockSelection?.state?.underline;

    useEffect(() => {
        setIsUnderline(isUnderlineSelected);
    }, [isUnderlineSelected]);

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
            <i className="format underline" />
        </button>
    );
};
