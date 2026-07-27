import React from "react";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { useCurrentSelection } from "~/hooks/useCurrentSelection.js";
import { useRichTextEditor } from "~/hooks/index.js";
import { ReactComponent as ItalicIcon } from "@webiny/icons/format_italic.svg";
import cn from "clsx";

export const ItalicAction = () => {
    const { editor } = useRichTextEditor();
    const { rangeSelection } = useCurrentSelection();
    const isItalicSelected = rangeSelection ? rangeSelection.hasFormat("italic") : false;

    const handleClick = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
    };

    return (
        <button
            onClick={handleClick}
            className={cn("popup-item", "spaced", { active: isItalicSelected })}
            aria-label="Format text as italic"
        >
            <ItalicIcon className="format" />
        </button>
    );
};
