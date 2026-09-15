import React from "react";
import { INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from "~/commands/index.js";
import { useRichTextEditor } from "~/hooks/useRichTextEditor.js";
import type { ListNode } from "@webiny/lexical-nodes";
import { $isListNode } from "@webiny/lexical-nodes";
import { useCurrentElement } from "~/hooks/useCurrentElement.js";
import { ReactComponent as BulletListIcon } from "@webiny/icons/format_list_bulleted.svg";
import cn from "clsx";

export const BulletListAction = () => {
    const { editor } = useRichTextEditor();
    const { element } = useCurrentElement();
    const { theme } = useRichTextEditor();
    const isList = $isListNode(element);

    const isBullet = isList && (element as ListNode).getListType() === "bullet";

    const formatBulletList = () => {
        if (!isBullet) {
            const styleId = theme.getTypographyByTag("ul")?.id;

            // will update the active state in the useEffect
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, { themeStyleId: styleId });
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        }
    };

    return (
        <button
            onClick={() => formatBulletList()}
            className={cn("popup-item", "spaced", { active: isBullet })}
            aria-label="Format text as bullet list"
        >
            <BulletListIcon className="icon" />
        </button>
    );
};
