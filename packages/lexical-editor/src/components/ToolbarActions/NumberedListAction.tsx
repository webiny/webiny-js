import React from "react";
import type { ListNode } from "@webiny/lexical-nodes";
import { $isListNode } from "@webiny/lexical-nodes";
import { INSERT_ORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from "~/commands/index.js";
import { useRichTextEditor } from "~/hooks/useRichTextEditor.js";
import { useCurrentElement } from "~/hooks/useCurrentElement.js";

export const NumberedListAction = () => {
    const { element } = useCurrentElement();
    const { editor, theme } = useRichTextEditor();
    const isList = $isListNode(element);
    const isNumbered = isList && (element as ListNode).getListType() === "number";

    const getStyleId = (): string | undefined => {
        // check default style for numbered list
        const id = theme.getTypographyByTag("ol")?.id;
        if (id) {
            return id;
        }
        // fallback to ul list styles
        return theme.getTypographyByTag("ul")?.id;
    };

    const formatNumberedList = () => {
        if (!isNumbered) {
            const styleId = getStyleId();
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, { themeStyleId: styleId });
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
    };

    return (
        <button
            onClick={() => formatNumberedList()}
            className={"popup-item spaced " + (isNumbered ? "active" : "")}
            aria-label="Format text as numbered list"
        >
            <i className="icon numbered-list" />
        </button>
    );
};
