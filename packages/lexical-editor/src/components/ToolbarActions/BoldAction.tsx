import React, { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";

export const BoldAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isBold, setIsBold] = useState(false);
    const { textBlockSelection } = useRichTextEditor();
    const isBoldSelected = !!textBlockSelection?.state?.bold;

    const handleClick = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        setIsBold(!isBold);
    };

    useEffect(() => {
        setIsBold(isBoldSelected);
    }, [isBoldSelected]);

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
