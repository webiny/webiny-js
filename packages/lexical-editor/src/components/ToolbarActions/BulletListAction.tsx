import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    INSERT_UNORDERED_WEBINY_LIST_COMMAND,
    REMOVE_WEBINY_LIST_COMMAND
} from "~/commands/webiny-list";
import { useRichTextEditor } from "~/hooks/useRichTextEditor";
import { findTypographyStyleByHtmlTag } from "~/utils/findTypographyStyleByHtmlTag";
import { $isListNode, ListNode } from "~/nodes/ListNode";
import { useCurrentElement } from "~/hooks/useCurrentElement";

export const BulletListAction = () => {
    const [editor] = useLexicalComposerContext();
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
            editor.dispatchCommand(INSERT_UNORDERED_WEBINY_LIST_COMMAND, { themeStyleId: styleId });
        } else {
            editor.dispatchCommand(REMOVE_WEBINY_LIST_COMMAND, undefined);
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
