import React from "react";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { useCurrentSelection } from "~/hooks/useCurrentSelection.js";
import { useRichTextEditor } from "~/hooks/index.js";
import { ReactComponent as BoldIcon } from "@webiny/icons/format_bold.svg";
import clsx from "clsx";

export const BoldAction = () => {
    const { editor } = useRichTextEditor();
    const { rangeSelection } = useCurrentSelection();
    const isBoldSelected = rangeSelection ? rangeSelection.hasFormat("bold") : false;

    const handleClick = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
    };

    return (
        <button
            onClick={handleClick}
            className={clsx("popup-item", "spaced", { active: isBoldSelected })}
            aria-label="Format text as bold"
        >
            <BoldIcon className="format" />
        </button>
    );
};
