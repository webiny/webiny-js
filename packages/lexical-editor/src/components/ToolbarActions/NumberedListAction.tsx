import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    INSERT_ORDERED_WEBINY_LIST_COMMAND,
    REMOVE_WEBINY_LIST_COMMAND
} from "~/commands/webiny-list";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { findTypographyStyleByHtmlTag } from "~/utils/findTypographyStyleByHtmlTag";
import { $isListNode, ListNode } from "~/nodes/ListNode";
import { useCurrentElement } from "~/hooks/useCurrentElement";

export const NumberedListAction = () => {
    const [editor] = useLexicalComposerContext();
    const { element } = useCurrentElement();
    const { themeEmotionMap } = useRichTextEditor();
    const isList = $isListNode(element);
    const isNumbered = isList && (element as ListNode).getListType() === "number";

    const getStyleId = (): string | undefined => {
        if (!themeEmotionMap) {
            return undefined;
        }
        // check default style for numbered list
        const id = findTypographyStyleByHtmlTag("ol", themeEmotionMap)?.id;
        if (id) {
            return id;
        }
        // fallback to ul list styles
        return findTypographyStyleByHtmlTag("ul", themeEmotionMap)?.id;
    };

    const formatNumberedList = () => {
        if (!isNumbered) {
            const styleId = themeEmotionMap ? getStyleId() : undefined;
            editor.dispatchCommand(INSERT_ORDERED_WEBINY_LIST_COMMAND, { themeStyleId: styleId });
        } else {
            editor.dispatchCommand(REMOVE_WEBINY_LIST_COMMAND, undefined);
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
