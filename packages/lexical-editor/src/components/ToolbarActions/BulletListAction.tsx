import React from "react";
import { INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from "~/commands";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { findTypographyStyleByHtmlTag } from "@webiny/lexical-theme";
import { $isListNode, ListNode } from "@webiny/lexical-nodes";
import { useCurrentElement } from "~/hooks/useCurrentElement";

export const BulletListAction = () => {
    const { editor } = useRichTextEditor();
    const { element } = useCurrentElement();
    const { themeEmotionMap } = useRichTextEditor();
    const isList = $isListNode(element);

    const isBullet = isList && (element as ListNode).getListType() === "bullet";

    const formatBulletList = () => {
        if (!isBullet) {
            const styleId = themeEmotionMap
                ? findTypographyStyleByHtmlTag("ul", themeEmotionMap)?.id
                : undefined;
            // will update the active state in the useEffect
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, { themeStyleId: styleId });
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
    };

    return (
        <button
            onClick={() => formatBulletList()}
            className={"popup-item spaced " + (isBullet ? "active" : "")}
            aria-label="Format text as bullet list"
        >
            <i className="icon bullet-list" />
        </button>
    );
};
