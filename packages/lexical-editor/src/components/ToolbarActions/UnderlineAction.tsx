import React from "react";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { useCurrentSelection, useRichTextEditor } from "~/hooks/index.js";
import { ReactComponent as UnderlineIcon } from "@webiny/icons/format_underlined.svg";
import cn from "clsx";

export const UnderlineAction = () => {
    const { editor } = useRichTextEditor();
    const { rangeSelection } = useCurrentSelection();
    const isUnderlineSelected = rangeSelection ? rangeSelection.hasFormat("underline") : false;

    const handleClick = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
    };

    return (
        <button
            onClick={handleClick}
            className={cn("popup-item", "spaced", { active: isUnderlineSelected })}
            aria-label="Underline text"
        >
            <UnderlineIcon className="format" />
        </button>
    );
};
