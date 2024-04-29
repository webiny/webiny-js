import React, { useCallback } from "react";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@webiny/lexical-nodes";
import { getNodeFromSelection } from "~/hooks/useCurrentElement";
import { useDeriveValueFromSelection } from "~/hooks/useCurrentSelection";
import { useRichTextEditor } from "~/hooks";

export const LinkAction = () => {
    const { editor } = useRichTextEditor();
    const isLink = useDeriveValueFromSelection(({ rangeSelection }) => {
        if (!rangeSelection) {
            return false;
        }
        const node = getNodeFromSelection(rangeSelection);
        return node ? $isLinkNode(node) || $isLinkNode(node.getParent()) : false;
    });

    const insertLink = useCallback(() => {
        if (!isLink) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url: "https://" });
        } else {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        }
    }, [editor, isLink]);

    return (
        <button
            onClick={insertLink}
            className={"popup-item spaced " + (isLink ? "active" : "")}
            aria-label="Insert link"
        >
            <i className="format link" />
        </button>
    );
};
