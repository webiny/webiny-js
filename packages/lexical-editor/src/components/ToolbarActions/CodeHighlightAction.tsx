import React from "react";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { useCurrentSelection } from "~/hooks/useCurrentSelection.js";
import { useRichTextEditor } from "~/hooks/index.js";
import { ReactComponent as CodeIcon } from "@webiny/icons/code.svg";
import clsx from "clsx";

export const CodeHighlightAction = () => {
    const { editor } = useRichTextEditor();
    const { rangeSelection } = useCurrentSelection();
    const isCodeSelected = rangeSelection ? rangeSelection.hasFormat("code") : false;

    const handleClick = () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
    };

    return (
        <button
            onClick={handleClick}
            className={clsx("popup-item", "spaced", { active: isCodeSelected })}
            aria-label="Text code highlight"
        >
            <CodeIcon className="format" />
        </button>
    );
};
