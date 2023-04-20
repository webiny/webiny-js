import React, { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";

export const ItalicAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isItalic, setIsItalic] = useState(false);
    const { textBlockSelection } = useRichTextEditor();
    const isItalicSelected = !!textBlockSelection?.state?.italic;

    const handleClick = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        setIsItalic(!isItalic);
    };

    useEffect(() => {
        setIsItalic(isItalicSelected);
    }, [isItalicSelected]);

    return (
        <button
            onClick={() => handleClick()}
            className={"popup-item spaced " + (isItalic ? "active" : "")}
            aria-label="Format text as italic"
        >
            <i className="format italic" />
        </button>
    );
};
