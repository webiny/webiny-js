import React, { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";

export const CodeHighlightAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isCode, setIsCode] = useState(false);
    const { textBlockSelection } = useRichTextEditor();
    const isCodeSelected = !!textBlockSelection?.state?.code;

    useEffect(() => {
        setIsCode(isCodeSelected);
    }, [isCodeSelected]);

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
